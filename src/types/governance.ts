export type LanguageCode = 'en' | 'ta' | 'ar';

export type UserRole = 'principal' | 'officer' | 'teacher' | 'parent';
export type AssignableRole = 'officer' | 'teacher' | 'parent';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'revoked' | 'rejected';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type ParentLinkStatus = 'pending' | 'verified' | 'rejected' | 'revoked';
export type ParentRelationship = 'mother' | 'father' | 'legal_guardian';

export type ModuleKey =
  | 'userManagement'
  | 'permissionsGovernance'
  | 'parentVerification'
  | 'auditCompliance'
  | 'studentRecords'
  | 'collegeProfile'
  | 'academicOverview';

export type ActionKey = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface ActionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

export type ModulePermissions = Record<ModuleKey, ActionPermissions>;

// Synchronized verbatim with firebase-blueprint.json
export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  SHA256_PATTERN: /^[a-f0-9]{64}$/,
  COLLEGE_CODE_PATTERN: /^[A-Z0-9-]+$/,
  UID_MAX: 128,
  FULL_NAME_MIN: 2,
  FULL_NAME_MAX: 120,
  EMAIL_MIN: 3,
  EMAIL_MAX: 160,
  PHONE_MAX: 32,
  DEPARTMENT_MAX: 100,
  REF_CODE_MAX: 64,
  JUSTIFICATION_MIN: 5,
  JUSTIFICATION_MAX: 500,
  REVIEW_NOTE_MAX: 500,
  LINK_NOTES_MAX: 300,
  SUMMARY_MAX: 400,
  COLLEGE_NAME_MIN: 2,
  COLLEGE_NAME_MAX: 160,
  SHORT_NAME_MAX: 32,
  ADDRESS_MAX: 300,
  CITY_MAX: 100,
  POSTAL_CODE_MAX: 24,
  WEBSITE_MAX: 200,
  REG_NUMBER_MAX: 100,
  INTRO_MAX: 1500,
  VISION_MISSION_MAX: 1000,
  REVISION_REASON_MAX: 400,
  ASSET_DATA_URL_MAX: 450000,
} as const;

export const MODULE_KEYS: ModuleKey[] = [
  'userManagement',
  'permissionsGovernance',
  'parentVerification',
  'auditCompliance',
  'studentRecords',
  'collegeProfile',
  'academicOverview',
];

export const ACTION_KEYS: ActionKey[] = ['view', 'create', 'edit', 'delete', 'approve'];

export const AUTHORIZED_BOOTSTRAP_EMAIL = 'collegeeaman2@gmail.com';

export const ORIGINAL_COLLEGE_LOGO_URL = '/assets/aistudio/1781688019967_907a1671.png';

export const OFFICIAL_COLLEGE_DEFAULTS = {
  nameEn: 'Al EAMAN Muslim Ladies Arabic College',
  nameTa: 'அல் ஈமான் முஸ்லிம் மகளிர் அரபிக் கல்லூரி',
  nameAr: 'كلية الإيمان العربية للبنات المسلمات',
  shortName: 'AL EAMAN',
  establishedYear: 2010,
  logoUrl: ORIGINAL_COLLEGE_LOGO_URL,
} as const;

export interface PublicSystemStatus {
  principalConfigured: boolean;
  collegeCode: string;
  initializedAt: unknown;
}

export interface PublicCollegeIdentity {
  nameEn: string;
  nameTa: string;
  nameAr: string;
  shortName: string;
  establishedYear: number;
  logoUrl: string;
  updatedAt: unknown;
}

