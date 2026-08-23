import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

code = code.replace(
  "+91 70000 00000",
  "{adminProfile.phone || '+91 70000 00000'}"
);

code = code.replace(
  "Employee ID: GEO-FAC-012",
  "Employee ID: {adminProfile.employeeId || 'GEO-FAC-012'}"
);

fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
