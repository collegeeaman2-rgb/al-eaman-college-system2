# Security Specification & Payload-First Security TDD
## Al EAMAN Muslim Ladies Arabic College Management System (Phase 1)

### 1. Core Data Invariants
1. **Single Principal Invariant**: At most one `/systemConfig/principal` document may ever exist. It can only be created once when it does not already exist, by the verified institutional owner email (`collegeeaman2@gmail.com`) with `email_verified == true`. Once written, it is immutable (`update: false, delete: false`).
2. **No Self-Activation or Self-Privilege Escalation**: Self-registered users in `/users/{userId}` and `/accountRequests/{requestId}` MUST have `status == 'pending'` and `role in ['officer', 'teacher', 'parent']`. Only the Principal can transition `status` to `'active'`, `'suspended'`, `'revoked'`, or `'rejected'`, or assign roles.
3. **No Self-Granted Permissions**: `/permissions/{userId}` can ONLY be created or updated by the Principal (`isPrincipal()`). Non-Principal users have read-only access to their own permission document.
4. **Parent Read-Only & Verified-Child Invariant**: Users with `role == 'parent'` can NEVER hold `create`, `edit`, `delete`, or `approve` permissions on any module. Furthermore, a Parent can read a `/demoStudents/{studentId}` record ONLY if `/parentChildLinks/{parentUid}_{studentId}` exists with `status == 'verified'`.
5. **PII Isolation**: `/users/{userId}` and `/accountRequests/{requestId}` contain PII (`email`, `phone`, `fullName`). Reads and queries are strictly restricted to the document owner (`uid == request.auth.uid`) or the Principal.
6. **Immutable Audit Trail**: `/auditLogs/{logId}` is append-only (`update: false, delete: false`). Administrative audit actions (`account_approved`, `permissions_updated`, etc.) can only be written by the Principal.
7. **Default-Deny Catch-All**: All unmatched paths are explicitly denied (`allow read, write: if false;`).
8. **Temporal & Schema Integrity**: Every create validates `createdAt == request.time`, strict `keys().hasAll(...) && keys().hasOnly(...)`, type checks, regex ID validation, and string maxLength limits.

### 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unverified Email Spoof (`P1`)**: User with `email: "collegeeaman2@gmail.com"` and `email_verified: false` attempts to initialize `/systemConfig/principal`.
2. **Second Principal Takeover (`P2`)**: An attacker attempts to overwrite or update `/systemConfig/principal` after initialization.
3. **Self-Activation Bypass (`P3`)**: Applicant creates `/users/{uid}` with `status: "active"` instead of `"pending"`.
4. **Self-Role Escalation on Create (`P4`)**: Applicant creates `/users/{uid}` with `role: "principal"`.
5. **Shadow Update on User Profile (`P5`)**: Active Officer updates their own `/users/{uid}` sending `{ fullName: "Updated", status: "active", role: "principal" }`.
6. **Self-Permission Grant (`P6`)**: Officer or Teacher attempts to write `/permissions/{uid}` granting `userManagement.approve = true`.
7. **Parent Non-Read-Only Permission Injection (`P7`)**: Attempt to save a `/permissions/{parentUid}` where `role == 'parent'` and `studentRecords.edit == true`.
8. **Unverified Parent Reading Student Record (`P8`)**: Parent with `status == 'active'` but `parentChildLinks/{uid}_STU-2026-001` status `'pending'` attempts `get(/demoStudents/STU-2026-001)`.
9. **Parent Cross-Child Snooping (`P9`)**: Parent verified for `STU-2026-001` attempts `get(/demoStudents/STU-2026-002)`.
10. **PII Blanket List Scraping (`P10`)**: Active Teacher attempts `list` on `/users` or `/accountRequests` without Principal role.
11. **Audit Log Tampering (`P11`)**: Any user (even Principal) attempts `update` or `delete` on `/auditLogs/{logId}`; or Officer attempts to forge `action: "account_approved"` in `/auditLogs/{logId}`.
12. **Resource Poisoning / Oversized Payload (`P12`)**: Authenticated user attempts to create `/accountRequests/{1500_char_id}` or injects a 5KB `justification` string.
13. **Unauthorized College Asset Modification (`P13`)**: Permitted Officer with `collegeProfile.edit == true` attempts to overwrite `/collegeAssets/logo`, `/collegeAssets/seal`, or `/collegeAssets/signature` (only Principal may update official assets).
14. **Silent Overwrite Without Revision (`P14`)**: Principal or authorized staff attempts to update `/collegeProfile/official` without atomically creating the corresponding `/collegeProfileRevisions/{lastRevisionId}` entry and incrementing `version`.
15. **Parent College Profile / Seal Snooping & Editing (`P15`)**: Parent user attempts `get(/collegeAssets/seal)`, `get(/collegeAssets/signature)`, or `update(/collegeProfile/official)`.
16. **Revision History Tampering (`P16`)**: Any user (including Principal) attempts to `update` or `delete` `/collegeProfileRevisions/{revisionId}`.

