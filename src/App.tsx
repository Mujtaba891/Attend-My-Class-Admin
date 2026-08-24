import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { MobileMenuSheet } from './components/layout/MobileMenuSheet';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { LiveAttendanceBoard } from './components/attendance/LiveAttendanceBoard';
import { QRSessionView } from './components/session/QRSessionView';
import { ClassroomDisplayMode } from './components/session/ClassroomDisplayMode';
import { StudentManagementView } from './components/students/StudentManagementView';
import { AttendanceHistoryView } from './components/attendance/AttendanceHistoryView';
import { AccountDeviceManagementView } from './components/devices/AccountDeviceManagementView';
import { CorrectionRequestsView } from './components/corrections/CorrectionRequestsView';
import { WeeklyReportsView } from './components/reports/WeeklyReportsView';
import { MonthlyReportsView } from './components/reports/MonthlyReportsView';
import { ActivityLogsView } from './components/logs/ActivityLogsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SettingsView } from './components/settings/SettingsView';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isClassroomDisplayOpen, setIsClassroomDisplayOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // If faculty/admin is not authenticated, show the login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            onNavigate={setActiveTab}
            onOpenClassroomDisplay={() => setIsClassroomDisplayOpen(true)}
          />
        );
      case 'live_board':
        return <LiveAttendanceBoard />;
      case 'qr_session':
        return (
          <QRSessionView
            onOpenClassroomDisplay={() => setIsClassroomDisplayOpen(true)}
          />
        );
      case 'students':
        return <StudentManagementView />;
      case 'attendance':
        return <AttendanceHistoryView />;
      case 'devices':
        return <AccountDeviceManagementView />;
      case 'corrections':
        return <CorrectionRequestsView />;
      case 'weekly_reports':
        return <WeeklyReportsView />;
      case 'monthly_reports':
        return <MonthlyReportsView />;
      case 'activity':
        return <ActivityLogsView />;
      case 'notifications':
        return <NotificationsView onNavigate={setActiveTab} />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardOverview
            onNavigate={setActiveTab}
            onOpenClassroomDisplay={() => setIsClassroomDisplayOpen(true)}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-hidden">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenClassroomDisplay={() => setIsClassroomDisplayOpen(true)}
        onNavigate={setActiveTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop Only: hidden on mobile) */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area (extra bottom padding on mobile for iOS bottom tab bar) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
          {renderActiveView()}
        </main>
      </div>

      {/* iPhone Design Bottom Navigation Bar (Mobile Only: hidden on md+) */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isMenuOpen={isMobileMenuOpen}
      />

      {/* iPhone Sliding Sheet / Togglable Sidebar Drawer */}
      <MobileMenuSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenClassroomDisplay={() => setIsClassroomDisplayOpen(true)}
      />

      {/* Classroom Projector / Fullscreen Mode */}
      {isClassroomDisplayOpen && (
        <ClassroomDisplayMode onClose={() => setIsClassroomDisplayOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <AppContent />
      </AttendanceProvider>
    </AuthProvider>
  );
}
