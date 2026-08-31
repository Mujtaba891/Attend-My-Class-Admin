import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Clock,
  RefreshCw,
  Play,
  Square,
  Plus,
  Monitor,
  Sparkles,
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Maximize2,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';
import { TimePickerModal } from '../common/TimePickerModal';

interface QRSessionViewProps {
  onOpenClassroomDisplay: () => void;
}

export const QRSessionView: React.FC<QRSessionViewProps> = ({ onOpenClassroomDisplay }) => {
  const {
    activeSession,
    students,
    todayAttendance,
    isSessionActive,
    sessionCountdown,
    sessionValidationError,
    clearSessionValidationError,
    startSessionManually,
    closeSessionManually,
    extendSession,
    updateSessionTime,
    regenerateToken,
    simulateStudentScan,
    currentTime,
  } = useAttendance();

  const { currentRole, adminProfile } = useAuth();
  const [selectedStudentForScan, setSelectedStudentForScan] = useState<string>('');

  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState(activeSession?.startTime || '10:00 AM');
  const [editEndTime, setEditEndTime] = useState(activeSession?.endTime || '10:40 AM');
  const [sessionPickerTarget, setSessionPickerTarget] = useState<'start' | 'end' | null>(null);

  // Sync state if active session changes outside
  React.useEffect(() => {
    if (activeSession && !isEditingTime) {
      setEditStartTime(activeSession.startTime);
      setEditEndTime(activeSession.endTime);
    }
  }, [activeSession, isEditingTime]);

  const handleSessionTimeConfirm = (selectedTime: string) => {
    if (sessionPickerTarget === 'start') {
      setEditStartTime(selectedTime);
      if (updateSessionTime) {
        updateSessionTime(selectedTime, editEndTime);
      }
    } else if (sessionPickerTarget === 'end') {
      setEditEndTime(selectedTime);
      if (updateSessionTime) {
        updateSessionTime(editStartTime, selectedTime);
      }
    }
  };

  const handleSaveTime = () => {
    if (updateSessionTime) {
      updateSessionTime(editStartTime, editEndTime);
    }
    setIsEditingTime(false);
  };

  const handleTestSession = () => {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    
    const formatTime = (d: Date) => {
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; 
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minStr} ${ampm}`;
    };

    startSessionManually();
    if (updateSessionTime) {
      updateSessionTime(formatTime(now), formatTime(later));
    }
  };

  if (!activeSession) {
    return (
      <div className="p-6 sm:p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-8 shadow-xl space-y-4">
        <div className="w-16 h-14 sm:h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
          <QrCode className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 font-heading">Start Today's QR Session</h3>
        <p className="text-sm text-slate-400">
          Generate an active dynamic QR code session for {adminProfile.assignedSubject || 'Core Subject'} {adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''} ({adminProfile.assignedClass || 'Semester IV'}) so students can scan and mark attendance.
        </p>

        {sessionValidationError && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Session Time Restricted</span>
              </div>
              <button
                onClick={clearSessionValidationError}
                className="text-amber-400/80 hover:text-amber-200 text-[11px] underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed pl-5">
              {sessionValidationError}
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={startSessionManually}
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-4 sm:px-6 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Launch QR Attendance Session</span>
          </button>
        </div>
      </div>
    );
  }

  // QR Payload
  const qrPayload = JSON.stringify({
    app: 'AttendMyClass',
    classId: activeSession.classId || 'core_class',
    sessionId: activeSession.id,
    date: activeSession.date,
    token: activeSession.token,
    validUntil: activeSession.endEpoch,
    subject: activeSession.subject,
    subjectType: activeSession.subjectType,
  });

  const presentList = todayAttendance.filter(a => a.status === 'present');
  const notMarkedList = todayAttendance.filter(a => a.status === 'not_marked');
  const absentList = todayAttendance.filter(a => a.status === 'absent');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Daily QR System
            </span>
            <span className="text-xs text-slate-400">
              {adminProfile.assignedClass || 'Semester IV'} • {adminProfile.assignedRoom || 'Lecture Hall 204'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            {adminProfile.assignedSubject || 'Classroom'} {adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''} QR Attendance Session
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Official Attendance Window: <strong className="text-slate-200">{activeSession.startTime} – {activeSession.endTime}</strong>. Students scan from their registered devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenClassroomDisplay}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 transition-all"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Classroom Projector Mode</span>
          </button>
        </div>
      </div>

      {/* Main Grid: QR Display Box + Controls & Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left (5 cols): Dynamic QR Container */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          {/* Status Indicator */}
          <div className="w-full flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Session Status:</span>
              {isSessionActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE & ACTIVE
                </span>
              ) : activeSession.status === 'scheduled' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  SCHEDULED ({activeSession.startTime})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                  CLOSED
                </span>
              )}
            </div>

            <div className="text-xs font-mono font-bold text-slate-300">
              {activeSession.date}
            </div>
          </div>

          {/* QR Code Container Box */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white shadow-2xl relative group">
            {isSessionActive ? (
              <QRCodeSVG
                value={qrPayload}
                size={240}
                level="H"
                includeMargin={false}
                className="rounded-lg"
              />
            ) : activeSession.status === 'scheduled' ? (
              <div className="w-[240px] h-[240px] flex flex-col items-center justify-center bg-slate-100 rounded-lg p-4 text-center">
                <Clock className="w-12 h-10 sm:h-12 text-amber-600 mb-2 animate-bounce" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Session Scheduled</span>
                <span className="text-[11px] text-slate-600 mt-1">Starts at {activeSession.startTime}</span>
                <button
                  onClick={startSessionManually}
                  className="mt-3 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded shadow"
                >
                  Start Early
                </button>
              </div>
            ) : (
              <div className="w-[240px] h-[240px] flex flex-col items-center justify-center bg-slate-100 rounded-lg p-4 text-center">
                <XCircle className="w-12 h-10 sm:h-12 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Session Closed</span>
                <span className="text-[11px] text-slate-500 mt-1">Attendance period has ended</span>
                <button
                  onClick={startSessionManually}
                  className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded"
                >
                  Reopen Session
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Token display & Rotation */}
          <div className="mt-4 sm:mt-6 w-full p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Active Security Token</span>
              <code className="text-xs font-mono font-bold text-teal-300">{activeSession.token}</code>
            </div>
            {currentRole === 'admin' && (
              <button
                onClick={regenerateToken}
                title="Regenerate token to invalidate screenshots"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rotate</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-3">
            QR automatically rotates periodically to guarantee anti-proxy attendance.
          </p>
        </div>

        {/* Right (7 cols): Session Controls, Timer & Live Breakdown */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* Timer & Controls Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 font-heading">
                Session Controller & Time Limits
              </h3>
              <div className="flex items-center gap-2">
                {!isEditingTime ? (
                  <>
                    <button
                      onClick={() => setIsEditingTime(true)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                    >
                      Edit Time
                    </button>
                    <button
                      onClick={handleTestSession}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold border border-amber-500/30 transition-colors"
                    >
                      Make Active Now (Test)
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSaveTime}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                  >
                    Save Time
                  </button>
                )}
              </div>
            </div>

            {isEditingTime && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div 
                  onClick={() => setSessionPickerTarget('start')}
                  className="bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-emerald-500/60 cursor-pointer transition-all group flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between text-[11px] uppercase text-slate-500 font-bold mb-1">
                    <span>Start Time</span>
                    <span className="text-emerald-400 text-[10px]">1-Click</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-200 font-mono">
                    <span>{editStartTime}</span>
                    <Clock className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                </div>

                <div 
                  onClick={() => setSessionPickerTarget('end')}
                  className="bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-emerald-500/60 cursor-pointer transition-all group flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between text-[11px] uppercase text-slate-500 font-bold mb-1">
                    <span>End Time</span>
                    <span className="text-emerald-400 text-[10px]">1-Click</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-200 font-mono">
                    <span>{editEndTime}</span>
                    <Clock className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Countdown Clock Display */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-medium">Session Clock</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">
                  {isSessionActive ? sessionCountdown : '--:--'}
                </div>
                <span className="text-[11px] text-slate-500">
                  {isSessionActive ? `Auto-closes at ${activeSession.endTime}` : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isSessionActive ? (
                  <>
                    <button
                      onClick={() => extendSession(5)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      +5 Min
                    </button>
                    <button
                      onClick={() => extendSession(10)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      +10 Min
                    </button>
                    <button
                      onClick={closeSessionManually}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>End & Auto-Absent</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startSessionManually}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Activate Session</span>
                  </button>
                )}
              </div>
            </div>

            {/* Test QR Scanner Simulator Tool */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Live Attendance Simulator (For Demo & Testing)
                </span>
                <span className="text-[10px] text-slate-500">Student App Simulation</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Simulate a student scanning the QR code with their authorized mobile device.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={selectedStudentForScan}
                  onChange={e => setSelectedStudentForScan(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose student or Auto-Pick Unmarked --</option>
                  {students
                    .filter(s => s.accountStatus === 'active')
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.rollNumber || s.id})
                      </option>
                    ))}
                </select>

                <button
                  onClick={() => simulateStudentScan(selectedStudentForScan || undefined)}
                  disabled={!isSessionActive}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shrink-0"
                >
                  Simulate QR Scan
                </button>
              </div>
            </div>
          </div>

          {/* Quick Real-Time Roster Tabs */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-heading">
                Session Roster Breakdown ({students.length} Total)
              </h3>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-emerald-400">{presentList.length} Present</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">{notMarkedList.length} Unmarked</span>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400">{absentList.length} Absent</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {todayAttendance.map(record => {
                const student = students.find(s => s.id === record.studentId);
                return (
                  <div
                    key={record.id}
                    className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-semibold text-slate-200 truncate">{record.studentName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {record.rollNumber || record.studentId}
                      </span>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Time Picker Modal */}
      <TimePickerModal
        isOpen={sessionPickerTarget !== null}
        onClose={() => setSessionPickerTarget(null)}
        initialTime={sessionPickerTarget === 'start' ? editStartTime : editEndTime}
        onConfirm={handleSessionTimeConfirm}
        title={sessionPickerTarget === 'start' ? 'Select Start Time' : 'Select End Time'}
      />
    </div>
  );
};
