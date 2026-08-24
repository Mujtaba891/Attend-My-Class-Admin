import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase';
import {
  Student,
  AttendanceSession,
  AttendanceRecord,
  CorrectionRequest,
  ActivityLog,
  AdminNotification,
  ClassConfig,
  AttendanceStatus,
  AttendanceMethod,
  AccountStatus,
  StudentAttendanceStats,
  CRDelegation,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_SESSIONS,
  INITIAL_TODAY_ATTENDANCE,
  INITIAL_CORRECTION_REQUESTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLASSES,
} from '../data/seedData';
import { useAuth } from './AuthContext';

interface AttendanceContextType {
  students: Student[];
  sessions: AttendanceSession[];
  activeSession: AttendanceSession | null;
  todayAttendance: AttendanceRecord[];
  allAttendance: AttendanceRecord[];
  correctionRequests: CorrectionRequest[];
  activityLogs: ActivityLog[];
  notifications: AdminNotification[];
  crDelegations: CRDelegation[];
  classes: ClassConfig[];
  currentClass: ClassConfig;
  currentTime: Date;
  sessionCountdown: string;
  isSessionActive: boolean;

  // Actions
  updateClassConfig: (classId: string, updates: Partial<ClassConfig>) => void;
  startSessionManually: () => void;
  closeSessionManually: () => void;
  extendSession: (extraMinutes: number) => void;
  updateSessionTime: (startTimeStr: string, endTimeStr: string) => void;
  regenerateToken: () => void;
  markAttendance: (studentId: string, status: AttendanceStatus, notes?: string, method?: AttendanceMethod) => void;
  bulkMarkStatus: (status: AttendanceStatus, targetIds?: string[]) => void;
  
  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  deleteStudents: (studentIds: string[]) => void;
  toggleAccountStatus: (studentId: string, newStatus: AccountStatus, reason?: string) => void;
  bulkUpdateStudentStatus: (studentIds: string[], newStatus: AccountStatus, reason?: string) => void;
  resetDeviceBinding: (studentId: string) => void;
  reactivateAndBindToCurrentPhone: (studentId: string) => void;
  reactivateDeviceAndAccount: (
    studentId: string,
    optionsOrDeviceId?: boolean | string | { transferToNewDevice?: boolean; newDeviceId?: string; newDeviceModel?: string },
    newDeviceModel?: string
  ) => void;
  importStudents: (newStudentsList: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  
  // Correction Requests
  createCorrectionRequest: (request: Omit<CorrectionRequest, 'id' | 'status' | 'requestedAt'>) => void;
  approveCorrectionRequest: (requestId: string, decisionNotes?: string) => void;
  rejectCorrectionRequest: (requestId: string, decisionNotes?: string) => void;
  getStudentMonthlyCorrectionCount: (studentId: string, monthKey?: string) => number;
  
  // Stats & Utilities
  getStudentStats: (studentId: string) => StudentAttendanceStats;
  simulateStudentScan: (studentId?: string) => void;
  markNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'actorId' | 'actorEmail' | 'actorName' | 'actorRole'>) => void;
  clearAllData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminProfile, currentRole } = useAuth();

  // Core database states
  const [rawStudents, setRawStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('amc_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const students = useMemo(() => {
    if (!adminProfile || adminProfile.role === 'admin') {
      return rawStudents;
    }

    const assignedSubject = (adminProfile.assignedSubject || '').trim();
    if (!assignedSubject || assignedSubject.toLowerCase() === 'all' || assignedSubject.toLowerCase() === 'all subjects') {
      return rawStudents;
    }

    const targetClean = assignedSubject.toLowerCase().replace(/\(mdc\)|\(cr subject\)|\(major\)|\(minor\)/gi, '').trim();
    const targetType = adminProfile.assignedSubjectType as string | undefined;

    const filtered = rawStudents.filter(student => {
      const sMajor = (student.major || '').toLowerCase().trim();
      const sMinor = (student.minor || '').toLowerCase().trim();
      const sMdc = (student.mdc || '').toLowerCase().trim();
      const sSkills = (student.skills || '').toLowerCase().trim();
      const sAec = (student.aec || '').toLowerCase().trim();
      const sVac1 = (student.vac1 || '').toLowerCase().trim();
      const sVac2 = (student.vac2 || '').toLowerCase().trim();
      const sCourse = (student.course || '').toLowerCase().trim();

      // If targetType is MDC or if user is CR with MDC/CR Subject/unspecified
      const isMDCCourse = targetType === 'MDC' || (adminProfile.role === 'cr' && (targetType === 'CR Subject' || !targetType || targetType === 'MDC'));

      if (isMDCCourse && sMdc) {
        return sMdc === targetClean || targetClean.includes(sMdc) || sMdc.includes(targetClean);
      }

      // Check based on subjectType if explicitly specified
      if (targetType === 'Major' && sMajor) {
        return sMajor === targetClean || targetClean.includes(sMajor) || sMajor.includes(targetClean);
      }
      if (targetType === 'Minor' && sMinor) {
        return sMinor === targetClean || targetClean.includes(sMinor) || sMinor.includes(targetClean);
      }
      if (targetType === 'MDC' && sMdc) {
        return sMdc === targetClean || targetClean.includes(sMdc) || sMdc.includes(targetClean);
      }
      if (targetType === 'Skills' && sSkills) {
        return sSkills === targetClean || targetClean.includes(sSkills) || sSkills.includes(targetClean);
      }
      if (targetType === 'AEC' && sAec) {
        return sAec === targetClean || targetClean.includes(sAec) || sAec.includes(targetClean);
      }
      if (targetType === 'VAC 1' && sVac1) {
        return sVac1 === targetClean || targetClean.includes(sVac1) || sVac1.includes(targetClean);
      }
      if (targetType === 'VAC 2' && sVac2) {
        return sVac2 === targetClean || targetClean.includes(sVac2) || sVac2.includes(targetClean);
      }

      // Default or CR Subject matching across specific subject fields (excluding generic course degree name)
      const specificSubjects = [sMdc, sMajor, sMinor, sSkills, sAec, sVac1, sVac2].filter(Boolean);
      if (specificSubjects.length > 0) {
        return specificSubjects.some(sub => 
          sub === targetClean || targetClean.includes(sub) || sub.includes(targetClean)
        );
      }

      return sCourse === targetClean || targetClean.includes(sCourse) || sCourse.includes(targetClean);
    });

    return filtered;
  }, [rawStudents, adminProfile]);

  const [sessions, setSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('amc_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('amc_attendance');
    return saved ? JSON.parse(saved) : INITIAL_TODAY_ATTENDANCE;
  });

  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>(() => {
    const saved = localStorage.getItem('amc_corrections');
    return saved ? JSON.parse(saved) : INITIAL_CORRECTION_REQUESTS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('amc_logs');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    const saved = localStorage.getItem('amc_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [crDelegations, setCrDelegations] = useState<CRDelegation[]>(() => {
    const saved = localStorage.getItem('amc_cr_delegations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('amc_cr_delegations', JSON.stringify(crDelegations));
  }, [crDelegations]);

  const [classes, setClasses] = useState<ClassConfig[]>(() => {
    try {
      const saved = localStorage.getItem('amc_classes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CLASSES;
  });
  const [systemSchedule, setSystemSchedule] = useState<{
    startTime: string;
    endTime: string;
    duration: number;
    room: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('amc_system_schedule');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      startTime: '10:00 AM',
      endTime: '10:40 AM',
      duration: 40,
      room: 'Block C room no 30',
    };
  });

  const currentClass = useMemo(() => {
    const baseClass = classes.find(c => c.id === 'core_class') || classes[0];
    const paperName = adminProfile?.assignedSubject || baseClass.paperName || 'Geology';
    
    // Check if faculty has a configured assignment for this subject or default assignment
    const facultyAssignment = adminProfile?.assignments?.find(a => 
      a.subject === adminProfile.assignedSubject && 
      (!adminProfile.assignedSubjectType || (a.subjectType || 'All') === adminProfile.assignedSubjectType)
    ) || adminProfile?.assignments?.[0];

    const defaultStartTime = systemSchedule?.startTime || facultyAssignment?.startTime || baseClass.defaultStartTime || '10:00 AM';
    const defaultEndTime = systemSchedule?.endTime || facultyAssignment?.endTime || baseClass.defaultEndTime || '10:40 AM';
    const durationMinutes = systemSchedule?.duration || facultyAssignment?.duration || baseClass.durationMinutes || 40;
    const room = systemSchedule?.room || facultyAssignment?.room || adminProfile?.assignedRoom || baseClass.room || 'Block C room no 30';

    return {
      ...baseClass,
      name: adminProfile?.assignedSubjectType ? `${adminProfile.assignedSubjectType} Course` : baseClass.name,
      paperName,
      room,
      defaultStartTime,
      defaultEndTime,
      durationMinutes,
    };
  }, [classes, adminProfile, systemSchedule]);

  // Current system clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Save to persistent storage on changes
  useEffect(() => {
    localStorage.setItem('amc_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('amc_students', JSON.stringify(rawStudents));
  }, [rawStudents]);

  useEffect(() => {
    localStorage.setItem('amc_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('amc_attendance', JSON.stringify(allAttendance));
  }, [allAttendance]);

  useEffect(() => {
    localStorage.setItem('amc_corrections', JSON.stringify(correctionRequests));
  }, [correctionRequests]);

  useEffect(() => {
    localStorage.setItem('amc_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('amc_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Clock ticker every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // Real-time Firestore Listeners (Connected directly to Student App)
  // -------------------------------------------------------------
  useEffect(() => {
    testConnection();

    // 1. Listen to Students collection
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        if (!snapshot.empty) {
          let list: Student[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              studentId: data.studentId || docSnap.id,
              fullName: data.fullName || data.name || data.username || 'Unnamed Student',
              rollNumber: data.rollNumber || data.studentId || '',
              registrationNumber: data.registrationNumber || '',
              email: data.email || '',
              phone: data.phone || '',
              course: data.course || 'B.Sc. Academic Program',
              major: data.major || '',
              minor: data.minor || '',
              mdc: data.mdc || '',
              vac1: data.vac1 || '',
              vac2: data.vac2 || '',
              skills: data.skills || '',
              aec: data.aec || '',
              semester: data.semester || 'Semester IV',
              section: data.section || 'A',
              batch: data.batch || '2024-2027',
              enrollmentDate: data.enrollmentDate || '',
              avatarUrl: data.photoUrl || data.avatarUrl || undefined,
              accountStatus: data.accountStatus || 'active',
              lockReason: data.lockReason || undefined,
              authorizedDeviceId: data.authorizedDeviceId || undefined,
              boundDeviceId: data.boundDeviceId || data.authorizedDeviceId || undefined,
              authorizedDeviceModel: data.authorizedDeviceModel || undefined,
              lastMismatchDetectedAt: data.lastMismatchDetectedAt || undefined,
              lastMismatchDetails: data.lastMismatchDetails || undefined,
              lastActivity: data.lastActivity || undefined,
              revokedDeviceId: data.revokedDeviceId || undefined,
              forceLogoutDeviceId: data.forceLogoutDeviceId || undefined,
              sessionRevokedAt: data.sessionRevokedAt || undefined,
              sessionVersion: data.sessionVersion || undefined,
              logoutPromptMessage: data.logoutPromptMessage || undefined,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            } as Student;
          });

          setRawStudents(list);
        }
      },
      (error) => {
        console.warn('Students listener notice:', error);
      }
    );

    // 2. Listen to Attendance Sessions collection
    const unsubSessions = onSnapshot(
      collection(db, 'attendanceSessions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AttendanceSession[] = snapshot.docs.map((docSnap) => {
          const parseDateAndTimeToEpoch = (dateStr, timeStr) => {
            try {
              if (!dateStr || !timeStr) return Date.now();
              const [year, month, day] = dateStr.split('-').map(Number);
              const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
              if (!match) return Date.now();
              let [_, hours, minutes, ampm] = match;
              let h = parseInt(hours, 10);
              let m = parseInt(minutes, 10);
              if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
              if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
              const d = new Date(year, month - 1, day, h, m, 0, 0);
              return d.getTime();
            } catch (e) {
              return Date.now();
            }
          };
            const data = docSnap.data();
            return {
              id: docSnap.id,
              classId: data.classId || 'core_class',
              className: data.className || 'Core Course - Theory & Practical Lab',
              date: data.date || '',
              startTime: data.startTime || '10:00 AM',
              endTime: data.endTime || '10:40 AM',
              startEpoch: data.startEpoch || parseDateAndTimeToEpoch(data.date || '', data.startTime || '10:00 AM'),
              endEpoch: data.endEpoch || parseDateAndTimeToEpoch(data.date || '', data.endTime || '10:40 AM'),
              token: data.token || '',
              status: data.status || 'active',
              totalStudents: data.totalStudents || 0,
              presentCount: data.presentCount || 0,
              absentCount: data.absentCount || 0,
              notMarkedCount: data.notMarkedCount || 0,
              correctionCount: data.correctionCount || 0,
              createdBy: data.createdBy || 'Admin',
              createdAt: data.createdAt || new Date().toISOString(),
              closedAt: data.closedAt || undefined,
              autoClosed: data.autoClosed || false,
            } as AttendanceSession;
          });
          setSessions(list);
        }
      },
      (error) => {
        console.warn('AttendanceSessions listener notice:', error);
      }
    );

    // 3. Listen to Attendance records collection (Live student check-ins)
    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AttendanceRecord[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              sessionId: data.sessionId || '',
              classId: data.classId || 'core_class',
              studentId: data.studentId || data.studentUid || '',
              studentName: data.studentName || data.name || '',
              rollNumber: data.rollNumber || '',
              date: data.date || '',
              status: data.status || 'present',
              method: data.method || 'qr_scan',
              markedAt: data.markedAt || undefined,
              markedBy: data.markedBy || undefined,
              deviceId: data.deviceId || undefined,
              notes: data.notes || undefined,
              updatedAt: data.updatedAt || new Date().toISOString(),
            } as AttendanceRecord;
          });
          setAllAttendance(list);
        }
      },
      (error) => {
        console.warn('Attendance records listener notice:', error);
      }
    );

    // 4. Listen to Correction Requests collection (Live student appeals)
    const unsubCorrections = onSnapshot(
      collection(db, 'correctionRequests'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CorrectionRequest[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              studentId: data.studentId || '',
              studentName: data.studentName || 'Student',
              rollNumber: data.rollNumber || '',
              email: data.email || '',
              attendanceDate: data.attendanceDate || '',
              sessionId: data.sessionId || '',
              currentStatus: data.currentStatus || 'absent',
              requestedStatus: data.requestedStatus || 'present',
              reason: data.reason || '',
              monthKey: data.monthKey || '',
              status: data.status || 'pending',
              submittedAt: data.submittedAt || data.requestedAt || new Date().toISOString(),
              decidedAt: data.decidedAt || undefined,
              decidedBy: data.decidedBy || undefined,
              decisionNotes: data.decisionNotes || undefined,
            } as CorrectionRequest;
          });
          setCorrectionRequests(list);
        }
      },
      (error) => {
        console.warn('CorrectionRequests listener notice:', error);
      }
    );

    // 5. Listen to Activity Logs
    const unsubLogs = onSnapshot(
      collection(db, 'activityLogs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ActivityLog[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              timestamp: data.timestamp || new Date().toISOString(),
              actorId: data.actorId || 'system',
              actorEmail: data.actorEmail || '',
              actorName: data.actorName || 'System',
              actorRole: data.actorRole || 'admin',
              eventType: data.eventType || 'system_event',
              targetType: data.targetType || 'system',
              targetId: data.targetId || undefined,
              targetName: data.targetName || undefined,
              details: data.details || '',
              metadata: data.metadata || undefined,
            } as ActivityLog;
          });
          setActivityLogs(list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }
      },
      (error) => {
        // Activity logs read may be restricted
        console.warn('Activity logs listener notice:', error);
      }
    );

    // Listen to CR Delegations
    const unsubCR = onSnapshot(
      collection(db, 'crDelegations'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CRDelegation[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              email: data.email || '',
              name: data.name || '',
              classId: data.classId || 'core_class',
              className: data.className || '',
              section: data.section || '',
              subject: data.subject || '',
              subjectType: data.subjectType || '',
              room: data.room || '',
              permissions: data.permissions || [],
              status: data.status || 'active',
              delegatedBy: data.delegatedBy || '',
              delegatedByType: data.delegatedByType || 'teacher',
              createdAt: data.createdAt || '',
              updatedAt: data.updatedAt || '',
            } as CRDelegation;
          });
          setCrDelegations(list);
        } else {
          setCrDelegations([]);
        }
      },
      (error) => console.warn('CR listener notice:', error)
    );

    // 6. Listen to Notifications
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AdminNotification[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              recipientType: data.recipientType || 'admin',
              recipientId: data.recipientId || 'all_admins',
              title: data.title || '',
              message: data.message || '',
              type: data.type || 'system_info',
              read: data.read ?? false,
              createdAt: data.createdAt || new Date().toISOString(),
              link: data.link || undefined,
            } as AdminNotification;
          });
          setNotifications(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      },
      (error) => {
        console.warn('Notifications listener notice:', error);
      }
    );

    // 7. Listen to System Schedule
    const unsubSchedule = onSnapshot(
      doc(db, 'system_settings', 'class_schedule'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.startTime && data.endTime) {
            const updatedSched = {
              startTime: data.startTime,
              endTime: data.endTime,
              duration: Number(data.duration) || 20,
              room: data.room || 'Block C room no 30',
            };
            setSystemSchedule(updatedSched);
            localStorage.setItem('amc_system_schedule', JSON.stringify(updatedSched));
          }
        }
      },
      (error) => {
        console.warn('Schedule listener notice:', error);
      }
    );

    return () => {
      unsubStudents();
      unsubSessions();
      unsubAttendance();
      unsubCorrections();
      unsubLogs();
      unsubNotifs();
      unsubCR();
      unsubSchedule();
    };
  }, []);

  
