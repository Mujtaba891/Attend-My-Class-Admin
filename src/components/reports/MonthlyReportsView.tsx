import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  Percent,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export const MonthlyReportsView: React.FC = () => {
  const { students, getStudentStats } = useAttendance();

  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'eligible' | 'defaulters'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const studentReportRows = useMemo(() => {
    return students.map(student => ({
      student,
      stats: getStudentStats(student.id),
    }));
  }, [students, getStudentStats]);

  const filteredRows = useMemo(() => {
    return studentReportRows.filter(({ student, stats }) => {
      const q = searchQuery.toLowerCase();
      const matches =
        student.fullName.toLowerCase().includes(q) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(q)) ||
        student.studentId.toLowerCase().includes(q);

      if (!matches) return false;
      if (sectionFilter !== 'all' && student.section !== sectionFilter) return false;
      if (filterType === 'eligible' && stats.isDefaulter) return false;
      if (filterType === 'defaulters' && !stats.isDefaulter) return false;

      return true;
    });
  }, [studentReportRows, searchQuery, filterType, sectionFilter]);

  const eligibleCount = studentReportRows.filter(r => !r.stats.isDefaulter).length;
  const defaulterCount = studentReportRows.filter(r => r.stats.isDefaulter).length;
  const classAverage =
    studentReportRows.length > 0
      ? Math.round(studentReportRows.reduce((acc, r) => acc + r.stats.percentage, 0) / studentReportRows.length)
      : 0;

  const handleExport = () => {
    const headers = [
      'Roll Number',
      'Registration Number',
      'Student Name',
      'Section',
      'Total Held',
      'Attended',
      'Absent',
      'Turnout %',
      'Eligibility (>=75%)',
    ];
    const rows = studentReportRows.map(({ student, stats }) => [
      student.rollNumber || student.id,
      student.registrationNumber || 'N/A',
      `"${student.fullName}"`,
      student.section,
      stats.totalClasses,
      stats.present,
      stats.absent,
      `${stats.percentage}%`,
      stats.isDefaulter ? 'DEFAULTER (<75%)' : 'ELIGIBLE (>=75%)',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Ledger_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Department Ledger
            </span>
            <span className="text-xs text-slate-400">75% Mandatory Clearance Standard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Monthly Attendance Ledger & Register
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Official monthly attendance register. Evaluates examination eligibility per college and university rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option>August 2026</option>
            <option>July 2026</option>
            <option>June 2026</option>
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Official Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-xs font-semibold uppercase text-slate-400">Batch Average Rate</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading mt-1">{classAverage}%</div>
          <span className="text-[11px] text-emerald-400 mt-0.5 block">Overall Class Turnout</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Enrolled</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading mt-1">{students.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">B.Sc. Geology</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-xs font-semibold uppercase text-slate-400">Exam Eligible (≥ 75%)</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-heading mt-1">{eligibleCount}</div>
          <span className="text-[11px] text-emerald-500/80 mt-0.5 block font-medium">Clear for examinations</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-xs font-semibold uppercase text-slate-400">Defaulters (&lt; 75%)</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-heading mt-1">{defaulterCount}</div>
          <span className="text-[11px] text-rose-400/80 mt-0.5 block font-medium">Warning Notice Issued</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Students ({studentReportRows.length})
          </button>

          <button
            onClick={() => setFilterType('eligible')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'eligible'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Eligible ≥ 75% ({eligibleCount})
          </button>

          <button
            onClick={() => setFilterType('defaulters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'defaulters'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Defaulters &lt; 75% ({defaulterCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Monthly Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4 text-center">Classes Conducted</th>
                <th className="py-3.5 px-4 text-center">Attended</th>
                <th className="py-3.5 px-4 text-center">Absent</th>
                <th className="py-3.5 px-4 text-center">Monthly Turnout</th>
                <th className="py-3.5 px-4 text-right">Clearance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.map(({ student, stats }) => (
                <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{student.fullName}</div>
                    <span className="text-[11px] text-slate-500 font-mono">{student.email}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                    {student.rollNumber || student.studentId}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">Section {student.section}</td>

                  <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                    {stats.totalClasses}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                    {stats.present}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                    {stats.absent}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono">
                    <span
                      className={`text-sm font-black font-heading ${
                        stats.isDefaulter ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {stats.percentage}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {stats.isDefaulter ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        DEFAULTER (&lt;75%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        ELIGIBLE (≥75%)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
