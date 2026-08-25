/**
 * Institutional Timetable & Course Schedule Configuration
 * Derived from official college academic regulations and VAC/AEC course allotments
 */

export interface TimetableSlot {
  id: string;
  periodNumber: number | string;
  name: string;
  code: string;
  category: 'mdc' | 'skill' | 'minor' | 'major' | 'practical' | 'vac' | 'aec';
  startTime: string; // "10:00 AM"
  endTime: string;   // "10:40 AM"
  slotStart: string; // "10:00"
  slotEnd: string;   // "10:40"
  durationMinutes: number;
  days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[];
  daysLabel: string; // "Mon-Wed" | "Thu-Sat" | "Mon-Sat"
  description: string;
  defaultRoom?: string;
}

export interface SectionCourseAllocation {
  section: string; // "A" - "M"
  vacGroup: 'ESE_HW' | 'UIN_DTSO';
  vacSubjects: {
    monWed: {
      code: string;
      name: string;
      time: string;
      room: string;
    };
    thuSat: {
      code: string;
      name: string;
      time: string;
      room: string;
    };
  };
  aecSubject: {
    code: string;
    name: string;
    time: string;
    days: string;
    room: string;
  };
}

// 1. MASTER TIMETABLE SLOTS
export const MASTER_TIMETABLE_SLOTS: TimetableSlot[] = [
  {
    id: 'slot_mdc',
    periodNumber: 1,
    name: 'Multi-Disciplinary Course (MDC)',
    code: 'MDC-105',
    category: 'mdc',
    startTime: '10:00 AM',
    endTime: '10:40 AM',
    slotStart: '10:00',
    slotEnd: '10:40',
    durationMinutes: 40,
    days: ['Monday', 'Tuesday', 'Wednesday'],
    daysLabel: 'Mon–Wed',
    description: 'Multi-Disciplinary Core Course (Monday to Wednesday)',
    defaultRoom: 'Academic Hall C',
  },
  {
    id: 'slot_skill',
    periodNumber: 1,
    name: 'Skill Enhancement Course (Skill / SEC)',
    code: 'SEC-204',
    category: 'skill',
    startTime: '10:00 AM',
    endTime: '10:40 AM',
    slotStart: '10:00',
    slotEnd: '10:40',
    durationMinutes: 40,
    days: ['Thursday', 'Friday', 'Saturday'],
    daysLabel: 'Thu–Sat',
    description: 'Skill Enhancement & Practical Tools (Thursday to Saturday)',
    defaultRoom: 'Computer Center Lab 3',
  },
  {
    id: 'slot_minor',
    periodNumber: 2,
    name: 'Minor Course',
    code: 'MIN-102',
    category: 'minor',
    startTime: '10:40 AM',
    endTime: '11:20 AM',
    slotStart: '10:40',
    slotEnd: '11:20',
    durationMinutes: 40,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysLabel: 'Mon–Sat',
    description: 'Minor Elective Interdisciplinary Discipline',
    defaultRoom: 'Lecture Hall B',
  },
  {
    id: 'slot_major',
    periodNumber: 3,
    name: 'Major Course',
    code: 'MAJ-301',
    category: 'major',
    startTime: '11:20 AM',
    endTime: '12:00 PM',
    slotStart: '11:20',
    slotEnd: '12:00',
    durationMinutes: 40,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysLabel: 'Mon–Sat',
    description: 'Core Major Specialization Subject (Theory)',
    defaultRoom: 'Lecture Hall 204 (North Wing)',
  },
  {
    id: 'slot_practical',
    periodNumber: '4–5',
    name: 'Practical Lab Slots',
    code: 'PRAC-LAB',
    category: 'practical',
    startTime: '12:00 PM',
    endTime: '02:00 PM',
    slotStart: '12:00',
    slotEnd: '14:00',
    durationMinutes: 120,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysLabel: 'Mon–Sat',
    description: 'Hands-on Laboratory Work, Experiments & Departmental Practical Sessions',
    defaultRoom: 'Department Lab 102 / North Wing Lab',
  },
  {
    id: 'slot_vac',
    periodNumber: 'VIII',
    name: 'Value Added Course (VAC)',
    code: 'VAC-122V',
    category: 'vac',
    startTime: '02:00 PM',
    endTime: '02:40 PM',
    slotStart: '14:00',
    slotEnd: '14:40',
    durationMinutes: 40,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysLabel: 'Mon–Sat (Subj Specific)',
    description: 'Value Added Courses (Environmental Science, Health & Wellness, Understanding India, Digital Tech Solutions)',
    defaultRoom: 'Assigned Section Rooms (R-2 to R-CA)',
  },
  {
    id: 'slot_aec',
    periodNumber: 'IX',
    name: 'AEC / English Communication Skills',
    code: 'ENL122A',
    category: 'aec',
    startTime: '02:40 PM',
    endTime: '03:20 PM',
    slotStart: '14:40',
    slotEnd: '15:20',
    durationMinutes: 40,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysLabel: 'Mon–Wed (Sec A-F) / Thu–Sat (Sec G-M)',
    description: 'Ability Enhancement Course: English Communication Skills',
    defaultRoom: 'Assigned Section Rooms (R-2 to R-9)',
  },
];

