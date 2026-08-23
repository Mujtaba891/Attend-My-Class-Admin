import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Unlock,
  Lock,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
  Trash2,
  Eye,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { StatusBadge } from '../common/Badge';
import { DeviceMismatchModal } from './DeviceMismatchModal';
import { DeleteStudentConfirmModal } from '../students/DeleteStudentConfirmModal';
import { StudentProfileModal } from '../students/StudentProfileModal';

export const AccountDeviceManagementView: React.FC = () => {
  const {
    students,
    toggleAccountStatus,
    reactivateDeviceAndAccount,
    reactivateAndBindToCurrentPhone,
    resetDeviceBinding,
  } = useAttendance();
  const { currentRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'locked' | 'active'>('all');
  const [selectedStudentForReview, setSelectedStudentForReview] = useState<Student | null>(null);
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Student | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const handleBindCurrentPhone = (student: Student) => {
    reactivateAndBindToCurrentPhone(student.id);
    const attemptedModel = student.lastMismatchDetails?.attemptedDeviceModel || 'Current Phone';
    setFeedbackToast(`Account unlocked & bound to ${attemptedModel} for ${student.fullName}!`);
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  const handleResetBinding = (student: Student) => {
    resetDeviceBinding(student.id);
    setFeedbackToast(`Device binding cleared for ${student.fullName}. Account active for automatic binding on next sign-in.`);
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  const handleQuickReactivate = (student: Student) => {
    reactivateDeviceAndAccount(student.id);
    const attemptedModel = student.lastMismatchDetails?.attemptedDeviceModel || 'Secondary Device';
    setFeedbackToast(`Account reactivated for ${student.fullName}! Unauthorized session on ${attemptedModel} has been terminated and logged out.`);
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  const lockedStudents = students.filter(s => s.accountStatus === 'locked');
  const activeStudents = students.filter(s => s.accountStatus === 'active');

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase();
      const match =
        s.fullName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.authorizedDeviceModel && s.authorizedDeviceModel.toLowerCase().includes(q));

      if (!match) return false;
      if (filterTab === 'locked' && s.accountStatus !== 'locked') return false;
      if (filterTab === 'active' && s.accountStatus !== 'active') return false;
      return true;
    });
  }, [students, searchQuery, filterTab]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{feedbackToast}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Hardware Security & Anti-Proxy
            </span>
            <span className="text-xs text-slate-400">Strict Device Fingerprint Binding</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Student Account & Device Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Automatic security locking prevents students from sharing logins or proxy scanning QR codes from secondary devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Locked Devices</span>
            <span className="text-xl font-bold text-rose-400 font-heading">{lockedStudents.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Authorized Hardware</span>
            <span className="text-xl font-bold text-emerald-400 font-heading">{activeStudents.length}</span>
          </div>
        </div>
      </div>

      {/* Incident Review Section for Locked Students */}
      {lockedStudents.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
              <h3 className="text-base font-bold text-rose-200 font-heading">
                Pending Security Incidents ({lockedStudents.length})
              </h3>
            </div>
            <span className="text-xs text-rose-300/80">Action required by Admin</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedStudents.map(student => (
              <div
                key={student.id}
                className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={student.fullName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-rose-500/50"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{student.fullName}</h4>
                        <span className="text-xs font-mono text-slate-400">
                          {student.rollNumber || student.studentId} • Section {student.section}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      FLAGGED
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Reason:</span>
                      <span className="font-semibold text-rose-300">Device Fingerprint Mismatch</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Attempted Device:</span>
                      <span className="text-slate-200 font-mono">
                        {student.lastMismatchDetails?.attemptedDeviceModel || 'Unknown Device'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedStudentForReview(student)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Incident Details
                    </button>

                    <button
                      onClick={() => handleResetBinding(student)}
                      title="Clear device binding so student can bind any device on next login"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-xs font-medium border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Binding</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleBindCurrentPhone(student)}
                      title="Reactivate student account & bind to the attempted phone"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Reactivate & Bind to Current Phone</span>
                    </button>

                    <button
                      onClick={() => handleQuickReactivate(student)}
                      title="Unlock student account & immediately revoke/logout the unauthorized secondary device"
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Quick Restore</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Student Device Directory */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Students ({students.length})
          </button>

          <button
            onClick={() => setFilterTab('locked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'locked'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Locked ({lockedStudents.length})
          </button>

          <button
            onClick={() => setFilterTab('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Authorized Active ({activeStudents.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or device..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Device Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Authorized Hardware Model</th>
                <th className="py-3.5 px-4">Hardware Fingerprint ID</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No student records found in device directory.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const isLocked = student.accountStatus === 'locked';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isLocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={student.fullName}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-slate-100">{student.fullName}</div>
                            <span className="text-[11px] text-slate-500">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                        {student.rollNumber || student.studentId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{student.authorizedDeviceModel || 'Unregistered'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <code className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300 font-mono text-[11px]">
                          {student.authorizedDeviceId || 'NONE'}
                        </code>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={student.accountStatus} variant="account" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentForProfile(student)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer"
                            title="View Student Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {currentRole === 'admin' && student.authorizedDeviceId && (
                            <button
                              onClick={() => resetDeviceBinding(student.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                              title="Clear Device Binding"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isLocked ? (
                            <button
                              onClick={() => setSelectedStudentForReview(student)}
                              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Review & Unlock
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleAccountStatus(student.id, 'locked', 'Admin security lock')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Lock Account"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {currentRole === 'admin' && (
                            <button
                              onClick={() => setSelectedStudentForDelete(student)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Review Incident Modal */}
      {selectedStudentForReview && (
        <DeviceMismatchModal
          isOpen={!!selectedStudentForReview}
          onClose={() => setSelectedStudentForReview(null)}
          student={selectedStudentForReview}
        />
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={!!selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
          student={selectedStudentForProfile}
        />
      )}

      {/* Delete Student Modal */}
      {selectedStudentForDelete && (
        <DeleteStudentConfirmModal
          isOpen={!!selectedStudentForDelete}
          onClose={() => setSelectedStudentForDelete(null)}
          student={selectedStudentForDelete}
        />
      )}
    </div>
  );
};
