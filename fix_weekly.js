import fs from 'fs';
let code = fs.readFileSync('src/components/reports/WeeklyReportsView.tsx', 'utf8');

const replacement = `
  // Calculate real week data
  const getRealWeekData = () => {
    // Group allAttendance by date
    const attendanceByDate = allAttendance.reduce((acc, record) => {
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
`;

code = code.replace(
  /\/\/ Weekly days data[\s\S]*?const avgRate = Math\.round[^\n]*;/m,
  replacement.trim()
);

// Replace "5 Classes" with actual count
code = code.replace(
  '<div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading mt-1">5 Classes</div>',
  '<div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading mt-1">{weekDays.length} Classes</div>'
);

// We need to dynamically update the "Weekly Average Rate" and the "Higher than last week" dummy text.
code = code.replace(
  '<span className="text-xs text-emerald-500/80 mt-0.5 block font-medium">\n              +4.2% higher than last week\n            </span>',
  '<span className="text-xs text-emerald-500/80 mt-0.5 block font-medium">\n              Based on recent activity\n            </span>'
);

fs.writeFileSync('src/components/reports/WeeklyReportsView.tsx', code);
