const fs = require('fs');
let code = fs.readFileSync('src/components/settings/TeacherProfileCard.tsx', 'utf8');

const hookBlock = `  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, department });
    setIsEditingAccount(false);
  };`;

const newBlock = `  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, department });
    setIsEditingAccount(false);
  };

  const handleDeleteAssignment = (id: string) => {
    const updatedAssignments = assignments.filter(a => a.id !== id);
    setAssignments(updatedAssignments);
    updateProfile({ assignments: updatedAssignments });
  };`;

code = code.replace(hookBlock, newBlock);
fs.writeFileSync('src/components/settings/TeacherProfileCard.tsx', code);
