import React from 'react';
import { Bell, CheckCircle2, ShieldAlert, Sparkles, Smartphone, CheckSquare, Clock, Trash2 } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface NotificationsViewProps {
  onNavigate: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAttendance();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'account_lock':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'correction_decision':
        return <CheckSquare className="w-5 h-5 text-cyan-400" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Administrative Feed
            </span>
            <span className="text-xs text-slate-400">{unreadCount} Unread</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Notifications Center
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            System alerts, device mismatch flags, correction request updates, and session notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">
            No notifications logged at this time.
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationRead(n.id);
                if (n.link) onNavigate(n.link);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                n.read
                  ? 'bg-slate-900/60 border-slate-800/80 opacity-75 hover:opacity-100'
                  : 'bg-slate-900 border-slate-700 shadow-md ring-1 ring-emerald-500/20'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                {getNotifIcon(n.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">{n.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{n.message}</p>
                {n.link && (
                  <span className="mt-2 inline-flex items-center text-[11px] font-semibold text-emerald-400 hover:text-emerald-300">
                    Open related module →
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
