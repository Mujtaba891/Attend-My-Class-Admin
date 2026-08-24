import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AdminUser, UserRole, TeachingAssignment } from '../types';

async function enrichCRProfileWithFirestoreData(email: string, baseProfile: AdminUser): Promise<AdminUser> {
  let enriched = { ...baseProfile };
  const cleanEmail = (email || baseProfile.email || '').trim().toLowerCase();
  if (!cleanEmail) return enriched;

  try {
    // 1. Fetch CR delegations from 'crDelegations' collection
    const crQ = query(collection(db, 'crDelegations'), where('email', '==', cleanEmail));
    const crSnap = await getDocs(crQ);
    const crDelegationsList: any[] = [];
    if (!crSnap.empty) {
      crSnap.docs.forEach(d => {
        crDelegationsList.push({ id: d.id, ...d.data() });
      });
    }

    // 2. Fetch student record from 'students' collection
    const studentQ = query(collection(db, 'students'), where('email', '==', cleanEmail));
    const studentSnap = await getDocs(studentQ);
    let studentData: any = null;
    if (!studentSnap.empty) {
      studentData = studentSnap.docs[0].data();
    }

    // IF USER IS TEACHER OR ADMIN (and role is NOT explicitly 'cr'):
    if (baseProfile.role === 'teacher' || baseProfile.role === 'admin') {
      enriched = {
        ...baseProfile,
        rollNumber: undefined,
        semester: undefined,
        section: undefined,
        designation: baseProfile.designation || 'Assistant Professor / Faculty Member',
        employeeId: baseProfile.employeeId || 'GEO-FAC-01',
        officeLocation: baseProfile.officeLocation || 'Block C, Room 30',
      };
      return enriched;
    }

    // IF USER IS CR / STUDENT:
    const isCRUser = baseProfile.role === 'cr' || crDelegationsList.length > 0;

    if (studentData || crDelegationsList.length > 0 || isCRUser) {
      const name = studentData?.fullName || studentData?.name || (baseProfile.name && baseProfile.name !== 'Faculty User' ? baseProfile.name : '') || 'Class Representative';
      const avatarUrl = studentData?.photoUrl || studentData?.avatarUrl || baseProfile.avatarUrl;
      const semester = studentData?.semester || baseProfile.semester || 'Semester I';
      const section = studentData?.section || baseProfile.section || 'A';
      const rollNumber = studentData?.rollNumber || studentData?.studentId || baseProfile.rollNumber || 'CR-2026-01';
      const studentMajor = studentData?.major || studentData?.course || 'Geology';
      const course = studentData?.course || studentData?.major || 'B.Sc. Academic Program';

      const primaryDel = crDelegationsList[0];
      const activeSubject = primaryDel?.subject || baseProfile.assignedSubject || studentMajor || 'Geology';
      const activeSubjectType = primaryDel?.subjectType || baseProfile.assignedSubjectType || 'MDC';
      const activeClass = primaryDel?.className || baseProfile.assignedClass || `${semester} - Section ${section}`;
      const activeRoom = primaryDel?.room || baseProfile.assignedRoom || 'Block C room no 30';

      let assignments: TeachingAssignment[] = crDelegationsList.map(cr => ({
        id: cr.id,
        subject: cr.subject || cr.className || studentMajor,
        subjectType: cr.subjectType || 'MDC',
        className: cr.className || `${semester} - Section ${section}`,
        room: cr.room || 'Block C room no 30'
      }));

      if (assignments.length === 0) {
        assignments = (baseProfile.assignments && baseProfile.assignments.length > 0) ? baseProfile.assignments : [{
          id: `assign_${Date.now()}`,
          subject: activeSubject,
          subjectType: activeSubjectType,
          className: activeClass,
          room: activeRoom
        }];
      }

      enriched = {
        ...baseProfile,
        name: name,
        avatarUrl: avatarUrl || baseProfile.avatarUrl,
        rollNumber: rollNumber,
        semester: semester,
        section: section,
        department: course,
        assignedSubject: activeSubject,
        assignedSubjectType: activeSubjectType as any,
        assignedClass: activeClass,
        assignedRoom: activeRoom,
        assignments: assignments,
        role: 'cr',
        permissions: ['view_sessions', 'mark_live_attendance', 'view_board', 'classroom_display', 'view_students'],
        employeeId: undefined,
        officeLocation: undefined,
        designation: undefined,
      };
    }
  } catch (err) {
    console.warn('CR Profile enrichment notice:', err);
  }
  return enriched;
}

