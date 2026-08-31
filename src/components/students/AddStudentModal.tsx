import React, { useState } from 'react';
import { X, UserPlus, Smartphone, CheckCircle } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  const { addStudent } = useAttendance();

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [section, setSection] = useState<string>('A');
  const [course, setCourse] = useState('B.Sc. (Hons) Degree Course');
  const [batch, setBatch] = useState('2024-2027');
  const [deviceModel, setDeviceModel] = useState('Google Pixel 8a (Auto-Bind)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const studentId = `STU-${Date.now().toString().slice(-4)}`;
    const newStudentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
      studentId,
      rollNumber: rollNumber || `2024-ROLL-${Math.floor(100 + Math.random() * 900)}`,
      registrationNumber: `REG-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName,
      email,
      phone,
      course,
      mdc: 'Geology',
      batch,
      section,
      accountStatus: 'active',
      authorizedDeviceId: `dev_hw_${Math.random().toString(36).substring(2, 10)}`,
      authorizedDeviceModel: deviceModel,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
    };

    addStudent(newStudentData);
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
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
              Enroll New Geology Student
            </h3>
            <p className="text-xs text-slate-400">
              Register student profile and configure initial device binding credentials.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Lin"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Roll Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2024-GEO-021"
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                College Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. maya.lin@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Section
              </label>
              <select
                value={section}
                onChange={e => setSection(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Batch
              </label>
              <input
                type="text"
                value={batch}
                onChange={e => setBatch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Course
              </label>
              <input
                type="text"
                value={course}
                onChange={e => setCourse(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Initial Hardware Device Authorization</span>
            </div>
            <input
              type="text"
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
              placeholder="e.g. iPhone 15 Pro, Samsung S24"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Device hardware fingerprint will lock to this smartphone to prevent proxy check-ins.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
