import fs from 'fs';
let code = fs.readFileSync('src/context/AttendanceContext.tsx', 'utf8');

const targetUpdateSession = `    const updated: AttendanceSession = {
      ...activeSession,
      startTime: startTimeStr,
      endTime: endTimeStr,
      startEpoch: newStartEpoch,
      endEpoch: newEndEpoch,
    };`;

const newUpdateSession = `    const now = Date.now();
    const isNowWithinBounds = now >= newStartEpoch && now <= newEndEpoch;
    const updated: AttendanceSession = {
      ...activeSession,
      startTime: startTimeStr,
      endTime: endTimeStr,
      startEpoch: newStartEpoch,
      endEpoch: newEndEpoch,
      status: isNowWithinBounds ? 'active' : activeSession.status,
    };`;

if (code.includes(targetUpdateSession)) {
  code = code.replace(targetUpdateSession, newUpdateSession);
  fs.writeFileSync('src/context/AttendanceContext.tsx', code);
  console.log("Patched updateSessionTime");
} else {
  console.log("Failed to find target");
}
