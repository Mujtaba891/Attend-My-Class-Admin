import fs from 'fs';
let code = fs.readFileSync('src/context/AttendanceContext.tsx', 'utf8');

// 1. Fix snapshot listener
const oldSnapshotListener = `              startEpoch: parseDateAndTimeToEpoch(data.date || '', data.startTime || '10:00 AM'),
              endEpoch: parseDateAndTimeToEpoch(data.date || '', data.endTime || '10:40 AM'),`;
const newSnapshotListener = `              startEpoch: data.startEpoch || parseDateAndTimeToEpoch(data.date || '', data.startTime || '10:00 AM'),
              endEpoch: data.endEpoch || parseDateAndTimeToEpoch(data.date || '', data.endTime || '10:40 AM'),`;
code = code.replace(oldSnapshotListener, newSnapshotListener);

// 2. Fix activeSession
const oldActiveSession = `  const activeSession = useMemo(() => {
    return sessions.find(s => s.status === 'active') || sessions.find(s => s.date === todayStr) || (sessions.length > 0 ? sessions[0] : null);
  }, [sessions, todayStr]);`;
const newActiveSession = `  const activeSession = useMemo(() => {
    const classSessions = sessions.filter(s => s.classId === currentClass.id);
    return classSessions.find(s => s.status === 'active') || classSessions.find(s => s.date === todayStr) || (classSessions.length > 0 ? classSessions[0] : null);
  }, [sessions, todayStr, currentClass.id]);`;
code = code.replace(oldActiveSession, newActiveSession);

// 3. Fix startSessionManually
const oldStartSession = `    if (activeSession) {
      sessionObj = {
        ...activeSession,
        status: 'active',
        startEpoch,
        endEpoch,
        token: activeSession.token || token,
      };`;
const newStartSession = `    if (activeSession && activeSession.date === sessionDate && activeSession.classId === currentClass.id) {
      sessionObj = {
        ...activeSession,
        status: 'active',
        startTime: currentClass.defaultStartTime || '10:00 AM',
        endTime: currentClass.defaultEndTime || '10:40 AM',
        startEpoch,
        endEpoch,
        token: activeSession.token || token,
      };`;
code = code.replace(oldStartSession, newStartSession);

fs.writeFileSync('src/context/AttendanceContext.tsx', code);
console.log("Patched AttendanceContext");
