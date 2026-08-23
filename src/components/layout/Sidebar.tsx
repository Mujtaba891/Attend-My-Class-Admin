import React from 'react';
import {
  LayoutDashboard,
  Radio,
  QrCode,
  Users,
  CalendarCheck2,
  Smartphone,
  CheckSquare,
  BarChart3,
  CalendarRange,
  ScrollText,
  Bell,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { students, correctionRequests, notifications, isSessionActive } = useAttendance();
  const { currentRole, adminProfile } = useAuth();

  const lockedStudentsCount = students.filter(s => s.accountStatus === 'locked').length;
  const pendingCorrectionsCount = correctionRequests.filter(c => c.status === 'pending').length;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'teacher', 'cr'],
    },
    {
      id: 'live_board',
      label: 'Live Attendance',
      icon: Radio,
      roles: ['admin', 'teacher', 'cr'],
      badge: isSessionActive ? 'LIVE' : undefined,
      badgeColor: 'bg-emerald-500 text-slate-950 animate-pulse',
    },
    {
      id: 'qr_session',
      label: 'Daily QR Session',
      icon: QrCode,
      roles: ['admin', 'teacher', 'cr'],
      badge: isSessionActive ? 'Active' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      roles: ['admin', 'teacher', 'cr'],
      count: students.length,
    },
    {
      id: 'attendance',
      label: 'Attendance History',
      icon: CalendarCheck2,
      roles: ['admin', 'teacher', 'cr'],
    },
    {
      id: 'devices',
      label: 'Account & Devices',
      icon: Smartphone,
      roles: ['admin', 'teacher'],
      count: lockedStudentsCount > 0 ? lockedStudentsCount : undefined,
      countColor: 'bg-rose-500 text-white font-bold',
      alert: lockedStudentsCount > 0,
    },
    {
      id: 'corrections',
      label: 'Correction Requests',
      icon: CheckSquare,
      roles: ['admin', 'teacher', 'cr'],
      count: pendingCorrectionsCount > 0 ? pendingCorrectionsCount : undefined,
      countColor: 'bg-cyan-500 text-slate-950 font-bold',
    },
    {
      id: 'weekly_reports',
      label: 'Weekly Reports',
      icon: BarChart3,
      roles: ['admin', 'teacher'],
    },
    {
      id: 'monthly_reports',
      label: 'Monthly Reports',
      icon: CalendarRange,
      roles: ['admin', 'teacher'],
    },
    {
      id: 'activity',
      label: 'Activity & Audit Logs',
      icon: ScrollText,
      roles: ['admin', 'teacher'],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      roles: ['admin', 'teacher', 'cr'],
      count: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      countColor: 'bg-purple-500 text-white',
    },
    {
      id: 'settings',
      label: 'Profile',
      icon: Settings,
      roles: ['admin', 'teacher'],
    },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col h-full shrink-0 select-none overflow-y-auto sticky top-0">
      {/* Subject Header Banner */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class & Subject</span>
          <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
        </div>
        <div className="mt-1">
          <h2 className="text-sm font-bold text-slate-100 font-heading line-clamp-1" title={`${adminProfile.assignedSubject || 'Core Course'} ${adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''}`}>
            {adminProfile.assignedSubject || 'Core Course'} {adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1" title={adminProfile.assignedClass || 'Semester IV'}>
            {adminProfile.assignedClass || 'Semester IV (Section A)'}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.alert && (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                )}
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      item.countColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Spark Plan notice */}
      <div className="p-3 m-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Attend My Class</span>
          <span className="text-emerald-400 text-[10px] font-bold">READY</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-500 leading-tight">
          Cloud-synchronized live attendance and real-time verification.
        </p>
      </div>
    </aside>
  );
};
