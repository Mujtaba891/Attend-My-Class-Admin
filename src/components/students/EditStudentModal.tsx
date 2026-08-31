import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Trash2,
  Check,
  User,
  Mail,
  Phone,
  BookOpen,
} from 'lucide-react';
import { Student, AccountStatus } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { StatusBadge } from '../common/Badge';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onDeleteRequest?: (student: Student) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onDeleteRequest,
}) => {
  const { updateStudent, resetDeviceBinding, toggleAccountStatus } = useAttendance();

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [section, setSection] = useState<string>('A');
  const [batch, setBatch] = useState('');
  const [course, setCourse] = useState('');
  const [mdc, setMdc] = useState('Geology');
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('active');
  const [lockReason, setLockReason] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [deviceResetDone, setDeviceResetDone] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName || '');
      setRollNumber(student.rollNumber || student.studentId || '');
      setRegistrationNumber(student.registrationNumber || '');
      setEmail(student.email || '');
      setPhone(student.phone || '');
      const rawSec = (student.section || 'A').toUpperCase().replace(/^SECTION\s*/i, '').trim();
      setSection(rawSec || 'A');
      setBatch(student.batch || '2024-2027');
      setCourse(student.course || 'B.Sc. Geology');
      setMdc(student.mdc || 'Geology');
      setAccountStatus(student.accountStatus || 'active');
      setLockReason(student.lockReason || '');
      setDeviceModel(student.authorizedDeviceModel || '');
      setAvatarUrl(student.avatarUrl || '');
      setDeviceResetDone(false);
      setSavedSuccess(false);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateStudent(student.id, {
      fullName,
      rollNumber,
      registrationNumber,
      email,
      phone,
      section,
      batch,
      course,
      mdc: mdc || 'Geology',
      accountStatus,
      lockReason: accountStatus !== 'active' ? lockReason : undefined,
      authorizedDeviceModel: deviceModel || undefined,
      avatarUrl: avatarUrl || student.avatarUrl,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleResetDevice = () => {
    resetDeviceBinding(student.id);
    setDeviceModel('');
    setDeviceResetDone(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
          <div className="w-12 h-10 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
              Manage Student Details
            </h3>
            <p className="text-xs text-slate-400">
              Update personal info, section assignment, account security, and device binding.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="my-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Student details saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* Personal & Academic Details */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Academic & Contact Profile
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  MDC Subject (Multi-Disciplinary Course)
                </label>
                <input
                  type="text"
                  value={mdc}
                  onChange={e => setMdc(e.target.value)}
                  placeholder="e.g. Geology"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={e => setBatch(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Security & Lock Status */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Account Security & Access Status
              </h4>
              <StatusBadge status={accountStatus} variant="account" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAccountStatus('active')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  accountStatus === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() => setAccountStatus('locked')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  accountStatus === 'locked'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Locked
              </button>

              <button
                type="button"
                onClick={() => setAccountStatus('disabled')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  accountStatus === 'disabled'
                    ? 'bg-slate-700/40 text-slate-200 border-slate-600 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Disabled
              </button>
            </div>

            {accountStatus !== 'active' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-rose-300 mb-1">
                  Reason for Account Lock / Suspension:
                </label>
                <input
                  type="text"
                  value={lockReason}
                  onChange={e => setLockReason(e.target.value)}
                  placeholder="e.g. Device mismatch detected during live scan"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/40 text-xs text-rose-200 placeholder-rose-400/50 focus:outline-none focus:border-rose-400"
                />
              </div>
            )}
          </div>

          {/* Hardware Device Binding Section */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Authorized Hardware Device Binding
                </h4>
              </div>

              {student.authorizedDeviceId && !deviceResetDone && (
                <button
                  type="button"
                  onClick={handleResetDevice}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-semibold border border-amber-500/30 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Unbind Device</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Bound Device Model
                </label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={e => setDeviceModel(e.target.value)}
                  placeholder="e.g. Apple iPhone 15 Pro"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Device Fingerprint ID
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 truncate">
                  {deviceResetDone ? 'Unbound (Ready for new device)' : (student.authorizedDeviceId || 'None registered')}
                </div>
              </div>
            </div>
            {deviceResetDone && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Device binding cleared. Student will pair their new device automatically upon next attendance scan.
              </p>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {onDeleteRequest && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteRequest(student);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Student Record</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Student Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
