import React from 'react';
import { X, CalendarDays } from 'lucide-react';
import { StudentCalendarView } from './StudentCalendarView';

interface StudentCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

export const StudentCalendarModal: React.FC<StudentCalendarModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
                Student Attendance Calendar
              </h2>
              <p className="text-xs text-slate-400">
                Monthly presence, absence records, and slot-by-slot schedule breakdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <StudentCalendarView initialStudentId={studentId} />
      </div>
    </div>
  );
};