// 2. DETAILED 4 VAC SUBJECTS
export const VAC_SUBJECTS_LIST = [
  {
    code: 'ESE122V',
    name: 'Environmental Science',
    timing: '2:00–2:40 PM',
    schedule: 'Monday–Wednesday',
    sections: ['A', 'B', 'C', 'D', 'E', 'F'],
    period: 'VIII (ESE/H&W)',
  },
  {
    code: 'HWO122V',
    name: 'Health And Wellness',
    timing: '2:00–2:40 PM',
    schedule: 'Thursday–Saturday',
    sections: ['A', 'B', 'C', 'D', 'E', 'F'],
    period: 'VIII (ESE/H&W)',
  },
  {
    code: 'UIN122V',
    name: 'Understanding India',
    timing: '2:00–2:40 PM',
    schedule: 'Monday–Wednesday',
    sections: ['G', 'H', 'I', 'J', 'K', 'L', 'M'],
    period: 'VIII (UIN/DTSO)',
  },
  {
    code: 'DTSO122V',
    name: 'Digital Technological Solutions',
    timing: '2:00–2:40 PM',
    schedule: 'Thursday–Saturday',
    sections: ['G', 'H', 'I', 'J', 'K', 'L', 'M'],
    period: 'VIII (UIN/DTSO)',
  },
];

