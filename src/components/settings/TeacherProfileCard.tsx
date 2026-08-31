import React, { useState } from 'react';
import { UserCircle, CheckCircle2, Trash2, Plus, Settings2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SubjectManagementModal } from './SubjectManagementModal';
import { TeachingAssignment } from '../../types';

export const TeacherProfileCard: React.FC = () => {
  const { adminProfile, updateProfile, deleteSubjectAssignment, currentRole } = useAuth();
  const assignments = adminProfile?.assignments || [];
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleMakeActive = (a: TeachingAssignment) => {
    updateProfile({
      assignedSubject: a.subject,
      assignedSubjectType: a.subjectType || 'All',
      assignedClass: a.className,
      assignedRoom: a.room
    });
  };

  const handleDeleteSubject = async (e: React.MouseEvent, a: TeachingAssignment) => {
    e.stopPropagation();
    try {
      await deleteSubjectAssignment(a.id);
      setDeletingId(null);
    } catch (err) {
      console.warn('Failed to delete subject:', err);
    }
  };

  return (
    <>
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-heading">
                Current Active Profile
              </h3>
              <p className="text-xs text-slate-400">
                Your faculty and subject assignment details
              </p>
            </div>
          </div>

          {currentRole !== 'cr' && (
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manage All Subjects</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Side: Active Details Grid */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-800/50 rounded-xl overflow-hidden border border-slate-800">
            <div className="p-5 bg-slate-950/40 space-y-5">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                  {adminProfile.role === 'cr' ? 'Student / CR Name' : 'Faculty / Full Name'}
                </div>
                <div className="text-sm text-slate-200 font-bold flex items-center gap-1.5">
                  {adminProfile.name}
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Institutional Email</div>
                <div className="text-sm text-slate-200 font-medium">{adminProfile.email}</div>
              </div>
              {adminProfile.role === 'cr' && adminProfile.rollNumber && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-500 mb-1">Student Roll Number</div>
                  <div className="text-sm text-amber-300 font-mono font-bold">{adminProfile.rollNumber}</div>
                </div>
              )}
              {adminProfile.role !== 'cr' && (
                <>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Designation / Role</div>
                    <div className="text-sm text-slate-200 font-medium">{adminProfile.designation || 'Assistant Professor / Faculty'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Employee / Faculty ID</div>
                    <div className="text-sm text-slate-200 font-medium">{adminProfile.employeeId || 'GEO-FAC-01'}</div>
                  </div>
                </>
              )}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Academic Program / Dept</div>
                <div className="text-sm text-slate-200 font-medium">{adminProfile.department || 'Department of Geology'}</div>
              </div>
            </div>
            <div className="p-5 bg-slate-950/40 space-y-5">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">
                  {adminProfile.role === 'cr' ? 'Delegated Subject' : 'Assigned Subject & Type'}
                </div>
                <div className="text-sm text-slate-200 font-bold flex items-center gap-2">
                  {adminProfile.assignedSubject}
                  {adminProfile.role === 'cr' ? (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-sm border border-blue-500/30 uppercase tracking-wider font-bold">CR Subject</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-sm border border-emerald-500/20 uppercase tracking-wider">{adminProfile.assignedSubjectType || 'All'}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Class / Semester / Section</div>
                <div className="text-sm text-slate-200 font-medium leading-snug">
                  {adminProfile.assignedClass}
                </div>
              </div>
              {adminProfile.role !== 'cr' ? (
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Office / Classroom Location</div>
                  <div className="text-sm text-slate-200 font-medium">
                    {adminProfile.officeLocation || adminProfile.assignedRoom || 'Block C, Room 30'}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Classroom Location</div>
                  <div className="text-sm text-slate-200 font-medium">
                    {adminProfile.assignedRoom || 'Block C room no 30'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Saved Profiles */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-[11px] font-bold text-slate-400">Teaching Subjects ({assignments.length})</h4>
              {currentRole !== 'cr' && (
                <button
                  onClick={() => setIsManageModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Subject</span>
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {assignments.length === 0 ? (
                <div className="text-center p-4 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No subject profiles configured.
                </div>
              ) : (
                assignments.map(a => {
                  const isActive = adminProfile.assignedSubject === a.subject;
                  const isDeleting = deletingId === a.id;

                  if (isDeleting) {
                    return (
                      <div key={a.id} className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-300 font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Delete "{a.subject}"?</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => handleDeleteSubject(e, a)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                          >
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={a.id}
                      onClick={() => handleMakeActive(a)}
                      className={`group p-3 rounded-xl border cursor-pointer transition-colors relative ${isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold truncate pr-2 ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>{a.subject}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400">Active</span>}
                          {currentRole !== 'cr' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(a.id);
                              }}
                              title="Delete Subject"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-300 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        {a.className} {a.subjectType && a.subjectType !== 'All' ? `• ${a.subjectType}` : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="w-full py-2.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-xs font-medium text-slate-300 mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Manage & Add Subjects</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for full subject management & deletions */}
      <SubjectManagementModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </>
  );
};

