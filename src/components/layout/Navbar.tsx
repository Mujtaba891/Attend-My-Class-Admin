import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  QrCode,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Plus,
  Monitor,
  Sparkles,
  Layers,
  Radio,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

interface NavbarProps {
  onOpenClassroomDisplay: () => void;
  onNavigate: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenClassroomDisplay,
  onNavigate,
  onToggleMobileMenu,
}) => {
  const { adminProfile, currentRole, logout, updateProfile } = useAuth();
  const {
    activeSession,
    currentClass,
    sessionCountdown,
    isSessionActive,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    currentTime,
    simulateStudentScan,
  } = useAttendance();

  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setShowRoleMenu(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('open-role-menu', handleOpen);
    return () => window.removeEventListener('open-role-menu', handleOpen);
  }, []);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatClock = (d: Date) => {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  return (
    <header className="sticky top-0 z-40 h-14 sm:h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 md:px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Branding & Class quick info */}
      <div className="flex items-center gap-2.5 md:gap-4 sm:gap-6">
        {/* Mobile menu toggle */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="hidden md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center p-1 shadow-lg shadow-emerald-950/40 overflow-hidden shrink-0">
            <img src="/logo-1.png" alt="Attend My Class Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm sm:text-base font-bold text-white tracking-tight">Attend My Class</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentRole === 'admin' ? 'Admin' : currentRole === 'teacher' ? 'Faculty' : 'CR'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
              {adminProfile.assignedSubject || 'Core Subject'} {adminProfile.assignedSubjectType && adminProfile.assignedSubjectType !== 'All' ? `(${adminProfile.assignedSubjectType})` : ''} • {adminProfile.assignedClass || 'Semester IV'} • {adminProfile.assignedRoom || 'Lecture Hall 204'}
            </p>
          </div>
        </div>

        {/* Live Session Status Pill */}
        {activeSession && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/70 text-xs">
            {isSessionActive ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-400">QR Session LIVE</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300">{sessionCountdown} left</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 font-medium">{activeSession.presentCount} Present</span>
              </>
            ) : activeSession.status === 'scheduled' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium text-amber-400">Scheduled ({currentClass.defaultStartTime})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-400">Session Closed</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Clock, Simulation trigger, Classroom display, Notifications, Role Persona, Profile */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatClock(currentTime)}</span>
        </div>

        {/* Demo Student QR Scan Simulation Button */}
        {isSessionActive && (
          <button
            onClick={() => simulateStudentScan()}
            title="Simulate student scanning classroom QR code"
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulate Scan</span>
          </button>
        )}

        {/* Classroom Projection Display Button */}
        <button
          onClick={onOpenClassroomDisplay}
          title="Open Classroom Projector / Live Display Mode"
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Classroom Mode</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-sm font-semibold text-slate-200">Notifications ({notifications.length})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-800/50">
                {notifications.length === 0 ? (
                  <p className="text-center py-4 sm:py-6 text-xs text-slate-500">No new notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) {
                          onNavigate(n.link);
                          setShowNotifMenu(false);
                        }
                      }}
                      className={`pt-2 cursor-pointer p-2 rounded-lg transition-colors ${
                        n.read ? 'hover:bg-slate-800/50 opacity-75' : 'bg-slate-800/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    onNavigate('notifications');
                    setShowNotifMenu(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  View all in Notifications Center
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Sign Out Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 p-1 sm:p-1.5 sm:pl-2 sm:pr-2.5 rounded-xl sm:bg-slate-800/80 sm:hover:bg-slate-800 sm:border sm:border-slate-700/80 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300 overflow-hidden shrink-0 shadow-inner">
              {adminProfile.avatarUrl ? (
                <img src={adminProfile.avatarUrl} alt={adminProfile.name} className="w-full h-full object-cover" />
              ) : (
                adminProfile.name ? adminProfile.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-100 line-clamp-1 max-w-[150px]">
                {adminProfile.name}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                {currentRole === 'admin' ? 'Administrator' : currentRole === 'teacher' ? 'Faculty' : 'Class Monitor (CR)'}
              </span>
            </div>
            <ChevronDown className="hidden sm:block w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-fadeIn">
                {/* Profile Card Header */}
                <div className="pb-3 border-b border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/80 border-2 border-emerald-500/40 flex items-center justify-center text-lg font-bold text-emerald-300 overflow-hidden shrink-0">
                    {adminProfile.avatarUrl ? (
                      <img src={adminProfile.avatarUrl} alt={adminProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      adminProfile.name ? adminProfile.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-100 truncate">{adminProfile.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{adminProfile.email}</div>
                    {adminProfile.rollNumber && adminProfile.role === 'cr' && (
                      <div className="text-[10px] font-mono text-amber-400 mt-0.5">Roll: {adminProfile.rollNumber}</div>
                    )}
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      <span>{adminProfile.department || 'Department of Academic Studies'}</span>
                    </div>
                  </div>
                </div>

              {/* View Profile Action Button */}
              <div className="py-2.5 border-b border-slate-800">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowRoleMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>View & Edit My Profile</span>
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>

              {/* Multi-Subject Switcher */}
              {adminProfile.assignments && adminProfile.assignments.length > 0 ? (
                <div className="py-2.5 border-b border-slate-800 space-y-1.5 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      {currentRole === 'cr' ? 'Your Delegated Subjects' : 'Switch Subject Profile'}
                    </div>
                    {currentRole !== 'cr' && (
                      <button 
                        onClick={() => {
                          localStorage.setItem('faculty_prefill_email', adminProfile.email);
                          logout();
                          setShowRoleMenu(false);
                        }}
                        className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="Add New Subject Profile"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {adminProfile.assignments.map(a => {
                    const isActive = adminProfile.assignedSubject === a.subject && adminProfile.assignedClass === a.className;
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          updateProfile({ assignedSubject: a.subject, assignedSubjectType: a.subjectType || 'All', assignedClass: a.className, assignedRoom: a.room });
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg border transition-colors cursor-pointer ${isActive ? 'bg-blue-500/15 border-blue-500/40 text-blue-200' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isActive ? 'text-blue-300' : 'text-slate-200'}`}>
                            {a.subject} {a.subjectType && a.subjectType !== 'All' && a.subjectType !== 'CR Subject' ? `(${a.subjectType})` : ''}
                          </span>
                          {isActive && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400">Active</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{a.className} {a.room ? `• ${a.room}` : ''}</div>
                      </button>
                    );
                  })}
                </div>
              ) : adminProfile.assignedSubject ? (
                <div className="py-2.5 border-b border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div><strong className="text-slate-300">Course:</strong> {adminProfile.assignedSubject}</div>
                  <div><strong className="text-slate-300">Class:</strong> {adminProfile.assignedClass}</div>
                </div>
              ) : null}

              <div className="pt-2.5">
                <button
                  onClick={() => {
                    logout();
                    setShowRoleMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
          )}
        </div>
      </div>
    </header>
  );
};