export interface FacultyLoginPayload {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation?: string;
  employeeId?: string;
  officeLocation?: string;
  assignedSubject?: string;
  assignedSubjectType?: 'Major' | 'Minor' | 'MDC' | 'Skills' | 'AEC' | 'VAC 1' | 'VAC 2' | 'All';
  assignedClass?: string;
  assignedRoom?: string;
}

interface AuthContextType {
  user: User | null;
  adminProfile: AdminUser;
  currentRole: UserRole;
  isMasterAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsFaculty: (payload: FacultyLoginPayload, password?: string) => Promise<void>;
  loginWithEmail: (email: string, password?: string, targetRole?: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<AdminUser>) => void;
  hasPermission: (action: string) => boolean;
}

const DEFAULT_PROFILE: AdminUser = {
  uid: 'faculty_default',
  email: 'faculty@college.edu',
  name: 'Faculty Teacher',
  role: 'teacher',
  department: 'Department of Geology',
  designation: 'Assistant Professor / Faculty',
  employeeId: 'GEO-FAC-01',
  officeLocation: 'Block C, Room 30',
  assignedSubject: 'Geology',
  assignedSubjectType: 'MDC',
  assignedClass: 'Semester I - Section A (Batch 2026-2027)',
  assignedRoom: 'Block C room no 30',
  permissions: ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedSession = localStorage.getItem('amc_authenticated_session');
      return savedSession === 'true';
    } catch {
      return false;
    }
  });

  const [adminProfile, setAdminProfile] = useState<AdminUser>(() => {
    try {
      const saved = localStorage.getItem('amc_faculty_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(adminProfile.role || 'teacher');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('amc_faculty_profile', JSON.stringify(adminProfile));
      localStorage.setItem('amc_authenticated_session', 'true');
      setCurrentRole(adminProfile.role);
    }
  }, [adminProfile, isAuthenticated]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsAuthenticated(true);

        // Fetch user data from Firestore if available
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          const adminDocRef = doc(db, 'admins', firebaseUser.uid);
          const adminSnap = await getDoc(adminDocRef);

          const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();
          const isMasterAdmin = cleanEmail === 'mujtabaalam010@gmail.com';

          if (userSnap.exists()) {
            const data = userSnap.data();
            let role: UserRole = (data.role as UserRole) || (adminSnap.exists() ? (adminSnap.data()?.role || 'teacher') : 'teacher');

            const base: AdminUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || data.email || 'faculty@college.edu',
              name: data.name || firebaseUser.displayName || 'Academic Faculty',
              role,
              department: data.department || 'Department of Academic Studies',
              phone: data.phone,
              employeeId: data.employeeId,
              rollNumber: data.rollNumber,
              semester: data.semester,
              section: data.section,
              designation: data.designation,
              officeLocation: data.officeLocation,
              bio: data.bio,
              assignedSubject: data.assignedSubject || 'Geology',
              assignedSubjectType: data.assignedSubjectType || 'MDC',
              assignedClass: data.assignedClass || 'Semester I - Section A',
              assignedRoom: data.assignedRoom || 'Block C room no 30',
              assignments: data.assignments || [{
                id: `assign_${Date.now()}`,
                subject: data.assignedSubject || 'Geology',
                subjectType: data.assignedSubjectType || 'MDC',
                className: data.assignedClass || 'Semester I - Section A',
                room: data.assignedRoom || 'Block C room no 30'
              }],
              permissions: data.permissions || (role === 'admin' ? ['all'] : role === 'teacher' ? ['manage_sessions', 'mark_attendance'] : ['view_sessions', 'mark_live_attendance', 'view_board', 'classroom_display', 'view_students']),
              avatarUrl: firebaseUser.photoURL || data.avatarUrl,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            const enriched = await enrichCRProfileWithFirestoreData(firebaseUser.email || '', base);
            
            // Sync role to Firestore if updated
            if (data.role !== enriched.role) {
              await setDoc(userDocRef, { role: enriched.role, lastLoginAt: new Date().toISOString() }, { merge: true });
            }

            setAdminProfile(enriched);
            setCurrentRole(enriched.role);
          } else {
            // Document does not exist in Firestore, create it
            const defaultRole: UserRole = isMasterAdmin ? 'admin' : 'teacher';
            const permissions = defaultRole === 'admin'
              ? ['all', 'manage_students', 'manage_sessions', 'lock_accounts', 'approve_corrections', 'view_reports', 'manage_devices', 'system_config']
              : ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students'];

            const newDoc: AdminUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Faculty User',
              role: defaultRole,
              department: 'Department of Geology',
              designation: 'Assistant Professor / Faculty',
              employeeId: 'GEO-FAC-01',
              officeLocation: 'Block C, Room 30',
              assignedSubject: 'Geology',
              assignedSubjectType: 'MDC',
              assignedClass: 'Semester I - Section A (Batch 2026-2027)',
              assignedRoom: 'Block C room no 30',
              assignments: [{
                id: `assign_${Date.now()}`,
                subject: 'Geology',
                subjectType: 'MDC',
                className: 'Semester I - Section A (Batch 2026-2027)',
                room: 'Block C room no 30'
              }],
              permissions,
              avatarUrl: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const enriched = await enrichCRProfileWithFirestoreData(firebaseUser.email || '', newDoc);
            await setDoc(userDocRef, { ...enriched, lastLoginAt: new Date().toISOString() }, { merge: true });
            if (enriched.role === 'admin' || enriched.role === 'teacher') {
              await setDoc(doc(db, 'admins', firebaseUser.uid), { ...enriched, lastLoginAt: new Date().toISOString() }, { merge: true });
            }

            setAdminProfile(enriched);
            setCurrentRole(enriched.role);
          }
        } catch (err) {
          console.warn('Firestore user profile fetch notice:', err);
          setAdminProfile(prev => ({
            ...prev,
            uid: firebaseUser.uid,
            email: firebaseUser.email || prev.email,
            name: firebaseUser.displayName || prev.name,
            avatarUrl: firebaseUser.photoURL || '',
          }));
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const loginWithEmail = async (email: string, passwordInput?: string, targetRole?: UserRole) => {
    setIsLoading(true);
    const pass = passwordInput && passwordInput.length >= 6 ? passwordInput : 'College@2026';
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = cred.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const adminDocRef = doc(db, 'admins', firebaseUser.uid);
      const adminSnap = await getDoc(adminDocRef);

      const cleanEmail = (email || firebaseUser.email || '').trim().toLowerCase();
      const isMasterAdmin = cleanEmail === 'mujtabaalam010@gmail.com';

      if (userDoc.exists()) {
        const data = userDoc.data();
        let role: UserRole = targetRole || (data.role as UserRole) || (adminSnap.exists() ? (adminSnap.data()?.role || 'teacher') : 'teacher');

        const adminData = {
          ...data,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          name: data.name || firebaseUser.displayName,
          role,
          department: data.department || (role === 'cr' ? 'Student Academic Council' : 'Department of Geology'),
          designation: data.designation || (role !== 'cr' ? 'Assistant Professor / Faculty' : undefined),
          employeeId: data.employeeId || (role !== 'cr' ? 'GEO-FAC-01' : undefined),
          officeLocation: data.officeLocation || (role !== 'cr' ? 'Block C, Room 30' : undefined),
          assignedSubject: data.assignedSubject || 'Geology',
          assignedSubjectType: data.assignedSubjectType || 'MDC',
          assignedClass: data.assignedClass || 'Semester I - Section A',
          assignedRoom: data.assignedRoom || 'Block C room no 30',
          assignments: data.assignments,
          permissions: data.permissions || (role === 'admin' ? ['all'] : role === 'teacher' ? ['manage_sessions', 'mark_attendance'] : ['view_sessions', 'mark_live_attendance', 'view_board', 'classroom_display', 'view_students']),
          avatarUrl: firebaseUser.photoURL || data.avatarUrl,
          createdAt: data.createdAt,
          updatedAt: new Date().toISOString(),
        } as any;
        
        const enriched = await enrichCRProfileWithFirestoreData(email, adminData);
        await setDoc(userDocRef, { ...enriched, role: enriched.role, lastLoginAt: new Date().toISOString() }, { merge: true });
        if (enriched.role === 'admin' || enriched.role === 'teacher') {
          await setDoc(doc(db, 'admins', firebaseUser.uid), { ...enriched, role: enriched.role, lastLoginAt: new Date().toISOString() }, { merge: true });
        }
        
        setAdminProfile(enriched);
        setCurrentRole(enriched.role);
      } else {
        throw new Error('User profile not found. Please create an account first.');
      }
      
      setUser(firebaseUser);
      setIsAuthenticated(true);
      localStorage.setItem('amc_authenticated_session', 'true');
      localStorage.setItem('amc_last_email', email);
      
    } catch (error) {
      console.error('Login with email error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsFaculty = async (payload: FacultyLoginPayload, passwordInput?: string) => {
    setIsLoading(true);
    const pass = passwordInput && passwordInput.length >= 6 ? passwordInput : 'College@2026';
    let authUid = payload.email.replace(/[^a-zA-Z0-9]/g, '_');

    try {
      // 1. Authenticate with Firebase Auth
      let firebaseUser: User | null = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, payload.email, pass);
        firebaseUser = cred.user;
      } catch (authErr: any) {
        if (
          authErr.code === 'auth/user-not-found' ||
          authErr.code === 'auth/invalid-credential' ||
          authErr.code === 'auth/invalid-login-credentials' ||
          authErr.code === 'auth/wrong-password'
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, payload.email, pass);
            firebaseUser = newCred.user;
            await updateFirebaseProfile(firebaseUser, { displayName: payload.name });
          } catch (createErr) {
            console.warn('Firebase Auth user creation notice:', createErr);
          }
        } else {
          console.warn('Firebase Auth sign in notice:', authErr);
        }
      }

      if (firebaseUser) {
        authUid = firebaseUser.uid;
        setUser(firebaseUser);
      }

      const effectiveRole: UserRole = payload.role;

      // 2. Build User Profile & Permissions
      const permissions =
        effectiveRole === 'admin'
          ? ['all', 'manage_students', 'manage_sessions', 'lock_accounts', 'approve_corrections', 'view_reports', 'manage_devices', 'system_config']
          : effectiveRole === 'teacher'
          ? ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students']
          : ['view_sessions', 'mark_live_attendance', 'view_board', 'classroom_display'];

      const now = new Date().toISOString();
      let existingAssignments: any[] = [];
      let existingData: Record<string, any> = {};
      try {
        const existingDoc = await getDoc(doc(db, 'users', authUid));
        if (existingDoc.exists()) {
           existingData = existingDoc.data() || {};
           existingAssignments = existingData.assignments || [];
        }
      } catch(e) {}
      
      const newAssignment = {
        id: `assign_${Date.now()}`,
        subject: payload.assignedSubject || 'Geology',
        subjectType: payload.assignedSubjectType || 'MDC',
        className: payload.assignedClass || 'Semester I - Section A',
        room: payload.assignedRoom || 'Block C room no 30'
      };
      
      const isDuplicate = existingAssignments.some(a => 
        a.subject === newAssignment.subject && a.className === newAssignment.className && (a.subjectType || 'MDC') === (newAssignment.subjectType || 'MDC')
      );
      
      if (!isDuplicate && payload.assignedSubject) {
        existingAssignments.push(newAssignment);
      }
      
      if (existingAssignments.length === 0) {
        existingAssignments.push(newAssignment);
      }

      let profileData = {
        ...existingData,
        uid: authUid,
        email: payload.email,
        name: payload.name || existingData.name || 'Faculty User',
        role: effectiveRole,
        department: payload.department || existingData.department || 'Department of Geology',
        designation: effectiveRole !== 'cr' ? (payload.designation || existingData.designation || 'Assistant Professor / Faculty') : undefined,
        employeeId: effectiveRole !== 'cr' ? (payload.employeeId || existingData.employeeId || 'GEO-FAC-01') : undefined,
        officeLocation: effectiveRole !== 'cr' ? (payload.officeLocation || existingData.officeLocation || 'Block C, Room 30') : undefined,
        assignedSubject: payload.assignedSubject || existingAssignments[existingAssignments.length-1]?.subject || 'Geology',
        assignedSubjectType: payload.assignedSubjectType || existingAssignments[existingAssignments.length-1]?.subjectType || 'MDC',
        assignedClass: payload.assignedClass || existingAssignments[existingAssignments.length-1]?.className || 'Semester I - Section A',
        assignedRoom: payload.assignedRoom || existingAssignments[existingAssignments.length-1]?.room || 'Block C room no 30',
        assignments: existingAssignments,
        permissions,
        createdAt: existingData.createdAt || now,
        updatedAt: now,
      } as any;

      profileData = await enrichCRProfileWithFirestoreData(payload.email, profileData);

      // 3. Persist to Firestore: /users/{uid} and /admins/{uid}
      try {
        const firestoreData = { ...profileData, role: profileData.role, lastLoginAt: now };
        Object.keys(firestoreData).forEach(key => {
          if (firestoreData[key] === undefined) {
            delete firestoreData[key];
          }
        });
        await setDoc(doc(db, 'users', authUid), firestoreData, { merge: true });

        if (profileData.role === 'admin' || profileData.role === 'teacher') {
          await setDoc(doc(db, 'admins', authUid), {
            ...profileData,
            role: profileData.role,
            lastLoginAt: now,
          }, { merge: true });
        }

        // Record Activity Log in Firestore
        const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'activityLogs', logId), {
          id: logId,
          timestamp: now,
          actorId: authUid,
          actorEmail: payload.email,
          actorName: payload.name,
          actorRole: profileData.role,
          eventType: 'user_login',
          targetType: 'auth',
          targetId: authUid,
          targetName: payload.name,
          details: `User ${payload.name} (${payload.email}) authenticated as ${profileData.role.toUpperCase()} and stored in Firebase Auth & Firestore.`,
        });
      } catch (firestoreErr) {
        console.warn('Firestore user persistence notice:', firestoreErr);
      }

      setAdminProfile(profileData);
      setCurrentRole(profileData.role);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const u = result.user;
        const now = new Date().toISOString();
        const userDocRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userDocRef);
        const existingData = userSnap.exists() ? userSnap.data() : {};

        const cleanEmail = (u.email || '').trim().toLowerCase();
        const role: UserRole = existingData.role || (cleanEmail === 'mujtabaalam010@gmail.com' ? 'admin' : 'teacher');
        const permissions = role === 'admin'
          ? ['all', 'manage_students', 'manage_sessions', 'lock_accounts', 'approve_corrections', 'view_reports', 'manage_devices', 'system_config']
          : role === 'teacher'
          ? ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students']
          : ['view_sessions', 'mark_live_attendance', 'view_board', 'classroom_display', 'view_students'];

        let profileData: AdminUser = {
          uid: u.uid,
          email: u.email || 'faculty@college.edu',
          name: existingData.name || u.displayName || u.email?.split('@')[0] || 'Google User',
          role,
          department: existingData.department || 'Department of Geology',
          assignedSubject: existingData.assignedSubject || 'Geology',
          assignedSubjectType: existingData.assignedSubjectType || 'MDC',
          assignedClass: existingData.assignedClass || 'Semester I - Section A',
          assignedRoom: existingData.assignedRoom || 'Block C room no 30',
          assignments: existingData.assignments || [{
            id: `assign_${Date.now()}`,
            subject: 'Geology',
            subjectType: 'MDC',
            className: 'Semester I - Section A',
            room: 'Block C room no 30'
          }],
          permissions,
          avatarUrl: u.photoURL || existingData.avatarUrl || '',
          createdAt: existingData.createdAt || now,
          updatedAt: now,
        };

        profileData = await enrichCRProfileWithFirestoreData(u.email || '', profileData);

        // Persist to Firestore /users/{uid} and /admins/{uid}
        try {
          await setDoc(userDocRef, {
            ...profileData,
            role: profileData.role,
            lastLoginAt: now,
          }, { merge: true });

          if (profileData.role === 'admin' || profileData.role === 'teacher') {
            await setDoc(doc(db, 'admins', u.uid), {
              ...profileData,
              role: profileData.role,
              lastLoginAt: now,
            }, { merge: true });
          }

          const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await setDoc(doc(db, 'activityLogs', logId), {
            id: logId,
            timestamp: now,
            actorId: u.uid,
            actorEmail: u.email,
            actorName: profileData.name,
            actorRole: role,
            eventType: 'user_login',
            targetType: 'auth',
            targetId: u.uid,
            targetName: profileData.name,
            details: `User ${profileData.name} (${u.email}) signed in via Google OAuth and stored in Firebase Auth & Firestore.`,
          });
        } catch (firestoreErr) {
          console.warn('Firestore user persistence notice:', firestoreErr);
        }

        setAdminProfile(profileData);
        setCurrentRole(role);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.warn('Google Sign-in popup notice:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('Sign-out error:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('amc_authenticated_session');
    localStorage.removeItem('amc_faculty_profile');
  };

  const updateProfile = async (updates: Partial<AdminUser>) => {
    setAdminProfile(prev => {
      const updated = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Sync to Firestore in the background
      if (updated.uid && updated.uid !== 'faculty_default') {
        const firestoreData = { ...updated };
        Object.keys(firestoreData).forEach(key => {
          if (firestoreData[key] === undefined) {
            delete firestoreData[key];
          }
        });
        const userRef = doc(db, 'users', updated.uid);
        setDoc(userRef, firestoreData, { merge: true }).catch(err => {
          console.warn('Failed to sync profile update to Firestore:', err);
        });
        if (updated.role === 'admin' || updated.role === 'teacher') {
          const adminRef = doc(db, 'admins', updated.uid);
          setDoc(adminRef, firestoreData, { merge: true }).catch(() => {});
        }
      }
      
      return updated;
    });
  };

  const switchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    setAdminProfile(prev => ({
      ...prev,
      role: newRole,
      permissions:
        newRole === 'admin'
          ? ['all', 'manage_students', 'manage_sessions', 'lock_accounts', 'approve_corrections', 'view_reports', 'manage_devices', 'system_config']
          : newRole === 'teacher'
          ? ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students']
          : ['view_sessions', 'mark_live_attendance', 'view_board', 'classroom_display'],
    }));
  };

  const hasPermission = (action: string): boolean => {
    if (currentRole === 'admin') return true;
    if (adminProfile.permissions.includes('all')) return true;
    return adminProfile.permissions.includes(action);
  };

  const isMasterAdmin = currentRole === 'admin' || (user?.email === 'mujtabaalam010@gmail.com') || (adminProfile.email === 'mujtabaalam010@gmail.com');

  return (
    <AuthContext.Provider
      value={{
        user,
        adminProfile,
        currentRole,
        isMasterAdmin,
        isAuthenticated,
        isLoading,
        loginAsFaculty,
        loginWithEmail,
        loginWithGoogle,
        logout,
        switchRole,
        updateProfile,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

