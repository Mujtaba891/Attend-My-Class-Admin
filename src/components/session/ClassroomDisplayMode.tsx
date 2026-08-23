import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';

interface ClassroomDisplayModeProps {
  onClose: () => void;
}

export const ClassroomDisplayMode: React.FC<ClassroomDisplayModeProps> = ({ onClose }) => {
  const {
    activeSession,
    currentClass,
    students,
    todayAttendance,
    isSessionActive,
    sessionCountdown,
    currentTime,
    simulateStudentScan,
    startSessionManually,
  } = useAttendance();
  const { adminProfile } = useAuth();

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!activeSession) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="w-16 h-14 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">No Active Session Today</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          Start a daily QR attendance session to project the QR code onto the classroom screen.
        </p>
        <div className="mt-4 sm:mt-6 flex items-center gap-3">
          <button
            onClick={() => startSessionManually()}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Start Session Now
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            Close Display
          </button>
        </div>
      </div>
    );
  }

  const qrPayload = JSON.stringify({
    app: 'AttendMyClass',
    classId: activeSession.classId,
    sessionId: activeSession.id,
    date: activeSession.date,
    token: activeSession.token,
    validUntil: activeSession.endEpoch,
  });

  const presentList = todayAttendance.filter(a => a.status === 'present');
  const notMarkedList = todayAttendance.filter(a => a.status === 'not_marked');
  const absentList = todayAttendance.filter(a => a.status === 'absent');

  // Most recent 8 check-ins
  const recentCheckIns = [...presentList]
    .sort((a, b) => new Date(b.markedAt || 0).getTime() - new Date(a.markedAt || 0).getTime())
    .slice(0, 8);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none overflow-hidden">
      {/* Top Classroom Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0 border-b border-slate-800 pb-4 lg:pb-6">
        <div className="flex items-start sm:items-center gap-3 lg:gap-4 w-full lg:w-auto">
          <div className="hidden sm:flex w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-2xl bg-slate-900 border border-slate-800 p-1.5 items-center justify-center shadow-xl shadow-emerald-950/60 overflow-hidden">
            <img src="/logo-1.png" alt="Attend My Class Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-heading text-white tracking-tight truncate">
                {adminProfile.assignedSubject || 'Classroom'} {adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''} Attendance
              </h1>
              <span className="self-start sm:self-auto px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 leading-tight">
                {adminProfile.assignedClass || 'Semester IV'} • {adminProfile.assignedRoom || 'Lecture Hall 204'}
              </span>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-1 sm:mt-1.5 flex flex-col sm:flex-row sm:gap-1.5">
              <span>{formattedDate}</span>
              <span className="hidden sm:inline">•</span>
              <span>Time Window: <strong className="text-slate-200">{activeSession.startTime} – {activeSession.endTime}</strong></span>
            </p>
          </div>
        </div>

        {/* Live Session Clock & Close */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 lg:gap-4 w-full lg:w-auto justify-between lg:justify-end mt-2 lg:mt-0">
          <div className="flex-1 sm:flex-none px-3 py-2 lg:px-5 lg:py-3 rounded-xl lg:rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center sm:justify-start gap-2 lg:gap-3">
            <Radio className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400 animate-pulse" />
            <div>
              <span className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Time Left</span>
              <span className="text-lg sm:text-xl lg:text-2xl font-black font-mono text-emerald-400">
                {sessionCountdown}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => simulateStudentScan()}
              disabled={!isSessionActive}
              title="Simulate student QR scan"
              className={`p-2 sm:p-3 lg:p-3.5 rounded-xl lg:rounded-2xl border transition-colors ${isSessionActive ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40" : "bg-slate-800/50 text-slate-500 border-slate-700/50 cursor-not-allowed"}`}
            >
              <Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>

            <button
              onClick={onClose}
              className="p-2 sm:p-3 lg:p-3.5 rounded-xl lg:rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Body: Large QR Box + Live Counters + Recent Attendance stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 my-auto items-center py-4 sm:py-6">
        {/* Left Column (5 cols): Large Crisp QR Code */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="p-5 sm:p-8 rounded-3xl bg-white shadow-2xl flex items-center justify-center">
            {isSessionActive ? (
              <QRCodeSVG
                value={qrPayload}
                size={300}
                level="H"
                includeMargin={false}
                className="rounded-xl"
              />
            ) : (
              <div className="w-[300px] h-[300px] flex flex-col items-center justify-center bg-slate-100 rounded-xl p-4 sm:p-6 text-center text-slate-800">
                <Clock className="w-16 h-14 sm:h-16 text-slate-400 mb-3" />
                <span className="text-base sm:text-lg font-bold">Session Closed</span>
                <span className="text-xs text-slate-500 mt-1">QR scanning is disabled outside {activeSession.startTime}–{activeSession.endTime}</span>
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <span className="text-sm font-semibold text-slate-200">
              Open Student App → Scan this Classroom QR
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Protected by Hardware Device Binding & Periodic Rotating Key
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): Big Stat Numbers & Live Check-in Stream */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* Big Stat Counters */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Present
              </span>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-400 font-heading mt-2">
                {presentList.length}
              </div>
              <span className="text-xs text-emerald-500/80 font-medium mt-1 block">
                {Math.round((presentList.length / students.length) * 100)}% of Class
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Not Marked
              </span>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 font-heading mt-2">
                {notMarkedList.length}
              </div>
              <span className="text-xs text-amber-500/80 font-medium mt-1 block">
                In Classroom
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" /> Absent
              </span>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-rose-400 font-heading mt-2">
                {absentList.length}
              </div>
              <span className="text-xs text-rose-500/80 font-medium mt-1 block">
                Unmarked / Locked
              </span>
            </div>
          </div>

          {/* Live Recent Check-Ins Grid */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Live Attendance Check-Ins
                </span>
              </div>
              <span className="text-xs text-slate-500">{presentList.length} Total Checked In</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {recentCheckIns.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-slate-500">
                  Waiting for students to scan the QR code...
                </div>
              ) : (
                recentCheckIns.map(record => {
                  const student = students.find(s => s.id === record.studentId);
                  return (
                    <div
                      key={record.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 animate-fadeIn"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={student?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={record.studentName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                        />
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-100 truncate">
                            {record.studentName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {record.rollNumber || record.studentId}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          PRESENT
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          {record.markedAt ? new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>College Geology Attendance System • Class Representative & Teacher Live Monitor</span>
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">ESC</kbd> to exit full display</span>
      </div>
    </div>
  );
};
