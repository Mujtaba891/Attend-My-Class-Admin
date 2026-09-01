/**
 * Application Type Definitions for College Attendance Portal
 */

export type UserRole = 'admin' | 'teacher' | 'cr';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  phone?: string;
  employeeId?: string;
  rollNumber?: string;
  semester?: string;
  section?: string;
  designation?: string;
  officeLocation?: string;
  bio?: string;
  assignedSubject?: string;
  assignedSubjectType?: 'Major' | 'Minor' | 'MDC' | 'Skills' | 'AEC' | 'VAC 1' | 'VAC 2' | 'All' | 'CR Subject';
  assignedClass?: string;
  assignedRoom?: string;
  assignments?: TeachingAssignment[];
  permissions: string[];
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}


export interface TeachingAssignment {
  id: string;
  subject: string;
  subjectType?: 'Major' | 'Minor' | 'MDC' | 'Skills' | 'AEC' | 'VAC 1' | 'VAC 2' | 'All' | 'CR Subject';
  className: string;
  room?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export type AccountStatus = 'active' | 'locked' | 'disabled';
export type AttendanceStatus = 'present' | 'absent' | 'not_marked' | 'correction_requested';
export type AttendanceMethod = 'qr_scan' | 'manual_admin' | 'auto_close' | 'correction_approval';
export type SessionStatus = 'scheduled' | 'active' | 'closed';
export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

export const VALID_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'] as const;
export type SectionType = typeof VALID_SECTIONS[number];

export interface Student {
  id: string; // Document ID / studentId (e.g., "STU-2024-001")
  studentId: string;
  fullName: string;
  rollNumber?: string;
  registrationNumber?: string;
  batch?: string;
  email: string;
  phone?: string;
  course: string; // "B.Sc. Academic Program"
  major?: string;
  minor?: string;
  mdc?: string;
  vac1?: string;
  vac2?: string;
  skills?: string;
  aec?: string;
  semester?: string; // "Semester IV"
  section: string; // "A" through "M" (or Section A, etc.)
  enrollmentDate?: string;
  avatarUrl?: string;
  accountStatus: AccountStatus;
  lockReason?: string;
  authorizedDeviceId?: string;
  boundDeviceId?: string;
  authorizedDeviceModel?: string;
  lastDeviceFingerprint?: string;
  lastMismatchDetectedAt?: string;
  lastMismatchDetails?: {
    attemptedDeviceId: string;
    attemptedDeviceModel: string;
    timestamp: string;
    ipAddress?: string;
  };
  lastActivity?: string;
  revokedDeviceId?: string;
  forceLogoutDeviceId?: string;
  sessionRevokedAt?: string;
  sessionVersion?: number;
  logoutPromptMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSession {
  id: string; // "session_2026_08_19"
  classId: string; // "core_class"
  className: string; // "Core Subject - Theory & Lab"
  subject?: string;
  subjectType?: string;
  date: string; // "2026-08-19"
  startTime: string; // "10:00 AM"
  endTime: string; // "10:40 AM"
  startEpoch: number;
  endEpoch: number;
  token: string; // cryptographic dynamic session token
  status: SessionStatus;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  notMarkedCount: number;
  correctionCount: number;
  createdBy: string;
  createdAt: string;
  closedAt?: string;
  autoClosed?: boolean;
}

export interface AttendanceRecord {
  id: string; // `${sessionId}_${studentId}`
  sessionId: string;
  classId: string;
  subject?: string;
  subjectType?: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  date: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  markedAt?: string;
  markedBy?: string;
  deviceId?: string;
  notes?: string;
  updatedAt: string;
}

export interface CorrectionRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  email: string;
  attendanceDate: string;
  sessionId: string;
  subject?: string;
  subjectType?: string;
  classId?: string;
  currentStatus: 'absent' | 'not_marked';
  requestedStatus: 'present';
  reason: string;
  monthKey: string; // "2026-08" to track monthly 2-request cap
  monthlyRequestIndex?: number; // 1 or 2
  status: CorrectionStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNotes?: string;
}

export type EventType =
  | 'student_registered'
  | 'account_disabled'
  | 'account_reactivated'
  | 'device_mismatch'
  | 'account_locked'
  | 'attendance_marked'
  | 'attendance_modified'
  | 'qr_session_created'
  | 'qr_session_started'
  | 'qr_session_closed'
  | 'correction_submitted'
  | 'correction_approved'
  | 'correction_rejected'
  | 'admin_action'
  | 'security_alert';

export type ActivityEventType = EventType;

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  actorRole: UserRole | 'system' | 'student';
  eventType: EventType;
  targetType: 'student' | 'session' | 'attendance' | 'correction' | 'security' | 'class';
  targetId: string;
  targetName: string;
  details: string;
  metadata?: Record<string, any>;
}

export type NotificationType =
  | 'correction_request'
  | 'account_lock'
  | 'device_mismatch'
  | 'correction_decision'
  | 'session_alert'
  | 'system_info';

export interface AdminNotification {
  id: string;
  recipientType: 'admin' | 'student';
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ClassConfig {
  id: string; // "core_class"
  name: string; // "Core Academic Course"
  code: string; // "CRS-201"
  paperName: string; // "Core Theory & Laboratory"
  room: string; // "Lecture Hall 204 / North Wing"
  academicYear: string; // "2025-2026"
  days?: string; // e.g. "Mon-Wed", "Thu-Sat", "Mon-Sat"
  slotStart: string; // "10:00"
  slotEnd: string; // "10:40"
  defaultStartTime: string; // "10:00 AM"
  defaultEndTime: string; // "10:40 AM"
  durationMinutes: number; // 40
  active: boolean;
  totalSessions: number;
  category: 'core' | 'major' | 'minor' | 'skill' | 'md' | 'vac1' | 'vac2' | 'aecc';
}

export interface StudentAttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  notMarked: number;
  percentage: number;
  isDefaulter: boolean; // < 75%
}

export interface CRDelegation {
  id: string;
  email: string;
  name: string;
  studentRollNumber?: string;
  studentId?: string;
  classId: string;
  className: string;
  section: string;
  subject?: string;
  subjectType?: string;
  room?: string;
  permissions: string[];
  status: 'active' | 'revoked';
  delegatedBy?: string;
  delegatedByType?: 'student' | 'teacher' | 'admin' | 'cr';
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetablePeriod {
  periodId: string;
  periodNumber: number;
  name: string;
  startTime: string; // "10:00"
  endTime: string;   // "10:40"
  timeSlot?: string; // "10:00 AM - 10:40 AM"
  subjectType: string; // "mdc" | "minor" | "major" | "lab" | "vac" | "aec"
  defaultRoom: string;
  daysRule: Record<string, string>;
}

export interface SectionMatrixItem {
  section: string;
  capacity?: number;
  majorRoom: string;
  aecDays: string;
  aecRoom: string;
  vacMonWed: string;
  vacRoom: string;
  vacThuSat: string;
}

export interface VacSubjectItem {
  code: string;
  label: string;
  description: string;
}

export interface LabBatchItem {
  id: string;
  name: string;
  section: string;
  rollRange: string;
  instructor: string;
  labRoom: string;
  monWedSubject: string;
  thuSatSubject: string;
}

export interface ScheduleMaster {
  academicYear: string;
  department: string;
  semester: string;
  scheduleVersion: string;
  updatedAt: string;
  updatedBy: string;
  periods: TimetablePeriod[];
  sectionMatrix: Record<string, SectionMatrixItem>;
  vacSubjects: VacSubjectItem[];
  labBatches: LabBatchItem[];
}

