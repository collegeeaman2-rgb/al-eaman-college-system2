import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type ActionCodeSettings,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  MailCheck,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import {
  checkMyPreApprovedInvite,
  claimPreApprovedInvite,
  initializeOneTimePrincipal,
  submitAccountRequest,
  validatePasswordOnServer,
} from '../lib/firestoreService';
import { useI18n } from '../i18n/I18nContext';
import { useCollegeProfile } from '../context/CollegeProfileContext';
import {
  AUTHORIZED_BOOTSTRAP_EMAIL,
  type AssignableRole,
  type PreApprovedInvite,
  type UserAccount,
} from '../types/governance';
import { CollegeBrandMark } from './CollegeBrandMark';
import { LanguageSelector } from './LanguageSelector';
import { PWAInstallButton } from './PWAInstallButton';
import { StatusText } from './StatusText';

interface AuthPortalProps {
  firebaseUser: FirebaseUser | null;
  userAccount: UserAccount | null;
  principalConfigured: boolean;
  onRefreshState: () => Promise<void>;
}

export function AuthPortal({
  firebaseUser,
  userAccount,
  principalConfigured,
  onRefreshState,
}: AuthPortalProps) {
  const { t, lang } = useI18n();
  const { publicIdentity } = useCollegeProfile();
  const establishedBadgeText = t.establishedLabel.replace(
    '{year}',
    String(publicIdentity.establishedYear)
  );
  const [authTab, setAuthTab] = useState<'signin' | 'request'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    valid: boolean;
    score: number;
    issues: string[];
  } | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedRole, setRequestedRole] = useState<AssignableRole>('teacher');
  const [department, setDepartment] = useState('');
  const [justification, setJustification] = useState('');
  const [studentReferenceCode, setStudentReferenceCode] = useState('');
  const [studentNameClaim, setStudentNameClaim] = useState('');

  const [pendingInvite, setPendingInvite] = useState<PreApprovedInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showEmailProviderHint, setShowEmailProviderHint] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const RESEND_COOLDOWN_SECONDS = 60;

  useEffect(() => {
    auth.languageCode = lang;
  }, [lang]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (firebaseUser?.displayName && !fullName) {
      setFullName(firebaseUser.displayName);
    }
  }, [firebaseUser, fullName]);

  useEffect(() => {
    let active = true;
    if (firebaseUser && firebaseUser.emailVerified && principalConfigured && !userAccount) {
      checkMyPreApprovedInvite()
        .then((invite) => {
          if (active) setPendingInvite(invite);
        })
        .catch(() => {
          if (active) setPendingInvite(null);
        });
    } else {
      setPendingInvite(null);
    }
    return () => {
      active = false;
    };
  }, [firebaseUser, principalConfigured, userAccount]);

  useEffect(() => {
    if (authTab !== 'request' || !password) {
      setPasswordValidation(null);
      return;
    }
    const timer = setTimeout(() => {
      validatePasswordOnServer(password, email)
        .then(setPasswordValidation)
        .catch(() => {});
    }, 220);
    return () => clearTimeout(timer);
  }, [password, email, authTab]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await onRefreshState();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getVerificationActionCodeSettings = (): ActionCodeSettings => ({
    url: window.location.origin,
  });

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setShowEmailProviderHint(false);
    setLoading(true);
    try {
      auth.languageCode = lang;
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await onRefreshState();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        setShowEmailProviderHint(true);
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg(t.tooManyRequestsError);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setShowEmailProviderHint(false);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const check = await validatePasswordOnServer(password, email);
      setPasswordValidation(check);
      if (!check.valid) {
        setErrorMsg('Password does not meet college security requirements.');
        setLoading(false);
        return;
      }
      auth.languageCode = lang;
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(cred.user, getVerificationActionCodeSettings());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setInfoMsg(t.verificationAccountCreated);
      await onRefreshState();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        setShowEmailProviderHint(true);
      } else if (code === 'auth/too-many-requests') {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setErrorMsg(t.tooManyRequestsError);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePrincipalSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await initializeOneTimePrincipal({
        fullName,
        phone,
        preferredLanguage: lang,
      });
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Principal initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAccountRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await submitAccountRequest({
        fullName,
        phone,
        requestedRole,
        department,
        justification,
        studentReferenceCode,
        studentNameClaim,
        preferredLanguage: lang,
        hasExistingUserDoc: Boolean(userAccount),
      });
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit account request.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimInvite = async () => {
    if (!pendingInvite) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      await claimPreApprovedInvite(pendingInvite, lang);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to activate invited account.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!firebaseUser || resendCooldown > 0) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      auth.languageCode = lang;
      await sendEmailVerification(firebaseUser, getVerificationActionCodeSettings());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setInfoMsg(t.verificationEmailSent);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/too-many-requests') {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setErrorMsg(t.tooManyRequestsError);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to resend verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!firebaseUser) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      await firebaseUser.reload();
      await firebaseUser.getIdToken(true);
      await onRefreshState();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/too-many-requests') {
        setErrorMsg(t.tooManyRequestsError);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Could not refresh verification status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setPendingInvite(null);
    setResendCooldown(0);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const inputClass =
    'w-full max-w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] placeholder:text-[#7E94B0] focus:outline-none focus:border-[#2878D0] focus:ring-2 focus:ring-[#2878D0]/15 transition-colors';

  const cardSurfaceClass =
    'bg-white border border-[#D7E5F5] rounded-2xl p-5 md:p-7 space-y-5 shadow-[0_14px_38px_-14px_rgba(21,62,117,0.14)] min-w-0';

  const renderAuthCard = () => {
    // 1. Authenticated but Email not verified
    if (firebaseUser && !firebaseUser.emailVerified) {
      return (
        <div className={cardSurfaceClass}>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#172B45]">{t.verifyEmailTitle}</h2>
              <p className="text-sm text-[#4B6484] mt-1">{t.verifyEmailBody}</p>
              <p className="text-xs font-mono text-[#153E75] mt-2 break-all">{firebaseUser.email}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs text-[#153E75] flex items-start gap-2.5 leading-relaxed">
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#2878D0]" />
            <span>{t.verifyEmailSpamHint}</span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {infoMsg && (
            <div className="p-3 rounded-xl bg-[#EAF2FB] border border-[#BFD6F2] text-xs text-[#153E75] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2878D0]" />
              <span>{infoMsg}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleRefreshVerification}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3] transition-colors disabled:opacity-60"
            >
              {t.refreshVerification}
            </button>
            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={handleResendVerification}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D7E5F5] text-[#172B45] text-sm font-medium hover:bg-[#F4F8FD] transition-colors disabled:opacity-60 tabular-nums"
            >
              {resendCooldown > 0
                ? t.resendVerificationCountdown.replace('{seconds}', String(resendCooldown))
                : t.resendVerification}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full min-h-[44px] px-4 py-2 text-xs font-medium text-[#4B6484] hover:text-[#172B45] inline-flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.signOut}
            </button>
          </div>
        </div>
      );
    }

    // 2. Authenticated & Verified, Principal NOT configured yet -> One-Time Principal Setup
    if (firebaseUser && firebaseUser.emailVerified && !principalConfigured) {
      const isAuthorizedOwner =
        (firebaseUser.email ?? '').toLowerCase() === AUTHORIZED_BOOTSTRAP_EMAIL;

      return (
        <div className={cardSurfaceClass}>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#EAF2FB] border border-[#D7E5F5] text-[#153E75] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#172B45]">{t.principalSetupTitle}</h2>
              <p className="text-sm text-[#4B6484] mt-1">{t.principalSetupSubtitle}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs text-[#172B45] space-y-1">
            <div>{t.principalSetupPolicy}</div>
            <div className="font-mono text-[#153E75]">
              {t.principalSetupAuthorizedEmail}: {AUTHORIZED_BOOTSTRAP_EMAIL}
            </div>
          </div>

          {!isAuthorizedOwner ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Signed in as <span className="font-mono">{firebaseUser.email}</span>. Please sign
                out and authenticate as{' '}
                <span className="font-mono">{AUTHORIZED_BOOTSTRAP_EMAIL}</span> to perform the
                one-time Principal lock.
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#153E75] text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#102F5B]"
              >
                <LogOut className="w-4 h-4" />
                {t.signOut}
              </button>
            </div>
          ) : (
            <form onSubmit={handleCompletePrincipalSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1.5">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Principal Name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1.5">
                  {t.phone}
                </label>
                <input
                  type="tel"
                  maxLength={32}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 / +91 ..."
                  className={inputClass}
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3] transition-colors disabled:opacity-60"
              >
                {loading ? '...' : t.principalSetupButton}
              </button>
            </form>
          )}
        </div>
      );
    }

    // 3. Authenticated & Verified, Principal configured, userAccount exists but NOT active
    if (firebaseUser && userAccount && userAccount.status !== 'active') {
      const gateTitle =
        userAccount.status === 'pending'
          ? t.pendingTitle
          : userAccount.status === 'suspended'
          ? t.suspendedTitle
          : userAccount.status === 'revoked'
          ? t.revokedTitle
          : t.rejectedTitle;
      const gateBody =
        userAccount.status === 'pending'
          ? t.pendingBody
          : userAccount.status === 'suspended'
          ? t.suspendedBody
          : userAccount.status === 'revoked'
          ? t.revokedBody
          : t.rejectedBody;

      return (
        <div className={cardSurfaceClass}>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#172B45]">{gateTitle}</h2>
              <p className="text-sm text-[#4B6484] mt-1">{gateBody}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#4B6484]">{t.fullName}</span>
              <span className="font-medium text-[#172B45]">{userAccount.fullName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#4B6484]">{t.emailAddress}</span>
              <span className="font-mono text-[#172B45]">{userAccount.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#4B6484]">{t.labels.role}</span>
              <span className="font-medium text-[#153E75]">{t.roles[userAccount.role]}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#4B6484]">{t.labels.status}</span>
              <StatusText status={userAccount.status} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRefreshState}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] text-sm font-medium text-[#172B45] hover:bg-[#F4F8FD]"
            >
              {t.refreshVerification}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#153E75] text-white text-sm font-medium inline-flex items-center gap-1.5 hover:bg-[#102F5B]"
            >
              <LogOut className="w-4 h-4" />
              {t.signOut}
            </button>
          </div>
        </div>
      );
    }

    // 4. Authenticated & Verified, Principal configured, NO userAccount yet
    if (firebaseUser && firebaseUser.emailVerified && principalConfigured && !userAccount) {
      return (
        <div className={cardSurfaceClass}>
          {pendingInvite ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EAF2FB] border border-[#D7E5F5] text-[#2878D0] flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#172B45]">{t.inviteDetectedTitle}</h2>
                  <p className="text-sm text-[#4B6484] mt-1">{t.inviteDetectedBody}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4B6484]">{t.fullName}</span>
                  <span className="font-medium text-[#172B45]">{pendingInvite.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B6484]">{t.labels.role}</span>
                  <span className="font-medium text-[#2878D0]">{t.roles[pendingInvite.role]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B6484]">{t.department}</span>
                  <span className="font-medium text-[#172B45]">{pendingInvite.department || '—'}</span>
                </div>
              </div>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {errorMsg}
                </div>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={handleClaimInvite}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3]"
              >
                {loading ? '...' : t.claimInviteButton}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full min-h-[44px] text-xs font-medium text-[#4B6484] hover:text-[#172B45]"
              >
                {t.signOut}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitAccountRequest} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#EAF2FB] border border-[#D7E5F5] text-[#153E75] flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#172B45]">{t.createRequest}</h2>
                    <p className="text-xs font-mono text-[#4B6484] mt-0.5">{firebaseUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs font-medium text-[#4B6484] hover:text-[#172B45] whitespace-nowrap"
                >
                  {t.signOut}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {t.phone}
                  </label>
                  <input
                    type="tel"
                    maxLength={32}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {t.requestedRole}
                  </label>
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as AssignableRole)}
                    className={inputClass}
                  >
                    <option value="officer">{t.roles.officer}</option>
                    <option value="teacher">{t.roles.teacher}</option>
                    <option value="parent">{t.roles.parent}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {t.department}
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={requestedRole === 'parent' ? 'Guardian' : 'Arabic / Sharia'}
                    className={inputClass}
                  />
                </div>
              </div>

              {requestedRole === 'parent' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5]">
                  <div>
                    <label className="block text-xs font-medium text-[#153E75] mb-1">
                      {t.studentReferenceCode}
                    </label>
                    <input
                      type="text"
                      maxLength={64}
                      value={studentReferenceCode}
                      onChange={(e) => setStudentReferenceCode(e.target.value)}
                      placeholder="STU-DEMO-101"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#153E75] mb-1">
                      {t.studentNameClaim}
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={studentNameClaim}
                      onChange={(e) => setStudentNameClaim(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.justification}
                </label>
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full max-w-full px-3.5 py-2.5 rounded-xl border border-[#D7E5F5] text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0] focus:ring-2 focus:ring-[#2878D0]/15"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3] transition-colors disabled:opacity-60"
              >
                {loading ? '...' : t.labels.submit}
              </button>
            </form>
          )}
        </div>
      );
    }

    // 5. Unauthenticated Sign-In / Registration Portal
    return (
      <div className={cardSurfaceClass}>
        {!principalConfigured ? (
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#2878D0]">{establishedBadgeText}</div>
            <h2 className="text-xl font-semibold text-[#172B45]">{t.principalSetupTitle}</h2>
            <p className="text-sm text-[#4B6484]">{t.principalSetupSubtitle}</p>
            <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs text-[#172B45]">
              {t.principalSetupAuthorizedEmail}:{' '}
              <span className="font-mono text-[#153E75] font-medium">
                {AUTHORIZED_BOOTSTRAP_EMAIL}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 p-1 bg-[#EAF2FB] border border-[#D7E5F5] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 min-h-[40px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                authTab === 'signin'
                  ? 'bg-[#2878D0] text-white shadow-xs'
                  : 'text-[#153E75] hover:bg-white/60'
              }`}
            >
              {t.signIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('request');
                setErrorMsg(null);
              }}
              className={`flex-1 min-h-[40px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                authTab === 'request'
                  ? 'bg-[#2878D0] text-white shadow-xs'
                  : 'text-[#153E75] hover:bg-white/60'
              }`}
            >
              {t.createRequest}
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#D7E5F5] bg-[#F4F8FD] hover:bg-[#EAF2FB] text-sm font-medium text-[#153E75] flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
        >
          <ShieldCheck className="w-4 h-4 text-[#2878D0]" />
          <span>{t.continueWithGoogle}</span>
        </button>

        <div className="relative flex items-center py-0.5">
          <div className="flex-grow border-t border-[#D7E5F5]" />
          <span className="shrink mx-3 text-xs text-[#667D9B]">{t.useEmailPassword}</span>
          <div className="flex-grow border-t border-[#D7E5F5]" />
        </div>

        {showEmailProviderHint && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-semibold">{t.emailProviderHintTitle}</div>
            <div>{t.emailProviderHintBody}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-[#EAF2FB] border border-[#BFD6F2] text-xs text-[#153E75]">
            {infoMsg}
          </div>
        )}

        <form
          onSubmit={authTab === 'request' && principalConfigured ? handleEmailRegister : handleEmailSignIn}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-medium text-[#153E75] mb-1">
              {t.emailAddress}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#153E75] mb-1">{t.password}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={authTab === 'request' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full max-w-full min-h-[44px] ps-3.5 pe-11 py-2 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0] focus:ring-2 focus:ring-[#2878D0]/15"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 end-0 w-11 flex items-center justify-center text-[#4B6484] hover:text-[#153E75]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authTab === 'request' && principalConfigured && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.confirmPassword}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              {passwordValidation && (
                <div className="p-3 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs space-y-1">
                  <div className="font-medium text-[#172B45] flex items-center justify-between">
                    <span>{t.passwordRules.title}</span>
                    <span className="font-mono tabular-nums text-[#2878D0]">
                      {passwordValidation.score}/5
                    </span>
                  </div>
                  {passwordValidation.issues.length > 0 && (
                    <ul className="space-y-0.5 text-[#9A3412]">
                      {passwordValidation.issues.map((issue) => (
                        <li key={issue}>
                          {t.passwordRules[issue as keyof typeof t.passwordRules] ?? issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3] transition-colors disabled:opacity-60 shadow-[0_6px_18px_-6px_rgba(40,120,208,0.55)]"
          >
            {loading
              ? '...'
              : authTab === 'request' && principalConfigured
              ? t.registerAndRequest
              : t.signInWithEmail}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F8FD] flex flex-col">
      {/* MOBILE DEDICATED TOP NAVY IDENTITY HEADER */}
      <header className="md:hidden relative overflow-hidden bg-[#0B2045] text-white px-4 pt-[calc(0.875rem+env(safe-area-inset-top))] pb-5 space-y-3 border-b border-[#D6B45C]/30 shadow-[0_6px_22px_-8px_rgba(11,32,69,0.55)]">
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
        >
          <defs>
            <pattern
              id="auth-islamic-star-pattern"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="11"
                y="11"
                width="22"
                height="22"
                fill="none"
                stroke="#D6B45C"
                strokeWidth="0.9"
              />
              <rect
                x="11"
                y="11"
                width="22"
                height="22"
                transform="rotate(45 22 22)"
                fill="none"
                stroke="#D6B45C"
                strokeWidth="0.9"
              />
              <circle cx="22" cy="22" r="4" fill="none" stroke="#FFFFFF" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-islamic-star-pattern)" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-wide text-[#D6B45C]">
            {establishedBadgeText}
          </span>
          <LanguageSelector variant="navy" compact />
        </div>
        <div className="relative">
          <CollegeBrandMark variant="navy" showSubtitles />
        </div>
      </header>

      {/* DESKTOP TOP BAR */}
      <header className="hidden md:block w-full border-b border-[#D7E5F5] bg-white">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-4">
          <CollegeBrandMark compact />
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton compact />
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex items-start md:items-center">
        <div className="w-full max-w-6xl mx-auto px-4 py-5 md:px-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          {/* Desktop Navy Institutional Panel */}
          <section className="hidden lg:flex lg:col-span-6 relative overflow-hidden flex-col justify-between bg-[#153E75] text-white rounded-2xl p-8 space-y-6 shadow-[0_18px_42px_-16px_rgba(21,62,117,0.45)]">
            {/* Subtle geometric background lines */}
            <svg
              aria-hidden="true"
              viewBox="0 0 400 400"
              className="absolute -end-20 -bottom-20 w-80 h-80 opacity-10 pointer-events-none"
            >
              <circle cx="200" cy="200" r="160" fill="none" stroke="#D6B66B" strokeWidth="1.5" />
              <rect
                x="85"
                y="85"
                width="230"
                height="230"
                fill="none"
                stroke="#D7E5F5"
                strokeWidth="1.2"
              />
              <rect
                x="85"
                y="85"
                width="230"
                height="230"
                transform="rotate(45 200 200)"
                fill="none"
                stroke="#D6B66B"
                strokeWidth="1.2"
              />
            </svg>

            <div className="relative space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#D6B45C]">
                <span>{establishedBadgeText}</span>
              </div>
              <CollegeBrandMark variant="navy" showSubtitles />
              <div className="w-16 h-px bg-[#D6B66B]/60" />
              <h1 className="text-3xl font-display font-bold text-white text-balance leading-snug">
                {t.portalSubtitle}
              </h1>
              <p className="text-sm text-[#D7E5F5] leading-relaxed">
                {t.labels.phase1BoundaryNote}
              </p>
            </div>

            <div className="relative border-t border-white/15 pt-5 space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-[#D6B66B] pt-0.5 tabular-nums">01.</span>
                <div>
                  <div className="font-medium text-white">{t.roles.principal}</div>
                  <div className="text-xs text-[#D7E5F5]">{t.labels.principalExclusiveNote}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-[#D6B66B] pt-0.5 tabular-nums">02.</span>
                <div>
                  <div className="font-medium text-white">
                    {t.roles.officer} · {t.roles.teacher}
                  </div>
                  <div className="text-xs text-[#D7E5F5]">{t.modules.permissionsGovernance.desc}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-[#D6B66B] pt-0.5 tabular-nums">03.</span>
                <div>
                  <div className="font-medium text-white">{t.roles.parent}</div>
                  <div className="text-xs text-[#D7E5F5]">{t.labels.parentReadOnlyNote}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Authentication & Onboarding Card */}
          <section className="lg:col-span-6 flex flex-col justify-center gap-4 min-w-0">
            {renderAuthCard()}
            <PWAInstallButton variant="card" />
          </section>
        </div>
      </main>
    </div>
  );
}
