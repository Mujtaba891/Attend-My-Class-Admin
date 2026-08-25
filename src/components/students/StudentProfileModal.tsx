import React, { useState } from 'react';
import {
  X,
  User,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck2,
  CalendarDays,
  Mail,
  Phone,
  BookOpen,
  Award,
  AlertTriangle,
  Lock,
  Unlock,
  Edit2,
  Check,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Student } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';
import { DeleteStudentConfirmModal } from './DeleteStudentConfirmModal';
import { EditStudentModal } from './EditStudentModal';
import { StudentCalendarModal } from '../calendar/StudentCalendarModal';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const {
    getStudentStats,
    toggleAccountStatus,
    reactivateDeviceAndAccount,
    resetDeviceBinding,
    updateStudent,
    allAttendance,
    correctionRequests,
    crDelegations,
  } = useAttendance();

  const { currentRole } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [deviceResetDone, setDeviceResetDone] = useState(false);

  if (!isOpen || !student) return null;

  const stats = getStudentStats(student.id);
  const isCR = crDelegations?.some(cr => cr.email === student.email && cr.status === 'active');
  const studentCorrections = correctionRequests.filter(c => c.studentId === student.id);
  const studentHistory = allAttendance.filter(a => a.studentId === student.id);

  const isLocked = student.accountStatus === 'locked';

  const handleResetDevice = () => {
    resetDeviceBinding(student.id);
    setDeviceResetDone(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Student Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-4">
              <img
                src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={student.fullName}
                referrerPolicy="no-referrer"
                className="w-16 h-14 sm:h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
              />
              <div>
                <h3 className="text-xl font-bold text-slate-100 font-heading">
                  {student.fullName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {student.rollNumber || student.studentId}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">{student.course}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">Section {student.section}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={student.accountStatus} variant="account" />
              {isCR && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                  Class Rep (CR)
                </span>
              )}
              {currentRole === 'admin' && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  title="Edit Student Info"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Security Alert if Account is Locked */}
          {isLocked && (
            <div className="my-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-rose-200 uppercase tracking-wide">
                    Account Locked: Device Fingerprint Mismatch
                  </h4>
                  <p className="text-xs text-rose-300/80 mt-0.5">
                    {student.lockReason || 'Student logged in from an unauthorized device or IP.'}
                  </p>
                </div>
              </div>

              {currentRole === 'admin' && (
                <button
                  onClick={() => reactivateDeviceAndAccount(student.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
                >
                  Verify & Reactivate
                </button>
              )}
            </div>
          )}

          {/* Attendance KPI Card Row */}
          <div className="grid grid-cols-4 gap-3 my-5">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Turnout Rate</span>
              <div
                className={`text-xl sm:text-2xl font-black font-heading mt-1 ${
                  stats.isDefaulter ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {stats.percentage}%
              </div>
              {stats.isDefaulter && (
                <span className="text-[9px] text-rose-400 font-bold uppercase block mt-0.5">
                  Defaulter (&lt;75%)
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Classes</span>
              <div className="text-xl sm:text-2xl font-black text-slate-100 font-heading mt-1">
                {stats.totalClasses}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Present</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-heading mt-1">
                {stats.present}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Absent</span>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-heading mt-1">
                {stats.absent}
              </div>
            </div>
          </div>

          {/* Quick Action: Open Full Attendance Calendar */}
          <div className="my-4">
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Open Student Attendance Calendar & Timetable</span>
            </button>
          </div>

          {/* Personal & Academic Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Academic & Contact Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Email Address</span>
                  <span className="text-slate-200 font-medium">{student.email}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Phone Number</span>
                  <span className="text-slate-200 font-medium">{student.phone || '+91 98765 43210'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Registration No</span>
                  <span className="text-slate-200 font-mono">{student.registrationNumber || 'REG-2024-GEO-001'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3">
                <Award className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Academic Batch</span>
                  <span className="text-slate-200 font-medium">{student.batch}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bound Hardware Device Information */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Hardware Device Security Binding
              </h4>

              {currentRole === 'admin' && student.authorizedDeviceId && !deviceResetDone && (
                <button
                  onClick={handleResetDevice}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Device Binding</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Authorized Device Model:</span>
                <span className="font-semibold text-slate-200">
                  {deviceResetDone ? 'Unbound / Pending pair' : (student.authorizedDeviceModel || 'No device registered')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hardware Fingerprint ID:</span>
                <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-teal-300 font-mono text-[11px]">
                  {deviceResetDone ? 'CLEARED' : (student.authorizedDeviceId || 'NONE')}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Anti-Proxy Integrity:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Single Device Strict Binding Active
                </span>
              </div>
            </div>
            {deviceResetDone && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Device cleared. Student can pair new phone on their next scan.
              </p>
            )}
          </div>

          {/* Recent Attendance Records & Corrections */}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Attendance Log Entries ({studentHistory.length})
            </h4>

            {studentHistory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No attendance sessions recorded for this student yet.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {studentHistory.map(rec => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300 font-semibold">{rec.date}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 capitalize">{rec.method?.replace('_', ' ') || 'Scan'}</span>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Administrative Actions Bottom Bar */}
          {currentRole === 'admin' && (
            <div className="pt-5 mt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {student.accountStatus === 'active' ? (
                  <button
                    onClick={() => toggleAccountStatus(student.id, 'locked', 'Locked by admin via profile')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Account</span>
                  </button>
                ) : (
                  <button
                    onClick={() => toggleAccountStatus(student.id, 'active')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Account</span>
                  </button>
                )}

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Student</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Student Modal */}
      {isEditModalOpen && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={student}
          onDeleteRequest={() => {
            setIsEditModalOpen(false);
            setIsDeleteModalOpen(true);
          }}
        />
      )}

      {/* Delete Student Modal */}
      {isDeleteModalOpen && (
        <DeleteStudentConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          student={student}
          onSuccess={() => {
            setIsDeleteModalOpen(false);
            onClose();
          }}
        />
      )}

      {/* Student Attendance Calendar Modal */}
      {isCalendarOpen && (
        <StudentCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          studentId={student.id}
        />
      )}
    </>
  );
};
