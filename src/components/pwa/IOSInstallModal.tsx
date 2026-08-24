import React from 'react';
import { Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 shadow-md shrink-0">
              <img src="/logo-1.png" alt="Attend My Class" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Install Attend My Class</h3>
              <p className="text-xs text-emerald-400 font-medium">Add to iPhone / iPad Home Screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Description */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-300 leading-relaxed">
            Install this application on your iOS device for full-screen standalone mode, fast offline loading, and instant QR sessions:
          </p>

          <div className="space-y-2.5">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Share className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200">1. Tap the Share button</div>
                <div className="text-slate-400 mt-0.5">In the Safari browser bottom bar, tap the Share icon.</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200">2. Select &ldquo;Add to Home Screen&rdquo;</div>
                <div className="text-slate-400 mt-0.5">Scroll down the share sheet and tap &ldquo;Add to Home Screen&rdquo;.</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200">3. Tap &ldquo;Add&rdquo; in Top Right</div>
                <div className="text-slate-400 mt-0.5">Confirm the name and tap Add. The app icon will appear on your home screen.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full-screen app experience</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
