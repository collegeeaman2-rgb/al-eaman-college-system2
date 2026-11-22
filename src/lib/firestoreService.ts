import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  writeBatch,
  type FirestoreError,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  BLUEPRINT_LIMITS,
  clampString,
  createDefaultModulesForRole,
  createFullPrincipalModules,
  enforceParentReadOnlyModules,
  sha256Hex,
  type AccountRequest,
  type ActionKey,
  type AssignableRole,
  type AuditAction,
  type LanguageCode,
  type ModuleKey,
  type ModulePermissions,
  type ParentRelationship,
  type PreApprovedInvite,
  type PublicSystemStatus,
  type UserAccount,
  type UserRole,
} from '../types/governance';

async function getBearerHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be signed in.');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function validatePasswordOnServer(
  password: string,
  email?: string
): Promise<{ valid: boolean; score: number; issues: string[] }> {
  const res = await fetch('/api/security/validate-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, email }),
  });
  return res.json();
}

export async function verifyServerSession(): Promise<{
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAuthorizedBootstrapOwner: boolean;
}> {
  const headers = await getBearerHeaders();
  const res = await fetch('/api/auth/session', { headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || 'Server session verification failed.');
  }
  return res.json();
}

export async function hashVerificationCodeOnServer(code: string): Promise<string> {
  const headers = await getBearerHeaders();
  const res = await fetch('/api/security/hash-verification-code', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });
  const data = (await res.json()) as { hash?: string; error?: string };
  if (!res.ok || !data.hash) {
    throw new Error(data.error || 'Failed to hash verification code.');
  }
  return data.hash;
}

export async function verifyCodeOnServer(code: string, storedHash: string): Promise<boolean> {
  const headers = await getBearerHeaders();
  const res = await fetch('/api/security/verify-code', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, storedHash }),
  });
  const data = (await res.json()) as { matched?: boolean };
  return Boolean(data.matched);
}

