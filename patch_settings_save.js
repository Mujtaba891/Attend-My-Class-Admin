import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

const targetUseEffect = `  useEffect(() => {
    const saved = localStorage.getItem('class_config');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.startTime) setStartTime(data.startTime);
      if (data.endTime) setEndTime(data.endTime);
      if (data.duration) setDuration(data.duration);
      if (data.room) setRoom(data.room);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('class_config', JSON.stringify({ startTime, endTime, duration, room }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };`;

const newUseEffect = `  const currentAssignment = adminProfile.assignments?.find(a => 
    a.subject === adminProfile.assignedSubject && 
    (a.subjectType || 'All') === (adminProfile.assignedSubjectType || 'All')
  ) || adminProfile.assignments?.[0];

  useEffect(() => {
    if (currentAssignment) {
      setStartTime(currentAssignment.startTime || '10:00 AM');
      setEndTime(currentAssignment.endTime || '10:40 AM');
      setDuration(currentAssignment.duration || 40);
      setRoom(currentAssignment.room || adminProfile.assignedRoom || 'Lecture Hall 204');
    }
  }, [currentAssignment]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAssignments = [...(adminProfile.assignments || [])];
    const index = updatedAssignments.findIndex(a => 
      a.subject === adminProfile.assignedSubject && 
      (a.subjectType || 'All') === (adminProfile.assignedSubjectType || 'All')
    );
    
    if (index >= 0) {
      updatedAssignments[index] = { ...updatedAssignments[index], startTime, endTime, duration, room };
    } else {
      updatedAssignments.push({
        id: \`assign_\${Date.now()}\`,
        subject: adminProfile.assignedSubject || 'Core Subject',
        subjectType: adminProfile.assignedSubjectType || 'Major',
        className: adminProfile.assignedClass || 'Semester IV',
        room,
        startTime,
        endTime,
        duration
      });
    }

    updateProfile({ assignments: updatedAssignments });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };`;

if (code.includes(targetUseEffect)) {
  code = code.replace(targetUseEffect, newUseEffect);
  fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
  console.log("Successfully patched SettingsView");
} else {
  console.log("Could not find target in SettingsView");
}
