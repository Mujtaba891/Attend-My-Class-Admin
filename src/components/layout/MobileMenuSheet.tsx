import React from 'react';
import {
  X,
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
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  badge?: string;
  count?: number;
  countColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenClassroomDisplay: () => void;
}

export const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onOpenClassroomDisplay,
}) => {
  const {
    students,
    correctionRequests,
    notifications,
    isSessionActive,
    simulateStudentScan,
  } = useAttendance();

  const { adminProfile, currentRole, logout } = useAuth();

  if (!isOpen) return null;

  const lockedStudentsCount = students.filter(s => s.accountStatus === 'locked').length;
  const pendingCorrectionsCount = correctionRequests.filter(c => c.status === 'pending').length;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const sections: MenuSection[] = [
    {
      title: 'Classroom & Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, roles: ['admin', 'teacher', 'cr'] },
        { id: 'live_board', label: 'Live Attendance Board', icon: Radio, roles: ['admin', 'teacher', 'cr'], badge: isSessionActive ? 'LIVE' : undefined },
        { id: 'qr_session', label: 'Daily QR Session', icon: QrCode, roles: ['admin', 'teacher', 'cr'], badge: isSessionActive ? 'Active' : undefined },
        { id: 'students', label: 'Student Directory', icon: Users, roles: ['admin', 'teacher', 'cr'], count: students.length },
        { id: 'attendance', label: 'Attendance History', icon: CalendarCheck2, roles: ['admin', 'teacher', 'cr'] },
      ],
    },
    {
      title: 'Verification & Security',
      items: [
        {
          id: 'devices',
          label: 'Account & Device Locks',
          icon: Smartphone,
          roles: ['admin', 'teacher'],
          count: lockedStudentsCount > 0 ? lockedStudentsCount : undefined,
          countColor: 'bg-rose-500 text-white',
        },
        {
          id: 'corrections',
          label: 'Correction Requests',
          icon: CheckSquare,
          roles: ['admin', 'teacher', 'cr'],
          count: pendingCorrectionsCount > 0 ? pendingCorrectionsCount : undefined,
          countColor: 'bg-cyan-500 text-slate-950',
        },
      ],
    },
    {
      title: 'Reports & Audit',
      items: [
        { id: 'weekly_reports', label: 'Weekly Defaulter Reports', icon: BarChart3, roles: ['admin', 'teacher'] },
        { id: 'monthly_reports', label: 'Monthly Summary & CSV', icon: CalendarRange, roles: ['admin', 'teacher'] },
        { id: 'activity', label: 'Activity & Audit Logs', icon: ScrollText, roles: ['admin', 'teacher'] },
        {
          id: 'notifications',
          label: 'Notifications Center',
          icon: Bell,
          roles: ['admin', 'teacher', 'cr'],
          count: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
          countColor: 'bg-purple-500 text-white',
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'settings', label: 'Profile', icon: Settings, roles: ['admin', 'teacher'] },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] md:hidden flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose}></div>

      {/* iPhone Card Sheet Container */}
      <div className="bg-slate-900 border-t border-slate-700/80 rounded-t-[32px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* iOS Drag Handle */}
        <div className="pt-3 pb-2 flex justify-center shrink-0 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"></div>
        </div>

        {/* Sheet Header */}
        <div className="px-5 pb-3 pt-1 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Attend My Class</span>
            <h3 className="text-base font-bold text-slate-100 font-heading">Navigation & Tools</h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3 space-y-5 pb-12">
          {/* Quick Actions (Classroom Mode, Scan Simulation) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenClassroomDisplay();
              }}
              className="p-3 rounded-2xl bg-teal-600/20 border border-teal-500/40 text-teal-200 text-xs font-semibold flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                <LayoutDashboard className="w-3.5 h-3.5" />
              </div>
              <span className="text-left">Classroom Projector</span>
            </button>

            {isSessionActive && (
              <button
                onClick={() => {
                  simulateStudentScan();
                }}
                className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-left">Simulate Scan</span>
              </button>
            )}
          </div>

          {/* Nav Sections */}
          {sections.map(sec => {
            const visibleItems = sec.items.filter(item => item.roles.includes(currentRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-1">
                <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {sec.title}
                </h4>
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between p-3 text-xs text-left transition-colors ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.countColor || 'bg-slate-800 text-slate-300'}`}>
                              {item.count}
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* User Profile & Sign Out */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
                  {adminProfile.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{adminProfile.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="uppercase text-[10px] font-bold text-emerald-400">
                      {currentRole === 'admin' ? 'Administrator' : currentRole === 'teacher' ? 'Faculty' : 'Class Monitor'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
            
            {adminProfile.assignedSubject && (
              <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 line-clamp-1">
                <span className="text-slate-300">{adminProfile.assignedSubject} {adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
