import React from 'react';
import {
  LayoutDashboard,
  Radio,
  QrCode,
  Users,
  Menu,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onToggleMenu,
  isMenuOpen,
}) => {
  const { isSessionActive, notifications, correctionRequests, students } = useAttendance();
  const { currentRole } = useAuth();

  const unreadNotifs = notifications.filter(n => !n.read).length;
  const pendingCorrections = correctionRequests.filter(c => c.status === 'pending').length;
  const lockedAccounts = students.filter(s => s.accountStatus === 'locked').length;
  const menuAlertCount = unreadNotifs + pendingCorrections + lockedAccounts;

  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'live_board',
      label: 'Live Board',
      icon: Radio,
      badge: isSessionActive ? 'LIVE' : undefined,
    },
    {
      id: 'qr_session',
      label: 'QR Code',
      icon: QrCode,
      
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
    },
  ];

  return (
    <nav
      id="ios-bottom-navbar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-2 pb-5 sm:pb-6 select-none shadow-2xl"
      
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !isMenuOpen;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => {
                if (isMenuOpen) onToggleMenu();
                onTabChange(tab.id);
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center relative transition-all duration-150 ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-emerald-500 text-[8px] font-black text-slate-950 animate-pulse">
                    {tab.badge}
                  </span>
                )}
                {tab.id === 'qr_session' && isSessionActive && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">{tab.label}</span>
            </button>
          );
        })}
        {/* 5th Tab: Menu / More togglable sidebar */}
        <button
          id="tab-more-menu"
          onClick={onToggleMenu}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center relative transition-all duration-150 ${
            isMenuOpen
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 transition-transform duration-150 ${isMenuOpen ? 'scale-110 rotate-90 text-emerald-400' : ''}`} />
            {menuAlertCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {menuAlertCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">More</span>
        </button>
      </div>
    </nav>
  );
};