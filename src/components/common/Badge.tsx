import React from 'react';
import { AttendanceStatus, AccountStatus, UserRole } from '../../types';

interface BadgeProps {
  status?: AttendanceStatus | AccountStatus | UserRole | string;
  variant?: 'attendance' | 'account' | 'role' | 'outline' | 'custom';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, variant = 'attendance', label, className = '' }) => {
  if (variant === 'attendance') {
    switch (status) {
      case 'present':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {label || 'Present'}
          </span>
        );
      case 'absent':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {label || 'Absent'}
          </span>
        );
      case 'not_marked':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {label || 'Not Marked'}
          </span>
        );
      case 'correction_requested':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            {label || 'Correction Requested'}
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 ${className}`}>
            {label || status}
          </span>
        );
    }
  }

  if (variant === 'account') {
    switch (status) {
      case 'active':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 whitespace-nowrap ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {label || 'Active Account'}
          </span>
        );
      case 'locked':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 whitespace-nowrap ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {label || 'Locked (Device Flag)'}
          </span>
        );
      case 'disabled':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-700 whitespace-nowrap ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            {label || 'Disabled / Leave'}
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  }

  if (variant === 'role') {
    switch (status) {
      case 'admin':
      case 'teacher':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 whitespace-nowrap ${className}`}>
            Faculty / Teacher
          </span>
        );
      case 'cr':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap ${className}`}>
            Class Representative
          </span>
        );
      default:
        return <span className="text-xs font-medium text-slate-300">{status}</span>;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-200 ${className}`}>
      {label || status}
    </span>
  );
};
