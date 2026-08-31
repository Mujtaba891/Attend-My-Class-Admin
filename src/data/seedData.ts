import { Student, AttendanceSession, AttendanceRecord, CorrectionRequest, ActivityLog, AdminNotification, ClassConfig, ScheduleMaster } from '../types';

export const INITIAL_SCHEDULE_MASTER: ScheduleMaster = {
  academicYear: "2026-2027",
  department: "Higher Education Governance",
  semester: "Semester 1 & 2 (NEP-2020)",
  scheduleVersion: "2026.1",
  updatedAt: "2026-08-31T13:55:59.720Z",
  updatedBy: "Prof. Dr. Tariq Ahmad (Dean Academic Affairs)",
  periods: [
    {
      periodId: "p1",
      periodNumber: 1,
      name: "MDC / Skill Enhancement Course",
      startTime: "10:00",
      endTime: "10:40",
      timeSlot: "10:00 AM - 10:40 AM",
      subjectType: "mdc",
      defaultRoom: "Academic Hall C / Computer Lab 3",
      daysRule: {
        "Mon-Wed": "Multi-Disciplinary Course (MDC)",
        "Thu-Sat": "Skill Enhancement Course (Skill / SEC)"
      }
    },
    {
      periodId: "p2",
      periodNumber: 2,
      name: "Minor Academic Course",
      startTime: "10:40",
      endTime: "11:20",
      timeSlot: "10:40 AM - 11:20 AM",
      subjectType: "minor",
      defaultRoom: "Lecture Hall B",
      daysRule: {
        "Mon-Sat": "Minor Course"
      }
    },
    {
      periodId: "p3",
      periodNumber: 3,
      name: "Major Academic Course",
      startTime: "11:20",
      endTime: "12:00",
      timeSlot: "11:20 AM - 12:00 PM",
      subjectType: "major",
      defaultRoom: "Lecture Hall 204 (North Wing)",
      daysRule: {
        "Mon-Sat": "Major Subject Specialization"
      }
    },
    {
      periodId: "p4_p5",
      periodNumber: 4,
      name: "Practical / Laboratory Slots",
      startTime: "12:00",
      endTime: "14:00",
      timeSlot: "12:00 PM - 02:00 PM",
      subjectType: "lab",
      defaultRoom: "Department Lab 102 / Hardware Lab",
      daysRule: {
        "Mon-Sat": "Practical Laboratory (Batch A1 & A2 split)"
      }
    },
    {
      periodId: "p8",
      periodNumber: 8,
      name: "Value Added Course (VAC)",
      startTime: "14:00",
      endTime: "14:40",
      timeSlot: "02:00 PM - 02:40 PM",
      subjectType: "vac",
      defaultRoom: "Section Allocated Rooms (R-2 to R-CA)",
      daysRule: {
        "Mon-Sat": "4 Rotating Subjects: ESE / H&W / UIN / DTSO"
      }
    },
    {
      periodId: "p9",
      periodNumber: 9,
      name: "AEC / English Communication",
      startTime: "14:40",
      endTime: "15:20",
      timeSlot: "02:40 PM - 03:20 PM",
      subjectType: "aec",
      defaultRoom: "Allocated Lecture Rooms",
      daysRule: {
        "Mon-Wed": "Sections A to F",
        "Thu-Sat": "Sections G to M"
      }
    }
  ],
  sectionMatrix: {
    A: { section: "A", capacity: 70, majorRoom: "R-2", aecDays: "Mon-Wed", aecRoom: "R-2", vacMonWed: "ESE", vacRoom: "R-2", vacThuSat: "H&W" },
    B: { section: "B", capacity: 70, majorRoom: "R-3", aecDays: "Mon-Wed", aecRoom: "R-3", vacMonWed: "H&W", vacRoom: "R-3", vacThuSat: "ESE" },
    C: { section: "C", capacity: 70, majorRoom: "R-4", aecDays: "Mon-Wed", aecRoom: "R-4", vacMonWed: "UIN", vacRoom: "R-4", vacThuSat: "DTSO" },
    D: { section: "D", capacity: 70, majorRoom: "R-5", aecDays: "Mon-Wed", aecRoom: "R-5", vacMonWed: "DTSO", vacRoom: "R-5", vacThuSat: "UIN" },
    E: { section: "E", capacity: 70, majorRoom: "R-6", aecDays: "Mon-Wed", aecRoom: "R-6", vacMonWed: "ESE", vacRoom: "R-6", vacThuSat: "UIN" },
    F: { section: "F", capacity: 70, majorRoom: "R-7", aecDays: "Mon-Wed", aecRoom: "R-7", vacMonWed: "H&W", vacRoom: "R-7", vacThuSat: "DTSO" },
    G: { section: "G", capacity: 70, majorRoom: "R-8", aecDays: "Thu-Sat", aecRoom: "R-2", vacMonWed: "UIN", vacRoom: "R-8", vacThuSat: "H&W" },
    H: { section: "H", capacity: 70, majorRoom: "R-9", aecDays: "Thu-Sat", aecRoom: "R-3", vacMonWed: "DTSO", vacRoom: "R-9", vacThuSat: "ESE" },
    I: { section: "I", capacity: 70, majorRoom: "R-10", aecDays: "Thu-Sat", aecRoom: "R-4", vacMonWed: "ESE", vacRoom: "R-10", vacThuSat: "DTSO" },
    J: { section: "J", capacity: 70, majorRoom: "R-11", aecDays: "Thu-Sat", aecRoom: "R-5", vacMonWed: "H&W", vacRoom: "R-11", vacThuSat: "UIN" },
    K: { section: "K", capacity: 70, majorRoom: "R-12", aecDays: "Thu-Sat", aecRoom: "R-6", vacMonWed: "UIN", vacRoom: "R-12", vacThuSat: "ESE" },
    L: { section: "L", capacity: 70, majorRoom: "R-13", aecDays: "Thu-Sat", aecRoom: "R-7", vacMonWed: "DTSO", vacRoom: "R-13", vacThuSat: "H&W" },
    M: { section: "M", capacity: 70, majorRoom: "R-CA", aecDays: "Thu-Sat", aecRoom: "R-8", vacMonWed: "ESE", vacRoom: "R-CA", vacThuSat: "H&W" }
  },
  vacSubjects: [
    { code: "ESE", label: "Environmental Science", description: "Core ecological sustainability & climate systems" },
    { code: "H&W", label: "Health & Wellness", description: "Physical fitness, nutrition & psychological wellbeing" },
    { code: "UIN", label: "Understanding India", description: "Heritage, constitutional values & socio-economic growth" },
    { code: "DTSO", label: "Digital Technologies", description: "Computational literacy, IT tools & modern office automation" }
  ],
  labBatches: [
    {
      id: "batch_a1",
      name: "Batch A1",
      section: "A",
      rollRange: "Roll 01 - 35",
      instructor: "Dept. Faculty In-Charge",
      labRoom: "Software & Computing Lab (Room Lab-102)",
      monWedSubject: "Data Structures & Algorithms Lab",
      thuSatSubject: "Web Technologies & Database Systems Lab"
    },
    {
      id: "batch_a2",
      name: "Batch A2",
      section: "A",
      rollRange: "Roll 36 - 70",
      instructor: "Dept. Faculty In-Charge",
      labRoom: "Hardware & Microprocessor Lab (Room Lab-204)",
      monWedSubject: "Digital Electronics & IoT Lab",
      thuSatSubject: "Network Simulation & Linux SysAdmin Lab"
    }
  ]
};

