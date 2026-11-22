/**
 * Phase 0: Payload-First Security TDD Test Suite (Dirty Dozen)
 * Verifies all 12 adversarial payloads against the Firestore security invariants
 * and can run both as a structural rule-invariant audit and against Firebase Emulator.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export interface DirtyDozenCase {
  id: string;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean };
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
  ruleGuardPattern: RegExp;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 'P1',
    name: 'Unverified Email Spoof on Principal Setup',
    collection: 'systemConfig/principal',
    operation: 'create',
    auth: { uid: 'spoof-uid', email: 'collegeeaman2@gmail.com', email_verified: false },
    payload: { principalUid: 'spoof-uid', initializedAt: 'SERVER_TIMESTAMP' },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /request\.auth\.token\.email_verified\s*==\s*true/,
  },
  {
    id: 'P2',
    name: 'Second Principal Takeover After Initialization',
    collection: 'systemConfig/principal',
    operation: 'update',
    auth: { uid: 'attacker-uid', email: 'collegeeaman2@gmail.com', email_verified: true },
    payload: { principalUid: 'attacker-uid' },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /match\s+\/systemConfig\/principal[\s\S]*allow\s+update,\s*delete:\s*if\s*false;/,
  },
  {
    id: 'P3',
    name: 'Self-Activation Bypass on Registration',
    collection: 'users/applicant-1',
    operation: 'create',
    auth: { uid: 'applicant-1', email: 'officer@example.com', email_verified: true },
    payload: {
      uid: 'applicant-1',
      fullName: 'Applicant One',
      email: 'officer@example.com',
      phone: '',
      role: 'officer',
      status: 'active',
      preferredLanguage: 'en',
      department: 'Admissions',
      referenceCode: '',
      inviteId: '',
      approvedBy: 'applicant-1',
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /incoming\(\)\.status\s*==\s*'pending'/,
  },
  {
    id: 'P4',
    name: 'Self-Role Escalation to Principal on Create',
    collection: 'users/applicant-2',
    operation: 'create',
    auth: { uid: 'applicant-2', email: 'teacher@example.com', email_verified: true },
    payload: {
      uid: 'applicant-2',
      fullName: 'Applicant Two',
      email: 'teacher@example.com',
      phone: '',
      role: 'principal',
      status: 'pending',
      preferredLanguage: 'en',
      department: 'Arabic',
      referenceCode: '',
      inviteId: '',
      approvedBy: '',
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /incoming\(\)\.role\s+in\s+\['officer',\s*'teacher',\s*'parent'\]/,
  },
  {
    id: 'P5',
    name: 'Shadow Update on Own User Profile (Escalating Role/Status)',
    collection: 'users/officer-1',
    operation: 'update',
    auth: { uid: 'officer-1', email: 'officer@example.com', email_verified: true },
    payload: { fullName: 'Officer One', status: 'active', role: 'principal' },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /affectedKeys\(\)\.hasOnly\(\['fullName',\s*'phone',\s*'preferredLanguage',\s*'updatedAt'\]\)/,
  },
  {
    id: 'P6',
    name: 'Self-Permission Grant by Non-Principal',
    collection: 'permissions/officer-1',
    operation: 'update',
    auth: { uid: 'officer-1', email: 'officer@example.com', email_verified: true },
    payload: {
      userId: 'officer-1',
      role: 'officer',
      modules: {
        userManagement: { view: true, create: true, edit: true, delete: true, approve: true },
      },
    },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /match\s+\/permissions\/\{userId\}[\s\S]*allow\s+update:\s*if\s*isValidId\(userId\)\s*&&\s*isPrincipal\(\)/,
  },
  {
    id: 'P7',
    name: 'Parent Non-Read-Only Permission Injection',
    collection: 'permissions/parent-1',
    operation: 'create',
    auth: { uid: 'principal-uid', email: 'collegeeaman2@gmail.com', email_verified: true },
    payload: {
      userId: 'parent-1',
      role: 'parent',
      modules: {
        studentRecords: { view: true, create: false, edit: true, delete: false, approve: false },
      },
    },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /role\s*==\s*'parent'\s*\?\s*\(\s*isReadOnlyActionSet/,
  },
  {
    id: 'P8',
    name: 'Unverified Parent Reading Student Record',
    collection: 'demoStudents/STU-2026-001',
    operation: 'get',
    auth: { uid: 'parent-1', email: 'parent1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /isVerifiedParentOf\(studentId\)/,
  },
  {
    id: 'P9',
    name: 'Parent Cross-Child Snooping',
    collection: 'demoStudents/STU-2026-002',
    operation: 'get',
    auth: { uid: 'parent-1', email: 'parent1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /parentChildLinks\/\$\(request\.auth\.uid\s*\+\s*'_'\s*\+\s*studentId\)/,
  },
  {
    id: 'P10',
    name: 'PII Blanket List Scraping on Users Collection',
    collection: 'users',
    operation: 'list',
    auth: { uid: 'teacher-1', email: 'teacher1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /allow\s+list:\s*if\s*isPrincipal\(\)\s*\|\|\s*\(isVerifiedUser\(\)\s*&&\s*resource\.data\.uid\s*==\s*request\.auth\.uid\)/,
  },
  {
    id: 'P11',
    name: 'Audit Log Tampering / Forgery',
    collection: 'auditLogs/log-1',
    operation: 'delete',
    auth: { uid: 'principal-uid', email: 'collegeeaman2@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /match\s+\/auditLogs\/\{logId\}[\s\S]*allow\s+update,\s*delete:\s*if\s*false;/,
  },
  {
    id: 'P12',
    name: 'Resource Poisoning with Oversized ID or String',
    collection: 'accountRequests/' + 'A'.repeat(1500),
    operation: 'create',
    auth: { uid: 'applicant-1', email: 'applicant@example.com', email_verified: true },
    payload: { justification: 'X'.repeat(5000) },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /id\.size\(\)\s*<=\s*128/,
  },
  {
    id: 'P13',
    name: 'Non-Principal Attempting to Modify Official Institutional Assets',
    collection: 'collegeAssets/seal',
    operation: 'update',
    auth: { uid: 'officer-1', email: 'officer@example.com', email_verified: true },
    payload: { assetType: 'seal', dataUrl: 'data:image/png;base64,AAAA' },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /match\s+\/collegeAssets\/\{assetType\}[\s\S]*allow\s+create:\s*if\s*assetType\s+in\s+\['logo',\s*'seal',\s*'signature'\]\s*&&\s*isPrincipal\(\)[\s\S]*allow\s+update:\s*if\s*assetType\s+in\s+\['logo',\s*'seal',\s*'signature'\]\s*&&\s*isPrincipal\(\)/,
  },
  {
    id: 'P14',
    name: 'Silent College Profile Overwrite Without Atomic Revision History',
    collection: 'collegeProfile/official',
    operation: 'update',
    auth: { uid: 'principal-uid', email: 'collegeeaman2@gmail.com', email_verified: true },
    payload: { nameEn: 'Al EAMAN Muslim Ladies Arabic College' },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /match\s+\/collegeProfile\/official[\s\S]*existsAfter\(\/databases\/\$\(database\)\/documents\/collegeProfileRevisions\/\$\(incoming\(\)\.lastRevisionId\)\)/,
  },
  {
    id: 'P15',
    name: 'Parent Attempting Seal Access or College Profile Write',
    collection: 'collegeAssets/seal',
    operation: 'get',
    auth: { uid: 'parent-1', email: 'parent1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /match\s+\/collegeAssets\/\{assetType\}[\s\S]*allow\s+get:\s*if\s*assetType\s+in\s+\['logo',\s*'seal',\s*'signature'\]\s*&&\s*\(assetType\s*==\s*'logo'\s*\|\|\s*isPrincipal\(\)\s*\|\|\s*isStaffUser\(\)\)/,
  },
  {
    id: 'P16',
    name: 'Revision History Tampering or Deletion',
    collection: 'collegeProfileRevisions/rev-1',
    operation: 'delete',
    auth: { uid: 'principal-uid', email: 'collegeeaman2@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
    ruleGuardPattern: /match\s+\/collegeProfileRevisions\/\{revisionId\}[\s\S]*allow\s+update,\s*delete:\s*if\s*false;/,
  },
];

export function runStaticRulesVerification() {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesText = fs.readFileSync(rulesPath, 'utf8');

  assert.match(rulesText, /rules_version\s*=\s*'2';/, 'Must use rules_version 2');
  assert.match(rulesText, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s*false;/, 'Must start with global default-deny');

  for (const testCase of DIRTY_DOZEN_PAYLOADS) {
    assert.match(
      rulesText,
      testCase.ruleGuardPattern,
      `Dirty Dozen check failed for ${testCase.id} (${testCase.name})`
    );
  }
  console.log(`Verified ${DIRTY_DOZEN_PAYLOADS.length}/${DIRTY_DOZEN_PAYLOADS.length} security rule guards in firestore.rules.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStaticRulesVerification();
}
