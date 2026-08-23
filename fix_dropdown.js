import fs from 'fs';
let code = fs.readFileSync('src/components/reports/WeeklyReportsView.tsx', 'utf8');

code = code.replace(
  '          <select\n            value={selectedWeek}\n            onChange={e => setSelectedWeek(e.target.value)}\n            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"\n          >\n            <option>Week 3 (Aug 15 - Aug 19, 2026)</option>\n            <option>Week 2 (Aug 08 - Aug 12, 2026)</option>\n            <option>Week 1 (Aug 01 - Aug 05, 2026)</option>\n          </select>',
  '          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200">\n            Latest Activity\n          </div>'
);

fs.writeFileSync('src/components/reports/WeeklyReportsView.tsx', code);
