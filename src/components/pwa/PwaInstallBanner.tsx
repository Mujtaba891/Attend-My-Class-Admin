import React from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const PwaInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    promptInstall,
    dismissInstallBanner,
    isBannerDismissed,
  } = usePWA();

  // If already running in installed standalone app, or dismissed, or neither installable nor iOS, don't show floating banner
  if (isStandalone || isInstalled || isBannerDismissed) {
    return null;
  }

  // Only show if browser supports install prompt or is iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-40 sm:max-w-md animate-slideUp">
      <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 p-3.5 sm:p-4 rounded-2xl shadow-2xl shadow-emerald-950/40 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: App Icon & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 shadow-inner shrink-0 relative">
            <img src="/logo-1.png" alt="Attend My Class" className="w-full h-full object-contain rounded-lg" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white truncate">Install Attend My Class</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              {isIOS ? 'Add to iOS Home Screen for instant offline access' : 'Fast standalone desktop & mobile app'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => promptInstall()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {isIOS ? <Smartphone className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isIOS ? 'Install' : 'Install App'}</span>
          </button>
          <button
            onClick={dismissInstallBanner}
            title="Dismiss"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
