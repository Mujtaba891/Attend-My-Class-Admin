import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  GraduationCap,
  AlertTriangle,
  Pencil,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TeachingAssignment } from '../../types';

interface SubjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubjectManagementModal: React.FC<SubjectManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    adminProfile,
    addSubjectAssignment,
    deleteSubjectAssignment,
    updateSubjectAssignment,
    setActiveSubjectAssignment,
    currentRole,
  } = useAuth();

  const assignments = adminProfile?.assignments || [];

  // Add / Edit form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState<'Major' | 'Minor' | 'MDC' | 'Skills' | 'AEC' | 'VAC 1' | 'VAC 2' | 'All'>('Major');
  const [className, setClassName] = useState('Semester I - Section A');
  const [room, setRoom] = useState('Block C room no 30');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('10:48 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setSubjectName('');
    setSubjectType('Major');
    setClassName('Semester I - Section A');
    setRoom('Block C room no 30');
    setStartTime('10:00 AM');
    setEndTime('10:48 AM');
    setIsAddingNew(false);
    setEditingId(null);
    setDeleteConfirmId(null);
  };

  const handleStartEdit = (a: TeachingAssignment) => {
    setEditingId(a.id);
    setIsAddingNew(false);
    setSubjectName(a.subject);
    setSubjectType((a.subjectType as any) || 'Major');
    setClassName(a.className || 'Semester I - Section A');
    setRoom(a.room || 'Block C room no 30');
    setStartTime(a.startTime || '10:00 AM');
    setEndTime(a.endTime || '10:48 AM');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateSubjectAssignment(editingId, {
          subject: subjectName.trim(),
          subjectType,
          className: className.trim(),
          room: room.trim(),
          startTime,
          endTime,
        });
        setActionNotice(`Updated subject "${subjectName}"`);
      } else {
        await addSubjectAssignment({
          subject: subjectName.trim(),
          subjectType,
          className: className.trim(),
          room: room.trim(),
          startTime,
          endTime,
        });
        setActionNotice(`Added subject "${subjectName}" to your profiles`);
      }
      resetForm();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.warn('Error saving subject:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (assignment: TeachingAssignment) => {
    setIsSubmitting(true);
    try {
      await deleteSubjectAssignment(assignment.id);
      setDeleteConfirmId(null);
      setActionNotice(`Deleted subject "${assignment.subject}"`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.warn('Error deleting subject:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectTypeColors: Record<string, string> = {
    Major: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    Minor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    MDC: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Skills: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    AEC: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'VAC 1': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'VAC 2': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    All: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    'CR Subject': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-heading">
                Manage Teaching Subjects
              </h2>
              <p className="text-xs text-slate-400">
                {currentRole === 'cr' ? 'View and switch delegated class subjects' : 'Add, edit, switch or delete faculty subject profiles'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Bar with Add Subject Button */}
          {!isAddingNew && !editingId && currentRole !== 'cr' && (
            <div className="flex items-center justify-between bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Configured Subjects ({assignments.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Active: <strong className="text-emerald-400">{adminProfile.assignedSubject}</strong> ({adminProfile.assignedSubjectType || 'MDC'})
                </span>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setIsAddingNew(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Subject</span>
              </button>
            </div>
          )}

          {/* Add / Edit Form */}
          {(isAddingNew || editingId) && (
            <form onSubmit={handleSaveForm} className="p-5 rounded-xl bg-slate-950/70 border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Edit Subject Assignment' : 'Add New Teaching Subject'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subject / Paper Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={e => setSubjectName(e.target.value)}
                    placeholder="e.g. Mineralogy, Petrology, Geology"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subject Category / Type *
                  </label>
                  <select
                    value={subjectType}
                    onChange={e => setSubjectType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Major">Major Course (Core)</option>
                    <option value="Minor">Minor Course</option>
                    <option value="MDC">Multi-Disciplinary Course (MDC)</option>
                    <option value="Skills">Skill Enhancement Course (SEC)</option>
                    <option value="AEC">Ability Enhancement (AEC)</option>
                    <option value="VAC 1">Value Added Course 1 (VAC 1)</option>
                    <option value="VAC 2">Value Added Course 2 (VAC 2)</option>
                    <option value="All">All Students / Core</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Class / Semester / Section *
                  </label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    placeholder="e.g. Semester I - Section A"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Classroom / Room No *
                  </label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="e.g. Block C room no 30"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    placeholder="10:48 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Subject' : 'Save & Add Subject'}
                </button>
              </div>
            </form>
          )}

          {/* List of Subjects */}
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No subject profiles found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Add New Subject" above to create your first teaching assignment.
                </p>
              </div>
            ) : (
              assignments.map(a => {
                const isActive =
                  adminProfile.assignedSubject === a.subject &&
                  (adminProfile.assignedSubjectType || 'All') === (a.subjectType || 'All');
                const badgeColor = subjectTypeColors[a.subjectType || 'Major'] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                const isConfirmingDelete = deleteConfirmId === a.id;

                return (
                  <div
                    key={a.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isConfirmingDelete ? (
                      /* Delete Confirmation Prompt */
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 space-y-3 animate-fadeIn">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-rose-300 block">
                              Delete subject "{a.subject}"?
                            </span>
                            <span className="text-[11px] text-slate-400">
                              This will remove this subject profile from your teaching assignments and Firestore.
                              {isActive && assignments.length > 1 && (
                                <span className="text-amber-400 block mt-0.5">
                                  Your active subject will automatically switch to the next available subject.
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleDelete(a)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                          >
                            {isSubmitting ? 'Deleting...' : 'Yes, Delete Subject'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Row */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-100 font-heading">
                              {a.subject}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${badgeColor}`}>
                              {a.subjectType || 'All'}
                            </span>
                            {isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                              {a.className}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              {a.room || 'Block C room no 30'}
                            </span>
                            {a.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {a.startTime} - {a.endTime || '10:48 AM'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubjectAssignment(a);
                                setActionNotice(`Switched active subject to "${a.subject}"`);
                                setTimeout(() => setActionNotice(null), 3000);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Make Active
                            </button>
                          )}

                          {currentRole !== 'cr' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(a)}
                                title="Edit Subject Details"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(a.id)}
                                title="Delete Subject Profile"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 text-xs text-slate-400">
          <span>
            {assignments.length} subject{assignments.length === 1 ? '' : 's'} assigned
          </span>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
