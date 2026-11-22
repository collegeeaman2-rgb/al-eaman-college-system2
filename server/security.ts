import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

export interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: DecodedIdToken;
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'admin123',
  'aleaman',
  'aleaman123',
  'college123',
  'principal123',
  'qwerty123',
  'letmein',
  'welcome123',
]);

let cachedProjectId: string | null = null;

export function getFirebaseProjectId(): string {
  if (cachedProjectId) return cachedProjectId;
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json is missing. Run Firebase provisioning first.');
  }
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as FirebaseAppletConfig;
  if (!raw.projectId || raw.projectId === 'remixed-project-id') {
    throw new Error('Firebase project is not provisioned (placeholder projectId detected).');
  }
  cachedProjectId = raw.projectId;
  return cachedProjectId;
}

function getFirebaseAdminAuth() {
  const projectId = getFirebaseProjectId();
  const adminApp = getApps().length ? getApp() : initializeApp({ projectId });
  return getAuth(adminApp);
}

/**
 * Verifies the Firebase ID token using firebase-admin/auth (works on Starter Tier with zero IAM).
 */
export async function requireVerifiedFirebaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing Bearer authorization token.' });
      return;
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      res.status(401).json({ error: 'Empty authorization token.' });
      return;
    }

    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    if (!decoded.email_verified) {
      res.status(403).json({
        error: 'Email verification is required before accessing protected college resources.',
      });
      return;
    }

    req.authUser = decoded;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid or expired authentication token.';
    res.status(401).json({ error: `Authentication failed: ${message}` });
  }
}

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
}

export function validatePasswordStrength(password: string, email?: string): PasswordValidationResult {
  const issues: string[] = [];
  if (typeof password !== 'string') {
    return { valid: false, score: 0, issues: ['Password must be a string.'] };
  }

  const trimmed = password.trim();
  if (trimmed.length < 12) {
    issues.push('min_length');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('uppercase');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('lowercase');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('digit');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push('symbol');
  }

  const lowered = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lowered) || lowered.includes('aleaman') || lowered.includes('eaman')) {
    issues.push('common_or_institutional_word');
  }
  if (email) {
    const localPart = email.split('@')[0]?.toLowerCase() ?? '';
    if (localPart.length >= 3 && lowered.includes(localPart)) {
      issues.push('contains_email');
    }
  }

  const score = Math.max(0, 5 - issues.length);
  return {
    valid: issues.length === 0,
    score,
    issues,
  };
}

export function hashVerificationCode(code: string): string {
  const normalized = code.trim();
  if (normalized.length < 6 || normalized.length > 64) {
    throw new Error('Verification code must be between 6 and 64 characters.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(normalized, salt, 32).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyHashedCode(code: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(code.trim(), salt, 32);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

// Single-use in-memory Principal bootstrap ceremony challenge store (bound to UID + expiry)
interface CeremonyChallenge {
  nonce: string;
  uid: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

const BOOTSTRAP_OWNER_EMAIL = 'collegeeaman2@gmail.com';
const ceremonyStore = new Map<string, CeremonyChallenge>();
let serverBootstrapCompleted = false;

export function getBootstrapOwnerEmail(): string {
  return BOOTSTRAP_OWNER_EMAIL;
}

export function isServerBootstrapMarkedComplete(): boolean {
  return serverBootstrapCompleted;
}

export function issuePrincipalBootstrapChallenge(uid: string, email: string): { nonce: string; expiresAt: number } {
  if (email.toLowerCase() !== BOOTSTRAP_OWNER_EMAIL) {
    throw new Error('Only the authorized institutional administrator email can initiate Principal setup.');
  }
  const nonce = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000;
  ceremonyStore.set(uid, {
    nonce,
    uid,
    email: email.toLowerCase(),
    expiresAt,
    used: false,
  });
  return { nonce, expiresAt };
}

export function consumePrincipalBootstrapChallenge(uid: string, email: string, nonce: string): boolean {
  const entry = ceremonyStore.get(uid);
  if (!entry) return false;
  if (entry.used || Date.now() > entry.expiresAt) return false;
  if (entry.email !== email.toLowerCase()) return false;
  const a = Buffer.from(entry.nonce, 'utf8');
  const b = Buffer.from(nonce.trim(), 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return false;
  }
  entry.used = true;
  serverBootstrapCompleted = true;
  return true;
}

export type CollegeRole = 'principal' | 'officer' | 'teacher' | 'parent';
export type CollegeModuleKey =
  | 'userManagement'
  | 'permissionsGovernance'
  | 'parentVerification'
  | 'auditCompliance'
  | 'studentRecords'
  | 'collegeProfile'
  | 'academicOverview';
export type CollegeActionKey = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface ActionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

export type ModulePermissions = Record<CollegeModuleKey, ActionSet>;

export function evaluateServerAuthorization(params: {
  role: CollegeRole;
  status: string;
  modules: ModulePermissions | null;
  moduleKey: CollegeModuleKey;
  action: CollegeActionKey;
  isParentChildVerified?: boolean;
}): { allowed: boolean; reason: string } {
  if (params.status !== 'active') {
    return { allowed: false, reason: `Account status is "${params.status}", not active.` };
  }
  if (params.role === 'principal') {
    return { allowed: true, reason: 'Primary Principal holds full governance authority.' };
  }
  if (params.role === 'parent') {
    if (params.action !== 'view') {
      return { allowed: false, reason: 'Parent accounts are strictly read-only.' };
    }
    if (params.moduleKey === 'studentRecords' && !params.isParentChildVerified) {
      return { allowed: false, reason: 'Parent-child relationship has not been verified by the Principal.' };
    }
  }
  if (!params.modules) {
    return { allowed: false, reason: 'No permission profile has been assigned by the Principal.' };
  }
  const mod = params.modules[params.moduleKey];
  if (!mod || mod[params.action] !== true) {
    return {
      allowed: false,
      reason: `Action "${params.action}" on module "${params.moduleKey}" is not permitted by the Principal.`,
    };
  }
  return { allowed: true, reason: 'Authorized by Principal permission profile.' };
}
