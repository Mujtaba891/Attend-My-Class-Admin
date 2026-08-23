import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

const targetImport = `import { useAuth } from '../../context/AuthContext';`;
const newImport = `import { useAuth } from '../../context/AuthContext';\nimport { useAttendance } from '../../context/AttendanceContext';`;

if (code.includes(targetImport)) {
  code = code.replace(targetImport, newImport);
}

const targetUse = `  const { adminProfile, isMasterAdmin, logout, updateProfile } = useAuth();`;
const newUse = `  const { adminProfile, isMasterAdmin, logout, updateProfile } = useAuth();\n  const { updateSessionTime, activeSession } = useAttendance();`;

if (code.includes(targetUse)) {
  code = code.replace(targetUse, newUse);
}

const targetSave = `    updateProfile({ assignments: updatedAssignments });
    
    setIsSaved(true);`;
const newSave = `    updateProfile({ assignments: updatedAssignments });
    if (activeSession && activeSession.status !== 'closed') {
      updateSessionTime(startTime, endTime);
    } else if (activeSession) {
      updateSessionTime(startTime, endTime);
    }
    
    setIsSaved(true);`;

if (code.includes(targetSave)) {
  code = code.replace(targetSave, newSave);
}

fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
console.log("Patched SettingsView");
