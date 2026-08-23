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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AdminUser, UserRole } from '../types';

export interface FacultyLoginPayload {
  name: string;
  email: string;
  role: UserRole;
  department: string;
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
  loginWithEmail: (email: string, password?: string) => Promise<void>;
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
  department: 'Department of Academic Studies',
  assignedSubject: 'Core Academic Course (Theory & Lab)',
  assignedClass: 'Semester IV - Section A (Batch 2024-2027)',
  assignedRoom: 'Lecture Hall 204 (North Wing)',
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

          if (userSnap.exists()) {
            const data = userSnap.data();
            const role = (data.role as UserRole) || (firebaseUser.email === 'mujtabaalam010@gmail.com' ? 'admin' : 'teacher');
            setAdminProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || data.email || 'faculty@college.edu',
              name: data.name || firebaseUser.displayName || 'Academic Faculty',
              role,
              department: data.department || 'Department of Academic Studies',
              phone: data.phone,
              employeeId: data.employeeId,
              designation: data.designation,
              officeLocation: data.officeLocation,
              bio: data.bio,
              assignedSubject: data.assignedSubject || 'Core Subject (Theory & Lab)',
              assignedSubjectType: data.assignedSubjectType || 'Major',
              assignedClass: data.assignedClass || 'Semester IV - Section A',
              assignedRoom: data.assignedRoom || 'Lecture Hall 204',
              assignments: data.assignments || [{
                id: `assign_${Date.now()}`,
                subject: data.assignedSubject || 'Core Subject (Theory & Lab)',
                className: data.assignedClass || 'Semester IV - Section A',
                room: data.assignedRoom || 'Lecture Hall 204'
              }],
              permissions: data.permissions || (role === 'admin' ? ['all'] : ['manage_sessions', 'mark_attendance']),
              avatarUrl: firebaseUser.photoURL || data.avatarUrl,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setCurrentRole(role);
          } else {
            // Document does not exist in Firestore, create it
            const role: UserRole = firebaseUser.email === 'mujtabaalam010@gmail.com' ? 'admin' : 'teacher';
            const permissions = role === 'admin'
              ? ['all', 'manage_students', 'manage_sessions', 'lock_accounts', 'approve_corrections', 'view_reports', 'manage_devices', 'system_config']
              : ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students'];

            const newDoc = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Faculty User',
              role,
              department: 'Department of Academic Studies',
              assignedSubject: 'Core Subject (Theory & Lab)',
              assignedClass: 'Semester IV - Section A',
              assignedRoom: 'Lecture Hall 204',
              assignments: [{
                id: `assign_${Date.now()}`,
                subject: 'Core Subject (Theory & Lab)',
                className: 'Semester IV - Section A',
                room: 'Lecture Hall 204'
              }],
              permissions,
              avatarUrl: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newDoc, { merge: true });
            await setDoc(doc(db, 'admins', firebaseUser.uid), newDoc, { merge: true });

            setAdminProfile(newDoc as AdminUser);
            setCurrentRole(role);
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


