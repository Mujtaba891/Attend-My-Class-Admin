import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

// Fix loginWithEmail
const targetLoginWithEmail = `        const adminData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          name: data.name || firebaseUser.displayName,
          role,
          department: data.department,
          assignedSubject: data.assignedSubject,
          assignedSubjectType: data.assignedSubjectType,
          assignedClass: data.assignedClass,
          assignedRoom: data.assignedRoom,
          assignments: data.assignments,
          permissions: data.permissions,
          avatarUrl: firebaseUser.photoURL || data.avatarUrl,
          createdAt: data.createdAt,
          updatedAt: new Date().toISOString(),
        };`;

const newLoginWithEmail = `        const adminData = {
          ...data,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          name: data.name || firebaseUser.displayName,
          role,
          department: data.department,
          assignedSubject: data.assignedSubject,
          assignedSubjectType: data.assignedSubjectType,
          assignedClass: data.assignedClass,
          assignedRoom: data.assignedRoom,
          assignments: data.assignments,
          permissions: data.permissions,
          avatarUrl: firebaseUser.photoURL || data.avatarUrl,
          createdAt: data.createdAt,
          updatedAt: new Date().toISOString(),
        } as any;`;

if (code.includes(targetLoginWithEmail)) {
  code = code.replace(targetLoginWithEmail, newLoginWithEmail);
  console.log("Patched loginWithEmail");
}

// Fix loginAsFaculty
const targetLoginAsFaculty = `      const now = new Date().toISOString();
      let existingAssignments = [];
      let profileData = null;
      try {
        const existingDoc = await getDoc(doc(db, 'users', authUid));
        if (existingDoc.exists()) {
           existingAssignments = existingDoc.data().assignments || [];
        }
      } catch(e) {}
      
      const newAssignment = {
        id: \`assign_\${Date.now()}\`,
        subject: payload.assignedSubject || 'Core Subject (Theory & Lab)',
        subjectType: payload.assignedSubjectType || 'All',
        className: payload.assignedClass || 'Semester IV - Section A',
        room: payload.assignedRoom || 'Lecture Hall 204'
      };
      
      const isDuplicate = existingAssignments.some(a => 
        a.subject === newAssignment.subject && a.className === newAssignment.className && (a.subjectType || 'All') === (newAssignment.subjectType || 'All')
      );
      
      if (!isDuplicate && payload.assignedSubject) {
        existingAssignments.push(newAssignment);
      }
      
      if (existingAssignments.length === 0) {
        existingAssignments.push(newAssignment);
      }

      profileData = {
        uid: authUid,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        department: payload.department || 'Department of Academic Studies',
        assignedSubject: payload.assignedSubject || existingAssignments[existingAssignments.length-1].subject,
        assignedSubjectType: payload.assignedSubjectType || existingAssignments[existingAssignments.length-1].subjectType || 'All',
        assignedClass: payload.assignedClass || existingAssignments[existingAssignments.length-1].className,
        assignedRoom: payload.assignedRoom || existingAssignments[existingAssignments.length-1].room,
        assignments: existingAssignments,
        permissions,
        createdAt: now,
        updatedAt: now,
      };`;

const newLoginAsFaculty = `      const now = new Date().toISOString();
      let existingAssignments = [];
      let existingData = {};
      let profileData = null;
      try {
        const existingDoc = await getDoc(doc(db, 'users', authUid));
        if (existingDoc.exists()) {
           existingData = existingDoc.data() || {};
           existingAssignments = existingData.assignments || [];
        }
      } catch(e) {}
      
      const newAssignment = {
        id: \`assign_\${Date.now()}\`,
        subject: payload.assignedSubject || 'Core Subject (Theory & Lab)',
        subjectType: payload.assignedSubjectType || 'All',
        className: payload.assignedClass || 'Semester IV - Section A',
        room: payload.assignedRoom || 'Lecture Hall 204'
      };
      
      const isDuplicate = existingAssignments.some(a => 
        a.subject === newAssignment.subject && a.className === newAssignment.className && (a.subjectType || 'All') === (newAssignment.subjectType || 'All')
      );
      
      if (!isDuplicate && payload.assignedSubject) {
        existingAssignments.push(newAssignment);
      }
      
      if (existingAssignments.length === 0) {
        existingAssignments.push(newAssignment);
      }

      profileData = {
        ...existingData,
        uid: authUid,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        department: payload.department || 'Department of Academic Studies',
        assignedSubject: payload.assignedSubject || existingAssignments[existingAssignments.length-1].subject,
        assignedSubjectType: payload.assignedSubjectType || existingAssignments[existingAssignments.length-1].subjectType || 'All',
        assignedClass: payload.assignedClass || existingAssignments[existingAssignments.length-1].className,
        assignedRoom: payload.assignedRoom || existingAssignments[existingAssignments.length-1].room,
        assignments: existingAssignments,
        permissions,
        createdAt: existingData.createdAt || now,
        updatedAt: now,
      } as any;`;

if (code.includes(targetLoginAsFaculty)) {
  code = code.replace(targetLoginAsFaculty, newLoginAsFaculty);
  console.log("Patched loginAsFaculty");
}

fs.writeFileSync('src/context/AuthContext.tsx', code);
