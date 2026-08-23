import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  MapPin,
  Clock,
  Laptop,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Student } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';

interface DeviceMismatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const DeviceMismatchModal: React.FC<DeviceMismatchModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { reactivateDeviceAndAccount } = useAttendance();
  const [bindNewHardware, setBindNewHardware] = useState(false);

  if (!isOpen || !student) return null;

  const mismatch = student.lastMismatchDetails;

  const handleReactivate = () => {
    reactivateDeviceAndAccount(student.id, {
      transferToNewDevice: bindNewHardware,
      newDeviceId: mismatch?.attemptedDeviceId,
      newDeviceModel: mismatch?.attemptedDeviceModel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
              Device Mismatch Security Incident
            </h3>
            <p className="text-xs text-slate-400">
              Student account locked to prevent proxy QR code scanning.
            </p>
          </div>
        </div>

        {/* Student Summary */}
        <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={student.fullName}
              referrerPolicy="no-referrer"
              className="w-12 h-10 sm:h-12 rounded-xl object-cover border border-rose-500/40"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-100">{student.fullName}</h4>
              <span className="text-xs font-mono text-slate-400">
                {student.rollNumber || student.studentId} • Section {student.section}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            LOCKED
          </span>
        </div>

        {/* Comparison: Registered vs. Attempted */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {/* Authorized */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Authorized Device</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Model</span>
                <span className="font-semibold text-slate-200">{student.authorizedDeviceModel || 'None'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Hardware Fingerprint</span>
                <code className="text-[10px] font-mono text-emerald-300">
                  {student.authorizedDeviceId || 'N/A'}
                </code>
              </div>
            </div>
          </div>

          {/* Attempted */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Unauthorized Attempt</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Attempted Model</span>
                <span className="font-semibold text-rose-200">
                  {mismatch?.attemptedDeviceModel || 'Unknown Device'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Attempted Fingerprint</span>
                <code className="text-[10px] font-mono text-rose-300">
                  {mismatch?.attemptedDeviceId || 'dev_unauthorized_token'}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Time details */}
        {mismatch && (
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Incident Timestamp:
              </span>
              <span className="font-mono text-slate-200 font-semibold">{mismatch.timestamp}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Detected IP / Network:
              </span>
              <span className="font-mono text-slate-200">{mismatch.ipAddress}</span>
            </div>
          </div>
        )}

        {/* Binding Decision Options */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Reactivation & Session Resolution:
          </label>
          
          <div
            onClick={() => setBindNewHardware(false)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              !bindNewHardware
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="device-decision"
                checked={!bindNewHardware}
                onChange={() => setBindNewHardware(false)}
                className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Revoke New Device & Restore Original Device</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Recommended</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Forces immediate logout of the secondary device (<span className="text-slate-300 font-mono">{mismatch?.attemptedDeviceModel || 'New Device'}</span>). Account remains active solely on the student's authorized phone.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setBindNewHardware(true)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              bindNewHardware
                ? 'bg-blue-500/10 border-blue-500/50 text-white ring-1 ring-blue-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="device-decision"
                checked={bindNewHardware}
                onChange={() => setBindNewHardware(true)}
                className="mt-0.5 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-100">
                  Transfer Authorization to New Device
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Authorizes and binds student account to the new device (<span className="text-slate-300 font-mono">{mismatch?.attemptedDeviceModel || 'New Device'}</span>). The previous device will be unpaired.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Keep Account Locked
          </button>
          <button
            type="button"
            onClick={handleReactivate}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{!bindNewHardware ? 'Reactivate & Logout New Device' : 'Authorize New Device & Unlock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
