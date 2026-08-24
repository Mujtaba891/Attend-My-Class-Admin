import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500/20 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300 animate-fadeIn z-30">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Offline Mode Active • Local attendance records & cached interface are running</span>
      <div className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
        <Database className="w-3 h-3" />
        <span>Service Worker Synced</span>
      </div>
    </div>
  );
};
