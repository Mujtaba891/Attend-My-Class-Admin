import React, { useState } from 'react';
import { X, CheckSquare, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { CorrectionRequest } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { StatusBadge } from '../common/Badge';

interface CorrectionDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CorrectionRequest | null;
  mode: 'approve' | 'reject';
}

export const CorrectionDecisionModal: React.FC<CorrectionDecisionModalProps> = ({
  isOpen,
  onClose,
  request,
  mode,
}) => {
  const {
    approveCorrectionRequest,
    rejectCorrectionRequest,
    getStudentMonthlyCorrectionCount,
  } = useAttendance();

  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const usedThisMonth = getStudentMonthlyCorrectionCount(request.studentId, request.monthKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (mode === 'approve') {
      approveCorrectionRequest(request.id, decisionNotes || 'Attendance correction verified and approved.');
    } else {
      rejectCorrectionRequest(request.id, decisionNotes || 'Attendance correction unverified.');
    }

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
          <div
            className={`p-2.5 rounded-xl ${
              mode === 'approve'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {mode === 'approve' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
              {mode === 'approve' ? 'Approve Attendance Correction' : 'Reject Attendance Correction'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'approve'
                ? 'Approving will immediately update student status to Present for this date.'
                : 'Rejecting will maintain the Absent record.'}
            </p>
          </div>
        </div>

        {/* Student & Request Summary */}
        <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-100">{request.studentName}</h4>
              <span className="text-xs font-mono text-slate-400">
                {request.rollNumber || request.studentId} • {request.subject || 'Geology'} Class
              </span>
            </div>
            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-500 uppercase block">Monthly Quota</span>
              <span className="font-bold text-teal-300 font-mono">{usedThisMonth} / 2 Used</span>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Target Class Date:</span>
              <strong className="text-slate-200 font-mono">{request.attendanceDate}</strong>
            </div>
            <div className="mt-2 text-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
                Student Submitted Reason:
              </span>
              <p className="italic text-slate-300/90 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800">
                "{request.reason}"
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Teacher / Admin Decision Notes
            </label>
            <textarea
              required={mode === 'reject'}
              rows={2}
              value={decisionNotes}
              onChange={e => setDecisionNotes(e.target.value)}
              placeholder={
                mode === 'approve'
                  ? 'e.g. Verified by Prof. Ross. Student was participating in Geological Rock Sample Lab.'
                  : 'e.g. Student was not marked by CR and no proof of presence was provided.'
              }
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
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
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-colors ${
                mode === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : mode === 'approve'
                ? 'Confirm & Mark Present'
                : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
