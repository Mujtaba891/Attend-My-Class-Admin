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
  BookOpen,
  Tag,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { CorrectionRequest } from '../../types';
import { CorrectionDecisionModal } from './CorrectionDecisionModal';

export const CorrectionRequestsView: React.FC = () => {
  const { correctionRequests, getStudentMonthlyCorrectionCount } = useAttendance();
  const { adminProfile, currentRole } = useAuth();

  const isTeacherRestricted = useMemo(() => {
    if (!adminProfile?.assignedSubject) return false;
    const sub = adminProfile.assignedSubject.toLowerCase().trim();
    return sub !== '' && sub !== 'all' && sub !== 'all subjects';
  }, [adminProfile]);

  const defaultSubjectFilter = useMemo(() => {
    if (isTeacherRestricted && adminProfile?.assignedSubject) {
      return adminProfile.assignedSubject;
    }
    return 'all';
  }, [isTeacherRestricted, adminProfile]);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(defaultSubjectFilter);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [activeDecision, setActiveDecision] = useState<{
    request: CorrectionRequest;
    mode: 'approve' | 'reject';
  } | null>(null);

  // Extract all distinct subjects present in requests
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    correctionRequests.forEach(r => {
      if (r.subject) set.add(r.subject);
    });
    ['Geology', 'Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'English', 'Computer Science'].forEach(s => set.add(s));
    return Array.from(set);
  }, [correctionRequests]);

  const availableTypes = useMemo(() => {
    return ['Major', 'Minor', 'MDC', 'Skills', 'AEC', 'VAC 1', 'VAC 2'];
  }, []);

  const filteredRequests = useMemo(() => {
    return correctionRequests.filter(req => {
      // 1. Subject filter
      if (selectedSubjectFilter !== 'all') {
        const reqSub = (req.subject || 'Geology').toLowerCase().trim();
        const targetSub = selectedSubjectFilter.toLowerCase().trim();
        if (!reqSub.includes(targetSub) && !targetSub.includes(reqSub)) {
          return false;
        }
      }

      // 2. Type filter
      if (selectedTypeFilter !== 'all') {
        const reqType = (req.subjectType || 'MDC').toLowerCase().trim();
        const targetType = selectedTypeFilter.toLowerCase().trim();
        if (!reqType.includes(targetType) && !targetType.includes(reqType)) {
          return false;
        }
      }

      // 3. Status tab filter
      if (filterTab !== 'all' && req.status !== filterTab) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          req.studentName.toLowerCase().includes(q) ||
          (req.rollNumber && req.rollNumber.toLowerCase().includes(q)) ||
          req.reason.toLowerCase().includes(q) ||
          req.attendanceDate.includes(q) ||
          (req.subject && req.subject.toLowerCase().includes(q)) ||
          (req.subjectType && req.subjectType.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [correctionRequests, selectedSubjectFilter, selectedTypeFilter, filterTab, searchQuery]);

  const pendingList = filteredRequests.filter(r => r.status === 'pending');
  const approvedList = filteredRequests.filter(r => r.status === 'approved');
  const rejectedList = filteredRequests.filter(r => r.status === 'rejected');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Subject-Isolated Correction Queue</span>
            </span>
            <span className="text-xs text-slate-400">Monthly Student Cap: 2 Requests</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Attendance Correction Queue
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Student correction requests are strictly isolated per subject so only assigned subject teachers & admins resolve them.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pending Review</span>
            <span className="text-xl font-bold text-cyan-400 font-heading">{pendingList.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Approved</span>
            <span className="text-xl font-bold text-emerald-400 font-heading">{approvedList.length}</span>
          </div>
        </div>
      </div>

      {/* Teacher Assigned Subject Notice Banner */}
      {isTeacherRestricted && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-200 font-medium">
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Subject Isolation Active: You are viewing requests for{' '}
              <strong className="text-cyan-300 font-bold">{adminProfile?.assignedSubject}</strong>{' '}
              ({adminProfile?.assignedSubjectType || 'MDC'})
            </span>
          </div>
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className="text-[11px] font-semibold text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {selectedSubjectFilter === 'all' ? 'Filtering Active' : 'Show All Subjects'}
          </button>
        </div>
      )}

      {/* Controls: Filter Tabs, Subject Selectors & Search */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterTab('pending')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All History ({filteredRequests.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, date, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Dropdown Filters for Subject & Subject Type */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Filter Subject:</span>
            <select
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Filter Subject Type:</span>
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="all">All Subject Types</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {(selectedSubjectFilter !== 'all' || selectedTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedSubjectFilter('all');
                setSelectedTypeFilter('all');
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Cards List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl space-y-1">
            <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-1" />
            <div className="text-slate-400 font-semibold">No correction requests found</div>
            <p className="text-slate-500">Try adjusting your subject, status, or search filters.</p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const usedQuota = getStudentMonthlyCorrectionCount(req.studentId, req.monthKey);

            return (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-slate-700 transition-colors"
              >
                {/* Left details */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-sm font-bold text-slate-100 font-heading">
                      {req.studentName}
                    </h3>
                    <span className="text-xs font-mono text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                      {req.rollNumber || req.studentId}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {req.email || `${req.studentId.toLowerCase()}@college.edu`}
                    </span>

                    {/* Subject Tag Badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-emerald-400" />
                      <span>{req.subject || 'Geology'} ({req.subjectType || 'MDC'})</span>
                    </span>

                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Date: <strong className="font-mono text-cyan-300">{req.attendanceDate}</strong></span>
                      <span className="text-slate-500 text-[11px]">({req.classId || 'core_class'})</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Status transition badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                      <span className="text-slate-500 font-semibold">Claimed:</span>
                      <span className="text-rose-400 uppercase font-bold">{req.currentStatus || 'ABSENT'}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-emerald-400 uppercase font-bold">{req.requestedStatus || 'PRESENT'}</span>
                    </div>

                    {/* Monthly quota tracker */}
                    <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-[11px] font-mono">
                      Quota Index: <strong className="text-teal-300">#{req.monthlyRequestIndex || 1}</strong> ({usedQuota}/2 this month)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
                      Student Submitted Explanation:
                    </span>
                    <p className="italic text-slate-200">"{req.reason}"</p>
                  </div>

                  {req.decidedAt && (
                    <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-200">Official Decision by {req.decidedBy}:</span>{' '}
                      <span className="italic">{req.decisionNotes}</span> <span className="text-slate-500">({new Date(req.decidedAt).toLocaleDateString()})</span>
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
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => setActiveDecision({ request: req, mode: 'approve' })}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
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
