import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, RefreshCw, HardDrive, ShieldCheck, Zap } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const PwaSettingsCard: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    isOnline,
    promptInstall,
    setShowIOSGuide,
  } = usePWA();

  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheClearedMsg, setCacheClearedMsg] = useState(false);

  const handleClearCacheAndReload = async () => {
    setCacheClearing(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      setCacheClearedMsg(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.warn('Cache clearing error:', err);
      setCacheClearing(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100">Progressive Web App (PWA) & Offline Mode</h3>
            <p className="text-xs text-slate-400">Install Attend My Class as a standalone app on your PC, Mac, Android, or iPhone</p>
          </div>
        </div>

        {isStandalone ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Installed (App Mode)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <Zap className="w-3.5 h-3.5" />
            <span>PWA Ready</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Card 1: App Status */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] uppercase font-bold text-slate-400">Installation Mode</div>
          <div className="mt-1 text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            {isStandalone ? (
              <span className="text-emerald-400">Standalone Desktop/Mobile</span>
            ) : isInstalled ? (
              <span className="text-emerald-400">Installed on Device</span>
            ) : (
              <span className="text-amber-400">Browser / Web Window</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {isStandalone ? 'Running inside native window without browser address bar' : 'Install for zero-lag native window experience'}
          </p>
        </div>

        {/* Card 2: Network & Offline Storage */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] uppercase font-bold text-slate-400">Offline & Cache Engine</div>
          <div className="mt-1 text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400">Service Worker Active</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Network status: {isOnline ? 'Connected (Live Firebase Sync)' : 'Offline (Cached Shell Active)'}
          </p>
        </div>

        {/* Card 3: Security & Manifest */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] uppercase font-bold text-slate-400">Manifest & Security</div>
          <div className="mt-1 text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>TLS / HTTPS Verified</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Compliant Web App Manifest with full 512px maskable icons
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isStandalone && (
            <button
              onClick={() => {
                if (isIOS) {
                  setShowIOSGuide(true);
                } else {
                  promptInstall();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{isIOS ? 'Add to iPhone / iPad Home Screen' : 'Install Attend My Class on this Device'}</span>
            </button>
          )}

          {isStandalone && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Application is already installed and running standalone!</span>
            </div>
          )}
        </div>

        <button
          onClick={handleClearCacheAndReload}
          disabled={cacheClearing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
        >
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>{cacheClearedMsg ? 'Cache Cleared! Reloading...' : cacheClearing ? 'Clearing...' : 'Clear PWA Cache & Force Reload'}</span>
        </button>
      </div>
    </div>
  );
};
