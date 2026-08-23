# Security Specification for Geology Attendance Admin System

## 1. Data Invariants
1. Only authenticated administrators (Admin, Teacher, CR) or the bootstrapped admin `mujtabaalam010@gmail.com` can perform administrative write operations on students, sessions, classes, logs, and correction approvals.
2. Students can only read their own student profile, submit their own correction requests (subject to 2/month limit check), and submit valid QR attendance if the session is active and their account is active (not locked/disabled).
3. Attendance sessions cannot be modified or forged by students.
4. Attendance status modifications must generate auditable activity logs.
5. Student accounts locked due to device mismatch can only be reactivated by Admins/Teachers.
6. The user email from runtime (`mujtabaalam010@gmail.com`) is bootstrapped as Master Admin.

## 2. The Dirty Dozen Payloads (Security Audit Tests)
1. **Unauthenticated Admin Write**: Attacker sends write to `/classes/geology` without Firebase Auth -> Rejected (`PERMISSION_DENIED`).
2. **Student Escalation**: Regular user attempts to write to `/admins/{uid}` claiming role="admin" -> Rejected (`PERMISSION_DENIED`).
3. **Ghost Field Poisoning**: Client attempts to update a Student record with extra unvalidated fields (`isAdmin: true`, `backdoor: "xyz"`) -> Rejected.
4. **ID Injection & Length Attack**: Malicious client sends a 200KB junk ID to `/attendance/{id}` -> Rejected by `isValidId()`.
5. **Self-Reactivation by Locked Student**: Locked student attempts to update `accountStatus: "active"` directly -> Rejected.
6. **Forged Attendance Session Creation**: Non-admin attempts to create a fake session in `/attendanceSessions` -> Rejected.
7. **Session QR Token Tampering**: Unprivileged user attempts to modify `token` in an active session -> Rejected.
8. **Direct Log Manipulation**: User tries to delete or modify `/activityLogs/{logId}` -> Rejected (Immutable audit trail).
9. **Correction Request Limit Bypass**: Submitting requests with invalid `monthKey` or modifying another student's correction -> Rejected.
10. **Spoofed Email Access**: User with unverified or mismatched email attempts to access `/admins` -> Rejected.
11. **Premature Session Manipulation**: Editing a closed session's attendance without proper admin privileges -> Rejected.
12. **Cross-Student Data Modification**: Student A attempts to mark Student B's attendance via mismatched `studentId` -> Rejected.
