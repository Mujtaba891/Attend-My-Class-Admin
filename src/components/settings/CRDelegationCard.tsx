import React, { useState } from 'react';
import { Users, CheckCircle2, AlertCircle, UserCircle, Trash2, ShieldCheck, Mail } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const CRDelegationCard: React.FC = () => {
  const { adminProfile, currentRole } = useAuth();
  const { crDelegations } = useAttendance();
  const [crEmail, setCrEmail] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState('');

  const activeSubjectName = (adminProfile?.assignedSubject || 'Geology').trim();
  const activeSubjectType = (adminProfile?.assignedSubjectType || 'MDC').trim();

  const normalizeSubject = (str?: string) =>
    (str || '').toLowerCase().replace(/\(mdc\)|\(minor\)|\(major\)|\(sec\)|\(vac\)/gi, '').trim();

  // Filter CRs specifically assigned to the currently active subject & course type
  const activeSubjectCRs = crDelegations.filter(cr => {
    const crSub = normalizeSubject(cr.subject);
    const currentSub = normalizeSubject(activeSubjectName);

    let effectiveCRType = (cr.subjectType || '').trim().toLowerCase();
    if (!effectiveCRType) {
      const fullSub = (cr.subject || '').toLowerCase();
      if (fullSub.includes('minor')) effectiveCRType = 'minor';
      else if (fullSub.includes('major')) effectiveCRType = 'major';
      else effectiveCRType = 'mdc';
    }

    const currentType = activeSubjectType.toLowerCase();

    const matchSub = !crSub || !currentSub || crSub === currentSub;
    const matchType = !effectiveCRType || !currentType || effectiveCRType === currentType;

    return matchSub && matchType;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = crEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid institutional email address.');
      return;
    }

    // Check if already delegated for this specific subject & course type
    if (activeSubjectCRs.some(cr => cr.email.toLowerCase() === cleanEmail)) {
      setError(`This email address is already assigned as CR for ${activeSubjectName} (${activeSubjectType}).`);
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      // 1. Create delegation record in crDelegations collection tagged with subject and subjectType
      await addDoc(collection(db, 'crDelegations'), {
        email: cleanEmail,
        name: 'Class Representative',
        classId: adminProfile?.assignedClass || 'core_class',
        className: adminProfile?.assignedClass || 'B.Sc. Program',
        subject: activeSubjectName,
        subjectType: activeSubjectType,
        permissions: ['view_students', 'view_sessions', 'view_board'],
        status: 'active',
        delegatedBy: adminProfile?.name || 'System Faculty',
        delegatedByType: currentRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Tag student in 'students' collection without creating a new duplicate admin document
      try {
        const studentQ = query(collection(db, 'students'), where('email', '==', cleanEmail));
        const studentSnap = await getDocs(studentQ);
        if (!studentSnap.empty) {
          studentSnap.docs.forEach(async (d) => {
            await setDoc(doc(db, 'students', d.id), {
              admin: true,
              isCR: true,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          });
        }
      } catch (studentErr) {
        console.warn('Notice tagging student with CR status:', studentErr);
      }

      setIsSaved(true);
      setCrEmail('');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to grant CR access. Please check network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeRevokeCR = async () => {
    if (!revokeTarget) return;
    const { id, email } = revokeTarget;
    setIsRevoking(true);
    setError('');
    try {
      // 1. Remove delegation record from crDelegations
      await deleteDoc(doc(db, 'crDelegations', id));

      // 2. Remove CR tag from student in 'students' collection if no other delegations remain
      try {
        const cleanEmail = email.trim().toLowerCase();
        const otherDelegations = crDelegations.filter(cr => cr.id !== id && cr.email.toLowerCase() === cleanEmail);
        if (otherDelegations.length === 0) {
          const studentQ = query(collection(db, 'students'), where('email', '==', cleanEmail));
          const studentSnap = await getDocs(studentQ);
          if (!studentSnap.empty) {
            studentSnap.docs.forEach(async (d) => {
              await setDoc(doc(db, 'students', d.id), {
                admin: false,
                isCR: false,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            });
          }
        }
      } catch (studentErr) {
        console.warn('Notice updating CR tag on student record:', studentErr);
      }

      setRevokeMessage(`Revoked CR access for ${email}`);
      setTimeout(() => setRevokeMessage(''), 4000);
    } catch (err) {
      console.error('Failed to revoke CR:', err);
      setError('Failed to revoke CR access. Please try again.');
    } finally {
      setIsRevoking(false);
      setRevokeTarget(null);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-heading">
              Class Representative (CR) Access Delegation
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Assign trusted student CRs for <span className="text-amber-400 font-semibold">{activeSubjectName} ({activeSubjectType})</span>
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          {activeSubjectCRs.length} Active CR{activeSubjectCRs.length !== 1 ? 's' : ''} ({activeSubjectType})
        </span>
      </div>

      {/* List of currently delegated CRs for active subject */}
      {activeSubjectCRs.length > 0 ? (
        <div className="space-y-2 pt-1">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Assigned CRs for {activeSubjectName} ({activeSubjectType}) ({activeSubjectCRs.length})
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeSubjectCRs.map(cr => (
              <div
                key={cr.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{cr.email}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="text-emerald-400">● Active CR ({cr.subjectType || activeSubjectType})</span>
                      {cr.delegatedBy && <span>• Assigned by {cr.delegatedBy}</span>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRevokeTarget({ id: cr.id, email: cr.email })}
                  title="Revoke CR Access"
                  className="p-2 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 active:scale-95 transition-all shrink-0 cursor-pointer border border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 italic">
          No Class Representative assigned yet for <span className="text-slate-200 font-medium">{activeSubjectName} ({activeSubjectType})</span>.
        </div>
      )}

      {revokeMessage && (
        <p className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4" /> {revokeMessage}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
            Add New CR Institutional Email Address for {activeSubjectName} ({activeSubjectType})
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={crEmail}
              onChange={e => setCrEmail(e.target.value)}
              placeholder="e.g. cr.student@college.edu"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-100 text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <UserCircle className="w-4 h-4" />
              <span>Grant Access</span>
            </button>
          </div>
          {error && <p className="mt-1.5 text-rose-400 text-[10px]">{error}</p>}
          {isSaved && (
            <p className="mt-1.5 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> CR access granted & synced!
            </p>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
            <ShieldCheck className="w-4 h-4" />
            <span>CR Permissions Overview</span>
          </div>
          <ul className="space-y-1.5 text-[11px]">
            <li className="flex items-start gap-2 text-amber-300/90">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>Can view live active session attendance</span>
            </li>
            <li className="flex items-start gap-2 text-amber-300/90">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>Can view students, but lock / unlock action is disabled</span>
            </li>
            <li className="flex items-start gap-2 text-amber-300/90">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>Can't mark or download attendance or alter data</span>
            </li>
          </ul>
        </div>
      </form>

      <ConfirmationModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={executeRevokeCR}
        title="Revoke CR Access"
        message={`Are you sure you want to revoke Class Representative (CR) access for ${revokeTarget?.email || ''} from ${activeSubjectName} (${activeSubjectType})?`}
        confirmText="Revoke Access"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRevoking}
      />
    </div>
  );
};

