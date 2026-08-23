import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  AlertCircle,
  Filter,
  User,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { CorrectionRequest } from '../../types';
import { StatusBadge } from '../common/Badge';
import { CorrectionDecisionModal } from './CorrectionDecisionModal';

export const CorrectionRequestsView: React.FC = () => {
  const { correctionRequests, getStudentMonthlyCorrectionCount } = useAttendance();
  const { currentRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [activeDecision, setActiveDecision] = useState<{
    request: CorrectionRequest;
    mode: 'approve' | 'reject';
  } | null>(null);

  const pendingList = correctionRequests.filter(r => r.status === 'pending');
  const approvedList = correctionRequests.filter(r => r.status === 'approved');
  const rejectedList = correctionRequests.filter(r => r.status === 'rejected');

  const filteredRequests = useMemo(() => {
    return correctionRequests.filter(req => {
      const q = searchQuery.toLowerCase();
      const matches =
        req.studentName.toLowerCase().includes(q) ||
        (req.rollNumber && req.rollNumber.toLowerCase().includes(q)) ||
        req.reason.toLowerCase().includes(q) ||
        req.attendanceDate.includes(q);

      if (!matches) return false;
      if (filterTab !== 'all' && req.status !== filterTab) return false;
      return true;
    });
  }, [correctionRequests, searchQuery, filterTab]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Student Claims & Corrections
            </span>
            <span className="text-xs text-slate-400">Strict Monthly Cap: 2 Requests / Month</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Attendance Correction Queue
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Review student claims for missed attendance. Approved corrections instantly update the student's record to Present.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pending Review</span>
            <span className="text-xl font-bold text-cyan-400 font-heading">{pendingList.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Approved</span>
            <span className="text-xl font-bold text-emerald-400 font-heading">{approvedList.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('pending')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'pending'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending ({pendingList.length})
          </button>

          <button
            onClick={() => setFilterTab('approved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved ({approvedList.length})
          </button>

          <button
            onClick={() => setFilterTab('rejected')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected ({rejectedList.length})
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All History ({correctionRequests.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or date..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Requests Cards List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">
            No correction requests found matching your filter criteria.
          </div>
        ) : (
          filteredRequests.map(req => {
            const usedQuota = getStudentMonthlyCorrectionCount(req.studentId, req.monthKey);

            return (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-700 transition-colors"
              >
                {/* Left details */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-100 font-heading">
                      {req.studentName}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      {req.rollNumber || req.studentId}
                    </span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Class Date: <strong className="font-mono text-emerald-400">{req.attendanceDate}</strong></span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
                      Submitted Explanation:
                    </span>
                    <p className="italic text-slate-300">"{req.reason}"</p>
                  </div>

                  {req.decidedAt && (
                    <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-300">Decision by {req.decidedBy}:</span>{' '}
                      {req.decisionNotes} ({new Date(req.decidedAt).toLocaleDateString()})
                    </div>
                  )}
                </div>

                {/* Right actions and status */}
                <div className="flex flex-col md:items-end justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Monthly Quota: {usedQuota}/2
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse'
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  {req.status === 'pending' && currentRole !== 'cr' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveDecision({ request: req, mode: 'reject' })}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => setActiveDecision({ request: req, mode: 'approve' })}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        Approve & Mark Present
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      {activeDecision && (
        <CorrectionDecisionModal
          isOpen={!!activeDecision}
          onClose={() => setActiveDecision(null)}
          request={activeDecision.request}
          mode={activeDecision.mode}
        />
      )}
    </div>
  );
};
