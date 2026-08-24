import React from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Percent,
  QrCode,
  Radio,
  ArrowRight,
  ShieldAlert,
  Play,
  Square,
  Sparkles,
  RefreshCw,
  Monitor,
  CheckSquare,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
  onOpenClassroomDisplay: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenClassroomDisplay,
}) => {
  const {
    students,
    activeSession,
    currentClass,
    todayAttendance,
    correctionRequests,
    isSessionActive,
    sessionCountdown,
    startSessionManually,
    closeSessionManually,
    simulateStudentScan,
    regenerateToken,
  } = useAttendance();

  const { currentRole, adminProfile } = useAuth();

  // Metrics
  const totalStudents = students.length;
  const presentCount = activeSession?.presentCount ?? todayAttendance.filter(a => a.status === 'present').length;
  const absentCount = activeSession?.absentCount ?? todayAttendance.filter(a => a.status === 'absent').length;
  const notMarkedCount = activeSession?.notMarkedCount ?? todayAttendance.filter(a => a.status === 'not_marked').length;
  const correctionCount = correctionRequests.filter(c => c.status === 'pending').length;
  const lockedCount = students.filter(s => s.accountStatus === 'locked').length;

  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Recent attendance stream
  const recentPresent = todayAttendance
    .filter(a => a.status === 'present' && a.markedAt)
    .sort((a, b) => new Date(b.markedAt || 0).getTime() - new Date(a.markedAt || 0).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {adminProfile.department || 'Department of Academic Studies'}
            </span>
            <span className="text-xs text-slate-400">
              {adminProfile.assignedClass || 'Semester IV (Batch 2024-2027)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1.5 tracking-tight">
            {adminProfile.assignedSubject ? `${adminProfile.assignedSubject} ${adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''}` : 'Academic Attendance Operations'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Teacher: {adminProfile.name} • Location: {adminProfile.assignedRoom || 'Lecture Hall 204'} • Real-time QR security & hardware binding.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSessionActive && (
            <button
              onClick={() => simulateStudentScan()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate Scan</span>
            </button>
          )}

          <button
            onClick={onOpenClassroomDisplay}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 transition-all"
          >
            <Monitor className="w-4 h-4" />
            <span>Launch Classroom Display</span>
          </button>
        </div>
      </div>

      {/* Security Alert Banner if accounts locked */}
      {lockedCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-200">
                {lockedCount} Student Account{lockedCount > 1 ? 's' : ''} Locked (Device Mismatch Flag)
              </h4>
              <p className="text-xs text-rose-300/80">
                Unregistered hardware fingerprint login attempts detected. Accounts require admin verification before attendance can be marked.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('devices')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Review & Reactivate
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Enrolled</span>
            <Users className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-100 font-heading">{totalStudents}</div>
          <div className="mt-1 text-[11px] text-slate-500 line-clamp-1">{adminProfile.assignedClass || 'Enrolled Students'}</div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('live_board')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-400 font-heading">{presentCount}</div>
          <div className="mt-1 text-[11px] text-emerald-500/80 font-medium">
            {attendancePercentage}% turnout
          </div>
        </div>

        {/* Absent Today */}
        <div
          onClick={() => onNavigate('live_board')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Absent Today</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-rose-400 font-heading">{absentCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Unexcused / Locked</div>
        </div>

        {/* Not Marked */}
        <div
          onClick={() => onNavigate('live_board')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Not Marked</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-amber-400 font-heading">{notMarkedCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Pending scan</div>
        </div>

        {/* Correction Requests */}
        <div
          onClick={() => onNavigate('corrections')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Corrections</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-cyan-400 font-heading">{correctionCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Pending review</div>
        </div>

        {/* Attendance Rate */}
        <div
          onClick={() => onNavigate('weekly_reports')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Session Rate</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-purple-300 font-heading">{attendancePercentage}%</div>
          <div className="mt-1 text-[11px] text-purple-400/80 font-medium">Target ≥ 75%</div>
        </div>
      </div>

      {/* Main Two-Column Row: Active QR Session Card + Live Attendance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column (7 cols): Daily QR Session Controller */}
        <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-heading">
                    Today’s Attendance QR Session
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isSessionActive || activeSession?.status === 'scheduled'
                      ? `Active Window: ${activeSession?.startTime} – ${activeSession?.endTime}`
                      : `Class Schedule Window: ${currentClass.defaultStartTime} – ${currentClass.defaultEndTime}`
                    } • ({adminProfile.assignedRoom || currentClass.room})
                  </p>
                </div>
              </div>

              <div>
                {isSessionActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    ACTIVE
                  </span>
                ) : activeSession?.status === 'scheduled' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    SCHEDULED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                    CLOSED
                  </span>
                )}
              </div>
            </div>

            {/* Session Stats Bar */}
            <div className="grid grid-cols-3 gap-3 my-5">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-[11px] font-medium text-slate-400 uppercase">Present</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{presentCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-[11px] font-medium text-slate-400 uppercase">Not Marked</span>
                <p className="text-xl font-bold text-amber-400 mt-1">{notMarkedCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-[11px] font-medium text-slate-400 uppercase">Absent</span>
                <p className="text-xl font-bold text-rose-400 mt-1">{absentCount}</p>
              </div>
            </div>

            {/* Session Time & Security Token info */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isSessionActive || activeSession?.status === 'scheduled' ? 'Active Session Window:' : 'Class Schedule Window:'}
                </span>
                <span className="font-mono text-slate-200 font-semibold">
                  {isSessionActive || activeSession?.status === 'scheduled'
                    ? `${activeSession?.startTime} – ${activeSession?.endTime}`
                    : `${currentClass.defaultStartTime} – ${currentClass.defaultEndTime}`
                  } ({currentClass.durationMinutes} min)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Time Remaining:</span>
                <span className={`font-mono font-bold ${isSessionActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isSessionActive ? `${sessionCountdown} remaining` : 'Session inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Rotating Security Token:</span>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300 font-mono text-[11px]">
                    {activeSession?.token || 'GEO-SEC-AUTO'}
                  </code>
                  {currentRole === 'admin' && (
                    <button
                      onClick={regenerateToken}
                      title="Regenerate Token"
                      className="text-slate-400 hover:text-slate-200 p-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-5 border-t border-slate-800/80 mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isSessionActive ? (
                <button
                  onClick={closeSessionManually}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Close Session Early</span>
                </button>
              ) : (
                <button
                  onClick={startSessionManually}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{activeSession?.status === 'closed' ? 'Re-open Session' : 'Start Session Now'}</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('qr_session')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Full QR Screen</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('live_board')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <span>Live Attendance Board</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Live Scan Activity Ticker */}
        <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  Live Attendance Feed
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {recentPresent.length} Recent Scans
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {recentPresent.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No check-ins yet for this session.
                </div>
              ) : (
                recentPresent.map(record => {
                  const student = students.find(s => s.id === record.studentId);
                  return (
                    <div
                      key={record.id}
                      className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-3 hover:bg-slate-950/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={record.studentName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            {record.studentName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {record.rollNumber || record.studentId} • Section {student?.section || 'A'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <StatusBadge status={record.status} />
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          {record.markedAt
                            ? new Date(record.markedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 text-center">
            <button
              onClick={() => onNavigate('live_board')}
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 font-medium"
            >
              <span>View all {students.length} students on Live Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
