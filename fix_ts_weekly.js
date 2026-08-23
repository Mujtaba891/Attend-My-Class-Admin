import fs from 'fs';
let code = fs.readFileSync('src/components/reports/WeeklyReportsView.tsx', 'utf8');

code = code.replace(
  'const attendanceByDate = allAttendance.reduce((acc, record) => {',
  'const attendanceByDate = allAttendance.reduce((acc: any, record: any) => {'
);

fs.writeFileSync('src/components/reports/WeeklyReportsView.tsx', code);