  const loginWithEmail = async (email: string, passwordInput?: string) => {
    setIsLoading(true);
    const pass = passwordInput && passwordInput.length >= 6 ? passwordInput : 'College@2026';
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = cred.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = (data.role) || 'teacher';
        
        const adminData = {
          ...data,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          name: data.name || firebaseUser.displayName,
          role,
          department: data.department,
          assignedSubject: data.assignedSubject,
          assignedSubjectType: data.assignedSubjectType,
          assignedClass: data.assignedClass,
          assignedRoom: data.assignedRoom,
          assignments: data.assignments,
          permissions: data.permissions,
          avatarUrl: firebaseUser.photoURL || data.avatarUrl,
          createdAt: data.createdAt,
          updatedAt: new Date().toISOString(),
        } as any;
        
        await setDoc(userDocRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
        
        setAdminProfile(adminData);
        setCurrentRole(role);
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
        // If user not found, create new account in Firebase Auth
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

      // 2. Build User Profile & Permissions
      const permissions =
        payload.role === 'admin'
          ? ['all', 'manage_students', 'manage_sessions', 'lock_accounts', 'approve_corrections', 'view_reports', 'manage_devices', 'system_config']
          : payload.role === 'teacher'
          ? ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students']
          : ['view_sessions', 'mark_live_attendance', 'view_board', 'classroom_display'];

      const now = new Date().toISOString();
      let existingAssignments: any[] = [];
      let existingData: Record<string, any> = {};
      let profileData = null;
      try {
        const existingDoc = await getDoc(doc(db, 'users', authUid));
        if (existingDoc.exists()) {
           existingData = existingDoc.data() || {};
           existingAssignments = existingData.assignments || [];
        }
      } catch(e) {}
      
      const newAssignment = {
        id: `assign_${Date.now()}`,
        subject: payload.assignedSubject || 'Core Subject (Theory & Lab)',
        subjectType: payload.assignedSubjectType || 'All',
        className: payload.assignedClass || 'Semester IV - Section A',
        room: payload.assignedRoom || 'Lecture Hall 204'
      };
      
      const isDuplicate = existingAssignments.some(a => 
        a.subject === newAssignment.subject && a.className === newAssignment.className && (a.subjectType || 'All') === (newAssignment.subjectType || 'All')
      );
      
      if (!isDuplicate && payload.assignedSubject) {
        existingAssignments.push(newAssignment);
      }
      
      if (existingAssignments.length === 0) {
        existingAssignments.push(newAssignment);
      }

      profileData = {
        ...existingData,
        uid: authUid,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        department: payload.department || 'Department of Academic Studies',
        assignedSubject: payload.assignedSubject || existingAssignments[existingAssignments.length-1].subject,
        assignedSubjectType: payload.assignedSubjectType || existingAssignments[existingAssignments.length-1].subjectType || 'All',
        assignedClass: payload.assignedClass || existingAssignments[existingAssignments.length-1].className,
        assignedRoom: payload.assignedRoom || existingAssignments[existingAssignments.length-1].room,
        assignments: existingAssignments,
        permissions,
        createdAt: existingData.createdAt || now,
        updatedAt: now,
      } as any;

      // 3. Persist to Firestore: /users/{uid} and /admins/{uid}
      try {
        const firestoreData = { ...profileData, lastLoginAt: now };
        Object.keys(firestoreData).forEach(key => {
          if (firestoreData[key] === undefined) {
            delete firestoreData[key];
          }
        });
        await setDoc(doc(db, 'users', authUid), firestoreData, { merge: true });

        if (payload.role === 'admin' || payload.role === 'teacher' || payload.role === 'cr') {
          await setDoc(doc(db, 'admins', authUid), {
            ...profileData,
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
          actorRole: payload.role,
          eventType: 'user_login',
          targetType: 'auth',
          targetId: authUid,
          targetName: payload.name,
          details: `User ${payload.name} (${payload.email}) authenticated as ${payload.role.toUpperCase()} and stored in Firebase Auth & Firestore.`,
        });
      } catch (firestoreErr) {
        console.warn('Firestore user persistence notice:', firestoreErr);
      }

      setAdminProfile(profileData);
      setCurrentRole(payload.role);
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
        const role: UserRole = u.email === 'mujtabaalam010@gmail.com' ? 'admin' : 'teacher';
        const permissions = role === 'admin'
          ? ['all', 'manage_students', 'manage_sessions', 'lock_accounts', 'approve_corrections', 'view_reports', 'manage_devices', 'system_config']
          : ['manage_sessions', 'mark_attendance', 'approve_corrections', 'view_reports', 'view_students'];

        const profileData: AdminUser = {
          uid: u.uid,
          email: u.email || 'faculty@college.edu',
          name: u.displayName || u.email?.split('@')[0] || 'Google Faculty User',
          role,
          department: 'Department of Academic Studies',
          assignedSubject: 'Core Subject (Theory & Lab)',
          assignedClass: 'Semester IV - Section A',
          assignedRoom: 'Lecture Hall 204',
          assignments: [{
            id: `assign_${Date.now()}`,
            subject: 'Core Subject (Theory & Lab)',
            className: 'Semester IV - Section A',
            room: 'Lecture Hall 204'
          }],
          permissions,
          avatarUrl: u.photoURL || '',
          createdAt: now,
          updatedAt: now,
        };

        // Persist to Firestore /users/{uid} and /admins/{uid}
        try {
          await setDoc(doc(db, 'users', u.uid), {
            ...profileData,
            lastLoginAt: now,
          }, { merge: true });

          await setDoc(doc(db, 'admins', u.uid), {
            ...profileData,
            lastLoginAt: now,
          }, { merge: true });

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
        const adminRef = doc(db, 'admins', updated.uid);
        setDoc(adminRef, firestoreData, { merge: true }).catch(() => {});
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

