import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  getDocs,
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
  ScheduleMaster,
  TimetablePeriod,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_SESSIONS,
  INITIAL_TODAY_ATTENDANCE,
  INITIAL_CORRECTION_REQUESTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLASSES,
  INITIAL_SCHEDULE_MASTER,
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
  scheduleMaster: ScheduleMaster;
  currentTime: Date;
  sessionCountdown: string;
  isSessionActive: boolean;
  sessionValidationError: string | null;
  clearSessionValidationError: () => void;

  // Actions
  updateClassConfig: (classId: string, updates: Partial<ClassConfig>) => void;
  resetClassesToDefaults: () => void;
  startSessionManually: () => Promise<{ success: boolean; message?: string }>;
  closeSessionManually: () => void;
  extendSession: (extraMinutes: number) => void;
  updateSessionTime: (startTimeStr: string, endTimeStr: string) => void;
  updateSystemSchedule: (newSched: { startTime: string; endTime: string; duration: number; room: string }) => void;
  regenerateToken: () => void;
  markAttendance: (studentId: string, status: AttendanceStatus, notes?: string, method?: AttendanceMethod) => void;
  markStudentDateAttendance: (studentId: string, dateStr: string, status: AttendanceStatus, notes?: string) => Promise<void>;
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
  createCorrectionRequest: (request: Omit<CorrectionRequest, 'id' | 'status' | 'submittedAt'>) => void;
  approveCorrectionRequest: (requestId: string, decisionNotes?: string) => void;
  rejectCorrectionRequest: (requestId: string, decisionNotes?: string) => void;
  getStudentMonthlyCorrectionCount: (studentId: string, monthKey?: string) => number;
  migrateAllStudentsMdcToGeology: () => Promise<number>;
  
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
    if (!adminProfile) {
      return rawStudents;
    }

    const assignedSubject = (adminProfile.assignedSubject || '').trim();
    const assignedType = (adminProfile.assignedSubjectType || '').trim();

    // If teacher/admin has selected or is set to All Subjects, show all students
    if ((!assignedSubject || assignedSubject.toLowerCase() === 'all' || assignedSubject.toLowerCase() === 'all subjects') &&
        (!assignedType || assignedType.toLowerCase() === 'all' || assignedType.toLowerCase() === 'all subjects')) {
      return rawStudents;
    }

    const targetClean = assignedSubject.toLowerCase().replace(/\(mdc\)|\(cr subject\)|\(major\)|\(minor\)|\(skills\)|\(sec\)|\(aec\)|\(vac 1\)|\(vac 2\)|\(vac i\)|\(vac ii\)/gi, '').trim();
    const targetType = assignedType || (adminProfile.role === 'cr' ? 'CR Subject' : '');

    const filtered = rawStudents.filter(student => {
      const sMajor = (student.major || '').toLowerCase().trim();
      const sMinor = (student.minor || '').toLowerCase().trim();
      const sMdc = (student.mdc || '').toLowerCase().trim();
      const sSkills = (student.skills || '').toLowerCase().trim();
      const sAec = (student.aec || '').toLowerCase().trim();
      const sVac1 = (student.vac1 || '').toLowerCase().trim();
      const sVac2 = (student.vac2 || '').toLowerCase().trim();
      const sCourse = (student.course || '').toLowerCase().trim();

      // Check based on subjectType if explicitly specified
      if ((targetType === 'MDC' || targetType === 'mdc') && sMdc) {
        if (!targetClean || targetClean === 'all') return true;
        return sMdc === targetClean || targetClean.includes(sMdc) || sMdc.includes(targetClean);
      }
      if ((targetType === 'Major' || targetType === 'major') && sMajor) {
        if (!targetClean || targetClean === 'all') return true;
        return sMajor === targetClean || targetClean.includes(sMajor) || sMajor.includes(targetClean);
      }
      if ((targetType === 'Minor' || targetType === 'minor') && sMinor) {
        if (!targetClean || targetClean === 'all') return true;
        return sMinor === targetClean || targetClean.includes(sMinor) || sMinor.includes(targetClean);
      }
      if ((targetType === 'Skills' || targetType === 'Skill / SEC' || targetType === 'Skill' || targetType === 'skill' || targetType === 'SEC') && sSkills) {
        if (!targetClean || targetClean === 'all') return true;
        return sSkills === targetClean || targetClean.includes(sSkills) || sSkills.includes(targetClean);
      }
      if ((targetType === 'AEC' || targetType === 'aec' || targetType === 'AECC') && sAec) {
        if (!targetClean || targetClean === 'all') return true;
        return sAec === targetClean || targetClean.includes(sAec) || sAec.includes(targetClean);
      }
      if ((targetType === 'VAC 1' || targetType === 'VAC I (Mon-Wed)' || targetType === 'VAC 1 (Mon-Wed)' || targetType === 'VAC I' || targetType === 'vac1') && sVac1) {
        if (!targetClean || targetClean === 'all') return true;
        return sVac1 === targetClean || targetClean.includes(sVac1) || sVac1.includes(targetClean);
      }
      if ((targetType === 'VAC 2' || targetType === 'VAC II (Thu-Sat)' || targetType === 'VAC 2 (Thu-Sat)' || targetType === 'VAC II' || targetType === 'vac2') && sVac2) {
        if (!targetClean || targetClean === 'all') return true;
        return sVac2 === targetClean || targetClean.includes(sVac2) || sVac2.includes(targetClean);
      }
      if (targetType === 'Practical' || targetType === 'practical') {
        if (!targetClean || targetClean === 'all') return true;
        return sMajor === targetClean || targetClean.includes(sMajor) || sMajor.includes(targetClean);
      }

      // Default or CR Subject matching across specific subject fields (excluding generic course degree name)
      if (targetClean && targetClean !== 'all') {
        const specificSubjects = [sMdc, sMajor, sMinor, sSkills, sAec, sVac1, sVac2].filter(Boolean);
        if (specificSubjects.length > 0) {
          return specificSubjects.some(sub => 
            sub === targetClean || targetClean.includes(sub) || sub.includes(targetClean)
          );
        }
        return sCourse === targetClean || targetClean.includes(sCourse) || sCourse.includes(targetClean);
      }

      return true;
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

  const [scheduleMaster, setScheduleMaster] = useState<ScheduleMaster>(() => {
    try {
      const saved = localStorage.getItem('amc_schedule_master');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.periods) && parsed.periods.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SCHEDULE_MASTER;
  });

  const format24to12 = useCallback((time24: string): string => {
    if (!time24) return '10:00 AM';
    const match = time24.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return time24;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  }, []);

  const [classes, setClasses] = useState<ClassConfig[]>(() => {
    try {
      const saved = localStorage.getItem('amc_classes');
      if (saved) {
        const parsed: ClassConfig[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_CLASSES to guarantee all 8 class slots exist
          return INITIAL_CLASSES.map(initC => {
            const match = parsed.find(p => p.id === initC.id || p.category === initC.category);
            return match ? { ...initC, ...match } : initC;
          });
        }
      }
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
    const facultyType = (adminProfile?.assignedSubjectType || '').trim().toLowerCase();
    
    // Find matching class from classes configuration
    let matchingClass = classes.find(c => {
      const cCat = (c.category || '').toLowerCase();
      const cName = (c.name || '').toLowerCase();
      const cId = (c.id || '').toLowerCase();
      
      if (facultyType === 'minor') return cCat === 'minor' || cId.includes('minor') || cName.includes('minor');
      if (facultyType === 'major') return cCat === 'major' || cId.includes('major') || cName.includes('major');
      if (facultyType === 'mdc') return cCat === 'md' || cId.includes('mdc') || cName.includes('mdc');
      if (facultyType === 'skills' || facultyType === 'skill' || facultyType === 'sec') return cCat === 'skill' || cId.includes('skill');
      if (facultyType === 'practical') return cCat === 'core' || cId.includes('practical');
      if (facultyType === 'vac 1' || facultyType === 'vac i' || facultyType === 'vac1') return cCat === 'vac1' || cId.includes('vac1');
      if (facultyType === 'vac 2' || facultyType === 'vac ii' || facultyType === 'vac2') return cCat === 'vac2' || cId.includes('vac2');
      if (facultyType === 'aec') return cCat === 'aecc' || cId.includes('aec');
      return false;
    });

    const baseClass = matchingClass || classes.find(c => c.id === 'core_class') || classes[0];
    const paperName = adminProfile?.assignedSubject || baseClass.paperName || 'Geology';
    
    // Check if faculty has a configured assignment for this subject or default assignment
    const facultyAssignment = adminProfile?.assignments?.find(a => 
      a.subject === adminProfile.assignedSubject ||
      (a.subjectType && adminProfile.assignedSubjectType && a.subjectType === adminProfile.assignedSubjectType)
    ) || adminProfile?.assignments?.[0];

    // Priority: facultyAssignment > baseClass defaults > systemSchedule
    const defaultStartTime = facultyAssignment?.startTime || baseClass.defaultStartTime || systemSchedule?.startTime || '10:00 AM';
    const defaultEndTime = facultyAssignment?.endTime || baseClass.defaultEndTime || systemSchedule?.endTime || '10:40 AM';
    const durationMinutes = facultyAssignment?.duration || baseClass.durationMinutes || systemSchedule?.duration || 40;
    const room = facultyAssignment?.room || adminProfile?.assignedRoom || baseClass.room || systemSchedule?.room || 'Block C room no 30';

    const subjectSlug = (adminProfile?.assignedSubject || 'geology').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const typeSlug = (adminProfile?.assignedSubjectType || 'mdc').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const classId = `class_${subjectSlug}_${typeSlug}`;

    return {
      ...baseClass,
      id: classId,
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
              mdc: data.mdc || 'Geology',
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
          const aliasKeySet = new Set(['active', 'active_session', 'current', 'core_class', 'class_applied_it_minor']);
          const parseDateAndTimeToEpoch = (dateStr?: string, timeStr?: string) => {
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

          const list: AttendanceSession[] = snapshot.docs
            .filter((docSnap) => {
              const data = docSnap.data();
              if (aliasKeySet.has(docSnap.id)) return false;
              if (data.classId && docSnap.id === data.classId) return false;
              if (data.date && docSnap.id === data.date) return false;
              return true;
            })
            .map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                classId: data.classId || 'core_class',
                className: data.className || 'Core Course - Theory & Practical Lab',
                subject: data.subject || data.subjectName || '',
                subjectType: data.subjectType || data.category || '',
                date: data.date || '',
                startTime: data.startTime || '10:00 AM',
                endTime: data.endTime || '10:40 AM',
                startEpoch: data.startEpoch || parseDateAndTimeToEpoch(data.date || '', data.startTime || '10:00 AM'),
                endEpoch: data.endEpoch || parseDateAndTimeToEpoch(data.date || '', data.endTime || '10:40 AM'),
                token: data.token || '',
                status: data.status || (data.active ? 'active' : 'closed'),
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
              subject: data.subject || data.subjectName || '',
              subjectType: data.subjectType || '',
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

    // 8. Listen to Master Timetable Schedule dataset
    const unsubTimetable = onSnapshot(
      doc(db, 'timetableSchedule', 'schedule_master'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ScheduleMaster;
          if (data && Array.isArray(data.periods) && data.periods.length > 0) {
            setScheduleMaster(data);
            localStorage.setItem('amc_schedule_master', JSON.stringify(data));

            // Sync classes array directly from this master dataset
            setClasses(prev => {
              const updated = prev.map(c => {
                const cat = (c.category || '').toLowerCase();
                let matchedPeriod: TimetablePeriod | undefined;
                if (cat === 'minor' || c.id === 'minor_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'minor' || p.periodId === 'p2');
                } else if (cat === 'major' || c.id === 'major_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'major' || p.periodId === 'p3');
                } else if (cat === 'core' || c.id === 'practical_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'lab' || p.periodId === 'p4_p5');
                } else if (cat === 'vac1' || c.id === 'vac1_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'vac' || p.periodId === 'p8');
                } else if (cat === 'vac2' || c.id === 'vac2_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'vac' || p.periodId === 'p8');
                } else if (cat === 'aecc' || c.id === 'aec_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'aec' || p.periodId === 'p9');
                } else if (cat === 'md' || c.id === 'mdc_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'mdc' || p.periodId === 'p1');
                } else if (cat === 'skill' || c.id === 'skill_class') {
                  matchedPeriod = data.periods.find(p => p.subjectType === 'mdc' || p.periodId === 'p1');
                }

                if (matchedPeriod) {
                  const defaultStartTime = format24to12(matchedPeriod.startTime);
                  const defaultEndTime = format24to12(matchedPeriod.endTime);
                  return {
                    ...c,
                    academicYear: data.academicYear || c.academicYear,
                    slotStart: matchedPeriod.startTime,
                    slotEnd: matchedPeriod.endTime,
                    defaultStartTime,
                    defaultEndTime,
                    room: matchedPeriod.defaultRoom || c.room,
                  };
                }
                return c;
              });
              localStorage.setItem('amc_classes', JSON.stringify(updated));
              return updated;
            });
          }
        }
      },
      (error) => {
        console.warn('Timetable schedule listener notice:', error);
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
      unsubTimetable();
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

  // Find active or today's session scoped strictly to the current subject
  const activeSession = useMemo(() => {
    const targetSubject = (adminProfile?.assignedSubject || '').trim().toLowerCase();
    const targetType = (adminProfile?.assignedSubjectType || '').trim().toLowerCase();

    // Filter sessions belonging to this subject
    const subjectSessions = sessions.filter(s => {
      if (!targetSubject || (adminProfile?.role === 'admin' && (targetSubject === 'all' || targetSubject === 'all subjects'))) {
        return true;
      }

      // 1. Match by subject field
      if (s.subject && s.subject.trim().toLowerCase() === targetSubject) {
        if (targetType && s.subjectType && targetType !== 'all') {
          return s.subjectType.trim().toLowerCase() === targetType;
        }
        return true;
      }

      // 2. Match by classId
      if (s.classId === currentClass.id) {
        return true;
      }

      // 3. Match by className containing subject name
      if (s.className && s.className.toLowerCase().includes(targetSubject)) {
        return true;
      }

      return false;
    });

    return (
      subjectSessions.find(s => s.status === 'active' && s.date === todayStr) ||
      subjectSessions.find(s => s.status === 'active') ||
      subjectSessions.find(s => s.date === todayStr) ||
      (subjectSessions.length > 0 ? subjectSessions[0] : null)
    );
  }, [sessions, todayStr, currentClass.id, adminProfile?.assignedSubject, adminProfile?.assignedSubjectType, adminProfile?.role]);

  // Filter today's attendance records strictly for this active session or today's date AND enrolled students for this subject
  const todayAttendance = useMemo(() => {
    const targetDate = activeSession?.date || todayStr;
    const enrolledIds = new Set(students.map(s => s.id));

    const recordsByStudent = new Map<string, AttendanceRecord>();

    allAttendance.forEach(a => {
      const isForTargetDate = a.date === targetDate;
      const isForActiveSession = activeSession ? a.sessionId === activeSession.id : false;

      if (isForTargetDate || isForActiveSession) {
        if (enrolledIds.size === 0 || enrolledIds.has(a.studentId)) {
          const existing = recordsByStudent.get(a.studentId);
          if (!existing) {
            recordsByStudent.set(a.studentId, a);
          } else {
            if (a.status !== 'not_marked' && existing.status === 'not_marked') {
              recordsByStudent.set(a.studentId, a);
            } else if (activeSession && a.sessionId === activeSession.id && existing.status === 'not_marked') {
              recordsByStudent.set(a.studentId, a);
            } else {
              const existingTime = new Date(existing.updatedAt || 0).getTime();
              const newTime = new Date(a.updatedAt || 0).getTime();
              if (newTime >= existingTime && a.status !== 'not_marked') {
                recordsByStudent.set(a.studentId, a);
              }
            }
          }
        }
      }
    });

    return Array.from(recordsByStudent.values());
  }, [allAttendance, activeSession, students, todayStr]);

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
      await updateDoc(doc(db, 'attendanceSessions', sessionId), updates).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  // Mark single attendance
  const markAttendance = useCallback(async (studentId: string, status: AttendanceStatus, notes?: string, method: AttendanceMethod = 'manual_admin') => {
    if (!activeSession) return;

    const student = students.find(s => s.id === studentId);
    const studentName = student ? student.fullName : studentId;
    const sessionDate = activeSession.date;
    const recordId = `${activeSession.id}_${studentId}`;
    const calDocId = `cal_${studentId}_${sessionDate.replace(/-/g, '_')}`;
    const now = new Date().toISOString();

    let updatedList: AttendanceRecord[] = [];

    setAllAttendance(prev => {
      const isTargetRecord = (r: AttendanceRecord) =>
        r.id === recordId || r.id === calDocId || (r.studentId === studentId && r.date === sessionDate);

      const hasMatch = prev.some(isTargetRecord);

      if (hasMatch) {
        updatedList = prev.map(r => {
          if (isTargetRecord(r)) {
            return {
              ...r,
              sessionId: activeSession.id,
              date: sessionDate,
              status,
              method,
              notes: notes || r.notes || '',
              markedAt: status === 'present' ? now : r.markedAt,
              markedBy: adminProfile.name || 'Teacher',
              updatedAt: now,
            };
          }
          return r;
        });
      } else {
        const recordToSave: AttendanceRecord = {
          id: recordId,
          sessionId: activeSession.id,
          classId: activeSession.classId,
          subject: activeSession.subject || adminProfile.assignedSubject || 'Geology',
          subjectType: activeSession.subjectType || adminProfile.assignedSubjectType || 'MDC',
          studentId,
          studentName,
          rollNumber: student?.rollNumber,
          date: sessionDate,
          status,
          method,
          notes: notes || '',
          markedAt: status === 'present' ? now : undefined,
          markedBy: adminProfile.name || 'Teacher',
          updatedAt: now,
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
        subject: activeSession.subject || adminProfile.assignedSubject || 'Geology',
        subjectType: activeSession.subjectType || adminProfile.assignedSubjectType || 'MDC',
        studentId,
        studentUid: studentId,
        studentName,
        rollNumber: student?.rollNumber || '',
        date: sessionDate,
        status,
        method,
        notes: notes || '',
        markedAt: status === 'present' ? now : '',
        markedBy: adminProfile.name || 'Teacher',
        updatedAt: now,
      };
      await setDoc(doc(db, 'attendance', recordId), sanitizedRecord, { merge: true });
      await setDoc(doc(db, 'attendance', calDocId), { ...sanitizedRecord, id: calDocId }, { merge: true }).catch(() => {});
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
    const sessionDate = activeSession.date;
    const targetSet = new Set<string>(targets);
    const now = new Date().toISOString();

    let updatedList: AttendanceRecord[] = [];

    setAllAttendance(prev => {
      const matchedStudentIds = new Set<string>();
      prev.forEach(r => {
        if (targetSet.has(r.studentId) && r.date === sessionDate) {
          matchedStudentIds.add(r.studentId);
        }
      });

      const updatedPrev = prev.map(r => {
        if (targetSet.has(r.studentId) && r.date === sessionDate) {
          return {
            ...r,
            sessionId: activeSession.id,
            status,
            method: 'manual_admin' as AttendanceMethod,
            markedAt: status === 'present' ? now : r.markedAt,
            markedBy: adminProfile.name || 'Teacher',
            updatedAt: now,
          };
        }
        return r;
      });

      const newRecords: AttendanceRecord[] = [];
      targetSet.forEach((stId: string) => {
        if (!matchedStudentIds.has(stId)) {
          const student = students.find(s => s.id === stId);
          const recId = `${activeSession.id}_${stId}`;
          newRecords.push({
            id: recId,
            sessionId: activeSession.id,
            classId: activeSession.classId,
            subject: activeSession.subject || adminProfile.assignedSubject || 'Geology',
            subjectType: activeSession.subjectType || adminProfile.assignedSubjectType || 'MDC',
            studentId: stId,
            studentName: student ? student.fullName : stId,
            rollNumber: student?.rollNumber,
            date: sessionDate,
            status,
            method: 'manual_admin',
            markedAt: status === 'present' ? now : undefined,
            markedBy: adminProfile.name || 'Teacher',
            updatedAt: now,
          });
        }
      });

      updatedList = [...newRecords, ...updatedPrev];
      return updatedList;
    });

    updateSessionCounters(activeSession.id, updatedList);

    try {
      const batch = writeBatch(db);
      targets.forEach(stId => {
        const recId = `${activeSession.id}_${stId}`;
        const calDocId = `cal_${stId}_${sessionDate.replace(/-/g, '_')}`;
        const student = students.find(s => s.id === stId);
        const recordData = {
          id: recId,
          sessionId: activeSession.id,
          classId: activeSession.classId,
          subject: activeSession.subject || adminProfile.assignedSubject || 'Geology',
          subjectType: activeSession.subjectType || adminProfile.assignedSubjectType || 'MDC',
          studentId: stId,
          studentUid: stId,
          studentName: student ? student.fullName : stId,
          rollNumber: student?.rollNumber || '',
          date: sessionDate,
          status,
          method: 'manual_admin',
          markedAt: status === 'present' ? now : '',
          markedBy: adminProfile.name || 'Teacher',
          updatedAt: now,
        };
        batch.set(doc(db, 'attendance', recId), recordData, { merge: true });
        batch.set(doc(db, 'attendance', calDocId), { ...recordData, id: calDocId }, { merge: true });
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

  // Helper to synchronize active session to the single canonical 'attendanceSessions' document
  const syncActiveSessionToFirestore = useCallback(async (sessionObj: AttendanceSession) => {
    try {
      const payload = {
        ...sessionObj,
        sessionId: sessionObj.id,
        validUntil: sessionObj.endEpoch,
        active: sessionObj.status === 'active',
        updatedAt: new Date().toISOString(),
      };
      
      // Save exactly ONE document into 'attendanceSessions' using sessionObj.id
      await setDoc(doc(db, 'attendanceSessions', sessionObj.id), payload, { merge: true });

      // Clean up legacy alias documents and redundant 'sessions' collection docs if present
      const legacyAliases = ['active', 'active_session', 'current', 'core_class', 'class_applied_it_minor', sessionObj.classId, sessionObj.date].filter(Boolean);
      legacyAliases.forEach(aliasId => {
        if (aliasId !== sessionObj.id) {
          deleteDoc(doc(db, 'attendanceSessions', aliasId as string)).catch(() => {});
          deleteDoc(doc(db, 'sessions', aliasId as string)).catch(() => {});
        }
      });
      deleteDoc(doc(db, 'sessions', sessionObj.id)).catch(() => {});
    } catch (e) {
      console.warn('Firestore session sync notice:', e);
    }
  }, []);

  // Update class configuration (e.g. from Settings or Timetable Editor)
  const updateClassConfig = useCallback((classId: string, updates: Partial<ClassConfig>) => {
    setClasses(prev => {
      const updated = prev.map(c => c.id === classId ? { ...c, ...updates } : c);
      try {
        localStorage.setItem('amc_classes', JSON.stringify(updated));
        setDoc(doc(db, 'settings', 'classes_schedule'), { classes: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        setDoc(doc(db, 'classes', classId), { id: classId, ...updates, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } catch (e) {}
      return updated;
    });
  }, []);

  const resetClassesToDefaults = useCallback(() => {
    setClasses(INITIAL_CLASSES);
    try {
      localStorage.setItem('amc_classes', JSON.stringify(INITIAL_CLASSES));
      setDoc(doc(db, 'settings', 'classes_schedule'), { classes: INITIAL_CLASSES, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch (e) {}
  }, []);

  const [sessionValidationError, setSessionValidationError] = useState<string | null>(null);

  const clearSessionValidationError = useCallback(() => {
    setSessionValidationError(null);
  }, []);

  // Mark or clear attendance for any specific calendar date (supporting previous months)
  const markStudentDateAttendance = useCallback(async (
    studentId: string,
    dateStr: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    const student = students.find(s => s.id === studentId);
    const studentName = student ? student.fullName : studentId;
    const subject = adminProfile?.assignedSubject || currentClass.paperName || 'Geology';
    const subjectType = adminProfile?.assignedSubjectType || 'MDC';

    const matchedSession = (activeSession && activeSession.date === dateStr)
      ? activeSession
      : sessions.find(s => s.date === dateStr);

    const targetSessionId = matchedSession?.id || `manual_session_${dateStr.replace(/-/g, '_')}`;
    const recordDocId = matchedSession
      ? `${matchedSession.id}_${studentId}`
      : `cal_${studentId}_${dateStr.replace(/-/g, '_')}`;
    const calDocId = `cal_${studentId}_${dateStr.replace(/-/g, '_')}`;

    const now = new Date().toISOString();
    let updatedList: AttendanceRecord[] = [];

    setAllAttendance(prev => {
      const isTargetRecord = (r: AttendanceRecord) =>
        (r.studentId === studentId && r.date === dateStr) ||
        r.id === recordDocId ||
        r.id === calDocId ||
        (matchedSession && r.sessionId === matchedSession.id && r.studentId === studentId);

      if (status === 'not_marked') {
        updatedList = prev.filter(r => !isTargetRecord(r));
      } else {
        const hasMatch = prev.some(isTargetRecord);
        if (hasMatch) {
          updatedList = prev.map(r => {
            if (isTargetRecord(r)) {
              return {
                ...r,
                sessionId: targetSessionId,
                date: dateStr,
                status,
                method: 'manual_admin' as AttendanceMethod,
                notes: notes || r.notes || `Manual calendar entry for ${dateStr}`,
                markedAt: status === 'present' ? now : r.markedAt,
                markedBy: adminProfile.name || 'Teacher',
                updatedAt: now,
              };
            }
            return r;
          });
        } else {
          const newRecord: AttendanceRecord = {
            id: recordDocId,
            sessionId: targetSessionId,
            classId: matchedSession?.classId || currentClass.id || 'core_class',
            subject: matchedSession?.subject || subject,
            subjectType: matchedSession?.subjectType || subjectType,
            studentId,
            studentName,
            rollNumber: student?.rollNumber,
            date: dateStr,
            status,
            method: 'manual_admin',
            notes: notes || `Manual calendar entry for ${dateStr}`,
            markedAt: status === 'present' ? now : undefined,
            markedBy: adminProfile.name || 'Teacher',
            updatedAt: now,
          };
          updatedList = [newRecord, ...prev];
        }
      }
      return updatedList;
    });

    if (matchedSession) {
      updateSessionCounters(matchedSession.id, updatedList);
    }

    try {
      if (status === 'not_marked') {
        await deleteDoc(doc(db, 'attendance', calDocId)).catch(() => {});
        if (matchedSession) {
          await deleteDoc(doc(db, 'attendance', `${matchedSession.id}_${studentId}`)).catch(() => {});
        }
      } else {
        const sanitizedRecord = {
          id: recordDocId,
          sessionId: targetSessionId,
          classId: matchedSession?.classId || currentClass.id || 'core_class',
          subject: matchedSession?.subject || subject,
          subjectType: matchedSession?.subjectType || subjectType,
          studentId,
          studentUid: studentId,
          studentName,
          rollNumber: student?.rollNumber || '',
          date: dateStr,
          status,
          method: 'manual_admin',
          notes: notes || `Manual calendar entry for ${dateStr}`,
          markedAt: status === 'present' ? now : '',
          markedBy: adminProfile.name || 'Teacher',
          updatedAt: now,
        };
        await setDoc(doc(db, 'attendance', recordDocId), sanitizedRecord, { merge: true });
        if (calDocId !== recordDocId) {
          await setDoc(doc(db, 'attendance', calDocId), { ...sanitizedRecord, id: calDocId }, { merge: true }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Manual calendar date attendance save notice:', e);
    }

    addActivityLog({
      eventType: 'attendance_modified',
      targetType: 'student',
      targetId: studentId,
      targetName: studentName,
      details: `Manual Calendar Entry: Marked ${studentName} as ${status.toUpperCase()} for ${dateStr} by ${adminProfile.name}.`,
    });
  }, [students, adminProfile, currentClass, activeSession, sessions, updateSessionCounters, addActivityLog]);

  // Start session manually with strict time window enforcement
  const startSessionManually = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    setSessionValidationError(null);
    const defaultStart = currentClass.defaultStartTime || '10:00 AM';
    const defaultEnd = currentClass.defaultEndTime || '10:40 AM';
    
    // Parse time bounds for current day
    const configuredStartEpoch = parseTimeToTodayEpoch(defaultStart);
    const configuredEndEpoch = parseTimeToTodayEpoch(defaultEnd);
    const now = Date.now();

    // 1. Strict Validation: Cannot start before session time starts
    if (now < configuredStartEpoch) {
      const msg = `Session cannot start before scheduled class time (${defaultStart}). Scheduled class window is ${defaultStart} – ${defaultEnd}.`;
      setSessionValidationError(msg);
      addActivityLog({
        eventType: 'admin_action',
        targetType: 'session',
        details: `Blocked attempt to start session before start time (${defaultStart}).`,
      });
      return { success: false, message: msg };
    }

    // 2. Strict Validation: Cannot start after session time has ended
    if (now > configuredEndEpoch) {
      const msg = `Session cannot start after scheduled class time has ended (${defaultEnd}). Scheduled class window was ${defaultStart} – ${defaultEnd}.`;
      setSessionValidationError(msg);
      addActivityLog({
        eventType: 'admin_action',
        targetType: 'session',
        details: `Blocked attempt to start session after end time (${defaultEnd}).`,
      });
      return { success: false, message: msg };
    }

    const startEpoch = configuredStartEpoch;
    const endEpoch = configuredEndEpoch;
    const sessionDate = todayStr;
    const token = `AMC-SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    let sessionObj: AttendanceSession;

    if (activeSession && activeSession.date === sessionDate && (activeSession.classId === currentClass.id || activeSession.subject === adminProfile.assignedSubject)) {
      sessionObj = {
        ...activeSession,
        status: 'active',
        date: sessionDate,
        subject: adminProfile.assignedSubject || activeSession.subject || 'Geology',
        subjectType: adminProfile.assignedSubjectType || activeSession.subjectType || 'MDC',
        startTime: defaultStart,
        endTime: defaultEnd,
        startEpoch,
        endEpoch,
        token: activeSession.token || token,
      };
      setSessions(prev =>
        prev.map(s => (s.id === activeSession.id ? sessionObj : s))
      );
    } else {
      const subjectSlug = (adminProfile?.assignedSubject || 'geology').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const typeSlug = (adminProfile?.assignedSubjectType || 'mdc').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newSessionId = `session_${subjectSlug}_${typeSlug}_${sessionDate.replace(/-/g, '_')}_${Date.now().toString(36)}`;
      sessionObj = {
        id: newSessionId,
        classId: currentClass.id,
        className: `${currentClass.name} - ${currentClass.paperName}`,
        subject: adminProfile.assignedSubject || 'Geology',
        subjectType: adminProfile.assignedSubjectType || 'MDC',
        date: sessionDate,
        startTime: defaultStart,
        endTime: defaultEnd,
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
        subject: adminProfile.assignedSubject || 'Geology',
        subjectType: adminProfile.assignedSubjectType || 'MDC',
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

    await syncActiveSessionToFirestore(sessionObj);

    addActivityLog({
      eventType: 'qr_session_started',
      targetType: 'session',
      targetId: sessionObj.id,
      targetName: `${currentClass.name} - ${currentClass.paperName}`,
      details: `Live QR attendance session started by ${adminProfile.name}. Token: ${sessionObj.token}`,
    });

    return { success: true };
  }, [activeSession, currentClass, todayStr, students, adminProfile, syncActiveSessionToFirestore, addActivityLog]);

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

    await syncActiveSessionToFirestore(closedSession);

    addActivityLog({
      eventType: 'qr_session_closed',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Attendance session closed. Unmarked students transitioned to Absent.`,
    });
  }, [activeSession, updateSessionCounters, syncActiveSessionToFirestore, addActivityLog]);

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

    await syncActiveSessionToFirestore(extended);

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Session duration extended by +${extraMinutes} minutes by ${adminProfile.name}.`,
    });
  }, [activeSession, adminProfile, syncActiveSessionToFirestore, addActivityLog]);

  const updateSessionTime = useCallback(async (startTimeStr: string, endTimeStr: string) => {
    if (!activeSession) return;
    
    const newStartEpoch = parseTimeToTodayEpoch(startTimeStr);
    let newEndEpoch = parseTimeToTodayEpoch(endTimeStr);
    
    // If end time epoch is <= start time epoch, add 40 minutes default
    if (newEndEpoch <= newStartEpoch) {
      newEndEpoch = newStartEpoch + (currentClass.durationMinutes || 40) * 60 * 1000;
    }

    const now = Date.now();
    const isNowWithinBounds = now >= newStartEpoch && now <= newEndEpoch;
    const updatedStatus = isNowWithinBounds ? 'active' : (now < newStartEpoch ? 'active' : activeSession.status);

    const updated: AttendanceSession = {
      ...activeSession,
      date: todayStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      startEpoch: newStartEpoch,
      endEpoch: newEndEpoch,
      status: updatedStatus,
    };

    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? updated : s))
    );

    await syncActiveSessionToFirestore(updated);

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Session time updated to ${startTimeStr} - ${endTimeStr} by ${adminProfile.name}.`,
    });
  }, [activeSession, currentClass, todayStr, adminProfile, syncActiveSessionToFirestore, addActivityLog]);

  const updateSystemSchedule = useCallback(async (newSched: { startTime: string; endTime: string; duration: number; room: string }) => {
    setSystemSchedule(newSched);
    try {
      localStorage.setItem('amc_system_schedule', JSON.stringify(newSched));
    } catch (e) {}
    try {
      await setDoc(doc(db, 'system_settings', 'class_schedule'), {
        ...newSched,
        updatedAt: new Date().toISOString(),
        updatedBy: adminProfile?.email || 'Teacher'
      }, { merge: true });
    } catch (err) {
      console.warn('Error saving system schedule to Firestore:', err);
    }
  }, [adminProfile]);

  // Regenerate security token
  const regenerateToken = useCallback(async () => {
    if (!activeSession) return;
    const newToken = `AMC-SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const updatedSession = { ...activeSession, token: newToken };

    setSessions(prev =>
      prev.map(s => (s.id === activeSession.id ? updatedSession : s))
    );

    await syncActiveSessionToFirestore(updatedSession);

    addActivityLog({
      eventType: 'admin_action',
      targetType: 'session',
      targetId: activeSession.id,
      targetName: activeSession.className,
      details: `Regenerated dynamic secure QR token (${newToken}) for session integrity.`,
    });
  }, [activeSession, syncActiveSessionToFirestore, addActivityLog]);

  // Add student
  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = studentData.studentId || `STU-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();
    const newStudent: Student = {
      ...studentData,
      mdc: studentData.mdc || 'Geology',
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
        mdc: st.mdc || 'Geology',
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

  // Bulk migrate all existing students and users to MDC: Geology
  const migrateAllStudentsMdcToGeology = useCallback(async () => {
    let count = 0;
    try {
      setRawStudents(prev =>
        prev.map(s => ({
          ...s,
          mdc: 'Geology',
          updatedAt: new Date().toISOString(),
        }))
      );

      const studentsSnap = await getDocs(collection(db, 'students'));
      if (!studentsSnap.empty) {
        const batch = writeBatch(db);
        studentsSnap.forEach(docSnap => {
          batch.set(
            doc(db, 'students', docSnap.id),
            { mdc: 'Geology', updatedAt: new Date().toISOString() },
            { merge: true }
          );
          count++;
        });
        await batch.commit();
      }

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          const userBatch = writeBatch(db);
          usersSnap.forEach(docSnap => {
            userBatch.set(
              doc(db, 'users', docSnap.id),
              { mdc: 'Geology', updatedAt: new Date().toISOString() },
              { merge: true }
            );
          });
          await userBatch.commit();
        }
      } catch (uErr) {
        // Users collection update notice
      }

      addActivityLog({
        eventType: 'admin_action',
        targetType: 'student',
        targetId: 'bulk_mdc_update',
        targetName: 'All Students & Users',
        details: `Bulk updated all existing student profiles to MDC: Geology.`,
      });
    } catch (err) {
      console.warn('MDC bulk migration notice:', err);
    }
    return count;
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
  const createCorrectionRequest = useCallback(async (reqData: Omit<CorrectionRequest, 'id' | 'status' | 'submittedAt'>) => {
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
    const targetSubject = req.subject || adminProfile?.assignedSubject || currentClass.paperName || 'Geology';
    const targetSubjectType = req.subjectType || adminProfile?.assignedSubjectType || 'MDC';
    const targetClassId = req.classId || currentClass.id || 'core_class';
    const recId = `${req.sessionId || `session_${req.attendanceDate}`}_${req.studentId}`;
    const calDocId = `cal_${req.studentId}_${req.attendanceDate.replace(/-/g, '_')}`;

    setAllAttendance(prev => {
      const isMatch = (a: AttendanceRecord) =>
        (a.studentId === req.studentId && a.date === req.attendanceDate) || a.id === recId || a.id === calDocId;

      const hasMatch = prev.some(isMatch);
      if (hasMatch) {
        updatedList = prev.map(a => {
          if (isMatch(a)) {
            return {
              ...a,
              subject: targetSubject,
              subjectType: targetSubjectType,
              classId: targetClassId,
              status: 'present',
              method: 'correction_approval',
              notes: `Correction approved: ${decisionNotes || req.reason}`,
              markedAt: now,
              markedBy: adminProfile.name || 'Teacher',
              updatedAt: now,
            };
          }
          return a;
        });
      } else {
        const newRec: AttendanceRecord = {
          id: recId,
          sessionId: req.sessionId || `session_${req.attendanceDate}`,
          classId: targetClassId,
          subject: targetSubject,
          subjectType: targetSubjectType,
          studentId: req.studentId,
          studentName: req.studentName,
          rollNumber: req.rollNumber,
          date: req.attendanceDate,
          status: 'present',
          method: 'correction_approval',
          markedAt: now,
          markedBy: adminProfile.name || 'Teacher',
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
        decidedBy: adminProfile.name || 'Teacher',
        decisionNotes: decisionNotes || 'Attendance correction verified and approved.',
      });

      const sanitizedRecord = {
        id: recId,
        sessionId: req.sessionId || `session_${req.attendanceDate}`,
        classId: targetClassId,
        subject: targetSubject,
        subjectType: targetSubjectType,
        studentId: req.studentId,
        studentUid: req.studentId,
        studentName: req.studentName,
        rollNumber: req.rollNumber || '',
        date: req.attendanceDate,
        status: 'present',
        method: 'correction_approval',
        markedAt: now,
        markedBy: adminProfile.name || 'Teacher',
        notes: `Correction approved: ${decisionNotes || req.reason}`,
        updatedAt: now,
      };

      await setDoc(doc(db, 'attendance', recId), sanitizedRecord, { merge: true });
      await setDoc(doc(db, 'attendance', calDocId), { ...sanitizedRecord, id: calDocId }, { merge: true }).catch(() => {});
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

  // Student stats calculator (scoped to current subject context if applicable)
  const getStudentStats = useCallback((studentId: string): StudentAttendanceStats => {
    const targetSubject = (adminProfile?.assignedSubject || '').trim().toLowerCase();
    const isGlobalAdmin = adminProfile?.role === 'admin' && (!targetSubject || targetSubject === 'all' || targetSubject === 'all subjects');

    const rawStudentRecords = allAttendance.filter(a => {
      if (a.studentId !== studentId) return false;
      if (isGlobalAdmin) return true;

      // Match subject attribute on record
      if (a.subject && a.subject.trim().toLowerCase() === targetSubject) {
        return true;
      }
      // Match classId
      if (a.classId === currentClass.id) {
        return true;
      }
      // Match session subject
      const sess = sessions.find(s => s.id === a.sessionId);
      if (sess) {
        if (sess.subject && sess.subject.trim().toLowerCase() === targetSubject) return true;
        if (sess.classId === currentClass.id) return true;
        if (sess.className && sess.className.toLowerCase().includes(targetSubject)) return true;
      }
      return !targetSubject;
    });

    // Deduplicate records by date, taking the latest updated status per date
    const recordsByDate = new Map<string, AttendanceRecord>();
    rawStudentRecords.forEach(a => {
      const existing = recordsByDate.get(a.date);
      if (!existing) {
        recordsByDate.set(a.date, a);
      } else {
        const existingTime = new Date(existing.updatedAt || existing.markedAt || 0).getTime();
        const aTime = new Date(a.updatedAt || a.markedAt || 0).getTime();
        if (aTime >= existingTime) {
          recordsByDate.set(a.date, a);
        }
      }
    });

    const studentRecords = Array.from(recordsByDate.values());
    const totalClasses = studentRecords.length;
    const present = studentRecords.filter(a => a.status === 'present').length;
    const absent = studentRecords.filter(a => a.status === 'absent').length;
    const notMarked = studentRecords.filter(a => a.status === 'not_marked').length;
    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 100;
    const isDefaulter = totalClasses > 0 && percentage < 75;

    return {
      totalClasses,
      present,
      absent,
      notMarked,
      percentage,
      isDefaulter,
    };
  }, [allAttendance, adminProfile, currentClass.id, sessions]);

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
        scheduleMaster,
        currentTime,
        sessionCountdown,
        isSessionActive,
        sessionValidationError,
        clearSessionValidationError,
        updateClassConfig,
        resetClassesToDefaults,
        startSessionManually,
        closeSessionManually,
        extendSession,
        updateSessionTime,
        updateSystemSchedule,
        regenerateToken,
        markAttendance,
        markStudentDateAttendance,
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
        migrateAllStudentsMdcToGeology,
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
