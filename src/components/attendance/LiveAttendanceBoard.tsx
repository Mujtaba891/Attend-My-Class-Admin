import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Download,
  ShieldAlert,
  UserCheck,
  Smartphone,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { Student, AttendanceStatus, AttendanceRecord } from '../../types';
import { StatusBadge } from '../common/Badge';
import { ManualAttendanceModal } from './ManualAttendanceModal';

export const LiveAttendanceBoard: React.FC = () => {
  const {
    students,
    todayAttendance,
    activeSession,
    currentClass,
    isSessionActive,
    bulkMarkStatus,
    simulateStudentScan,
    markAttendance,
  } = useAttendance();

  const { currentRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<{
    student: Student;
    record?: AttendanceRecord;
  } | null>(null);

  // Map students with their today's attendance record
  const studentRoster = useMemo(() => {
    return students.map(student => {
      const record = todayAttendance.find(a => a.studentId === student.id);
      return {
        student,
        record: record || {
          id: `${activeSession?.id || 'geo_today'}_${student.id}`,
          sessionId: activeSession?.id || 'geo_today',
          classId: 'geology',
          studentId: student.id,
          studentName: student.fullName,
          rollNumber: student.rollNumber,
          date: activeSession?.date || '2026-08-19',
          status: 'not_marked' as AttendanceStatus,
          method: 'auto_close' as const,
        },
      };
    });
  }, [students, todayAttendance, activeSession]);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return studentRoster.filter(({ student, record }) => {
      // Search match
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        student.fullName.toLowerCase().includes(q) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(q)) ||
        student.studentId.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status match
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }

      // Section match
      if (sectionFilter !== 'all') {
        const normalizeSec = (s?: string) => (s || '').toUpperCase().replace(/^SECTION\s*/i, '').trim();
        if (normalizeSec(student.section) !== normalizeSec(sectionFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [studentRoster, searchQuery, statusFilter, sectionFilter]);

  // Counters
  const presentCount = studentRoster.filter(r => r.record.status === 'present').length;
  const absentCount = studentRoster.filter(r => r.record.status === 'absent').length;
  const notMarkedCount = studentRoster.filter(r => r.record.status === 'not_marked').length;
  const correctionCount = studentRoster.filter(r => r.record.status === 'correction_requested').length;

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['Roll Number', 'Student Name', 'Section', 'Status', 'Marked At', 'Method', 'Account Status', 'Notes'];
    const rows = studentRoster.map(({ student, record }) => [
      student.rollNumber || student.id,
      `"${student.fullName}"`,
      student.section,
      record.status,
      record.markedAt || 'N/A',
      record.method || 'N/A',
      student.accountStatus,
      `"${record.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Geology_Attendance_${activeSession?.date || 'Today'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Real-Time Attendance Sync
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Live Attendance Board
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {currentClass.name} Session • {activeSession?.date || 'Today'} ({activeSession?.startTime || currentClass.defaultStartTime} – {activeSession?.endTime || currentClass.defaultEndTime})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSessionActive && (
            <button
              onClick={() => simulateStudentScan()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate QR Scan</span>
            </button>
          )}

          {currentRole !== 'cr' && notMarkedCount > 0 && (
            <button
              onClick={() => bulkMarkStatus('absent')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Mark Unmarked as Absent</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Quick Stat Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Students ({studentRoster.length})
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
            onClick={() => setStatusFilter('not_marked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'not_marked'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Not Marked ({notMarkedCount})
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

          {correctionCount > 0 && (
            <button
              onClick={() => setStatusFilter('correction_requested')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'correction_requested'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Corrections ({correctionCount})
            </button>
          )}
        </div>

        {/* Section & Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Sections (A–M)</option>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name / roll..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll / ID</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timestamp & Method</th>
                <th className="py-3.5 px-4">Account & Device</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No students match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRoster.map(({ student, record }) => {
                  const isLocked = student.accountStatus === 'locked';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isLocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={student.fullName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{student.fullName}</span>
                              {isLocked && (
                                <span title="Account Locked due to Device Mismatch">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll / ID */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                        {student.rollNumber || student.studentId}
                      </td>

                      {/* Section */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                          Section {student.section}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={record.status} />
                      </td>

                      {/* Timestamp & Method */}
                      <td className="py-3.5 px-4">
                        {record.markedAt ? (
                          <div>
                            <div className="font-mono text-slate-200">
                              {new Date(record.markedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </div>
                            <span className="text-[10px] text-slate-500 capitalize">
                              {record.method ? record.method.replace('_', ' ') : 'QR Scan'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Not recorded</span>
                        )}
                      </td>

                      {/* Account / Device */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[130px] font-mono text-[11px]">
                            {student.authorizedDeviceModel || 'Unregistered'}
                          </span>
                        </div>
                        {isLocked ? (
                          <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">
                            Device Mismatch Flagged
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                            Hardware Verified
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Present */}
                          <button
                            onClick={() => markAttendance(student.id, 'present', 'Quick Present by Teacher/CR')}
                            title="Mark Present"
                            disabled={isLocked}
                            className={`p-1.5 rounded-lg border text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 transition-colors ${
                              isLocked ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Quick Absent */}
                          <button
                            onClick={() => markAttendance(student.id, 'absent', 'Quick Absent by Teacher/CR')}
                            title="Mark Absent"
                            className="p-1.5 rounded-lg border text-rose-400 hover:bg-rose-500/20 border-rose-500/30 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            onClick={() => setSelectedStudentForEdit({ student, record })}
                            title="Override & Notes"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Status Override Modal */}
      {selectedStudentForEdit && (
        <ManualAttendanceModal
          isOpen={!!selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
          student={selectedStudentForEdit.student}
          currentRecord={selectedStudentForEdit.record}
        />
      )}
    </div>
  );
};
