import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, Users } from 'lucide-react';
import { Student } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';

interface DeleteStudentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null; // For single student delete
  studentsList?: Student[]; // For batch delete
  onSuccess?: () => void;
}

export const DeleteStudentConfirmModal: React.FC<DeleteStudentConfirmModalProps> = ({
  isOpen,
  onClose,
  student,
  studentsList,
  onSuccess,
}) => {
  const { deleteStudent, deleteStudents, getStudentStats } = useAttendance();

  if (!isOpen) return null;

  const isBatch = !!studentsList && studentsList.length > 0;
  const targetStudents = isBatch ? studentsList : (student ? [student] : []);

  if (targetStudents.length === 0) return null;

  const handleDelete = () => {
    if (isBatch) {
      deleteStudents(targetStudents.map(s => s.id));
    } else if (student) {
      deleteStudent(student.id);
    }
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
          <div className="w-12 h-10 sm:h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
              {isBatch ? `Delete ${targetStudents.length} Students?` : 'Delete Student Record?'}
            </h3>
            <p className="text-xs text-rose-400 font-medium">
              This administrative action cannot be undone.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4">
          {!isBatch && student && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5">
              <img
                src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={student.fullName}
                referrerPolicy="no-referrer"
                className="w-12 h-10 sm:h-12 rounded-xl object-cover border border-slate-700 shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-100 truncate">{student.fullName}</div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">{student.rollNumber || student.studentId}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Section {student.section} • {student.course}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Attendance</span>
                <span className="text-sm font-bold font-heading text-slate-200">
                  {getStudentStats(student.id).percentage}%
                </span>
              </div>
            </div>
          )}

          {isBatch && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Selected students for removal ({targetStudents.length}):</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                {targetStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-900">
                    <span className="text-slate-200 font-medium truncate">{s.fullName}</span>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">{s.rollNumber || s.studentId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning notice */}
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Permanent Data Deletion Impact:</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-rose-300/80 space-y-0.5 ml-1">
              <li>Student profile and contact information will be permanently removed.</li>
              <li>All historical daily attendance logs will be purged.</li>
              <li>Pending and historical correction requests will be deleted.</li>
              <li>Hardware device binding and anti-proxy fingerprints will be cleared.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isBatch ? `Confirm Delete (${targetStudents.length})` : 'Confirm Delete Student'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
