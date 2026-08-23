import fs from 'fs';
let code = fs.readFileSync('src/context/AttendanceContext.tsx', 'utf8');

const targetCurrentClass = `  const currentClass = useMemo(() => classes.find(c => c.id === 'core_class') || classes[0], [classes]);`;

const newCurrentClass = `  const currentClass = useMemo(() => {
    const baseClass = classes.find(c => c.id === 'core_class') || classes[0];
    
    if (!adminProfile || !adminProfile.assignedSubject) return baseClass;

    const currentAssignment = adminProfile.assignments?.find(a => 
      a.subject === adminProfile.assignedSubject && 
      (a.subjectType || 'All') === (adminProfile.assignedSubjectType || 'All')
    ) || adminProfile.assignments?.[0];

    if (currentAssignment) {
      return {
        ...baseClass,
        name: currentAssignment.subjectType ? \`\${currentAssignment.subjectType} Course\` : baseClass.name,
        paperName: currentAssignment.subject,
        room: currentAssignment.room || baseClass.room,
        defaultStartTime: currentAssignment.startTime || baseClass.defaultStartTime,
        defaultEndTime: currentAssignment.endTime || baseClass.defaultEndTime,
        durationMinutes: currentAssignment.duration || baseClass.durationMinutes,
      };
    }
    
    return baseClass;
  }, [classes, adminProfile]);`;

if (code.includes(targetCurrentClass)) {
  code = code.replace(targetCurrentClass, newCurrentClass);
  fs.writeFileSync('src/context/AttendanceContext.tsx', code);
  console.log("Successfully patched currentClass");
} else {
  console.log("Could not find target CurrentClass");
}
