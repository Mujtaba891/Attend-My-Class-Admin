import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const PwaUpdateToast: React.FC = () => {
  const { isUpdateAvailable, applyUpdate } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed top-16 md:top-20 right-4 z-50 animate-slideDown max-w-sm">
      <div className="bg-gradient-to-r from-blue-900/90 to-indigo-900/90 backdrop-blur-md border border-blue-500/50 p-3.5 rounded-xl shadow-2xl shadow-blue-950/60 flex items-center justify-between gap-3 text-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-200">App Update Ready</div>
            <p className="text-[11px] text-blue-300/80">New version with improved features</p>
          </div>
        </div>

        <button
          onClick={applyUpdate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Update</span>
        </button>
      </div>
    </div>
  );
};