// 3. SECTION-BY-SECTION ALLOCATION TABLE (SECTIONS A TO M)
export const SECTION_ALLOCATIONS: Record<string, SectionCourseAllocation> = {
  A: {
    section: 'A',
    vacGroup: 'ESE_HW',
    vacSubjects: {
      monWed: { code: 'ESE122V', name: 'Environmental Science', time: '2:00–2:40 PM', room: 'R-2' },
      thuSat: { code: 'HWO122V', name: 'Health And Wellness', time: '2:00–2:40 PM', room: 'R-2' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Monday–Wednesday', room: 'R-2' },
  },
  B: {
    section: 'B',
    vacGroup: 'ESE_HW',
    vacSubjects: {
      monWed: { code: 'ESE122V', name: 'Environmental Science', time: '2:00–2:40 PM', room: 'R-5' },
      thuSat: { code: 'HWO122V', name: 'Health And Wellness', time: '2:00–2:40 PM', room: 'R-5' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Monday–Wednesday', room: 'R-3' },
  },
  C: {
    section: 'C',
    vacGroup: 'ESE_HW',
    vacSubjects: {
      monWed: { code: 'ESE122V', name: 'Environmental Science', time: '2:00–2:40 PM', room: 'R-37' },
      thuSat: { code: 'HWO122V', name: 'Health And Wellness', time: '2:00–2:40 PM', room: 'R-37' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Monday–Wednesday', room: 'R-4' },
  },
  D: {
    section: 'D',
    vacGroup: 'ESE_HW',
    vacSubjects: {
      monWed: { code: 'ESE122V', name: 'Environmental Science', time: '2:00–2:40 PM', room: 'R-6' },
      thuSat: { code: 'HWO122V', name: 'Health And Wellness', time: '2:00–2:40 PM', room: 'R-6' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Monday–Wednesday', room: 'R-5' },
  },
  E: {
    section: 'E',
    vacGroup: 'ESE_HW',
    vacSubjects: {
      monWed: { code: 'ESE122V', name: 'Environmental Science', time: '2:00–2:40 PM', room: 'R-10' },
      thuSat: { code: 'HWO122V', name: 'Health And Wellness', time: '2:00–2:40 PM', room: 'R-10' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Monday–Wednesday', room: 'R-7' },
  },
  F: {
    section: 'F',
    vacGroup: 'ESE_HW',
    vacSubjects: {
      monWed: { code: 'ESE122V', name: 'Environmental Science', time: '2:00–2:40 PM', room: 'R-13' },
      thuSat: { code: 'HWO122V', name: 'Health And Wellness', time: '2:00–2:40 PM', room: 'R-13' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Monday–Wednesday', room: 'R-8' },
  },
  G: {
    section: 'G',
    vacGroup: 'UIN_DTSO',
    vacSubjects: {
      monWed: { code: 'UIN122V', name: 'Understanding India', time: '2:00–2:40 PM', room: 'R-01' },
      thuSat: { code: 'DTSO122V', name: 'Digital Technological Solutions', time: '2:00–2:40 PM', room: 'R-01' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Thursday–Saturday', room: 'R-2' },
  },
  H: {
    section: 'H',
    vacGroup: 'UIN_DTSO',
    vacSubjects: {
      monWed: { code: 'UIN122V', name: 'Understanding India', time: '2:00–2:40 PM', room: 'R-27' },
      thuSat: { code: 'DTSO122V', name: 'Digital Technological Solutions', time: '2:00–2:40 PM', room: 'R-27' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Thursday–Saturday', room: 'R-3' },
  },
  I: {
    section: 'I',
    vacGroup: 'UIN_DTSO',
    vacSubjects: {
      monWed: { code: 'UIN122V', name: 'Understanding India', time: '2:00–2:40 PM', room: 'R-39' },
      thuSat: { code: 'DTSO122V', name: 'Digital Technological Solutions', time: '2:00–2:40 PM', room: 'R-39' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Thursday–Saturday', room: 'R-4' },
  },
  J: {
    section: 'J',
    vacGroup: 'UIN_DTSO',
    vacSubjects: {
      monWed: { code: 'UIN122V', name: 'Understanding India', time: '2:00–2:40 PM', room: 'R-40' },
      thuSat: { code: 'DTSO122V', name: 'Digital Technological Solutions', time: '2:00–2:40 PM', room: 'R-40' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Thursday–Saturday', room: 'R-5' },
  },
  K: {
    section: 'K',
    vacGroup: 'UIN_DTSO',
    vacSubjects: {
      monWed: { code: 'UIN122V', name: 'Understanding India', time: '2:00–2:40 PM', room: 'R-11' },
      thuSat: { code: 'DTSO122V', name: 'Digital Technological Solutions', time: '2:00–2:40 PM', room: 'R-11' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Thursday–Saturday', room: 'R-7' },
  },
  L: {
    section: 'L',
    vacGroup: 'UIN_DTSO',
    vacSubjects: {
      monWed: { code: 'UIN122V', name: 'Understanding India', time: '2:00–2:40 PM', room: 'R-CA deptt' },
      thuSat: { code: 'DTSO122V', name: 'Digital Technological Solutions', time: '2:00–2:40 PM', room: 'R-CA deptt' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Thursday–Saturday', room: 'R-8' },
  },
  M: {
    section: 'M',
    vacGroup: 'UIN_DTSO',
    vacSubjects: {
      monWed: { code: 'UIN122V', name: 'Understanding India', time: '2:00–2:40 PM', room: 'R-CA deptt' },
      thuSat: { code: 'DTSO122V', name: 'Digital Technological Solutions', time: '2:00–2:40 PM', room: 'R-CA deptt' },
    },
    aecSubject: { code: 'ENL122A', name: 'English Communication Skills', time: '2:40–3:20 PM', days: 'Thursday–Saturday', room: 'R-9' },
  },
};

/**
 * Returns all active periods scheduled on a particular day of the week
 * @param dayOfWeek 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 * @param section Optional section letter (e.g. 'A', 'B', etc.)
 */
export function getPeriodsForDay(dayOfWeek: number, section: string = 'A'): {
  period: string;
  name: string;
  code: string;
  time: string;
  room: string;
  category: string;
}[] {
  if (dayOfWeek === 0) return []; // Sunday is a holiday

  const isMonWed = dayOfWeek >= 1 && dayOfWeek <= 3; // Mon, Tue, Wed
  const isThuSat = dayOfWeek >= 4 && dayOfWeek <= 6; // Thu, Fri, Sat

  const secKey = section ? section.toUpperCase().replace(/^SECTION\s*/i, '').trim() : 'A';
  const alloc = SECTION_ALLOCATIONS[secKey] || SECTION_ALLOCATIONS['A'];

  const periods = [];

  // Period 1: 10:00 - 10:40
  if (isMonWed) {
    periods.push({
      period: 'Period 1 (10:00–10:40 AM)',
      name: 'Multi-Disciplinary Course (MDC)',
      code: 'MDC-105',
      time: '10:00 AM – 10:40 AM',
      room: 'Academic Hall C',
      category: 'mdc',
    });
  } else {
    periods.push({
      period: 'Period 1 (10:00–10:40 AM)',
      name: 'Skill Enhancement Course (Skill / SEC)',
      code: 'SEC-204',
      time: '10:00 AM – 10:40 AM',
      room: 'Computer Center Lab 3',
      category: 'skill',
    });
  }

  // Period 2: 10:40 - 11:20
  periods.push({
    period: 'Period 2 (10:40–11:20 AM)',
    name: 'Minor Course',
    code: 'MIN-102',
    time: '10:40 AM – 11:20 AM',
    room: 'Lecture Hall B',
    category: 'minor',
  });

  // Period 3: 11:20 - 12:00
  periods.push({
    period: 'Period 3 (11:20 AM–12:00 PM)',
    name: 'Major Course',
    code: 'MAJ-301',
    time: '11:20 AM – 12:00 PM',
    room: 'Lecture Hall 204 (North Wing)',
    category: 'major',
  });

  // Period 4 & 5: 12:00 - 02:00
  periods.push({
    period: 'Period 4–5 (12:00–02:00 PM)',
    name: 'Practical Lab Slots',
    code: 'PRAC-LAB',
    time: '12:00 PM – 02:00 PM',
    room: 'Department Lab 102',
    category: 'practical',
  });

  // Period 6 / VIII: 02:00 - 02:40 (VAC)
  if (isMonWed) {
    periods.push({
      period: 'Period VIII (02:00–02:40 PM)',
      name: `VAC: ${alloc.vacSubjects.monWed.name}`,
      code: alloc.vacSubjects.monWed.code,
      time: '02:00 PM – 02:40 PM',
      room: alloc.vacSubjects.monWed.room,
      category: 'vac',
    });
  } else {
    periods.push({
      period: 'Period VIII (02:00–02:40 PM)',
      name: `VAC: ${alloc.vacSubjects.thuSat.name}`,
      code: alloc.vacSubjects.thuSat.code,
      time: '02:00 PM – 02:40 PM',
      room: alloc.vacSubjects.thuSat.room,
      category: 'vac',
    });
  }

  // Period 7 / IX: 02:40 - 03:20 (AEC)
  const isAECScheduledToday = 
    (alloc.aecSubject.days === 'Monday–Wednesday' && isMonWed) ||
    (alloc.aecSubject.days === 'Thursday–Saturday' && isThuSat);

  if (isAECScheduledToday) {
    periods.push({
      period: 'Period IX (02:40–03:20 PM)',
      name: `AEC: ${alloc.aecSubject.name}`,
      code: alloc.aecSubject.code,
      time: '02:40 PM – 03:20 PM',
      room: alloc.aecSubject.room,
      category: 'aec',
    });
  }

  return periods;
}

// 4. ACADEMIC & FESTIVE HOLIDAYS DATABASE
export interface AcademicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  category: 'gazetted' | 'festive' | 'restricted' | 'break';
  typeLabel: string; // "Gazetted Holiday" | "Festive Holiday" | "Academic Recess" | "National Holiday"
  description: string;
  symbol: string; // Emoji or short symbol
  isCollegeClosed: boolean;
}

export const ACADEMIC_HOLIDAYS_DATABASE: AcademicHoliday[] = [
  // --- Official Academic / Government Gazetted & Festive Holiday Calendar (Exact J&K & National Roster) ---
  {
    date: '2026-01-05',
    name: "Guru Gobind Singh Ji's Birthday",
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: "Prakash Parv / Birth anniversary of Guru Gobind Singh Ji",
    symbol: 'ੴ',
    isCollegeClosed: true,
  },
  {
    date: '2026-01-17',
    name: 'Shab-i-Miraj*',
    category: 'festive',
    typeLabel: 'Festive / Religious',
    description: 'Observance of Isra and Mi\'raj (Subject to moon sighting)',
    symbol: '🌙',
    isCollegeClosed: true,
  },
  {
    date: '2026-01-23',
    name: 'Friday following Shab-i-Miraj*',
    category: 'festive',
    typeLabel: 'Festive / Religious',
    description: 'Friday prayers and congregation following Shab-i-Miraj',
    symbol: '🕌',
    isCollegeClosed: true,
  },
  {
    date: '2026-01-26',
    name: 'Republic Day',
    category: 'gazetted',
    typeLabel: 'National Holiday',
    description: '77th Republic Day of India — National Flag Hoisting & Celebrations',
    symbol: '🇮🇳',
    isCollegeClosed: true,
  },
  {
    date: '2026-02-15',
    name: 'Mahashivratri',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Auspicious observance of Lord Shiva / Herath',
    symbol: '🔱',
    isCollegeClosed: true,
  },
  {
    date: '2026-03-17',
    name: 'Shab-i-Qadr*',
    category: 'festive',
    typeLabel: 'Festive / Religious',
    description: 'Laylat al-Qadr (Night of Power / Decree during Ramadan)',
    symbol: '✨',
    isCollegeClosed: true,
  },
  {
    date: '2026-03-19',
    name: '1st Navratra',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'First Day of Chaitra Navratri / Navreh auspicious start',
    symbol: '🌸',
    isCollegeClosed: true,
  },
  {
    date: '2026-03-20',
    name: 'Jumat-ul-Vida*',
    category: 'festive',
    typeLabel: 'Festive / Religious',
    description: 'Last Friday (Al-Wida) of the sacred month of Ramadan',
    symbol: '🕌',
    isCollegeClosed: true,
  },
  {
    date: '2026-03-21',
    name: 'Nauroz*',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Persian / Kashmiri New Year spring equinox festival',
    symbol: '🌱',
    isCollegeClosed: true,
  },
  {
    date: '2026-03-21',
    name: 'Eid-ul-Fitr*',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Grand Islamic festival celebrating conclusion of Ramadan',
    symbol: '🌙',
    isCollegeClosed: true,
  },
  {
    date: '2026-03-26',
    name: 'Ram Navami',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Birth anniversary of Lord Rama',
    symbol: '🏹',
    isCollegeClosed: true,
  },
  {
    date: '2026-04-14',
    name: 'Baisakhi',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Harvest festival and Khalsa foundation day',
    symbol: '🌾',
    isCollegeClosed: true,
  },
  {
    date: '2026-04-14',
    name: 'Dr. B.R. Ambedkar Jayanti',
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: 'Commemoration of the architect of the Indian Constitution',
    symbol: '⚖️',
    isCollegeClosed: true,
  },
  {
    date: '2026-05-01',
    name: 'Buddha Purnima',
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: 'Birth, enlightenment, and Nirvana of Gautama Buddha',
    symbol: '☸️',
    isCollegeClosed: true,
  },
  {
    date: '2026-05-23',
    name: 'Urs Shah-i-Hamdan Sahib*',
    category: 'restricted',
    typeLabel: 'Regional / Urs',
    description: 'Annual Urs observance of Mir Sayyid Ali Hamadani (RA)',
    symbol: '🕌',
    isCollegeClosed: true,
  },
  {
    date: '2026-05-27',
    name: 'Eid-ul-Azha*',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Feast of the Sacrifice (Day 1)',
    symbol: '🕋',
    isCollegeClosed: true,
  },
  {
    date: '2026-05-28',
    name: 'Eid-ul-Azha* — 2nd day',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Eid-ul-Azha celebrations and holiday (Day 2)',
    symbol: '🕋',
    isCollegeClosed: true,
  },
  {
    date: '2026-06-22',
    name: 'Mela Khir Bhawani',
    category: 'festive',
    typeLabel: 'Festive / Regional',
    description: 'Annual sacred festival at Ragnya Devi temple (Tulmulla)',
    symbol: '🌺',
    isCollegeClosed: true,
  },
  {
    date: '2026-06-26',
    name: 'Ashoora*',
    category: 'festive',
    typeLabel: 'Solemn Observance',
    description: '10th of Muharram — Martyrdom of Hazrat Imam Hussain (AS)',
    symbol: '🖤',
    isCollegeClosed: true,
  },
  {
    date: '2026-07-05',
    name: 'Guru Hargobind Ji\'s Birthday',
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: 'Prakash Utsav of sixth Sikh Guru, Guru Hargobind Ji',
    symbol: 'ੴ',
    isCollegeClosed: true,
  },
  {
    date: '2026-08-15',
    name: 'Independence Day',
    category: 'gazetted',
    typeLabel: 'National Holiday',
    description: 'Indian Independence Day — National commemoration',
    symbol: '🇮🇳',
    isCollegeClosed: true,
  },
  {
    date: '2026-08-26',
    name: 'Eid-i-Milad-ul-Nabi*',
    category: 'festive',
    typeLabel: 'Festive / Religious',
    description: 'Birth anniversary celebration of Prophet Muhammad (PBUH)',
    symbol: '✨',
    isCollegeClosed: true,
  },
  {
    date: '2026-08-28',
    name: 'Friday following Eid-i-Milad-ul-Nabi*',
    category: 'festive',
    typeLabel: 'Festive / Religious',
    description: 'Congregational prayers following Eid-i-Milad-ul-Nabi',
    symbol: '🕌',
    isCollegeClosed: true,
  },
  {
    date: '2026-09-04',
    name: 'Janamashtami',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Celebration of the birth of Lord Krishna',
    symbol: '🦚',
    isCollegeClosed: true,
  },
  {
    date: '2026-09-23',
    name: 'Birthday of Maharaja Hari Singh Ji',
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: 'Commemoration of the birth anniversary of Maharaja Hari Singh Ji',
    symbol: '👑',
    isCollegeClosed: true,
  },
  {
    date: '2026-10-02',
    name: "Mahatma Gandhi's Birthday",
    category: 'gazetted',
    typeLabel: 'National Holiday',
    description: 'Gandhi Jayanti — International Day of Non-Violence',
    symbol: '👓',
    isCollegeClosed: true,
  },
  {
    date: '2026-10-08',
    name: 'Urs Sheikh Noor-ud-Din Sahib*',
    category: 'restricted',
    typeLabel: 'Regional / Urs',
    description: 'Annual Urs of patron saint Sheikh Noor-ud-Din Noorani (Nund Rishi RA, Charar-i-Sharief)',
    symbol: '🕊️',
    isCollegeClosed: true,
  },
  {
    date: '2026-10-20',
    name: 'Mahanavami & Dussehra',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Maha Navami and Vijayadashami (Dussehra) festivities',
    symbol: '🏹',
    isCollegeClosed: true,
  },
  {
    date: '2026-10-26',
    name: 'Accession Day',
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: 'Commemoration of the signing of the Instrument of Accession',
    symbol: '📜',
    isCollegeClosed: true,
  },
  {
    date: '2026-11-08',
    name: 'Diwali',
    category: 'festive',
    typeLabel: 'Festive Holiday',
    description: 'Festival of Lights (Deepawali)',
    symbol: '🪔',
    isCollegeClosed: true,
  },
  {
    date: '2026-11-24',
    name: 'Guru Nanak Dev Ji\'s Birthday',
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: 'Gurpurab / 557th Prakash Utsav of Guru Nanak Dev Ji',
    symbol: 'ੴ',
    isCollegeClosed: true,
  },
  {
    date: '2026-12-25',
    name: 'Christmas Day',
    category: 'gazetted',
    typeLabel: 'Gazetted Holiday',
    description: 'Christmas celebration',
    symbol: '🎄',
    isCollegeClosed: true,
  },
];

/**
 * Returns holiday details for a given date (YYYY-MM-DD or MM-DD)
 */
export function getHolidayForDate(dateStr: string): AcademicHoliday | null {
  if (!dateStr) return null;
  // 1. Direct exact date match
  const exact = ACADEMIC_HOLIDAYS_DATABASE.find(h => h.date === dateStr);
  if (exact) return exact;

  // 2. Year-agnostic match for recurring fixed-date holidays (e.g. 08-15, 01-26, 10-02, 12-25, 01-01)
  const monthDay = dateStr.slice(5); // "MM-DD"
  const recurring = ACADEMIC_HOLIDAYS_DATABASE.find(h => h.date.slice(5) === monthDay);
  if (recurring) {
    return {
      ...recurring,
      date: dateStr,
    };
  }

  return null;
}

/**
 * Checks if a specific date is a college holiday or academic recess
 */
export function isDateHoliday(dateStr: string): boolean {
  return getHolidayForDate(dateStr) !== null;
}

/**
 * Returns all holidays for a specific month (e.g. "2026-08")
 */
export function getHolidaysForMonth(year: number, monthIndex: number): AcademicHoliday[] {
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  const targetPrefix = `${year}-${monthStr}`;

  return ACADEMIC_HOLIDAYS_DATABASE.filter(h => h.date.startsWith(targetPrefix));
}

