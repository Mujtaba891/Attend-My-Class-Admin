import fs from 'fs';
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
code = code.replace(
  /className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col h-\[calc\(100vh-4rem\)\] sticky top-16 shrink-0 select-none overflow-y-auto"/g,
  'className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col h-full shrink-0 select-none overflow-y-auto sticky top-0"'
);
fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
