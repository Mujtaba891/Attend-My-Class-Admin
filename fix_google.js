import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const targetLoginGoogle = `        const profileData: AdminUser = {
          uid: u.uid,
          email: u.email || 'faculty@college.edu',
          name: u.displayName || u.email?.split('@')[0] || 'Google Faculty User',
          role,
          department: 'Department of Academic Studies',
          assignedSubject: 'Core Subject (Theory & Lab)',
          assignedClass: 'Semester IV - Section A',
          assignedRoom: 'Lecture Hall 204',
          assignments: [{
            id: \`assign_\${Date.now()}\`,
            subject: 'Core Subject (Theory & Lab)',
            className: 'Semester IV - Section A',
            room: 'Lecture Hall 204'
          }],
          permissions,
          avatarUrl: u.photoURL || '',
          createdAt: now,
          updatedAt: now,
        };

        // Persist to Firestore /users/{uid} and /admins/{uid}
        try {
          await setDoc(doc(db, 'users', u.uid), {
            ...profileData,
            lastLoginAt: now,
          }, { merge: true });
          await setDoc(doc(db, 'admins', u.uid), {
            ...profileData,
            lastLoginAt: now,
          }, { merge: true });
        } catch (firestoreErr) {
          console.warn('Firestore user persistence notice:', firestoreErr);
        }`;

const newLoginGoogle = `        let profileData: AdminUser = {
          uid: u.uid,
          email: u.email || 'faculty@college.edu',
          name: u.displayName || u.email?.split('@')[0] || 'Google Faculty User',
          role,
          department: 'Department of Academic Studies',
          assignedSubject: 'Core Subject (Theory & Lab)',
          assignedClass: 'Semester IV - Section A',
          assignedRoom: 'Lecture Hall 204',
          assignments: [{
            id: \`assign_\${Date.now()}\`,
            subject: 'Core Subject (Theory & Lab)',
            className: 'Semester IV - Section A',
            room: 'Lecture Hall 204'
          }],
          permissions,
          avatarUrl: u.photoURL || '',
          createdAt: now,
          updatedAt: now,
        };

        // Persist to Firestore /users/{uid} and /admins/{uid}
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const existingDoc = await getDoc(userDocRef);
          if (existingDoc.exists()) {
             const existingData = existingDoc.data();
             profileData = { ...profileData, ...existingData, updatedAt: now };
          }
          await setDoc(userDocRef, {
            ...profileData,
            lastLoginAt: now,
          }, { merge: true });
          await setDoc(doc(db, 'admins', u.uid), {
            ...profileData,
            lastLoginAt: now,
          }, { merge: true });
        } catch (firestoreErr) {
          console.warn('Firestore user persistence notice:', firestoreErr);
        }`;

if (code.includes(targetLoginGoogle)) {
  code = code.replace(targetLoginGoogle, newLoginGoogle);
  console.log("Patched loginWithGoogle");
  fs.writeFileSync('src/context/AuthContext.tsx', code);
} else {
  console.log("Could not find target block for loginWithGoogle.");
}