const parseTimeToTodayEpoch = (timeStr: string) => {
  if (!timeStr) return Date.now();
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return Date.now();
  let [_, hours, minutes, ampm] = match;
  let h = parseInt(hours, 10);
  let m = parseInt(minutes, 10);
  if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
  
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Find active or today's session
  const activeSession = useMemo(() => {
    const classSessions = sessions.filter(s => s.classId === currentClass.id);
    return classSessions.find(s => s.status === 'active') || classSessions.find(s => s.date === todayStr) || (classSessions.length > 0 ? classSessions[0] : null);
  }, [sessions, todayStr, currentClass.id]);

  // Filter today's attendance records
  const todayAttendance = useMemo(() => {
    if (!activeSession) return [];
    return allAttendance.filter(a => a.sessionId === activeSession.id);
  }, [allAttendance, activeSession]);

  // Format countdown string
  const sessionCountdown = useMemo(() => {
    if (!activeSession || activeSession.status !== 'active') return '00:00';
    const now = currentTime.getTime();
    if (now < activeSession.startEpoch) {
      return 'UPCOMING';
    }
    if (now > activeSession.endEpoch) {
      return 'ENDED';
    }
    const end = activeSession.endEpoch;
    const diff = Math.max(0, end - now);
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [activeSession, currentTime]);

  const isSessionActive = activeSession?.status === 'active' && currentTime.getTime() >= activeSession.startEpoch && currentTime.getTime() <= activeSession.endEpoch;

  // Add an Activity Log helper
  const addActivityLog = useCallback(async (logData: Omit<ActivityLog, 'id' | 'timestamp' | 'actorId' | 'actorEmail' | 'actorName' | 'actorRole'>) => {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLog: ActivityLog = {
      id,
      timestamp: new Date().toISOString(),
      actorId: adminProfile.uid,
      actorEmail: adminProfile.email,
      actorName: adminProfile.name,
      actorRole: currentRole,
      ...logData,
    };
    setActivityLogs(prev => [newLog, ...prev]);

    try {
      await setDoc(doc(db, 'activityLogs', id), newLog);
    } catch {
      // Local fallback logged
    }
  }, [adminProfile, currentRole]);

  // Recalculate session counters
  const updateSessionCounters = useCallback(async (sessionId: string, records: AttendanceRecord[]) => {
    const sessionRecords = records.filter(r => r.sessionId === sessionId);
    const present = sessionRecords.filter(r => r.status === 'present').length;
    const absent = sessionRecords.filter(r => r.status === 'absent').length;
    const notMarked = sessionRecords.filter(r => r.status === 'not_marked').length;
    const correction = sessionRecords.filter(r => r.status === 'correction_requested').length;

    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            presentCount: present,
            absentCount: absent,
            notMarkedCount: notMarked,
            correctionCount: correction,
          };
        }
        return s;
      })
    );

    try {
      const updates = {
        presentCount: present,
        absentCount: absent,
        notMarkedCount: notMarked,
        correctionCount: correction,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'attendanceSessions', sessionId), updates);
      await updateDoc(doc(db, 'sessions', sessionId), updates).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  // Mark single attendance
  const markAttendance = useCallback(async (studentId: string, status: AttendanceStatus, notes?: string, method: AttendanceMethod = 'manual_admin') => {
    if (!activeSession) return;

    const student = students.find(s => s.id === studentId);
    const studentName = student ? student.fullName : studentId;
    const recordId = `${activeSession.id}_${studentId}`;

    let updatedList: AttendanceRecord[] = [];
    let recordToSave: AttendanceRecord;

    setAllAttendance(prev => {
      const existingIndex = prev.findIndex(r => r.id === recordId);
      if (existingIndex >= 0) {
        updatedList = prev.map((r, i) => {
          if (i === existingIndex) {
            recordToSave = {
              ...r,
              status,
              method,
              notes: notes || r.notes,
              markedAt: status === 'present' ? new Date().toISOString() : r.markedAt,
              markedBy: adminProfile.name,
              updatedAt: new Date().toISOString(),
            };
            return recordToSave;
          }
          return r;
        });
      } else {
        recordToSave = {
          id: recordId,
          sessionId: activeSession.id,
          classId: activeSession.classId,
          studentId,
          studentName,
          rollNumber: student?.rollNumber,
          date: activeSession.date,
          status,
          method,
          notes,
          markedAt: status === 'present' ? new Date().toISOString() : undefined,
          markedBy: adminProfile.name,
          updatedAt: new Date().toISOString(),
        };
        updatedList = [recordToSave, ...prev];
      }
      return updatedList;
    });

    updateSessionCounters(activeSession.id, updatedList);

    try {
      const sanitizedRecord = {
        id: recordId,
        sessionId: activeSession.id,
        classId: activeSession.classId,
        studentId,
        studentUid: studentId,
        studentName,
        rollNumber: student?.rollNumber || '',
        date: activeSession.date,
        status,
        method,
        notes: notes || '',
        markedAt: status === 'present' ? new Date().toISOString() : '',
        markedBy: adminProfile.name,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'attendance', recordId), sanitizedRecord, { merge: true });
    } catch (e) {
      console.warn('Attendance save warning:', e);
    }

    addActivityLog({
      eventType: 'attendance_modified',
      targetType: 'student',
      targetId: studentId,
      targetName: studentName,
      details: `Marked attendance as ${status.toUpperCase()} (${method}) by ${adminProfile.name}.`,
    });
  }, [activeSession, students, adminProfile, updateSessionCounters, addActivityLog]);

  // Bulk mark status
  const bulkMarkStatus = useCallback(async (status: AttendanceStatus, targetIds?: string[]) => {
    if (!activeSession) return;

    const targets = targetIds || students.map(s => s.id);
    let updatedList: AttendanceRecord[] = [];

    setAllAttendance(prev => {
      const existingMap = new Map<string, AttendanceRecord>(prev.map(r => [r.id, r]));

      targets.forEach(stId => {
        const recId = `${activeSession.id}_${stId}`;
        const student = students.find(s => s.id === stId);
        const existing = existingMap.get(recId);

        if (existing) {
          existingMap.set(recId, {
            ...existing,
            status,
            method: 'manual_admin',
            markedAt: status === 'present' ? new Date().toISOString() : existing.markedAt,
            markedBy: adminProfile.name,
            updatedAt: new Date().toISOString(),
          });
        } else {
          existingMap.set(recId, {
            id: recId,
            sessionId: activeSession.id,
            classId: activeSession.classId,
            studentId: stId,
            studentName: student ? student.fullName : stId,
            rollNumber: student?.rollNumber,
            date: activeSession.date,
            status,
            method: 'manual_admin',
            markedAt: status === 'present' ? new Date().toISOString() : undefined,
            markedBy: adminProfile.name,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      updatedList = Array.from(existingMap.values());
      return updatedList;
    });

    updateSessionCounters(activeSession.id, updatedList);

    try {
      const batch = writeBatch(db);
      targets.forEach(stId => {
        const recId = `${activeSession.id}_${stId}`;
        const student = students.find(s => s.id === stId);
        const docRef = doc(db, 'attendance', recId);
        batch.set(docRef, {
          id: recId,
          sessionId: activeSession.id,
          classId: activeSession.classId,
          studentId: stId,
          studentUid: stId,
          studentName: student ? student.fullName : stId,
          rollNumber: student?.rollNumber || '',
          date: activeSession.date,
          status,
          method: 'manual_admin',
          markedAt: status === 'present' ? new Date().toISOString() : '',
          markedBy: adminProfile.name,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Bulk attendance write batch warning:', e);
    }

    addActivityLog({
      eventType: 'attendance_modified',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Bulk marked ${targets.length} students as ${status.toUpperCase()} by ${adminProfile.name}.`,
    });
  }, [activeSession, students, adminProfile, updateSessionCounters, addActivityLog]);

  // Update class configuration (e.g. from Settings)
  const updateClassConfig = useCallback((classId: string, updates: Partial<ClassConfig>) => {
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, ...updates } : c));
  }, []);

  // Start session manually (or create fresh session if none exists)
  const startSessionManually = useCallback(async () => {
    const defaultStart = currentClass.defaultStartTime || '10:00 AM';
    const defaultEnd = currentClass.defaultEndTime || '10:40 AM';
    
    // Use configured time bounds for current day
    const configuredStartEpoch = parseTimeToTodayEpoch(defaultStart);
    const configuredEndEpoch = parseTimeToTodayEpoch(defaultEnd);
    
    let durationMs = configuredEndEpoch - configuredStartEpoch;
    if (durationMs <= 0) durationMs = 40 * 60 * 1000;

    const now = Date.now();
    let startEpoch = configuredStartEpoch;
    let endEpoch = configuredEndEpoch;

    // If configured end time is in the past or right now when teacher launches session,
    // ensure endEpoch is extended into the future so session remains ACTIVE for students!
    if (endEpoch <= now) {
      startEpoch = Math.min(configuredStartEpoch, now);
      endEpoch = now + durationMs;
    }

    const sessionDate = todayStr;
    const token = `AMC-SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    let sessionObj: AttendanceSession;

    if (activeSession && activeSession.date === sessionDate && activeSession.classId === currentClass.id) {
      sessionObj = {
        ...activeSession,
        status: 'active',
        startTime: currentClass.defaultStartTime || '10:00 AM',
        endTime: currentClass.defaultEndTime || '10:40 AM',
        startEpoch,
        endEpoch,
        token: activeSession.token || token,
      };
      setSessions(prev =>
        prev.map(s => (s.id === activeSession.id ? sessionObj : s))
      );
    } else {
      const newSessionId = `session_${sessionDate.replace(/-/g, '_')}_${Date.now().toString(36)}`;
      sessionObj = {
        id: newSessionId,
        classId: currentClass.id,
        className: `${currentClass.name} - ${currentClass.paperName}`,
        date: sessionDate,
        startTime: currentClass.defaultStartTime || '10:00 AM',
        endTime: currentClass.defaultEndTime || '10:40 AM',
        startEpoch,
        endEpoch,
        token,
        status: 'active',
        totalStudents: students.length,
        presentCount: 0,
        absentCount: 0,
        notMarkedCount: students.length,
        correctionCount: 0,
        createdBy: adminProfile.name,
        createdAt: new Date().toISOString(),
      };

      const initialRecords: AttendanceRecord[] = students.map(st => ({
        id: `${newSessionId}_${st.id}`,
        sessionId: newSessionId,
        classId: currentClass.id,
        studentId: st.id,
        studentName: st.fullName,
        rollNumber: st.rollNumber,
        date: sessionDate,
        status: 'not_marked',
        method: 'auto_close',
        updatedAt: new Date().toISOString(),
      }));

      setSessions(prev => [sessionObj, ...prev]);
      setAllAttendance(prev => [...initialRecords, ...prev]);
    }

    try {
      await setDoc(doc(db, 'attendanceSessions', sessionObj.id), sessionObj, { merge: true });
      await setDoc(doc(db, 'sessions', sessionObj.id), sessionObj, { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('Session start Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'qr_session_started',
      targetType: 'session',
      targetId: sessionObj.id,
      targetName: `${currentClass.name} - ${currentClass.paperName}`,
      details: `Live QR attendance session started by ${adminProfile.name}. Token: ${sessionObj.token}`,
    });
  }, [activeSession, currentClass, todayStr, students, adminProfile, addActivityLog]);

  // Close session manually and auto-transition unmarked to absent
  const closeSessionManually = useCallback(async () => {
    if (!activeSession) return;

    let updatedList: AttendanceRecord[] = [];
    setAllAttendance(prev => {
      updatedList = prev.map(r => {
        if (r.sessionId === activeSession.id && r.status === 'not_marked') {
          return {
            ...r,
            status: 'absent',
            method: 'auto_close',
            notes: 'Session closed - marked absent automatically',
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      return updatedList;
    });

    const closedSession: AttendanceSession = {
      ...activeSession,
      status: 'closed',
      closedAt: new Date().toISOString(),
      autoClosed: true,
    };

    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? closedSession : s))
    );

    updateSessionCounters(activeSession.id, updatedList);

    try {
      await setDoc(doc(db, 'attendanceSessions', activeSession.id), closedSession, { merge: true });
      await setDoc(doc(db, 'sessions', activeSession.id), closedSession, { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('Session close Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'qr_session_closed',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Attendance session closed. Unmarked students transitioned to Absent.`,
    });
  }, [activeSession, updateSessionCounters, addActivityLog]);

  // Extend session
  const extendSession = useCallback(async (extraMinutes: number) => {
    if (!activeSession) return;
    const newEndEpoch = (activeSession.endEpoch || Date.now()) + extraMinutes * 60 * 1000;

    const extended: AttendanceSession = {
      ...activeSession,
      endEpoch: newEndEpoch,
      status: 'active',
    };

    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? extended : s))
    );

    try {
      await updateDoc(doc(db, 'attendanceSessions', activeSession.id), {
        endEpoch: newEndEpoch,
        status: 'active',
      });
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        endEpoch: newEndEpoch,
        status: 'active',
      }).catch(() => {});
    } catch (e) {
      console.warn('Extend session write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Session duration extended by +${extraMinutes} minutes by ${adminProfile.name}.`,
    });
  }, [activeSession, adminProfile, addActivityLog]);

  const updateSessionTime = useCallback(async (startTimeStr: string, endTimeStr: string) => {
    if (!activeSession) return;
    
    const newStartEpoch = parseTimeToTodayEpoch(startTimeStr);
    let newEndEpoch = parseTimeToTodayEpoch(endTimeStr);
    
    // If end time epoch is <= start time epoch, add 40 minutes default
    if (newEndEpoch <= newStartEpoch) {
      newEndEpoch = newStartEpoch + 40 * 60 * 1000;
    }

    const now = Date.now();
    const isNowWithinBounds = now >= newStartEpoch && now <= newEndEpoch;
    const updatedStatus = isNowWithinBounds ? 'active' : (now < newStartEpoch ? 'active' : activeSession.status);

    const updated: AttendanceSession = {
      ...activeSession,
      startTime: startTimeStr,
      endTime: endTimeStr,
      startEpoch: newStartEpoch,
      endEpoch: newEndEpoch,
      status: updatedStatus,
    };

    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? updated : s))
    );

    try {
      const docUpdates = {
        startTime: startTimeStr,
        endTime: endTimeStr,
        date: activeSession.date,
        startEpoch: newStartEpoch,
        endEpoch: newEndEpoch,
        status: updatedStatus,
      };
      await updateDoc(doc(db, 'attendanceSessions', activeSession.id), docUpdates);
      await updateDoc(doc(db, 'sessions', activeSession.id), docUpdates).catch(() => {});
    } catch (e) {
      console.warn('Update session time write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Session time updated to ${startTimeStr} - ${endTimeStr} by ${adminProfile.name}.`,
    });
  }, [activeSession, adminProfile, addActivityLog]);

  // Regenerate security token
  const regenerateToken = useCallback(async () => {
    if (!activeSession) return;
    const newToken = `AMC-SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? { ...s, token: newToken } : s))
    );

    try {
      await updateDoc(doc(db, 'attendanceSessions', activeSession.id), {
        token: newToken,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        token: newToken,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch (e) {
      console.warn('Regenerate token write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Regenerated dynamic secure QR token (${newToken}) for session integrity.`,
    });
  }, [activeSession, addActivityLog]);

  // Add student
  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = studentData.studentId || `STU-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();
    const newStudent: Student = {
      ...studentData,
      id,
      studentId: id,
      createdAt: now,
      updatedAt: now,
    };

    setRawStudents(prev => [newStudent, ...prev]);

    try {
      await setDoc(doc(db, 'students', id), newStudent);
    } catch (e) {
      console.warn('Add student Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'student_registered',
      targetType: 'student',
      targetId: id,
      targetName: newStudent.fullName,
      details: `Enrolled new student ${newStudent.fullName} (${newStudent.rollNumber || id}) into ${newStudent.course}.`,
    });
  }, [addActivityLog]);

  // Update student
  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    const now = new Date().toISOString();
    setRawStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            ...updates,
            updatedAt: now,
          };
        }
        return s;
      })
    );

    try {
      const cleanUpdates = { ...updates, updatedAt: now };
      Object.keys(cleanUpdates).forEach(key => {
        if (cleanUpdates[key] === undefined) delete cleanUpdates[key];
      });
      await updateDoc(doc(db, 'students', studentId), cleanUpdates);
    } catch (e) {
      console.warn('Update student Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'student',
      targetId: studentId,
      targetName: updates.fullName || studentId,
      details: `Updated student profile information for ID: ${studentId}.`,
    });
  }, [addActivityLog]);

  // Delete student
  const deleteStudent = useCallback(async (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    setRawStudents(prev => prev.filter(s => s.id !== studentId));
    setAllAttendance(prev => prev.filter(a => a.studentId !== studentId));
    setCorrectionRequests(prev => prev.filter(c => c.studentId !== studentId));

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (e) {
      console.warn('Delete student Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'student',
      targetId: studentId,
      targetName: target?.fullName || studentId,
      details: `Removed student ${target?.fullName || studentId} from enrollment records.`,
    });
  }, [students, addActivityLog]);

  // Bulk delete students
  const deleteStudents = useCallback(async (studentIds: string[]) => {
    const idSet = new Set(studentIds);
    const count = studentIds.length;
    setRawStudents(prev => prev.filter(s => !idSet.has(s.id)));
    setAllAttendance(prev => prev.filter(a => !idSet.has(a.studentId)));
    setCorrectionRequests(prev => prev.filter(c => !idSet.has(c.studentId)));

    try {
      const batch = writeBatch(db);
      studentIds.forEach(id => {
        batch.delete(doc(db, 'students', id));
      });
      await batch.commit();
    } catch (e) {
      console.warn('Bulk delete Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'student',
      targetId: 'bulk',
      targetName: `${count} Students`,
      details: `Batch deleted ${count} students and purged their attendance & correction records.`,
    });

    const newNotif: AdminNotification = {
      id: `notif_${Date.now()}`,
      recipientType: 'admin',
      recipientId: 'all_admins',
      title: 'Batch Students Deleted',
      message: `Successfully deleted ${count} student records from the system.`,
      type: 'system_info',
      read: false,
      createdAt: new Date().toISOString(),
      link: 'students',
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, [addActivityLog]);

  // Bulk update student status
  const bulkUpdateStudentStatus = useCallback(async (studentIds: string[], newStatus: AccountStatus, reason?: string) => {
    const now = new Date().toISOString();
    setRawStudents(prev =>
      prev.map(s => {
        if (studentIds.includes(s.id) || studentIds.includes(s.studentId)) {
          return {
            ...s,
            accountStatus: newStatus,
            lockReason: newStatus !== 'active' ? (reason || 'Bulk status change by admin') : undefined,
            updatedAt: now,
          };
        }
        return s;
      })
    );

    try {
      const batch = writeBatch(db);
      studentIds.forEach(id => {
        batch.set(doc(db, 'students', id), {
          accountStatus: newStatus,
          lockReason: newStatus !== 'active' ? (reason || 'Bulk status change by admin') : '',
          updatedAt: now,
        }, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Bulk update status Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'student',
      targetId: 'bulk',
      targetName: `${studentIds.length} Students`,
      details: `Bulk updated status of ${studentIds.length} students to ${newStatus.toUpperCase()}.`,
    });
  }, [addActivityLog]);

  // Reset student device binding (Sets authorizedDeviceId: null, boundDeviceId: null, and accountStatus: "active")
  const resetDeviceBinding = useCallback(async (studentId: string) => {
    const student = students.find(s => s.id === studentId || s.studentId === studentId || s.rollNumber === studentId);
    if (!student) return;

    const now = new Date().toISOString();
    setRawStudents(prev =>
      prev.map(s => {
        if (s.id === student.id || s.studentId === student.studentId) {
          return {
            ...s,
            accountStatus: 'active',
            authorizedDeviceId: undefined,
            boundDeviceId: undefined,
            authorizedDeviceModel: undefined,
            revokedDeviceId: undefined,
            forceLogoutDeviceId: undefined,
            logoutPromptMessage: undefined,
            lockReason: undefined,
            lastMismatchDetectedAt: undefined,
            lastMismatchDetails: undefined,
            updatedAt: now,
          };
        }
        return s;
      })
    );

    try {
      const payload = {
        accountStatus: 'active',
        authorizedDeviceId: null,
        boundDeviceId: null,
        authorizedDeviceModel: null,
        lockReason: null,
        revokedDeviceId: null,
        forceLogoutDeviceId: null,
        logoutPromptMessage: null,
        lastMismatchDetectedAt: null,
        lastMismatchDetails: null,
        updatedAt: now,
      };
      await setDoc(doc(db, 'students', student.id), payload, { merge: true });
      if (student.studentId && student.studentId !== student.id) {
        await setDoc(doc(db, 'students', student.studentId), payload, { merge: true });
      }
    } catch (e) {
      console.warn('Reset device binding write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'security',
      targetId: student.id,
      targetName: student.fullName,
      details: `Device binding cleared for ${student.fullName}. Account active and student can automatically bind their current device as primary phone on next sign-in.`,
    });
  }, [students, addActivityLog]);

  // Reactivate & Bind to Current Phone
  const reactivateAndBindToCurrentPhone = useCallback(async (studentId: string) => {
    const student = students.find(s => s.id === studentId || s.studentId === studentId || s.rollNumber === studentId);
    if (!student) return;

    const attemptedDeviceId = student.lastMismatchDetails?.attemptedDeviceId || null;
    const attemptedDeviceModel = student.lastMismatchDetails?.attemptedDeviceModel || null;
    const now = new Date().toISOString();

    setRawStudents(prev =>
      prev.map(s => {
        if (s.id === student.id || s.studentId === student.studentId) {
          return {
            ...s,
            accountStatus: 'active',
            lockReason: undefined,
            authorizedDeviceId: attemptedDeviceId || undefined,
            boundDeviceId: attemptedDeviceId || undefined,
            authorizedDeviceModel: attemptedDeviceModel || undefined,
            revokedDeviceId: undefined,
            forceLogoutDeviceId: undefined,
            logoutPromptMessage: undefined,
            lastMismatchDetectedAt: undefined,
            lastMismatchDetails: undefined,
            updatedAt: now,
          };
        }
        return s;
      })
    );

    try {
      const payload = {
        accountStatus: 'active',
        lockReason: null,
        authorizedDeviceId: attemptedDeviceId,
        boundDeviceId: attemptedDeviceId,
        authorizedDeviceModel: attemptedDeviceModel,
        revokedDeviceId: null,
        forceLogoutDeviceId: null,
        logoutPromptMessage: null,
        lastMismatchDetectedAt: null,
        lastMismatchDetails: null,
        updatedAt: now,
      };
      await setDoc(doc(db, 'students', student.id), payload, { merge: true });
      if (student.studentId && student.studentId !== student.id) {
        await setDoc(doc(db, 'students', student.studentId), payload, { merge: true });
      }
    } catch (e) {
      console.warn('Reactivate & Bind to Current Phone Firestore write notice:', e);
    }

    addActivityLog({
      eventType: 'account_reactivated',
      targetType: 'security',
      targetId: student.id,
      targetName: student.fullName,
      details: `Reactivated and bound to current phone (${attemptedDeviceModel || attemptedDeviceId || 'Current Device'}) by ${adminProfile.name}.`,
    });
  }, [students, adminProfile, addActivityLog]);

  // Import batch students
  const importStudents = useCallback(async (newStudentsList: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const createdList: Student[] = newStudentsList.map((st, idx) => {
      const id = `stu_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        ...st,
        id,
        createdAt: now,
        updatedAt: now,
      };
    });

    setRawStudents(prev => [...prev, ...createdList]);

    try {
      const batch = writeBatch(db);
      createdList.forEach(st => {
        batch.set(doc(db, 'students', st.id), st, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Import batch students write notice:', e);
    }

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'student',
      targetId: 'batch_import',
      targetName: `${createdList.length} Students`,
      details: `Imported ${createdList.length} students via CSV roster batch enrollment.`,
    });

    const newNotif: AdminNotification = {
      id: `notif_${Date.now()}`,
      recipientType: 'admin',
      recipientId: 'all_admins',
      title: 'Batch Student Import Completed',
      message: `Enrolled ${createdList.length} new students into the class roster.`,
      type: 'system_info',
      read: false,
      createdAt: now,
      link: 'students',
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, [addActivityLog]);

  // Toggle account status
  const toggleAccountStatus = useCallback(async (studentId: string, newStatus: AccountStatus, reason?: string) => {
    const student = students.find(s => s.id === studentId || s.studentId === studentId || s.rollNumber === studentId);
    if (!student) return;

    const now = new Date().toISOString();
    setRawStudents(prev =>
      prev.map(s => {
        if (s.id === student.id || s.studentId === student.studentId) {
          return {
            ...s,
            accountStatus: newStatus,
            lockReason: newStatus !== 'active' ? (reason || 'Admin status override') : undefined,
            updatedAt: now,
          };
        }
        return s;
      })
    );

    try {
      const payload = {
        accountStatus: newStatus,
        lockReason: newStatus !== 'active' ? (reason || 'Admin status override') : '',
        updatedAt: now,
      };
      await setDoc(doc(db, 'students', student.id), payload, { merge: true });
      if (student.studentId && student.studentId !== student.id) {
        await setDoc(doc(db, 'students', student.studentId), payload, { merge: true });
      }
    } catch (e) {
      console.warn('Toggle account status write notice:', e);
    }

    const eventType = newStatus === 'active' ? 'account_reactivated' : newStatus === 'locked' ? 'account_locked' : 'account_disabled';

    addActivityLog({
      eventType,
      targetType: 'student',
      targetId: student.id,
      targetName: student.fullName,
      details: `Student account ${newStatus.toUpperCase()} by ${adminProfile.name}. ${reason ? `Reason: ${reason}` : ''}`,
    });
  }, [students, adminProfile, addActivityLog]);

  // Reactivate student device & account (Quick Reactivate logs out the new unauthorized device)
  const reactivateDeviceAndAccount = useCallback(
    async (
      studentId: string,
      optionsOrDeviceId?: boolean | string | { transferToNewDevice?: boolean; newDeviceId?: string; newDeviceModel?: string },
      newDeviceModel?: string
    ) => {
      const student = students.find(s => s.id === studentId || s.studentId === studentId || s.rollNumber === studentId);
      if (!student) {
        console.warn('Student not found for reactivate:', studentId);
        return;
      }

      let transferToNewDevice = false;
      let targetDeviceId = student.authorizedDeviceId;
      let targetDeviceModel = student.authorizedDeviceModel;

      if (typeof optionsOrDeviceId === 'object' && optionsOrDeviceId !== null) {
        transferToNewDevice = optionsOrDeviceId.transferToNewDevice === true;
        if (transferToNewDevice) {
          targetDeviceId = optionsOrDeviceId.newDeviceId || student.lastMismatchDetails?.attemptedDeviceId || `dev_auth_${Date.now().toString(36)}`;
          targetDeviceModel = optionsOrDeviceId.newDeviceModel || student.lastMismatchDetails?.attemptedDeviceModel || 'Authorized Mobile Device';
        }
      } else if (typeof optionsOrDeviceId === 'boolean') {
        transferToNewDevice = optionsOrDeviceId;
        if (transferToNewDevice) {
          targetDeviceId = student.lastMismatchDetails?.attemptedDeviceId || `dev_auth_${Date.now().toString(36)}`;
          targetDeviceModel = student.lastMismatchDetails?.attemptedDeviceModel || 'Authorized Mobile Device';
        }
      } else if (typeof optionsOrDeviceId === 'string' && optionsOrDeviceId.trim().length > 0) {
        // Explicit device ID provided (e.g. transfer to specific ID)
        transferToNewDevice = true;
        targetDeviceId = optionsOrDeviceId;
        targetDeviceModel = newDeviceModel || 'Authorized Mobile Device';
      }

      // Default (Quick Reactivate): Keep existing authorized device and revoke/logout the unauthorized device
      if (!targetDeviceId) {
        targetDeviceId = `dev_auth_${Date.now().toString(36)}`;
        targetDeviceModel = targetDeviceModel || 'Primary Registered Device';
      }

      const attemptedUnauthorizedId = student.lastMismatchDetails?.attemptedDeviceId;
      const attemptedUnauthorizedModel = student.lastMismatchDetails?.attemptedDeviceModel;
      const revokedDeviceId = (!transferToNewDevice && attemptedUnauthorizedId) ? attemptedUnauthorizedId : undefined;
      const sessionVersion = Date.now();
      const now = new Date().toISOString();

      setRawStudents(prev =>
        prev.map(s => {
          if (s.id === student.id || s.studentId === student.studentId) {
            return {
              ...s,
              accountStatus: 'active',
              authorizedDeviceId: targetDeviceId,
              authorizedDeviceModel: targetDeviceModel,
              revokedDeviceId: revokedDeviceId || s.revokedDeviceId,
              forceLogoutDeviceId: revokedDeviceId,
              sessionRevokedAt: revokedDeviceId ? now : s.sessionRevokedAt,
              sessionVersion,
              logoutPromptMessage: revokedDeviceId ? 'Your session on this device has been revoked by the administrator. Please log out.' : undefined,
              lockReason: undefined,
              lastMismatchDetectedAt: undefined,
              lastMismatchDetails: undefined,
              updatedAt: now,
            };
          }
          return s;
        })
      );

      try {
        const studentPayload: any = {
          accountStatus: 'active',
          authorizedDeviceId: targetDeviceId || '',
          authorizedDeviceModel: targetDeviceModel || '',
          lockReason: '',
          lastMismatchDetectedAt: '',
          lastMismatchDetails: null,
          revokedDeviceId: revokedDeviceId || '',
          forceLogoutDeviceId: revokedDeviceId || '',
          sessionRevokedAt: revokedDeviceId ? now : '',
          sessionVersion,
          logoutPromptMessage: revokedDeviceId ? 'Your session on this device has been revoked by the administrator. Please log out.' : '',
          updatedAt: now,
        };

        await setDoc(doc(db, 'students', student.id), studentPayload, { merge: true });
        if (student.studentId && student.studentId !== student.id) {
          await setDoc(doc(db, 'students', student.studentId), studentPayload, { merge: true });
        }
      } catch (e) {
        console.warn('Reactivate device write notice:', e);
      }

      const details = transferToNewDevice
        ? `Hardware binding transferred by ${adminProfile.name} to new device: ${targetDeviceModel} (${targetDeviceId}).`
        : `Quick Reactivated by ${adminProfile.name}. Unauthorized new device (${attemptedUnauthorizedModel || 'Secondary Device'}) was REVOKED and FORCED TO LOG OUT. Account restored to authorized primary device.`;

      addActivityLog({
        eventType: 'account_reactivated',
        targetType: 'security',
        targetId: student.id,
        targetName: student.fullName,
        details,
      });

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          recipientType: 'admin',
          title: 'Account Reactivated & Device Revoked',
          message: `${student.fullName}'s account unlocked. Unauthorized session was terminated.`,
          type: 'account_lock',
          read: false,
          createdAt: now,
        },
        ...prev,
      ]);
    },
    [students, adminProfile, addActivityLog]
  );

  // Create correction request
  const createCorrectionRequest = useCallback(async (reqData: Omit<CorrectionRequest, 'id' | 'status' | 'requestedAt'>) => {
    const id = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReq: CorrectionRequest = {
      ...reqData,
      id,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setCorrectionRequests(prev => [newReq, ...prev]);

    try {
      await setDoc(doc(db, 'correctionRequests', id), newReq);
    } catch (e) {
      console.warn('Create correction request write notice:', e);
    }
  }, []);

  // Count student monthly requests
  const getStudentMonthlyCorrectionCount = useCallback((studentId: string, monthKey?: string): number => {
    const currentMonth = monthKey || todayStr.substring(0, 7);
    return correctionRequests.filter(cr => cr.studentId === studentId && cr.monthKey === currentMonth).length;
  }, [correctionRequests, todayStr]);

  // Approve correction request
  const approveCorrectionRequest = useCallback(async (requestId: string, decisionNotes?: string) => {
    const req = correctionRequests.find(r => r.id === requestId);
    if (!req) return;

    const now = new Date().toISOString();
    setCorrectionRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'approved',
            decidedAt: now,
            decidedBy: adminProfile.name,
            decisionNotes: decisionNotes || 'Attendance correction verified and approved.',
          };
        }
        return r;
      })
    );

    let updatedList: AttendanceRecord[] = [];
    setAllAttendance(prev => {
      const matchIndex = prev.findIndex(a => a.studentId === req.studentId && a.date === req.attendanceDate);
      if (matchIndex >= 0) {
        updatedList = prev.map((a, i) => {
          if (i === matchIndex) {
            return {
              ...a,
              status: 'present',
              method: 'correction_approval',
              notes: `Correction approved: ${decisionNotes || req.reason}`,
              markedAt: now,
              markedBy: adminProfile.name,
              updatedAt: now,
            };
          }
          return a;
        });
      } else {
        const newRec: AttendanceRecord = {
          id: `${req.sessionId || `session_${req.attendanceDate}`}_${req.studentId}`,
          sessionId: req.sessionId || `session_${req.attendanceDate}`,
          classId: 'core_class',
          studentId: req.studentId,
          studentName: req.studentName,
          rollNumber: req.rollNumber,
          date: req.attendanceDate,
          status: 'present',
          method: 'correction_approval',
          markedAt: now,
          markedBy: adminProfile.name,
          notes: `Correction approved: ${decisionNotes || req.reason}`,
          updatedAt: now,
        };
        updatedList = [newRec, ...prev];
      }
      return updatedList;
    });

    try {
      await updateDoc(doc(db, 'correctionRequests', requestId), {
        status: 'approved',
        decidedAt: now,
        decidedBy: adminProfile.name,
        decisionNotes: decisionNotes || 'Attendance correction verified and approved.',
      });

      const recId = `${req.sessionId || `session_${req.attendanceDate}`}_${req.studentId}`;
      await setDoc(doc(db, 'attendance', recId), {
        id: recId,
        sessionId: req.sessionId || `session_${req.attendanceDate}`,
        classId: 'core_class',
        studentId: req.studentId,
        studentUid: req.studentId,
        studentName: req.studentName,
        rollNumber: req.rollNumber || '',
        date: req.attendanceDate,
        status: 'present',
        method: 'correction_approval',
        markedAt: now,
        markedBy: adminProfile.name,
        notes: `Correction approved: ${decisionNotes || req.reason}`,
        updatedAt: now,
      }, { merge: true });
    } catch (e) {
      console.warn('Approve correction request write notice:', e);
    }

    addActivityLog({
      eventType: 'correction_approved',
      targetType: 'correction',
      targetId: requestId,
      targetName: `${req.studentName} (${req.attendanceDate})`,
      details: `Approved attendance correction for ${req.studentName} on ${req.attendanceDate}. Marked as PRESENT.`,
    });
  }, [correctionRequests, adminProfile, addActivityLog]);

  // Reject correction request
  const rejectCorrectionRequest = useCallback(async (requestId: string, decisionNotes?: string) => {
    const req = correctionRequests.find(r => r.id === requestId);
    if (!req) return;

    const now = new Date().toISOString();
    setCorrectionRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'rejected',
            decidedAt: now,
            decidedBy: adminProfile.name,
            decisionNotes: decisionNotes || 'Attendance correction claim could not be verified.',
          };
        }
        return r;
      })
    );

    try {
      await updateDoc(doc(db, 'correctionRequests', requestId), {
        status: 'rejected',
        decidedAt: now,
        decidedBy: adminProfile.name,
        decisionNotes: decisionNotes || 'Attendance correction claim could not be verified.',
      });
    } catch (e) {
      console.warn('Reject correction request write notice:', e);
    }

    addActivityLog({
      eventType: 'correction_rejected',
      targetType: 'correction',
      targetId: requestId,
      targetName: `${req.studentName} (${req.attendanceDate})`,
      details: `Rejected attendance correction for ${req.studentName} on ${req.attendanceDate}. Notes: ${decisionNotes || 'Unverified'}.`,
    });
  }, [correctionRequests, adminProfile, addActivityLog]);

  // Student stats calculator
  const getStudentStats = useCallback((studentId: string): StudentAttendanceStats => {
    const studentRecords = allAttendance.filter(a => a.studentId === studentId);
    const totalClasses = Math.max(1, studentRecords.length);
    const present = studentRecords.filter(a => a.status === 'present').length;
    const absent = studentRecords.filter(a => a.status === 'absent').length;
    const notMarked = studentRecords.filter(a => a.status === 'not_marked').length;
    const percentage = studentRecords.length > 0 ? Math.round((present / totalClasses) * 100) : 100;
    const isDefaulter = studentRecords.length > 0 && percentage < 75;

    return {
      totalClasses,
      present,
      absent,
      notMarked,
      percentage,
      isDefaulter,
    };
  }, [allAttendance]);

  // Simulate real-time student scan
  const simulateStudentScan = useCallback((studentId?: string) => {
    if (!activeSession || !isSessionActive) return;

    let targetStudent: Student | undefined;
    if (studentId) {
      targetStudent = students.find(s => s.id === studentId);
    } else {
      const notMarkedStudentIds = todayAttendance
        .filter(a => a.status === 'not_marked')
        .map(a => a.studentId);

      const candidate = students.find(s => s.accountStatus === 'active' && notMarkedStudentIds.includes(s.id));
      targetStudent = candidate || students.find(s => s.accountStatus === 'active');
    }

    if (!targetStudent) return;

    if (targetStudent.accountStatus === 'locked') {
      addActivityLog({
        eventType: 'security_alert',
        targetType: 'student',
        targetId: targetStudent.id,
        targetName: targetStudent.fullName,
        details: `Scan rejected: Student account is LOCKED due to prior security flags.`,
      });
      return;
    }

    markAttendance(targetStudent.id, 'present', 'Scanned QR Code in class', 'qr_scan');
  }, [activeSession, students, todayAttendance, markAttendance, addActivityLog]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setRawStudents([]);
    setSessions([]);
    setAllAttendance([]);
    setCorrectionRequests([]);
    setActivityLogs([]);
    setNotifications([]);
    localStorage.clear();
  }, []);

  // Notifications helpers
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <AttendanceContext.Provider
      value={{
        students,
        sessions,
        activeSession,
        todayAttendance,
        allAttendance,
        correctionRequests,
        activityLogs,
        notifications,
        crDelegations,
        classes,
        currentClass,
        currentTime,
        sessionCountdown,
        isSessionActive,
        updateClassConfig,
        startSessionManually,
        closeSessionManually,
        extendSession,
        updateSessionTime,
        regenerateToken,
        markAttendance,
        bulkMarkStatus,
        addStudent,
        updateStudent,
        deleteStudent,
        deleteStudents,
        toggleAccountStatus,
        bulkUpdateStudentStatus,
        resetDeviceBinding,
        reactivateAndBindToCurrentPhone,
        reactivateDeviceAndAccount,
        importStudents,
        createCorrectionRequest,
        approveCorrectionRequest,
        rejectCorrectionRequest,
        getStudentMonthlyCorrectionCount,
        getStudentStats,
        simulateStudentScan,
        markNotificationRead,
        deleteNotification,
        markAllNotificationsRead,
        addActivityLog,
        clearAllData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
