import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  MapPin,
  Download,
  Printer,
  Info,
  CalendarDays,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { Student, AttendanceRecord } from '../../types';
import {
  MASTER_TIMETABLE_SLOTS,
  SECTION_ALLOCATIONS,
  VAC_SUBJECTS_LIST,
  getPeriodsForDay,
  getHolidayForDate,
  isDateHoliday,
  getHolidaysForMonth,
  AcademicHoliday,
  ACADEMIC_HOLIDAYS_DATABASE,
} from '../../data/timetableData';

interface StudentCalendarViewProps {
  initialStudentId?: string;
  onNavigateToStudent?: (studentId: string) => void;
}

export const StudentCalendarView: React.FC<StudentCalendarViewProps> = ({
  initialStudentId,
}) => {
  const { students, allAttendance, sessions, markAttendance } = useAttendance();
  const { currentRole } = useAuth();

  // Selected Student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id || '')
  );
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // Active Calendar Date (Month/Year)
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 7, 1)); // Default to August 2026
  const [selectedDayDate, setSelectedDayDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'timetable' | 'vac_aec' | 'holidays'>('timetable');

  // Find active student
  const currentStudent: Student | undefined = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Filter student list by search
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const q = studentSearchQuery.toLowerCase();
    return students.filter(
      s =>
        s.fullName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.section && s.section.toLowerCase().includes(q))
    );
  }, [students, studentSearchQuery]);

  // Current Month calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const currentMonthName = monthNames[month];

  // Holidays in Current Month
  const currentMonthHolidays = useMemo(() => {
    return getHolidaysForMonth(year, month);
  }, [year, month]);

  // Attendance records for the selected student
  const studentAttendanceRecords = useMemo(() => {
    if (!currentStudent) return [];
    return allAttendance.filter(a => a.studentId === currentStudent.id);
  }, [allAttendance, currentStudent]);

  // Attendance lookup by date string (YYYY-MM-DD)
  const attendanceByDate = useMemo(() => {
    const map: Record<string, AttendanceRecord[]> = {};
    studentAttendanceRecords.forEach(rec => {
      if (!map[rec.date]) {
        map[rec.date] = [];
      }
      map[rec.date].push(rec);
    });
    return map;
  }, [studentAttendanceRecords]);

  // Calendar days generation
  const calendarGridDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Convert so Monday is 0, Sunday is 6
    const startingOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = startingOffset - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = prevDate.toISOString().split('T')[0];
      const holiday = getHolidayForDate(dateStr);
      days.push({
        date: prevDate,
        dateStr,
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        isSunday: prevDate.getDay() === 0,
        holiday,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const holiday = getHolidayForDate(dateStr);
      days.push({
        date: dateObj,
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        isSunday: dateObj.getDay() === 0,
        holiday,
      });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      const holiday = getHolidayForDate(dateStr);
      days.push({
        date: nextDate,
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isSunday: nextDate.getDay() === 0,
        holiday,
      });
    }

    return days;
  }, [year, month]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleTodayJump = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayDate(today.toISOString().split('T')[0]);
  };

  // Month Statistics for selected student
  const monthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlyRecords = studentAttendanceRecords.filter(r => r.date.startsWith(monthPrefix));

    const presentCount = monthlyRecords.filter(r => r.status === 'present').length;
    const absentCount = monthlyRecords.filter(r => r.status === 'absent').length;
    const totalSessions = monthlyRecords.length;

    // Estimate working days in month (excluding Sundays and Gazetted/Festive Holidays)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDaysCount = 0;
    let holidaysInMonthCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSunday = dt.getDay() === 0;
      const holiday = getHolidayForDate(dateStr);

      if (holiday) {
        holidaysInMonthCount++;
      }

      if (!isSunday && !holiday) {
        workingDaysCount++;
      }
    }

    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
    const isDefaulter = totalSessions > 0 && percentage < 75;

    return {
      presentCount,
      absentCount,
      totalSessions,
      workingDaysCount,
      holidaysInMonthCount,
      percentage,
      isDefaulter,
    };
  }, [studentAttendanceRecords, year, month]);

  // Selected Day Details & Schedule
  const selectedDayInfo = useMemo(() => {
    const [y, m, d] = selectedDayDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const isSunday = dayOfWeek === 0;
    const holiday = getHolidayForDate(selectedDayDate);

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const section = currentStudent?.section || 'A';
    const scheduledPeriods = holiday ? [] : getPeriodsForDay(dayOfWeek, section);
    const dayAttendanceRecords = attendanceByDate[selectedDayDate] || [];

    return {
      dateStr: selectedDayDate,
      dayName,
      dayNumber: d,
      formattedFull: dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      isSunday,
      holiday,
      scheduledPeriods,
      dayAttendanceRecords,
      isPresent: dayAttendanceRecords.some(r => r.status === 'present'),
      isAbsent: dayAttendanceRecords.some(r => r.status === 'absent'),
    };
  }, [selectedDayDate, currentStudent, attendanceByDate]);

  // Export CSV
  const handleExportCSV = () => {
    if (!currentStudent) return;
    const headers = ['Roll Number', 'Student Name', 'Date', 'Day', 'Status', 'Marked At', 'Method', 'Notes'];
    const rows = studentAttendanceRecords.map(r => {
      const d = new Date(r.date);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] || '';
      return [
        currentStudent.rollNumber || currentStudent.studentId,
        `"${currentStudent.fullName}"`,
        r.date,
        dayName,
        r.status,
        r.markedAt || 'N/A',
        r.method || 'N/A',
        `"${r.notes || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Attendance_${currentStudent.rollNumber || currentStudent.studentId}_${year}_${month + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Student Calendar Tracker
              </span>
              <span className="text-xs text-slate-400">Timetable & Attendance Matrix</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
              Individual Attendance Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Track daily presence, absence, period-wise schedule (MDC, Skill, Minor, Major, Practicals, VAC, AEC), and monthly turnout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsTimetableModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Institutional Timetable</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Student CSV</span>
            </button>
          </div>
        </div>

        {/* Student Selector Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Active Student Picker */}
          <div className="relative w-full md:w-96">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Select Student Profile</span>
              <span className="text-emerald-400 font-mono text-[10px]">
                {students.length} Registered Students
              </span>
            </label>
            <div
              onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-emerald-500/60 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-colors shadow-inner"
            >
              {currentStudent ? (
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      currentStudent.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={currentStudent.fullName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {currentStudent.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <span className="text-emerald-400 font-semibold">
                        {currentStudent.rollNumber || currentStudent.studentId}
                      </span>
                      <span>•</span>
                      <span>Sec {currentStudent.section || 'A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500">Select a student...</span>
              )}
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isStudentDropdownOpen ? 'rotate-90 text-emerald-400' : ''
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            {isStudentDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl space-y-2 max-h-72 flex flex-col">
                <div className="relative shrink-0 px-1 pt-1">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    placeholder="Search by name, roll no, section..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching students found
                    </div>
                  ) : (
                    filteredStudents.map(stu => (
                      <div
                        key={stu.id}
                        onClick={() => {
                          setSelectedStudentId(stu.id);
                          setIsStudentDropdownOpen(false);
                          setStudentSearchQuery('');
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          stu.id === currentStudent?.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              stu.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={stu.fullName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-md object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{stu.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {stu.rollNumber || stu.studentId} • Section {stu.section || 'A'}
                            </div>
                          </div>
                        </div>
                        {stu.id === currentStudent?.id && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Month Navigator Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[150px]">
              <span className="text-xs font-bold text-slate-100 font-heading block">
                {currentMonthName} {year}
              </span>
              <span className="text-[10px] text-slate-400">
                {monthStats.workingDaysCount} Working Days
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleTodayJump}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Student Monthly Summary KPI Bar */}
      {currentStudent && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Turnout % */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                Month Turnout
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  monthStats.isDefaulter ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
              />
            </div>
            <div className="mt-2">
              <div
                className={`text-2xl sm:text-3xl font-black font-heading ${
                  monthStats.isDefaulter ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {monthStats.percentage}%
              </div>
              <span className="text-[10px] text-slate-400">
                {monthStats.isDefaulter ? 'Defaulter (<75%)' : 'Good Standing (≥75%)'}
              </span>
            </div>
          </div>

          {/* Present Classes */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Present</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-heading text-emerald-400">
                {monthStats.presentCount}
              </div>
              <span className="text-[10px] text-slate-400">Recorded Sessions</span>
            </div>
          </div>

          {/* Absent Classes */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Absent</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black font-heading text-rose-400">
                {monthStats.absentCount}
              </div>
              <span className="text-[10px] text-slate-400">Missed Sessions</span>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Allotted VAC & AEC</span>
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-1 space-y-0.5">
              {(() => {
                const sec = (currentStudent.section || 'A').toUpperCase().replace(/^SECTION\s*/i, '').trim() || 'A';
                const alloc = SECTION_ALLOCATIONS[sec] || SECTION_ALLOCATIONS['A'];
                return (
                  <>
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {alloc?.vacSubjects.monWed.name || 'Env Science'} / {alloc?.vacSubjects.thuSat.name || 'Health & Wellness'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Room {alloc?.vacSubjects.monWed.room || 'R-2'} • Period VIII & IX
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Working Days */}
          <div className="hidden lg:flex p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Academic Load</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-heading text-slate-200">
                6 Slots / Day
              </div>
              <span className="text-[10px] text-slate-400">10:00 AM – 03:20 PM</span>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Holidays Banner / Quick Navigation Strip */}
      {currentMonthHolidays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-base">
                ✨
              </span>
              <div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  Festive & Gazetted Holidays in {currentMonthName} ({currentMonthHolidays.length})
                </span>
                <p className="text-[10px] text-slate-400">
                  Official university holidays with suspended academic periods
                </p>
              </div>
            </div>

            {/* Quick jump holiday chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {currentMonthHolidays.map(hol => {
                const dayNum = parseInt(hol.date.split('-')[2], 10);
                const isSelected = selectedDayDate === hol.date;
                return (
                  <button
                    key={hol.date}
                    onClick={() => setSelectedDayDate(hol.date)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-900/50'
                        : 'bg-slate-950/80 hover:bg-amber-950/40 text-amber-200 border-amber-500/30 hover:border-amber-400'
                    }`}
                  >
                    <span>{hol.symbol}</span>
                    <span className="truncate max-w-[140px]">{hol.name}</span>
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-amber-950/60 text-amber-300">
                      {currentMonthName.slice(0, 3)} {dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Calendar Grid + Day Period Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Interactive Calendar Grid */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          {/* Calendar Header Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-heading">
                {currentMonthName} {year} Attendance Grid
              </h2>
              <span className="text-xs text-slate-400">
                (Click any day to inspect full daily schedule)
              </span>
            </div>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Festive / Holiday
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Sunday
              </span>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-800">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div className="text-slate-500">Sun</div>
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarGridDays.map((dayItem, idx) => {
              const isSelected = dayItem.dateStr === selectedDayDate;
              const records = attendanceByDate[dayItem.dateStr] || [];
              const isPresent = records.some(r => r.status === 'present');
              const isAbsent = records.some(r => r.status === 'absent');
              const isToday =
                new Date().toISOString().split('T')[0] === dayItem.dateStr;
              const hasHoliday = !!dayItem.holiday;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayDate(dayItem.dateStr)}
                  className={`min-h-[72px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative select-none ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/80 z-10'
                      : hasHoliday && dayItem.isCurrentMonth
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/30'
                      : dayItem.isCurrentMonth
                      ? 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/40'
                      : 'bg-slate-950/20 border-slate-900 text-slate-600 opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Top Bar: Day Number + Today / Holiday Symbol */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-emerald-300 font-black scale-110'
                          : isToday
                          ? 'text-amber-400 font-black'
                          : hasHoliday
                          ? 'text-amber-300 font-bold'
                          : dayItem.isSunday
                          ? 'text-slate-500'
                          : 'text-slate-200'
                      }`}
                    >
                      {dayItem.dayNum}
                    </span>

                    <div className="flex items-center gap-1">
                      {hasHoliday && (
                        <span className="text-xs" title={dayItem.holiday?.name}>
                          {dayItem.holiday?.symbol}
                        </span>
                      )}
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                  </div>

                  {/* Center / Bottom: Attendance Status Indicator or Holiday Tag */}
                  <div className="mt-1 space-y-1">
                    {hasHoliday ? (
                      <div className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold truncate">
                        <span className="shrink-0">{dayItem.holiday?.symbol}</span>
                        <span className="truncate">{dayItem.holiday?.name}</span>
                      </div>
                    ) : dayItem.isSunday ? (
                      <span className="text-[9px] font-semibold text-slate-600 uppercase block text-center">
                        Sunday
                      </span>
                    ) : isPresent ? (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">Present</span>
                      </div>
                    ) : isAbsent ? (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                        <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">Absent</span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between">
                        <span>{dayItem.date.getDay() <= 3 ? 'MDC' : 'Skill'}</span>
                        <span className="text-slate-600">6p</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 cols): Selected Day Period Inspector */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Inspector Header */}
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Daily Period Schedule
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedDayInfo.dateStr}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-heading mt-0.5">
                {selectedDayInfo.formattedFull}
              </h3>
            </div>

            {/* If Holiday: Festive Holiday Callout Card */}
            {selectedDayInfo.holiday ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/60 via-slate-950 to-slate-900 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span>{selectedDayInfo.holiday.symbol}</span>
                    <span>{selectedDayInfo.holiday.typeLabel}</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-semibold uppercase">
                    Classes Suspended
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200">
                    {selectedDayInfo.holiday.name}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {selectedDayInfo.holiday.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-amber-500/20 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>University Campus Closed</span>
                  <span className="text-amber-400 font-semibold">Official Academic Holiday</span>
                </div>
              </div>
            ) : (
              /* Attendance Status Callout for regular class day */
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {selectedDayInfo.isSunday ? (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  ) : selectedDayInfo.isPresent ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : selectedDayInfo.isAbsent ? (
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <XCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {selectedDayInfo.isSunday
                        ? 'Academic Off / Sunday'
                        : selectedDayInfo.isPresent
                        ? 'Marked Present'
                        : selectedDayInfo.isAbsent
                        ? 'Marked Absent'
                        : 'Scheduled Classes'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {currentStudent?.fullName} ({currentStudent?.rollNumber || currentStudent?.studentId})
                    </div>
                  </div>
                </div>

                {/* Quick Status Toggle for Teacher/Admin */}
                {currentRole !== 'cr' && !selectedDayInfo.isSunday && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (!currentStudent) return;
                        markAttendance(
                          currentStudent.id,
                          selectedDayInfo.isPresent ? 'absent' : 'present',
                          `Calendar override: Marked ${selectedDayInfo.isPresent ? 'Absent' : 'Present'} for ${selectedDayInfo.dateStr}`,
                          'manual_admin'
                        );
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        selectedDayInfo.isPresent
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {selectedDayInfo.isPresent ? 'Set Absent' : 'Mark Present'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* List of Scheduled Periods for Selected Day */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Timetable Periods ({selectedDayInfo.scheduledPeriods.length})</span>
                <span className="text-[10px] text-emerald-400">Sec {currentStudent?.section || 'A'}</span>
              </h4>

              {selectedDayInfo.holiday ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-amber-500/20 text-center text-xs text-slate-400 space-y-1">
                  <div className="text-amber-400 font-semibold">No Periods Scheduled Today</div>
                  <div className="text-[11px] text-slate-500">
                    Enjoy the {selectedDayInfo.holiday.name} ({selectedDayInfo.holiday.symbol})
                  </div>
                </div>
              ) : selectedDayInfo.isSunday ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                  No classes scheduled on Sundays.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {selectedDayInfo.scheduledPeriods.map((period, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          {period.time}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-300">
                          {period.code}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-200 line-clamp-1">
                        {period.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {period.room}
                        </span>
                        <span className="capitalize text-slate-500">{period.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Timetable Reference Banner */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] space-y-1.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Weekly Academic Structure</span>
            </div>
            <ul className="text-[10px] text-slate-400 space-y-1 leading-snug">
              <li>• <strong className="text-slate-300">10:00–10:40</strong>: MDC (Mon–Wed) | Skill / SEC (Thu–Sat)</li>
              <li>• <strong className="text-slate-300">10:40–11:20</strong>: Minor Course (Daily)</li>
              <li>• <strong className="text-slate-300">11:20–12:00</strong>: Major Course (Daily)</li>
              <li>• <strong className="text-slate-300">12:00–02:00</strong>: Practical Lab Slots (Daily)</li>
              <li>• <strong className="text-slate-300">02:00–02:40</strong>: VAC (ESE / H&W / UIN / DTSO)</li>
              <li>• <strong className="text-slate-300">02:40–03:20</strong>: AEC / English Communication</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Institutional Timetable & Holiday Reference Modal */}
      {isTimetableModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsTimetableModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Institutional Master Schedule & Holidays
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100 font-heading mt-1">
                  Academic Timetable, Course Allocations & Festive Holidays
                </h3>
              </div>
              <button
                onClick={() => setIsTimetableModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveModalTab('timetable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeModalTab === 'timetable'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Core Period Master Schedule
              </button>
              <button
                onClick={() => setActiveModalTab('vac_aec')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeModalTab === 'vac_aec'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                2. VAC & AEC Sections Matrix
              </button>
              <button
                onClick={() => setActiveModalTab('holidays')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'holidays'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>✨</span>
                <span>3. Festive & Gazetted Holidays ({ACADEMIC_HOLIDAYS_DATABASE.length})</span>
              </button>
            </div>

            {/* Tab 1: Daily Slot Table */}
            {activeModalTab === 'timetable' && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Daily Period Master Schedule & Allotted Timings
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <tr>
                        <th className="p-3">Period</th>
                        <th className="p-3">Time Slot</th>
                        <th className="p-3">Subject / Course Type</th>
                        <th className="p-3">Schedule Days</th>
                        <th className="p-3">Room / Venue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 text-slate-200">
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-emerald-400">Period 1</td>
                        <td className="p-3 font-mono">10:00 AM – 10:40 AM</td>
                        <td className="p-3 font-semibold">Multi-Disciplinary Course (MDC)</td>
                        <td className="p-3 text-emerald-300 font-medium">Monday, Tuesday, Wednesday</td>
                        <td className="p-3 text-slate-400">Academic Hall C</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-teal-400">Period 1</td>
                        <td className="p-3 font-mono">10:00 AM – 10:40 AM</td>
                        <td className="p-3 font-semibold">Skill Enhancement Course (Skill / SEC)</td>
                        <td className="p-3 text-teal-300 font-medium">Thursday, Friday, Saturday</td>
                        <td className="p-3 text-slate-400">Computer Center Lab 3</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-blue-400">Period 2</td>
                        <td className="p-3 font-mono">10:40 AM – 11:20 AM</td>
                        <td className="p-3 font-semibold">Minor Course</td>
                        <td className="p-3 text-slate-300">Monday to Saturday</td>
                        <td className="p-3 text-slate-400">Lecture Hall B</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-indigo-400">Period 3</td>
                        <td className="p-3 font-mono">11:20 AM – 12:00 PM</td>
                        <td className="p-3 font-semibold">Major Course</td>
                        <td className="p-3 text-slate-300">Monday to Saturday</td>
                        <td className="p-3 text-slate-400">Lecture Hall 204 (North Wing)</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-purple-400">Period 4–5</td>
                        <td className="p-3 font-mono">12:00 PM – 02:00 PM</td>
                        <td className="p-3 font-semibold">Practical Lab Slots</td>
                        <td className="p-3 text-slate-300">Monday to Saturday</td>
                        <td className="p-3 text-slate-400">Department Lab 102</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-400">Period VIII</td>
                        <td className="p-3 font-mono">02:00 PM – 02:40 PM</td>
                        <td className="p-3 font-semibold">Value Added Course (VAC)</td>
                        <td className="p-3 text-amber-300">4 Subjects (ESE / H&W / UIN / DTSO)</td>
                        <td className="p-3 text-slate-400">Section Allocated (R-2 to R-CA)</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">Period IX</td>
                        <td className="p-3 font-mono">02:40 PM – 03:20 PM</td>
                        <td className="p-3 font-semibold">AEC / English Communication Skills (ENL122A)</td>
                        <td className="p-3 text-cyan-300">Mon–Wed (Sec A–F) | Thu–Sat (Sec G–M)</td>
                        <td className="p-3 text-slate-400">Section Allocated (R-2 to R-9)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: VAC & AEC Sections A to M Allotment Matrix */}
            {activeModalTab === 'vac_aec' && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Section-Wise VAC & AEC Allocation Matrix (Sections A to M)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-mono sticky top-0">
                      <tr>
                        <th className="p-2.5">Section</th>
                        <th className="p-2.5">VAC Mon–Wed (2:00–2:40)</th>
                        <th className="p-2.5">VAC Thu–Sat (2:00–2:40)</th>
                        <th className="p-2.5">VAC Room</th>
                        <th className="p-2.5">AEC English (2:40–3:20)</th>
                        <th className="p-2.5">AEC Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 text-slate-200 font-mono text-[11px]">
                      {Object.values(SECTION_ALLOCATIONS).map(item => (
                        <tr key={item.section} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold text-emerald-400">Section {item.section}</td>
                          <td className="p-2.5 text-slate-200">{item.vacSubjects.monWed.name}</td>
                          <td className="p-2.5 text-slate-200">{item.vacSubjects.thuSat.name}</td>
                          <td className="p-2.5 text-amber-300 font-semibold">{item.vacSubjects.monWed.room}</td>
                          <td className="p-2.5 text-cyan-300">{item.aecSubject.days}</td>
                          <td className="p-2.5 text-emerald-300 font-semibold">{item.aecSubject.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Official Academic & Festive Holidays */}
            {activeModalTab === 'holidays' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Official Academic & Festive Holidays (2026)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {ACADEMIC_HOLIDAYS_DATABASE.length} Gazetted, Festive & Recess Dates
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-mono sticky top-0">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Symbol</th>
                        <th className="p-2.5">Holiday / Festival</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Significance & Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 text-slate-200 text-[11px]">
                      {ACADEMIC_HOLIDAYS_DATABASE.map(hol => (
                        <tr key={hol.date} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono font-semibold text-amber-300 whitespace-nowrap">
                            {hol.date}
                          </td>
                          <td className="p-2.5 text-base text-center">{hol.symbol}</td>
                          <td className="p-2.5 font-bold text-slate-100 whitespace-nowrap">
                            {hol.name}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                hol.category === 'gazetted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : hol.category === 'festive'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : hol.category === 'break'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              }`}
                            >
                              {hol.typeLabel}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{hol.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
