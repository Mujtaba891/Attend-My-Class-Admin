import React, { useState } from 'react';
import { X, Send, AlertCircle, BookOpen, Calendar, ShieldAlert } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types';

interface SubmitCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  defaultDate?: string;
}

const ALL_SUBJECTS = ['Geology', 'Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'English', 'Computer Science'];
const ALL_TYPES = ['MDC', 'Major', 'Minor', 'Skills', 'AEC', 'VAC 1', 'VAC 2'];

export const SubmitCorrectionModal: React.FC<SubmitCorrectionModalProps> = ({
  isOpen,
  onClose,
  student,
  defaultDate,
}) => {
  const { createCorrectionRequest, getStudentMonthlyCorrectionCount } = useAttendance();

  const todayStr = new Date().toISOString().split('T')[0];
  const [attendanceDate, setAttendanceDate] = useState(defaultDate || todayStr);
  const [subject, setSubject] = useState(student.major || 'Geology');
  const [subjectType, setSubjectType] = useState('MDC');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const monthKey = attendanceDate.substring(0, 7);
  const usedThisMonth = getStudentMonthlyCorrectionCount(student.id, monthKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (usedThisMonth >= 2) {
      setErrorMsg('Monthly limit reached! You have already submitted 2 correction requests this month.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please enter a detailed explanation for your attendance correction claim.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCorrectionRequest({
        studentId: student.id,
        studentName: student.fullName,
        rollNumber: student.rollNumber || student.studentId,
        email: student.email,
        attendanceDate,
        sessionId: `session_${subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${attendanceDate}`,
        subject,
        subjectType,
        classId: 'core_class',
        currentStatus: 'absent',
        requestedStatus: 'present',
        reason: reason.trim(),
        monthKey,
        monthlyRequestIndex: usedThisMonth + 1,
      });

      setSuccessMsg(`Correction request submitted for ${subject} (${subjectType}) on ${attendanceDate}! Assigned subject teacher will review.`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit correction request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-heading">
                Subject Correction Request
              </h3>
              <p className="text-[11px] text-slate-400">
                Routed directly to specific Subject Teacher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota Indicator */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Monthly Quota ({monthKey}):</span>
          <span className={`font-bold ${usedThisMonth >= 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {usedThisMonth} / 2 Used
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Date Picker */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Attendance Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              required
            />
          </div>

          {/* Subject Dropdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              >
                {ALL_SUBJECTS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subject Type</label>
              <select
                value={subjectType}
                onChange={e => setSubjectType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              >
                {ALL_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Explanation / Reason for Correction
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Attended Geology lab session on this date, QR failed to register due to network delay."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              required
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || usedThisMonth >= 2}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit to {subject} Teacher</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