export const INITIAL_CLASSES: ClassConfig[] = [
  {
    id: 'mdc_class',
    name: 'MDC (Mon-Wed)',
    code: 'MDC-105',
    paperName: 'Multi-Disciplinary Course (MDC)',
    room: 'Academic Hall C / Computer Lab 3',
    academicYear: '2026-2027',
    days: 'Mon-Wed',
    slotStart: '10:00',
    slotEnd: '10:40',
    defaultStartTime: '10:00 AM',
    defaultEndTime: '10:40 AM',
    durationMinutes: 40,
    active: true,
    totalSessions: 0,
    category: 'md',
  },
  {
    id: 'skill_class',
    name: 'Skill / SEC (Thu-Sat)',
    code: 'SEC-204',
    paperName: 'Skill Enhancement Course (Skill / SEC)',
    room: 'Academic Hall C / Computer Lab 3',
    academicYear: '2026-2027',
    days: 'Thu-Sat',
    slotStart: '10:00',
    slotEnd: '10:40',
    defaultStartTime: '10:00 AM',
    defaultEndTime: '10:40 AM',
    durationMinutes: 40,
    active: false,
    totalSessions: 0,
    category: 'skill',
  },
  {
    id: 'minor_class',
    name: 'Minor',
    code: 'MIN-102',
    paperName: 'Minor Academic Course',
    room: 'Lecture Hall B',
    academicYear: '2026-2027',
    days: 'Mon-Sat',
    slotStart: '10:40',
    slotEnd: '11:20',
    defaultStartTime: '10:40 AM',
    defaultEndTime: '11:20 AM',
    durationMinutes: 40,
    active: false,
    totalSessions: 0,
    category: 'minor',
  },
  {
    id: 'major_class',
    name: 'Major',
    code: 'MAJ-301',
    paperName: 'Major Academic Course',
    room: 'Lecture Hall 204 (North Wing)',
    academicYear: '2026-2027',
    days: 'Mon-Sat',
    slotStart: '11:20',
    slotEnd: '12:00',
    defaultStartTime: '11:20 AM',
    defaultEndTime: '12:00 PM',
    durationMinutes: 40,
    active: false,
    totalSessions: 0,
    category: 'major',
  },
  {
    id: 'practical_class',
    name: 'Practical',
    code: 'PRAC-LAB',
    paperName: 'Practical / Laboratory Slots',
    room: 'Department Lab 102 / Hardware Lab',
    academicYear: '2026-2027',
    days: 'Mon-Sat',
    slotStart: '12:00',
    slotEnd: '14:00',
    defaultStartTime: '12:00 PM',
    defaultEndTime: '02:00 PM',
    durationMinutes: 120,
    active: false,
    totalSessions: 0,
    category: 'core',
  },
  {
    id: 'vac1_class',
    name: 'VAC I (Mon-Wed)',
    code: 'VAC-122V-1',
    paperName: 'Value Added Course (ESE / UIN)',
    room: 'Section Allocated Rooms (R-2 to R-CA)',
    academicYear: '2026-2027',
    days: 'Mon-Wed',
    slotStart: '14:00',
    slotEnd: '14:40',
    defaultStartTime: '02:00 PM',
    defaultEndTime: '02:40 PM',
    durationMinutes: 40,
    active: false,
    totalSessions: 0,
    category: 'vac1',
  },
  {
    id: 'vac2_class',
    name: 'VAC II (Thu-Sat)',
    code: 'VAC-122V-2',
    paperName: 'Value Added Course (H&W / DTSO)',
    room: 'Section Allocated Rooms (R-2 to R-CA)',
    academicYear: '2026-2027',
    days: 'Thu-Sat',
    slotStart: '14:00',
    slotEnd: '14:40',
    defaultStartTime: '02:00 PM',
    defaultEndTime: '02:40 PM',
    durationMinutes: 40,
    active: false,
    totalSessions: 0,
    category: 'vac2',
  },
  {
    id: 'aec_class',
    name: 'AEC',
    code: 'ENL122A',
    paperName: 'AEC / English Communication',
    room: 'Allocated Lecture Rooms',
    academicYear: '2026-2027',
    days: 'Mon-Sat',
    slotStart: '14:40',
    slotEnd: '15:20',
    defaultStartTime: '02:40 PM',
    defaultEndTime: '03:20 PM',
    durationMinutes: 40,
    active: false,
    totalSessions: 0,
    category: 'aecc',
  },
];

// Completely clean empty data arrays with zero dummy/mock students, sessions, or records
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_SESSIONS: AttendanceSession[] = [];
export const INITIAL_TODAY_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_CORRECTION_REQUESTS: CorrectionRequest[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
export const INITIAL_NOTIFICATIONS: AdminNotification[] = [];
