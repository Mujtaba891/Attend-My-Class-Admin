import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Download,
  CalendarCheck2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { StatusBadge } from '../common/Badge';

export const AttendanceHistoryView: React.FC = () => {
  const { allAttendance, students, sessions, currentClass } = useAttendance();

  const [selectedDate, setSelectedDate] = useState<string>('2026-08-19');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const enrolledStudentIds = useMemo(() => new Set(students.map(s => s.id)), [students]);

  // Subject-scoped attendance records
  const subjectAttendance = useMemo(() => {
    return allAttendance.filter(a => enrolledStudentIds.size === 0 || enrolledStudentIds.has(a.studentId));
  }, [allAttendance, enrolledStudentIds]);

  // Unique session dates
  const availableDates = useMemo(() => {
    const dates: string[] = Array.from(new Set(subjectAttendance.map(a => a.date)));
    return dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
  }, [subjectAttendance]);

  // Session for selected date
  const sessionForDate = useMemo(() => {
    return sessions.find(s => s.date === selectedDate && (s.classId === currentClass.id || s.subject === currentClass.paperName));
  }, [sessions, selectedDate, currentClass]);

  // Records for selected date
  const recordsForDate = useMemo(() => {
    return subjectAttendance.filter(a => a.date === selectedDate);
  }, [subjectAttendance, selectedDate]);

  const filteredRecords = useMemo(() => {
    return recordsForDate.filter(r => {
      const q = searchQuery.toLowerCase();
      const matches =
        r.studentName.toLowerCase().includes(q) ||
        (r.rollNumber && r.rollNumber.toLowerCase().includes(q)) ||
        r.studentId.toLowerCase().includes(q);

      if (!matches) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [recordsForDate, searchQuery, statusFilter]);

  const presentCount = recordsForDate.filter(r => r.status === 'present').length;
  const absentCount = recordsForDate.filter(r => r.status === 'absent').length;
  const notMarkedCount = recordsForDate.filter(r => r.status === 'not_marked').length;

  const handleExport = () => {
    const headers = ['Roll Number', 'Student Name', 'Date', 'Status', 'Marked At', 'Method', 'Notes'];
    const rows = recordsForDate.map(r => [
      r.rollNumber || r.studentId,
      `"${r.studentName}"`,
      r.date,
      r.status,
      r.markedAt || 'N/A',
      r.method || 'N/A',
      `"${r.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Historical_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Department Archives
            </span>
            <span className="text-xs text-slate-400">Classroom Historical Logs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Attendance History & Archives
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Query and verify historical classroom attendance sessions by specific date.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Daily Sheet</span>
        </button>
      </div>

      {/* Date Selector Strip & KPI bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Date Selector Box */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
            Select Class Date:
          </label>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
          >
            {availableDates.map(date => (
              <option key={date} value={date}>
                {date} {date === '2026-08-19' ? '(Today)' : ''}
              </option>
            ))}
          </select>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <span>Session: </span>
            <strong className="text-slate-200">{sessionForDate?.startTime || currentClass.defaultStartTime} – {sessionForDate?.endTime || currentClass.defaultEndTime}</strong> ({currentClass.room})
          </div>
        </div>

        {/* Date Stat Overview */}
        <div className="lg:col-span-8 grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">Present</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-heading mt-1">
              {presentCount}
            </div>
            <span className="text-[11px] text-emerald-500/80 font-medium mt-0.5">
              {recordsForDate.length > 0 ? Math.round((presentCount / recordsForDate.length) * 100) : 0}% Turnout
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">Absent</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-heading mt-1">
              {absentCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Marked absent</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">Not Marked</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading mt-1">
              {notMarkedCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Pending</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Records ({recordsForDate.length})
          </button>

          <button
            onClick={() => setStatusFilter('present')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'present'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Present ({presentCount})
          </button>

          <button
            onClick={() => setStatusFilter('absent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'absent'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Absent ({absentCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4">Verification Method</th>
                <th className="py-3.5 px-4">Check-In Timestamp</th>
                <th className="py-3.5 px-4">Notes & Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No attendance records logged for this filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{rec.studentName}</div>
                      <span className="text-[11px] text-slate-500 font-mono">{rec.studentId}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                      {rec.rollNumber || rec.studentId}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.status} />
                    </td>

                    <td className="py-3.5 px-4 capitalize text-slate-300">
                      {rec.method?.replace('_', ' ') || 'QR Scan'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {rec.markedAt
                        ? new Date(rec.markedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 italic max-w-xs truncate">
                      {rec.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
