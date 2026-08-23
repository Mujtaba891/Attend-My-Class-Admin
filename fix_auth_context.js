import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const targetToReplace = `            setAdminProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || data.email || 'faculty@college.edu',
              name: data.name || firebaseUser.displayName || 'Academic Faculty',
              role,
              department: data.department || 'Department of Academic Studies',
              assignedSubject: data.assignedSubject || 'Core Subject (Theory & Lab)',
              assignedClass: data.assignedClass || 'Semester IV - Section A',
              assignedRoom: data.assignedRoom || 'Lecture Hall 204',
              assignments: data.assignments || [{
                id: \`assign_\${Date.now()}\`,
                subject: data.assignedSubject || 'Core Subject (Theory & Lab)',
                className: data.assignedClass || 'Semester IV - Section A',
                room: data.assignedRoom || 'Lecture Hall 204'
              }],
              permissions: data.permissions || (role === 'admin' ? ['all'] : ['manage_sessions', 'mark_attendance']),
              avatarUrl: firebaseUser.photoURL || data.avatarUrl,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });`;

const newCode = `            setAdminProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || data.email || 'faculty@college.edu',
              name: data.name || firebaseUser.displayName || 'Academic Faculty',
              role,
              department: data.department || 'Department of Academic Studies',
              phone: data.phone,
              employeeId: data.employeeId,
              designation: data.designation,
              officeLocation: data.officeLocation,
              bio: data.bio,
              assignedSubject: data.assignedSubject || 'Core Subject (Theory & Lab)',
              assignedSubjectType: data.assignedSubjectType || 'Major',
              assignedClass: data.assignedClass || 'Semester IV - Section A',
              assignedRoom: data.assignedRoom || 'Lecture Hall 204',
              assignments: data.assignments || [{
                id: \`assign_\${Date.now()}\`,
                subject: data.assignedSubject || 'Core Subject (Theory & Lab)',
                className: data.assignedClass || 'Semester IV - Section A',
                room: data.assignedRoom || 'Lecture Hall 204'
              }],
              permissions: data.permissions || (role === 'admin' ? ['all'] : ['manage_sessions', 'mark_attendance']),
              avatarUrl: firebaseUser.photoURL || data.avatarUrl,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });`;

if (code.includes(targetToReplace)) {
  code = code.replace(targetToReplace, newCode);
  fs.writeFileSync('src/context/AuthContext.tsx', code);
  console.log("Successfully updated onAuthStateChanged!");
} else {
  console.log("Could not find the target code to replace. Let me check the exact formatting.");
}
