import fs from 'fs';

// 1. TeacherProfileCard.tsx
let code = fs.readFileSync('src/components/settings/TeacherProfileCard.tsx', 'utf8');
code = code.replace(
  '<button className="w-full py-2.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-xs font-medium text-slate-300 mt-2">',
  '<button onClick={() => window.dispatchEvent(new CustomEvent("open-role-menu"))} className="w-full py-2.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-xs font-medium text-slate-300 mt-2">'
);
fs.writeFileSync('src/components/settings/TeacherProfileCard.tsx', code);

// 2. Navbar.tsx
let navbar = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');
navbar = navbar.replace(
  "const [showRoleMenu, setShowRoleMenu] = useState(false);",
  "const [showRoleMenu, setShowRoleMenu] = useState(false);\n\n  useEffect(() => {\n    const handleOpen = () => {\n      setShowRoleMenu(true);\n      window.scrollTo({ top: 0, behavior: 'smooth' });\n    };\n    window.addEventListener('open-role-menu', handleOpen);\n    return () => window.removeEventListener('open-role-menu', handleOpen);\n  }, []);"
);
// Import useEffect if not present (assuming it is, but let's check)
if (!navbar.includes('useEffect')) {
  navbar = navbar.replace("import React, { useState }", "import React, { useState, useEffect }");
}
fs.writeFileSync('src/components/layout/Navbar.tsx', navbar);
