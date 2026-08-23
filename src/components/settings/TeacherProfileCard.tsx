import React, { useState } from 'react';
import { UserCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TeacherProfileCard: React.FC = () => {
  const { adminProfile, updateProfile } = useAuth();
  const assignments = adminProfile?.assignments || [];

  const handleMakeActive = (a: any) => {
    updateProfile({
      assignedSubject: a.subject,
      assignedSubjectType: a.subjectType || 'All',
      assignedClass: a.className,
      assignedRoom: a.room
    });
  };

  return (
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Active Details Grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-800/50 rounded-xl overflow-hidden border border-slate-800">
          <div className="p-5 bg-slate-950/40 space-y-5">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Faculty / Full Name</div>
              <div className="text-sm text-slate-200 font-bold flex items-center gap-1.5">
                {adminProfile.name}
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Institutional Email</div>
              <div className="text-sm text-slate-200 font-medium">{adminProfile.email}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Department</div>
              <div className="text-sm text-slate-200 font-medium">{adminProfile.department || 'Department of Geology'}</div>
            </div>
          </div>
          <div className="p-5 bg-slate-950/40 space-y-5">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Assigned Subject & Type</div>
              <div className="text-sm text-slate-200 font-bold flex items-center gap-2">
                {adminProfile.assignedSubject}
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-sm border border-emerald-500/20 uppercase tracking-wider">{adminProfile.assignedSubjectType || 'All'}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Assigned Class / Semester</div>
              <div className="text-sm text-slate-200 font-medium leading-snug">
                {adminProfile.assignedClass}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Lecture Room</div>
              <div className="text-sm text-slate-200 font-medium">
                {adminProfile.assignedRoom || 'Not specified'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Saved Profiles */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-[11px] font-bold text-slate-400">Saved Subject Profiles</h4>
          </div>
          
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {assignments.length === 0 ? (
              <div className="text-center p-4 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No profiles configured.
              </div>
            ) : (
              assignments.map(a => {
                const isActive = adminProfile.assignedSubject === a.subject && adminProfile.assignedClass === a.className && (adminProfile.assignedSubjectType || 'All') === (a.subjectType || 'All');
                return (
                  <div key={a.id} onClick={() => handleMakeActive(a)} className={`p-3 rounded-xl border cursor-pointer transition-colors ${isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>{a.subject}</span>
                      {isActive && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400">Active</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      {a.className}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-role-menu"))} className="w-full py-2.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-xs font-medium text-slate-300 mt-2">
            View All Subjects
          </button>
        </div>
      </div>
    </div>
  );
};
