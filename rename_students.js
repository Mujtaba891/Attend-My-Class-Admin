import fs from 'fs';

let code = fs.readFileSync('src/context/AttendanceContext.tsx', 'utf8');

// 1. Rename the state declaration
code = code.replace(
  "const [students, setStudents] = useState<Student[]>(() => {",
  "const [rawStudents, setRawStudents] = useState<Student[]>(() => {"
);

// 2. Replace setStudents with setRawStudents
code = code.replaceAll('setStudents', 'setRawStudents');

// 3. Fix the useEffect for localStorage
code = code.replace(
  "localStorage.setItem('amc_students', JSON.stringify(students));\n  }, [students]);",
  "localStorage.setItem('amc_students', JSON.stringify(rawStudents));\n  }, [rawStudents]);"
);

// 4. Inject the `students` useMemo right after the rawStudents initialization
const injection = `
  const students = useMemo(() => {
    if (!adminProfile || adminProfile.role === 'admin' || !adminProfile.assignedSubject) {
      return rawStudents;
    }
    
    const subject = adminProfile.assignedSubject;
    const type = adminProfile.assignedSubjectType;

    return rawStudents.filter(student => {
      if (type === 'Major') return student.major === subject;
      if (type === 'Minor') return student.minor === subject;
      if (type === 'MDC') return student.mdc === subject;
      if (type === 'Skills') return student.skills === subject;
      if (type === 'AEC') return student.aec === subject;
      if (type === 'VAC 1') return student.vac1 === subject;
      if (type === 'VAC 2') return student.vac2 === subject;
      if (type === 'All') {
        return (
          student.major === subject ||
          student.minor === subject ||
          student.mdc === subject ||
          student.skills === subject ||
          student.aec === subject ||
          student.vac1 === subject ||
          student.vac2 === subject
        );
      }
      return true; // Fallback
    });
  }, [rawStudents, adminProfile]);
`;

code = code.replace(
  "  });\n\n  const [sessions, setSessions] = useState",
  "  });\n" + injection + "\n  const [sessions, setSessions] = useState"
);

fs.writeFileSync('src/context/AttendanceContext.tsx', code);
