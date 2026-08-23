import React, { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  User,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { ActivityEventType } from '../../types';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matches =
        log.details.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        (log.targetName && log.targetName.toLowerCase().includes(q)) ||
        log.eventType.toLowerCase().includes(q);

      if (!matches) return false;
      if (eventFilter !== 'all' && log.eventType !== eventFilter) return false;
      return true;
    });
  }, [activityLogs, searchQuery, eventFilter]);

  const getEventBadge = (type: ActivityEventType) => {
    switch (type) {
      case 'qr_session_started':
      case 'qr_session_closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <QrCode className="w-3 h-3" />
            {type.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'security_alert':
      case 'account_locked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            {type.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'account_reactivated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            REACTIVATED
          </span>
        );
      case 'correction_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            CORRECTION APPROVED
          </span>
        );
      case 'correction_rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            CORRECTION REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
            {type.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Departmental Compliance
            </span>
            <span className="text-xs text-slate-400">Immutable Audit Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            System & Security Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Cryptographically timestamped record of all session activations, overrides, device alerts, and correction decisions.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Events Logged</span>
          <span className="text-xl font-bold text-slate-200 font-heading">{activityLogs.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Event Types</option>
            <option value="attendance_modified">Attendance Modified</option>
            <option value="qr_session_started">QR Session Started</option>
            <option value="qr_session_closed">QR Session Closed</option>
            <option value="account_locked">Account Locked (Mismatch)</option>
            <option value="account_reactivated">Account Reactivated</option>
            <option value="correction_approved">Correction Approved</option>
            <option value="correction_rejected">Correction Rejected</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search logs by actor, target..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Detailed Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No activity logs found for this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getEventBadge(log.eventType)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{log.actorName}</div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-300">{log.targetName || 'System'}</span>
                      {log.targetType && (
                        <span className="text-[10px] text-slate-500 block uppercase">
                          {log.targetType}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
