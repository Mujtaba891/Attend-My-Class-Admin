import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export const WeeklyReportsView: React.FC = () => {
  const { students, allAttendance, getStudentStats, currentClass } = useAttendance();

  const [selectedWeek, setSelectedWeek] = useState('Week 3 (Aug 15 - Aug 19, 2026)');

  // Calculate real week data
  const getRealWeekData = () => {
    const enrolledStudentIds = new Set(students.map(s => s.id));
    const subjectRecords = allAttendance.filter(a => enrolledStudentIds.size === 0 || enrolledStudentIds.has(a.studentId));

    // Group subject attendance by date
    const attendanceByDate = subjectRecords.reduce((acc: any, record: any) => {
      if (!acc[record.date]) {
        acc[record.date] = { present: 0, absent: 0 };
      }
      if (record.status === 'present' || record.status === 'late') {
        acc[record.date].present += 1;
      } else if (record.status === 'absent') {
        acc[record.date].absent += 1;
      }
      return acc;
    }, {});

    const sortedDates = Object.keys(attendanceByDate).sort();
    
    // If no data, return empty
    if (sortedDates.length === 0) return [];
    
    // Get up to the last 5 distinct dates
    const recentDates = sortedDates.slice(-5);
    
    return recentDates.map(dateStr => {
      const data = attendanceByDate[dateStr];
      const total = data.present + data.absent;
      const rate = total > 0 ? Math.round((data.present / total) * 100) : 0;
      
      const d = new Date(dateStr);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      return {
        day: days[d.getDay()] || 'Day',
        date: dateStr,
        present: data.present,
        absent: data.absent,
        rate
      };
    });
  };

  const weekDays = getRealWeekData();
  const avgRate = weekDays.length > 0 ? Math.round(weekDays.reduce((acc, d) => acc + d.rate, 0) / weekDays.length) : 0;

  // Defaulters list
  const defaulters = students
    .map(s => ({ student: s, stats: getStudentStats(s.id) }))
    .filter(item => item.stats.isDefaulter);

  const handleExport = () => {
    const headers = ['Roll Number', 'Student Name', 'Section', 'Total Classes', 'Present', 'Absent', 'Percentage', 'Status'];
    const rows = students.map(s => {
      const stats = getStudentStats(s.id);
      return [
        s.rollNumber || s.id,
        `"${s.fullName}"`,
        s.section,
        stats.totalClasses,
        stats.present,
        stats.absent,
        `${stats.percentage}%`,
        stats.isDefaulter ? 'Defaulter (<75%)' : 'Eligible',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Weekly_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Weekly Analytics
            </span>
            <span className="text-xs text-slate-400">Monday – Friday Slot</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Weekly Attendance Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            5-Day Lecture turnout trends, at-risk student monitoring, and departmental performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200">
            Latest Activity
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Weekly Average Rate</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-heading mt-1">{avgRate}%</div>
            <span className="text-xs text-emerald-500/80 mt-0.5 block font-medium">
              Based on recent activity
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Total Lectures Held</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading mt-1">{weekDays.length} Classes</div>
            <span className="text-xs text-slate-400 mt-0.5 block">{currentClass.defaultStartTime} Daily Slot</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Weekly Defaulters</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-heading mt-1">{defaulters.length}</div>
            <span className="text-xs text-rose-300/80 mt-0.5 block">Students below 75%</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Daily Visual Attendance Distribution Bars */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 sm:space-y-6">
        <h3 className="text-base font-bold text-slate-100 font-heading">
          Day-by-Day Turnout Breakdown ({currentClass.defaultStartTime} – {currentClass.defaultEndTime})
        </h3>

        <div className="space-y-4">
          {weekDays.map((item, idx) => (
            <div key={item.date ? `${item.day}-${item.date}` : `${item.day}-${idx}`} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{item.day}</span>
                  <span className="text-slate-500 font-mono">({item.date})</span>
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  <span className="text-emerald-400">{item.present} Present</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400">{item.absent} Absent</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-100 font-bold font-mono">{item.rate}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
                  style={{ width: `${item.rate}%` }}
                ></div>
                <div
                  className="h-full bg-rose-500/60 rounded-r-full"
                  style={{ width: `${100 - item.rate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Defaulter / At-Risk Students Warning Panel */}
      {defaulters.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold font-heading">
              Weekly Attendance Defaulters List (&lt; 75% Requirement)
            </h3>
          </div>
          <p className="text-xs text-rose-300/80">
            The following students require departmental attendance counseling before mid-term examination clearance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {defaulters.map(({ student, stats }) => (
              <div
                key={student.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{student.fullName}</h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {student.rollNumber || student.id} • Section {student.section}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-rose-400 font-heading">
                    {stats.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {stats.present}/{stats.totalClasses} classes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
