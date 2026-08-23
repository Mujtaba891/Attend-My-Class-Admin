import React, { useState } from 'react';
import { X, UserCheck, AlertTriangle } from 'lucide-react';
import { Student, AttendanceStatus, AttendanceRecord } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { StatusBadge } from '../common/Badge';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentRecord?: AttendanceRecord;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  student,
  currentRecord,
}) => {
  const { markAttendance } = useAttendance();

  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(
    currentRecord?.status || 'present'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    markAttendance(
      student.id,
      selectedStatus,
      reason || 'Manual administrative attendance adjustment',
      'manual_admin'
    );

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
              Override Attendance Status
            </h3>
            <p className="text-xs text-slate-400">
              Manual modifications are permanently recorded in the audit logs.
            </p>
          </div>
        </div>

        <div className="my-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={student.fullName}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-slate-700"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-100">{student.fullName}</h4>
              <p className="text-xs text-slate-400 font-mono">
                {student.rollNumber || student.studentId} • Section {student.section}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Current Status</span>
            <StatusBadge status={currentRecord?.status || 'not_marked'} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Select New Attendance Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('present')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  selectedStatus === 'present'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Present
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('absent')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  selectedStatus === 'absent'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                Absent
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('not_marked')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  selectedStatus === 'not_marked'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Not Marked
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('correction_requested')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  selectedStatus === 'correction_requested'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                Correction
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Reason for Modification (Mandatory for Audit Trail)
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Student present in Geology Lab 204, camera hardware glitch verified by Prof. Ross"
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This change will immediately alter the session stats and log your name and timestamp to the departmental audit record.
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Apply Status Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