export async function authorizeActionOnServer(params: {
  role: UserRole;
  status: string;
  modules: ModulePermissions | null;
  moduleKey: ModuleKey;
  action: ActionKey;
  isParentChildVerified?: boolean;
}): Promise<void> {
  const headers = await getBearerHeaders();
  const res = await fetch('/api/auth/authorize-action', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as { allowed?: boolean; reason?: string };
  if (!res.ok || !data.allowed) {
    throw new Error(data.reason || 'Server authorization denied this action.');
  }
}

export async function fetchPublicSystemStatus(): Promise<PublicSystemStatus | null> {
  const path = 'systemConfig/publicStatus';
  try {
    const snap = await getDocFromServer(doc(db, 'systemConfig', 'publicStatus'));
    if (!snap.exists()) return null;
    return snap.data() as PublicSystemStatus;
  } catch (error) {
    const fbErr = error as FirestoreError;
    if (fbErr?.code === 'permission-denied' || fbErr?.code === 'not-found') {
      // If publicStatus doesn't exist yet, rules return permission-denied or null depending on read rule
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function initializeOneTimePrincipal(params: {
  fullName: string;
  phone: string;
  preferredLanguage: LanguageCode;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) {
    throw new Error('A verified Firebase user session is required.');
  }

  // Server-side one-time ceremony issuance & verification
  const headers = await getBearerHeaders();
  const issueRes = await fetch('/api/bootstrap/issue-ceremony', { method: 'POST', headers });
  const issueData = (await issueRes.json()) as { nonce?: string; error?: string };
  if (!issueRes.ok || !issueData.nonce) {
    throw new Error(issueData.error || 'Could not initiate Principal bootstrap ceremony.');
  }

  const confirmRes = await fetch('/api/bootstrap/confirm-ceremony', {
    method: 'POST',
    headers,
    body: JSON.stringify({ nonce: issueData.nonce }),
  });
  const confirmData = (await confirmRes.json()) as { verified?: boolean; error?: string };
  if (!confirmRes.ok || !confirmData.verified) {
    throw new Error(confirmData.error || 'Server bootstrap ceremony verification failed.');
  }

  const safeName = clampString(params.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX);
  if (safeName.length < BLUEPRINT_LIMITS.FULL_NAME_MIN) {
    throw new Error('Full name must be at least 2 characters.');
  }
  const safePhone = clampString(params.phone, BLUEPRINT_LIMITS.PHONE_MAX);
  const logRef = doc(collection(db, 'auditLogs'));
  const batch = writeBatch(db);

  batch.set(doc(db, 'systemConfig', 'publicStatus'), {
    principalConfigured: true,
    collegeCode: 'ALEAMAN-01',
    initializedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'systemConfig', 'principal'), {
    principalUid: user.uid,
    initializedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'users', user.uid), {
    uid: user.uid,
    fullName: safeName,
    email: clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    phone: safePhone,
    role: 'principal',
    status: 'active',
    preferredLanguage: params.preferredLanguage,
    department: 'Principal Office',
    referenceCode: 'PRIN-001',
    inviteId: '',
    approvedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'permissions', user.uid), {
    userId: user.uid,
    role: 'principal',
    modules: createFullPrincipalModules(),
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  });

  batch.set(logRef, {
    actorUid: user.uid,
    actorEmail: clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: 'principal',
    action: 'principal_initialized' satisfies AuditAction,
    targetUid: user.uid,
    targetResource: `systemConfig/principal`,
    summary: clampString(`One-time primary Principal initialized for ${user.email}`, BLUEPRINT_LIMITS.SUMMARY_MAX),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'systemConfig/principal');
  }
}

export async function submitAccountRequest(params: {
  fullName: string;
  phone: string;
  requestedRole: AssignableRole;
  department: string;
  justification: string;
  studentReferenceCode: string;
  studentNameClaim: string;
  preferredLanguage: LanguageCode;
  hasExistingUserDoc: boolean;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) {
    throw new Error('Verified email is required before submitting an account request.');
  }

  const safeName = clampString(params.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX);
  const safePhone = clampString(params.phone, BLUEPRINT_LIMITS.PHONE_MAX);
  const safeDept = clampString(params.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX);
  const safeJust = clampString(params.justification, BLUEPRINT_LIMITS.JUSTIFICATION_MAX);
  const safeStuRef = clampString(params.studentReferenceCode, BLUEPRINT_LIMITS.REF_CODE_MAX);
  const safeStuName = clampString(params.studentNameClaim, BLUEPRINT_LIMITS.FULL_NAME_MAX);

  if (safeName.length < BLUEPRINT_LIMITS.FULL_NAME_MIN) {
    throw new Error('Full name must be at least 2 characters.');
  }
  if (safeJust.length < BLUEPRINT_LIMITS.JUSTIFICATION_MIN) {
    throw new Error('Please provide a brief justification (at least 5 characters).');
  }

  const batch = writeBatch(db);
  if (!params.hasExistingUserDoc) {
    batch.set(doc(db, 'users', user.uid), {
      uid: user.uid,
      fullName: safeName,
      email: clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX),
      phone: safePhone,
      role: params.requestedRole,
      status: 'pending',
      preferredLanguage: params.preferredLanguage,
      department: safeDept,
      referenceCode: safeStuRef,
      inviteId: '',
      approvedBy: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const reqRef = doc(collection(db, 'accountRequests'));
  batch.set(reqRef, {
    requesterUid: user.uid,
    fullName: safeName,
    email: clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    phone: safePhone,
    requestedRole: params.requestedRole,
    department: safeDept,
    justification: safeJust,
    studentReferenceCode: safeStuRef,
    studentNameClaim: safeStuName,
    status: 'pending',
    reviewedBy: '',
    reviewNote: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, 'auditLogs'));
  batch.set(logRef, {
    actorUid: user.uid,
    actorEmail: clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: 'applicant',
    action: 'account_requested' satisfies AuditAction,
    targetUid: user.uid,
    targetResource: `accountRequests/${reqRef.id}`,
    summary: clampString(
      `Submitted ${params.requestedRole} account request for ${safeName}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'accountRequests');
  }
}

export async function checkMyPreApprovedInvite(): Promise<PreApprovedInvite | null> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) return null;
  const inviteId = await sha256Hex(user.email);
  const path = `preApprovedInvites/${inviteId}`;
  try {
    const snap = await getDoc(doc(db, 'preApprovedInvites', inviteId));
    if (!snap.exists()) return null;
    const data = snap.data() as PreApprovedInvite;
    if (data.status !== 'invited') return null;
    return data;
  } catch (error) {
    const fbErr = error as FirestoreError;
    if (fbErr?.code === 'permission-denied' || fbErr?.code === 'not-found') {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function claimPreApprovedInvite(
  invite: PreApprovedInvite,
  preferredLanguage: LanguageCode
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) {
    throw new Error('Verified email required to claim invitation.');
  }

  const batch = writeBatch(db);
  batch.update(doc(db, 'preApprovedInvites', invite.inviteId), {
    status: 'claimed',
    claimedByUid: user.uid,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'users', user.uid), {
    uid: user.uid,
    fullName: clampString(invite.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX),
    email: clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    phone: clampString(invite.phone, BLUEPRINT_LIMITS.PHONE_MAX),
    role: invite.role,
    status: 'active',
    preferredLanguage,
    department: clampString(invite.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
    referenceCode: clampString(invite.referenceCode, BLUEPRINT_LIMITS.REF_CODE_MAX),
    inviteId: invite.inviteId,
    approvedBy: invite.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const enforcedModules =
    invite.role === 'parent' ? enforceParentReadOnlyModules(invite.modules) : invite.modules;

  batch.set(doc(db, 'permissions', user.uid), {
    userId: user.uid,
    role: invite.role,
    modules: enforcedModules,
    updatedBy: invite.createdBy,
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, 'auditLogs'));
  batch.set(logRef, {
    actorUid: user.uid,
    actorEmail: clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: invite.role,
    action: 'invite_claimed' satisfies AuditAction,
    targetUid: user.uid,
    targetResource: `preApprovedInvites/${invite.inviteId}`,
    summary: clampString(
      `${invite.email} activated pre-approved ${invite.role} account`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `preApprovedInvites/${invite.inviteId}`);
  }
}

export async function updateOwnLanguagePreference(
  userAccount: UserAccount,
  preferredLanguage: LanguageCode
): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.uid !== userAccount.uid) return;
  const path = `users/${user.uid}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', user.uid), {
      preferredLanguage,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function reviewAccountRequestAsPrincipal(params: {
  principal: UserAccount;
  request: AccountRequest;
  decision: 'approved' | 'rejected';
  reviewNote: string;
  initialModules?: ModulePermissions;
}): Promise<void> {
  await authorizeActionOnServer({
    role: params.principal.role,
    status: params.principal.status,
    modules: createFullPrincipalModules(),
    moduleKey: 'userManagement',
    action: 'approve',
  });

  const batch = writeBatch(db);
  const safeNote = clampString(params.reviewNote, BLUEPRINT_LIMITS.REVIEW_NOTE_MAX);

  batch.update(doc(db, 'accountRequests', params.request.id), {
    status: params.decision,
    reviewedBy: params.principal.uid,
    reviewNote: safeNote,
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'users', params.request.requesterUid), {
    status: params.decision === 'approved' ? 'active' : 'rejected',
    approvedBy: params.decision === 'approved' ? params.principal.uid : '',
    updatedAt: serverTimestamp(),
  });

  if (params.decision === 'approved') {
    const rawModules = params.initialModules ?? createDefaultModulesForRole(params.request.requestedRole);
    const finalModules =
      params.request.requestedRole === 'parent'
        ? enforceParentReadOnlyModules(rawModules)
        : rawModules;

    batch.set(doc(db, 'permissions', params.request.requesterUid), {
      userId: params.request.requesterUid,
      role: params.request.requestedRole,
      modules: finalModules,
      updatedBy: params.principal.uid,
      updatedAt: serverTimestamp(),
    });
  }

  const logRef = doc(collection(db, 'auditLogs'));
  batch.set(logRef, {
    actorUid: params.principal.uid,
    actorEmail: clampString(params.principal.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: 'principal',
    action: (params.decision === 'approved' ? 'account_approved' : 'account_rejected') satisfies AuditAction,
    targetUid: params.request.requesterUid,
    targetResource: `accountRequests/${params.request.id}`,
    summary: clampString(
      `${params.decision === 'approved' ? 'Approved' : 'Rejected'} ${params.request.requestedRole} request for ${params.request.email}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `accountRequests/${params.request.id}`);
  }
}

export async function createPreApprovedInviteAsPrincipal(params: {
  principal: UserAccount;
  email: string;
  fullName: string;
  phone: string;
  role: AssignableRole;
  department: string;
  referenceCode: string;
  modules: ModulePermissions;
}): Promise<void> {
  await authorizeActionOnServer({
    role: params.principal.role,
    status: params.principal.status,
    modules: createFullPrincipalModules(),
    moduleKey: 'userManagement',
    action: 'create',
  });

  const normalizedEmail = clampString(params.email.toLowerCase(), BLUEPRINT_LIMITS.EMAIL_MAX);
  const inviteId = await sha256Hex(normalizedEmail);
  const enforcedModules =
    params.role === 'parent' ? enforceParentReadOnlyModules(params.modules) : params.modules;

  const batch = writeBatch(db);
  batch.set(doc(db, 'preApprovedInvites', inviteId), {
    inviteId,
    email: normalizedEmail,
    fullName: clampString(params.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX),
    phone: clampString(params.phone, BLUEPRINT_LIMITS.PHONE_MAX),
    role: params.role,
    department: clampString(params.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
    referenceCode: clampString(params.referenceCode, BLUEPRINT_LIMITS.REF_CODE_MAX),
    modules: enforcedModules,
    status: 'invited',
    createdBy: params.principal.uid,
    claimedByUid: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, 'auditLogs'));
  batch.set(logRef, {
    actorUid: params.principal.uid,
    actorEmail: clampString(params.principal.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: 'principal',
    action: 'account_created_by_principal' satisfies AuditAction,
    targetUid: inviteId,
    targetResource: `preApprovedInvites/${inviteId}`,
    summary: clampString(
      `Created pre-approved ${params.role} account invite for ${normalizedEmail}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `preApprovedInvites/${inviteId}`);
  }
}

export async function changeUserLifecycleAsPrincipal(params: {
  principal: UserAccount;
  targetUser: UserAccount;
  nextStatus: 'active' | 'suspended' | 'revoked';
}): Promise<void> {
  if (params.targetUser.uid === params.principal.uid || params.targetUser.role === 'principal') {
    throw new Error('The primary Principal account cannot be suspended or revoked.');
  }

  await authorizeActionOnServer({
    role: params.principal.role,
    status: params.principal.status,
    modules: createFullPrincipalModules(),
    moduleKey: 'userManagement',
    action: 'edit',
  });

  const actionMap: Record<'active' | 'suspended' | 'revoked', AuditAction> = {
    active: 'account_reactivated',
    suspended: 'account_suspended',
    revoked: 'account_revoked',
  };

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', params.targetUser.uid), {
    status: params.nextStatus,
    approvedBy: params.principal.uid,
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, 'auditLogs'));
  batch.set(logRef, {
    actorUid: params.principal.uid,
    actorEmail: clampString(params.principal.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: 'principal',
    action: actionMap[params.nextStatus],
    targetUid: params.targetUser.uid,
    targetResource: `users/${params.targetUser.uid}`,
    summary: clampString(
      `Changed status of ${params.targetUser.email} to ${params.nextStatus}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${params.targetUser.uid}`);
  }
}

export async function updatePermissionsAndRoleAsPrincipal(params: {
  principal: UserAccount;
  targetUser: UserAccount;
  nextRole: AssignableRole;
  modules: ModulePermissions;
}): Promise<void> {
  if (params.targetUser.uid === params.principal.uid || params.targetUser.role === 'principal') {
    throw new Error('Cannot reassign or restrict the primary Principal account.');
  }

  await authorizeActionOnServer({
    role: params.principal.role,
    status: params.principal.status,
    modules: createFullPrincipalModules(),
    moduleKey: 'permissionsGovernance',
    action: 'edit',
  });

  const enforcedModules =
    params.nextRole === 'parent' ? enforceParentReadOnlyModules(params.modules) : params.modules;

  const batch = writeBatch(db);

  if (params.nextRole !== params.targetUser.role) {
    batch.update(doc(db, 'users', params.targetUser.uid), {
      role: params.nextRole,
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(db, 'permissions', params.targetUser.uid), {
    userId: params.targetUser.uid,
    role: params.nextRole,
    modules: enforcedModules,
    updatedBy: params.principal.uid,
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, 'auditLogs'));
  batch.set(logRef, {
    actorUid: params.principal.uid,
    actorEmail: clampString(params.principal.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: 'principal',
    action: 'permissions_updated' satisfies AuditAction,
    targetUid: params.targetUser.uid,
    targetResource: `permissions/${params.targetUser.uid}`,
    summary: clampString(
      `Updated ${params.nextRole} module/action permissions for ${params.targetUser.email}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `permissions/${params.targetUser.uid}`);
  }
}

export async function seedDemoStudentsAsPrincipal(principal: UserAccount): Promise<void> {
  await authorizeActionOnServer({
    role: principal.role,
    status: principal.status,
    modules: createFullPrincipalModules(),
    moduleKey: 'parentVerification',
    action: 'create',
  });

  const syntheticStudents = [
    {
      studentId: 'STU-DEMO-101',
      fullName: 'Demo Student A (Alimah Year 1)',
      programLevel: 'Alimah Year 1',
      enrollmentStatus: 'enrolled',
      guardianHint: 'Synthetic Dev Record #101',
    },
    {
      studentId: 'STU-DEMO-102',
      fullName: 'Demo Student B (Hifz Division)',
      programLevel: 'Hifz & Tajweed',
      enrollmentStatus: 'enrolled',
      guardianHint: 'Synthetic Dev Record #102',
    },
    {
      studentId: 'STU-DEMO-103',
      fullName: 'Demo Student C (Arabic Diploma)',
      programLevel: 'Arabic Language Diploma',
      enrollmentStatus: 'enrolled',
      guardianHint: 'Synthetic Dev Record #103',
    },
  ];

  const batch = writeBatch(db);
  for (const s of syntheticStudents) {
    batch.set(doc(db, 'demoStudents', s.studentId), {
      ...s,
      isDemoData: true,
      createdAt: serverTimestamp(),
    });
  }
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'demoStudents');
  }
}

export async function requestParentChildLink(params: {
  parentUser: UserAccount;
  studentId: string;
  studentName: string;
  relationship: ParentRelationship;
  verificationCode: string;
  notes: string;
}): Promise<void> {
  const safeStudentId = clampString(params.studentId, 64);
  if (!BLUEPRINT_LIMITS.ID_PATTERN.test(safeStudentId)) {
    throw new Error('Student ID may only contain letters, numbers, hyphens, and underscores.');
  }
  const codeHash = await hashVerificationCodeOnServer(params.verificationCode);
  const linkId = `${params.parentUser.uid}_${safeStudentId}`;

  const batch = writeBatch(db);
  batch.set(doc(db, 'parentChildLinks', linkId), {
    linkId,
    parentUid: params.parentUser.uid,
    studentId: safeStudentId,
    studentName: clampString(params.studentName, BLUEPRINT_LIMITS.FULL_NAME_MAX),
    relationship: params.relationship,
    verificationCodeHash: codeHash,
    status: 'pending',
    verifiedBy: '',
    notes: clampString(params.notes, BLUEPRINT_LIMITS.LINK_NOTES_MAX),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, 'auditLogs'));
  batch.set(logRef, {
    actorUid: params.parentUser.uid,
    actorEmail: clampString(params.parentUser.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: 'parent',
    action: 'parent_link_requested' satisfies AuditAction,
    targetUid: params.parentUser.uid,
    targetResource: `parentChildLinks/${linkId}`,
    summary: clampString(
      `Requested parent-child verification for student ${safeStudentId}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `parentChildLinks/${linkId}`);
  }
}

export async function verifyOrRevokeParentLinkAuthorized(params: {
  actor: UserAccount;
  modules: ModulePermissions | null;
  linkId: string;
  parentUid: string;
  studentId: string;
  studentName: string;
  relationship: ParentRelationship;
  nextStatus: 'verified' | 'rejected' | 'revoked';
  verificationCodeInput?: string;
  storedHash?: string;
  notes: string;
}): Promise<void> {
  const effectiveModules =
    params.actor.role === 'principal' ? createFullPrincipalModules() : params.modules;

  await authorizeActionOnServer({
    role: params.actor.role,
    status: params.actor.status,
    modules: effectiveModules,
    moduleKey: 'parentVerification',
    action: 'approve',
  });

  let finalHash = params.storedHash || 'PRINCIPAL_DIRECT_VERIFICATION';
  if (params.verificationCodeInput && params.verificationCodeInput.trim().length >= 6) {
    finalHash = await hashVerificationCodeOnServer(params.verificationCodeInput);
  }

  // If link existed before, use update semantics to respect immutable createdAt in rules
  const existingSnap = await getDoc(doc(db, 'parentChildLinks', params.linkId));
  const finalBatch = writeBatch(db);
  if (existingSnap.exists()) {
    finalBatch.update(doc(db, 'parentChildLinks', params.linkId), {
      status: params.nextStatus,
      verifiedBy: params.actor.uid,
      notes: clampString(params.notes, BLUEPRINT_LIMITS.LINK_NOTES_MAX),
      verificationCodeHash: finalHash,
      updatedAt: serverTimestamp(),
    });
  } else {
    finalBatch.set(doc(db, 'parentChildLinks', params.linkId), {
      linkId: params.linkId,
      parentUid: params.parentUid,
      studentId: params.studentId,
      studentName: clampString(params.studentName, BLUEPRINT_LIMITS.FULL_NAME_MAX),
      relationship: params.relationship,
      verificationCodeHash: finalHash,
      status: params.nextStatus,
      verifiedBy: params.actor.uid,
      notes: clampString(params.notes, BLUEPRINT_LIMITS.LINK_NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const logRef = doc(collection(db, 'auditLogs'));
  finalBatch.set(logRef, {
    actorUid: params.actor.uid,
    actorEmail: clampString(params.actor.email, BLUEPRINT_LIMITS.EMAIL_MAX),
    actorRole: params.actor.role,
    action: (params.nextStatus === 'verified' ? 'parent_link_verified' : 'parent_link_revoked') satisfies AuditAction,
    targetUid: params.parentUid,
    targetResource: `parentChildLinks/${params.linkId}`,
    summary: clampString(
      `Marked parent-child link ${params.linkId} as ${params.nextStatus}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await finalBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `parentChildLinks/${params.linkId}`);
  }
}

export async function verifyOrRevokeParentLinkAsPrincipal(params: {
  principal: UserAccount;
  linkId: string;
  parentUid: string;
  studentId: string;
  studentName: string;
  relationship: ParentRelationship;
  nextStatus: 'verified' | 'rejected' | 'revoked';
  verificationCodeInput?: string;
  storedHash?: string;
  notes: string;
}): Promise<void> {
  return verifyOrRevokeParentLinkAuthorized({
    actor: params.principal,
    modules: createFullPrincipalModules(),
    linkId: params.linkId,
    parentUid: params.parentUid,
    studentId: params.studentId,
    studentName: params.studentName,
    relationship: params.relationship,
    nextStatus: params.nextStatus,
    verificationCodeInput: params.verificationCodeInput,
    storedHash: params.storedHash,
    notes: params.notes,
  });
}
