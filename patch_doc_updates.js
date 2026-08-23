import fs from 'fs';
let code = fs.readFileSync('src/context/AttendanceContext.tsx', 'utf8');

const targetDocUpdates = `      const docUpdates = {
        startTime: startTimeStr,
        endTime: endTimeStr,
        date: activeSession.date,
        startEpoch: newStartEpoch,
        endEpoch: newEndEpoch,
      };`;

const newDocUpdates = `      const docUpdates = {
        startTime: startTimeStr,
        endTime: endTimeStr,
        date: activeSession.date,
        startEpoch: newStartEpoch,
        endEpoch: newEndEpoch,
        status: updated.status,
      };`;

if (code.includes(targetDocUpdates)) {
  code = code.replace(targetDocUpdates, newDocUpdates);
  fs.writeFileSync('src/context/AttendanceContext.tsx', code);
  console.log("Patched docUpdates");
} else {
  console.log("Failed to find target");
}