export interface CollegeProfile {
  nameEn: string;
  nameTa: string;
  nameAr: string;
  shortName: string;
  establishedYear: number;
  addressEn: string;
  addressTa: string;
  addressAr: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode: string;
  telephone: string;
  alternateTelephone: string;
  email: string;
  website: string;
  registrationNumber: string;
  introductionEn: string;
  introductionTa: string;
  introductionAr: string;
  visionEn: string;
  visionTa: string;
  visionAr: string;
  missionEn: string;
  missionTa: string;
  missionAr: string;
  principalStaffId: string;
  version: number;
  lastRevisionId: string;
  createdBy: string;
  updatedBy: string;
  updatedByEmail: string;
  updatedByName: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export type CollegeAssetType = 'logo' | 'seal' | 'signature';

export interface CollegeAsset {
  assetType: CollegeAssetType;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  version: number;
  lastRevisionId: string;
  updatedBy: string;
  updatedByEmail: string;
  updatedAt: unknown;
}

export type CollegeRevisionTargetType =
  | 'profile'
  | 'asset_logo'
  | 'asset_seal'
  | 'asset_signature';

export interface CollegeProfileRevision {
  revisionId: string;
  targetType: CollegeRevisionTargetType;
  version: number;
  reason: string;
  changedFields: string[];
  previousSnapshot: Record<string, string | number | boolean | null>;
  newSnapshot: Record<string, string | number | boolean | null>;
  actorUid: string;
  actorEmail: string;
  actorName: string;
  actorRole: 'principal' | 'officer' | 'teacher';
  createdAt: unknown;
}

/**
 * Snapshot structure prepared for future PDF reports, official letters, and certificates
 * so issued documents retain historical college branding & details.
 */
export interface CollegeIdentitySnapshot {
  capturedAtIso: string;
  profileVersion: number;
  nameEn: string;
  nameTa: string;
  nameAr: string;
  shortName: string;
  establishedYear: number;
  addressEn: string;
  addressTa: string;
  addressAr: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode: string;
  telephone: string;
  alternateTelephone: string;
  email: string;
  website: string;
  registrationNumber: string;
  logoUrl: string;
  sealUrl: string;
  signatureUrl: string;
}

export interface UserAccount {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  preferredLanguage: LanguageCode;
  department: string;
  referenceCode: string;
  inviteId: string;
  approvedBy: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface PreApprovedInvite {
  inviteId: string;
  email: string;
  fullName: string;
  phone: string;
  role: AssignableRole;
  department: string;
  referenceCode: string;
  modules: ModulePermissions;
  status: 'invited' | 'claimed' | 'revoked';
  createdBy: string;
  claimedByUid: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface AccountRequest {
  id: string;
  requesterUid: string;
  fullName: string;
  email: string;
  phone: string;
  requestedRole: AssignableRole;
  department: string;
  justification: string;
  studentReferenceCode: string;
  studentNameClaim: string;
  status: RequestStatus;
  reviewedBy: string;
  reviewNote: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface PermissionProfile {
  userId: string;
  role: UserRole;
  modules: ModulePermissions;
  updatedBy: string;
  updatedAt: unknown;
}

export interface DemoStudent {
  studentId: string;
  fullName: string;
  programLevel: string;
  enrollmentStatus: 'enrolled' | 'leave' | 'graduated';
  guardianHint: string;
  isDemoData: boolean;
  createdAt: unknown;
}

export interface ParentChildLink {
  linkId: string;
  parentUid: string;
  studentId: string;
  studentName: string;
  relationship: ParentRelationship;
  verificationCodeHash: string;
  status: ParentLinkStatus;
  verifiedBy: string;
  notes: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export type AuditAction =
  | 'principal_initialized'
  | 'account_requested'
  | 'account_approved'
  | 'account_rejected'
  | 'account_suspended'
  | 'account_reactivated'
  | 'account_revoked'
  | 'account_created_by_principal'
  | 'invite_claimed'
  | 'permissions_updated'
  | 'role_updated'
  | 'parent_link_requested'
  | 'parent_link_verified'
  | 'parent_link_revoked'
  | 'login_recorded'
  | 'college_profile_updated'
  | 'college_asset_updated';

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole | 'applicant';
  action: AuditAction;
  targetUid: string;
  targetResource: string;
  summary: string;
  createdAt: unknown;
}

export function createEmptyActionSet(): ActionPermissions {
  return { view: false, create: false, edit: false, delete: false, approve: false };
}

export function createFullActionSet(): ActionPermissions {
  return { view: true, create: true, edit: true, delete: true, approve: true };
}

export function createEmptyModules(): ModulePermissions {
  return {
    userManagement: createEmptyActionSet(),
    permissionsGovernance: createEmptyActionSet(),
    parentVerification: createEmptyActionSet(),
    auditCompliance: createEmptyActionSet(),
    studentRecords: createEmptyActionSet(),
    collegeProfile: createEmptyActionSet(),
    academicOverview: createEmptyActionSet(),
  };
}

export function createFullPrincipalModules(): ModulePermissions {
  return {
    userManagement: createFullActionSet(),
    permissionsGovernance: createFullActionSet(),
    parentVerification: createFullActionSet(),
    auditCompliance: createFullActionSet(),
    studentRecords: createFullActionSet(),
    collegeProfile: createFullActionSet(),
    academicOverview: createFullActionSet(),
  };
}

export function createDefaultModulesForRole(role: AssignableRole): ModulePermissions {
  const base = createEmptyModules();
  base.collegeProfile = { view: true, create: false, edit: false, delete: false, approve: false };
  if (role === 'parent') {
    base.studentRecords = { view: true, create: false, edit: false, delete: false, approve: false };
  }
  return base;
}

export function normalizeModulePermissions(
  modules?: Partial<ModulePermissions> | null
): ModulePermissions {
  const base = createEmptyModules();
  if (!modules) return base;
  for (const key of MODULE_KEYS) {
    const existing = modules[key];
    if (existing) {
      base[key] = {
        view: Boolean(existing.view),
        create: Boolean(existing.create),
        edit: Boolean(existing.edit),
        delete: Boolean(existing.delete),
        approve: Boolean(existing.approve),
      };
    }
  }
  return base;
}

export function enforceParentReadOnlyModules(modules: ModulePermissions): ModulePermissions {
  const normalized = normalizeModulePermissions(modules);
  const next = createEmptyModules();
  for (const modKey of MODULE_KEYS) {
    next[modKey] = {
      view: Boolean(normalized[modKey]?.view),
      create: false,
      edit: false,
      delete: false,
      approve: false,
    };
  }
  return next;
}

export function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export async function sha256Hex(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
