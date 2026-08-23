import React, { useState } from 'react';
import { Users, CheckCircle2, ShieldCheck, AlertCircle, XCircle, UserCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

export const CRDelegationCard: React.FC = () => {
  const { adminProfile, currentRole } = useAuth();
  const { crDelegations } = useAttendance();
  const [crEmail, setCrEmail] = useState('cr.geology@college.edu');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crEmail.trim() || !crEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    try {
      await addDoc(collection(db, 'crDelegations'), {
        email: crEmail.trim().toLowerCase(),
        name: 'Class Representative',
        classId: 'core_class',
        className: 'B.Sc. Geology',
        section: 'A',
        permissions: ['view_students', 'mark_attendance'],
        status: 'active',
        delegatedBy: adminProfile?.name || 'System',
        delegatedByType: currentRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsSaved(true);
      setCrEmail('');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to grant CR access. Please try again.');
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl text-amber-500">
          <Users className="w-5 h-5" />
        </div>
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-100 font-heading">
            Class Representative (CR) Access Delegation
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Give a trusted student access to the class dashboard
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <div>
          <label className="block text-[11px] text-slate-300 mb-1.5">
            CR Institutional Email Address
          </label>
          <input
            type="email"
            value={crEmail}
            onChange={e => setCrEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {error && <p className="mt-1.5 text-rose-400 text-[10px]">{error}</p>}
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-500 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>CR Permissions Overview</span>
          </div>
          <ul className="space-y-2 text-[11px]">
            <li className="flex items-start gap-2 text-amber-500/90">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Can view live active session attendance</span>
            </li>
            <li className="flex items-start gap-2 text-amber-500/90">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Can view students, but lock / unlock action is disabled</span>
            </li>
            <li className="flex items-start gap-2 text-amber-500/90">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Can't mark or download attendance or alter data</span>
            </li>
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {isSaved ? (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Granted!
            </span>
          ) : <div />}
          <div className="ml-auto">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-100 text-[11px] font-bold transition-colors flex items-center gap-1.5"
            >
              <UserCircle className="w-4 h-4" />
              Grant CR Access
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
