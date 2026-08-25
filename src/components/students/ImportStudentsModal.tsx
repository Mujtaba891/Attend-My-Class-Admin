import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, Sparkles, UserPlus } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_CSV = `Full Name,Roll Number,Email,Phone,Section
Aarav Sharma,2024-ROLL-001,aarav.s@college.edu,+91 98111 22334,A
Ananya Iyer,2024-ROLL-002,ananya.i@college.edu,+91 98222 33445,A
Rohan Deshmukh,2024-ROLL-003,rohan.d@college.edu,+91 98333 44556,B
Pooja Kulkarni,2024-ROLL-004,pooja.k@college.edu,+91 98444 55667,B
Vikram Patel,2024-ROLL-005,vikram.p@college.edu,+91 98555 66778,A`;

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ isOpen, onClose }) => {
  const { importStudents } = useAttendance();
  const [csvText, setCsvText] = useState('');
  const [parsedList, setParsedList] = useState<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleParseCsv = (text: string) => {
    setError(null);
    setCsvText(text);
    if (!text.trim()) {
      setParsedList([]);
      return;
    }

    try {
      const lines = text.trim().split('\n');
      if (lines.length <= 1) {
        setParsedList([]);
        return;
      }

      // Check header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.trim());
        const name = cols[0] || `Student ${i}`;
        const roll = cols[1] || `2024-ROLL-${String(i).padStart(3, '0')}`;
        const email = cols[2] || `student${i}@college.edu`;
        const phone = cols[3] || '+91 98000 00000';
        const rawSec = (cols[4] || 'A').toUpperCase().replace(/^SECTION\s*|^SEC\s*/i, '').trim();
        const validSections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
        const section = validSections.includes(rawSec) ? rawSec : 'A';

        students.push({
          studentId: `STU-${Date.now().toString().slice(-4)}-${i}`,
          rollNumber: roll,
          registrationNumber: `REG-2024-${1000 + i}`,
          fullName: name,
          email,
          phone,
          course: 'B.Sc. (Hons) Degree Course',
          batch: '2024-2027',
          section,
          accountStatus: 'active',
          avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + i * 20}?w=150&auto=format&fit=crop&q=80`,
        });
      }

      setParsedList(students);
    } catch (err: any) {
      setError('Could not parse CSV format. Please ensure comma-separated format with headers: Name, Roll, Email, Phone, Section.');
    }
  };

  const handleLoadSample = () => {
    handleParseCsv(SAMPLE_CSV);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedList.length === 0) return;
    importStudents(parsedList);
    setImportSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
          <div className="w-12 h-10 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
              Bulk Import Student Roster
            </h3>
            <p className="text-xs text-slate-400">
              Paste or upload CSV roster to enroll multiple students simultaneously.
            </p>
          </div>
        </div>

        {importSuccess && (
          <div className="my-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Successfully imported {parsedList.length} students into Geology Directory!</span>
          </div>
        )}

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* File Drag or Load Sample Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Choose CSV File</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Paste Sample Roster (5 Students)</span>
            </button>
          </div>

          {/* Paste CSV textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              CSV Data (Header: Full Name, Roll Number, Email, Phone, Section)
            </label>
            <textarea
              rows={3}
              value={csvText}
              onChange={e => handleParseCsv(e.target.value)}
              placeholder={`Full Name,Roll Number,Email,Phone,Section\nJohn Doe,2024-GEO-001,john.doe@geology.edu,+91 98765 43210,A`}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
          </div>

          {/* Parsed Preview Table */}
          {parsedList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">
                  Parsed Students Preview ({parsedList.length}):
                </span>
                <span className="text-[11px] text-emerald-400">Ready to enroll</span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Roll No</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {parsedList.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-semibold text-slate-100">{st.fullName}</td>
                        <td className="py-2 px-3 font-mono text-emerald-400">{st.rollNumber}</td>
                        <td className="py-2 px-3 text-slate-400">{st.email}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold">
                            Sec {st.section}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={parsedList.length === 0}
              onClick={handleConfirmImport}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
                parsedList.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll All {parsedList.length} Students</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
