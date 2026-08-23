import React, { useState, useEffect } from 'react';
import { Clock, Timer, Sun, ChevronUp, ChevronDown, Check, X } from 'lucide-react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTime: string; // e.g. "12:00 PM" or "08:40 PM"
  onConfirm: (formattedTime: string) => void;
  title?: string;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isOpen,
  onClose,
  initialTime,
  onConfirm,
  title = 'Select Time'
}) => {
  const [hours, setHours] = useState<number>(12);
  const [minutes, setMinutes] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

  // Parse initial time string when modal opens
  useEffect(() => {
    if (isOpen && initialTime) {
      try {
        const trimmed = initialTime.trim();
        const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const p = match[3].toUpperCase() as 'AM' | 'PM';
          
          if (h < 1) h = 12;
          if (h > 12) h = 12;
          
          setHours(h);
          setMinutes(isNaN(m) ? 0 : Math.min(59, Math.max(0, m)));
          setPeriod(p === 'AM' ? 'AM' : 'PM');
        }
      } catch (e) {
        console.warn('Error parsing initial time string:', e);
      }
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  // Helper functions for Hours wrap-around (1-12)
  const incrementHour = () => {
    setHours(prev => (prev === 12 ? 1 : prev + 1));
  };

  const decrementHour = () => {
    setHours(prev => (prev === 1 ? 12 : prev - 1));
  };

  // Helper functions for Minutes wrap-around (00-59)
  const incrementMinute = () => {
    setMinutes(prev => (prev === 59 ? 0 : prev + 1));
  };

  const decrementMinute = () => {
    setMinutes(prev => (prev === 0 ? 59 : prev - 1));
  };

  // Toggle Period AM/PM
  const togglePeriod = () => {
    setPeriod(prev => (prev === 'AM' ? 'PM' : 'AM'));
  };

  // Formatted output
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const selectedTimeString = `${formattedHours}:${formattedMinutes} ${period}`;

  // Get neighboring hours for the visual reel (-2, -1, selected, +1, +2)
  const getHourOffset = (offset: number) => {
    let val = (hours + offset) % 12;
    if (val <= 0) val += 12;
    return val;
  };

  // Get neighboring minutes for the visual reel (-2, -1, selected, +1, +2)
  const getMinuteOffset = (offset: number) => {
    let val = (minutes + offset) % 60;
    if (val < 0) val += 60;
    return String(val).padStart(2, '0');
  };

  const handleConfirm = () => {
    onConfirm(selectedTimeString);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Columns: HOURS, MINUTES, PERIOD */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 my-6">
          
          {/* Column 1: HOURS */}
          <div className="flex flex-col items-center bg-slate-50/80 rounded-2xl p-3 border border-slate-100 relative">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>HOURS</span>
            </div>

            {/* Up Chevron */}
            <button
              type="button"
              onClick={incrementHour}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm mb-2"
              title="Increase Hour"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Reel values */}
            <div className="flex flex-col items-center space-y-1 my-1 w-full">
              <button 
                type="button"
                onClick={() => setHours(getHourOffset(-2))} 
                className="text-xs font-semibold text-slate-300 hover:text-slate-500 transition-colors"
              >
                {getHourOffset(-2)}
              </button>
              <button 
                type="button"
                onClick={() => setHours(getHourOffset(-1))} 
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {getHourOffset(-1)}
              </button>

              {/* Selected Highlight Box */}
              <div className="w-full py-2 bg-white rounded-xl border border-slate-200/90 shadow-md flex items-center justify-center text-xl font-black text-emerald-600 ring-2 ring-emerald-500/20">
                {String(hours).padStart(2, '0')}
              </div>

              <button 
                type="button"
                onClick={() => setHours(getHourOffset(1))} 
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {getHourOffset(1)}
              </button>
              <button 
                type="button"
                onClick={() => setHours(getHourOffset(2))} 
                className="text-xs font-semibold text-slate-300 hover:text-slate-500 transition-colors"
              >
                {getHourOffset(2)}
              </button>
            </div>

            {/* Down Chevron */}
            <button
              type="button"
              onClick={decrementHour}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm mt-2"
              title="Decrease Hour"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Column 2: MINUTES */}
          <div className="flex flex-col items-center bg-slate-50/80 rounded-2xl p-3 border border-slate-100 relative">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Timer className="w-3.5 h-3.5" />
              <span>MINUTES</span>
            </div>

            {/* Up Chevron */}
            <button
              type="button"
              onClick={incrementMinute}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm mb-2"
              title="Increase Minute"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Reel values */}
            <div className="flex flex-col items-center space-y-1 my-1 w-full">
              <button 
                type="button"
                onClick={() => setMinutes(parseInt(getMinuteOffset(-2), 10))} 
                className="text-xs font-semibold text-slate-300 hover:text-slate-500 transition-colors"
              >
                {getMinuteOffset(-2)}
              </button>
              <button 
                type="button"
                onClick={() => setMinutes(parseInt(getMinuteOffset(-1), 10))} 
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {getMinuteOffset(-1)}
              </button>

              {/* Selected Highlight Box */}
              <div className="w-full py-2 bg-white rounded-xl border border-slate-200/90 shadow-md flex items-center justify-center text-xl font-black text-emerald-600 ring-2 ring-emerald-500/20">
                {formattedMinutes}
              </div>

              <button 
                type="button"
                onClick={() => setMinutes(parseInt(getMinuteOffset(1), 10))} 
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {getMinuteOffset(1)}
              </button>
              <button 
                type="button"
                onClick={() => setMinutes(parseInt(getMinuteOffset(2), 10))} 
                className="text-xs font-semibold text-slate-300 hover:text-slate-500 transition-colors"
              >
                {getMinuteOffset(2)}
              </button>
            </div>

            {/* Down Chevron */}
            <button
              type="button"
              onClick={decrementMinute}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm mt-2"
              title="Decrease Minute"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Column 3: PERIOD (AM / PM) */}
          <div className="flex flex-col items-center bg-slate-50/80 rounded-2xl p-3 border border-slate-100 relative">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Sun className="w-3.5 h-3.5" />
              <span>PERIOD</span>
            </div>

            {/* Up Chevron */}
            <button
              type="button"
              onClick={togglePeriod}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm mb-2"
              title="Toggle AM/PM"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* AM / PM Reel */}
            <div className="flex flex-col items-center justify-center my-auto py-3 space-y-3 w-full">
              <button
                type="button"
                onClick={() => setPeriod('AM')}
                className={`w-full py-2.5 rounded-xl font-black text-lg transition-all ${
                  period === 'AM'
                    ? 'bg-white border border-slate-200 shadow-md text-emerald-600 ring-2 ring-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                AM
              </button>

              <button
                type="button"
                onClick={() => setPeriod('PM')}
                className={`w-full py-2.5 rounded-xl font-black text-lg transition-all ${
                  period === 'PM'
                    ? 'bg-white border border-slate-200 shadow-md text-emerald-600 ring-2 ring-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                PM
              </button>
            </div>

            {/* Down Chevron */}
            <button
              type="button"
              onClick={togglePeriod}
              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm mt-2"
              title="Toggle AM/PM"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Selected Time Display Bar */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between mb-6 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Selected Time
              </span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                {selectedTimeString}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <span>Confirm Time</span>
          </button>
        </div>
      </div>
    </div>
  );
};
