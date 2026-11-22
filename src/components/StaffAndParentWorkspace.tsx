import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Link2,
  Lock,
  LogOut,
  Plus,
  Shield,
  SlidersHorizontal,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  requestParentChildLink,
  updateOwnLanguagePreference,
  verifyOrRevokeParentLinkAuthorized,
} from '../lib/firestoreService';
import { useI18n } from '../i18n/I18nContext';
import { useCollegeProfile } from '../context/CollegeProfileContext';
import {
  ACTION_KEYS,
  MODULE_KEYS,
  normalizeModulePermissions,
  type AccountRequest,
  type AuditLog,
  type DemoStudent,
  type LanguageCode,
  type ParentChildLink,
  type ParentRelationship,
  type PermissionProfile,
  type UserAccount,
} from '../types/governance';
import { CollegeBrandMark } from './CollegeBrandMark';
import { CollegeProfilePage } from './CollegeProfilePage';
import { LanguageSelector } from './LanguageSelector';
import { MobileBottomNav, type MobileNavItem } from './MobileBottomNav';
import { MobileTopHeader, type MobileNotificationItem } from './MobileTopHeader';
import { PWAInstallButton } from './PWAInstallButton';
import { StatusText } from './StatusText';

interface StaffAndParentWorkspaceProps {
  userAccount: UserAccount;
  permissionProfile: PermissionProfile | null;
}

type SubTab =
  | 'access'
  | 'users'
  | 'parentLinks'
  | 'students'
  | 'permissions'
  | 'audit'
  | 'collegeProfile'
  | 'profile';

export function StaffAndParentWorkspace({
  userAccount,
  permissionProfile,
}: StaffAndParentWorkspaceProps) {
  const { t, lang } = useI18n();
  const { publicIdentity } = useCollegeProfile();
  const [activeTab, setActiveTab] = useState<SubTab>('access');

  const [parentLinks, setParentLinks] = useState<ParentChildLink[]>([]);
  const [staffParentLinks, setStaffParentLinks] = useState<ParentChildLink[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<DemoStudent[]>([]);
  const [staffStudents, setStaffStudents] = useState<DemoStudent[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserAccount[]>([]);
  const [staffRequests, setStaffRequests] = useState<AccountRequest[]>([]);
  const [staffPermissions, setStaffPermissions] = useState<PermissionProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [relationship, setRelationship] = useState<ParentRelationship>('mother');
  const [verificationCode, setVerificationCode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const isParent = userAccount.role === 'parent';
  const isTeacher = userAccount.role === 'teacher';
  const isOfficer = userAccount.role === 'officer';
  const modules = permissionProfile?.modules
    ? normalizeModulePermissions(permissionProfile.modules)
    : null;

  const canViewStudents = Boolean(modules?.studentRecords?.view);
  const canViewUsers = !isParent && Boolean(modules?.userManagement?.view);
  const canViewPerms = !isParent && Boolean(modules?.permissionsGovernance?.view);
  const canViewParentLinks = !isParent && Boolean(modules?.parentVerification?.view);
  const canApproveParentLinks = !isParent && Boolean(modules?.parentVerification?.approve);
  const canViewAudit = !isParent && Boolean(modules?.auditCompliance?.view);
  const hasAcademicReserved = !isParent && Boolean(modules?.academicOverview?.view);
  const headerCollegeName =
    lang === 'ta'
      ? publicIdentity.nameTa
      : lang === 'ar'
      ? publicIdentity.nameAr
      : publicIdentity.nameEn;

  // Reset active tab automatically if Principal revokes permission mid-session
  useEffect(() => {
    if (activeTab === 'users' && !canViewUsers) setActiveTab('access');
    if (activeTab === 'parentLinks' && !canViewParentLinks) setActiveTab('access');
    if (activeTab === 'permissions' && !canViewPerms) setActiveTab('access');
    if (activeTab === 'students' && !isParent && !canViewStudents) setActiveTab('access');
  }, [activeTab, canViewUsers, canViewParentLinks, canViewPerms, canViewStudents, isParent]);

  // Parent's own parent-child links
  useEffect(() => {
    if (!isParent) {
      setParentLinks([]);
      return;
    }
    const path = 'parentChildLinks';
    const q = query(collection(db, path), where('parentUid', '==', userAccount.uid));
    return onSnapshot(
      q,
      (snap) => setParentLinks(snap.docs.map((d) => d.data() as ParentChildLink)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }, [isParent, userAccount.uid]);

  // Parent's verified linked child records (read-only)
  useEffect(() => {
    if (!isParent || !canViewStudents) {
      setLinkedStudents([]);
      return;
    }
    const verifiedLinks = parentLinks.filter((l) => l.status === 'verified');
    if (verifiedLinks.length === 0) {
      setLinkedStudents([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      verifiedLinks.map(async (link) => {
        const path = `demoStudents/${link.studentId}`;
        try {
          const snap = await getDoc(doc(db, 'demoStudents', link.studentId));
          return snap.exists() ? (snap.data() as DemoStudent) : null;
        } catch (err) {
          if (auth.currentUser) handleFirestoreError(err, OperationType.GET, path);
          return null;
        }
      })
    )
      .then((results) => {
        if (!cancelled) {
          setLinkedStudents(results.filter((s): s is DemoStudent => s !== null));
        }
      })
      .catch(() => {
        if (!cancelled) setLinkedStudents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isParent, canViewStudents, parentLinks]);

  // Staff students list (permitted only)
  useEffect(() => {
    if (isParent || !canViewStudents) {
      setStaffStudents([]);
      return;
    }
    const path = 'demoStudents';
    const q = query(collection(db, path), where('isDemoData', '==', true));
    return onSnapshot(
      q,
      (snap) => setStaffStudents(snap.docs.map((d) => d.data() as DemoStudent)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }, [isParent, canViewStudents]);

  // Staff users + accountRequests (when userManagement.view is granted)
  useEffect(() => {
    if (!canViewUsers) {
      setStaffUsers([]);
      setStaffRequests([]);
      return;
    }
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => setStaffUsers(snap.docs.map((d) => d.data() as UserAccount)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );
    const unsubReqs = onSnapshot(
      query(collection(db, 'accountRequests'), orderBy('createdAt', 'desc')),
      (snap) =>
        setStaffRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccountRequest))),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'accountRequests');
      }
    );
    return () => {
      unsubUsers();
      unsubReqs();
    };
  }, [canViewUsers]);

  // Staff permissions directory (when permissionsGovernance.view is granted)
  useEffect(() => {
    if (!canViewPerms) {
      setStaffPermissions([]);
      return;
    }
    return onSnapshot(
      collection(db, 'permissions'),
      (snap) => setStaffPermissions(snap.docs.map((d) => d.data() as PermissionProfile)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'permissions');
      }
    );
  }, [canViewPerms]);

  // Staff parent verification queue (when parentVerification.view is granted)
  useEffect(() => {
    if (!canViewParentLinks) {
      setStaffParentLinks([]);
      return;
    }
    return onSnapshot(
      collection(db, 'parentChildLinks'),
      (snap) => setStaffParentLinks(snap.docs.map((d) => d.data() as ParentChildLink)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'parentChildLinks');
      }
    );
  }, [canViewParentLinks]);

  // Audit logs (full if auditCompliance.view, otherwise own actor logs)
  useEffect(() => {
    const path = 'auditLogs';
    const q = canViewAudit
      ? query(collection(db, path), orderBy('createdAt', 'desc'))
      : query(collection(db, path), where('actorUid', '==', userAccount.uid));
    return onSnapshot(
      q,
      (snap) => setAuditLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog))),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }, [canViewAudit, userAccount.uid]);

  const handleLanguageChange = (nextLang: LanguageCode) => {
    updateOwnLanguagePreference(userAccount, nextLang).catch(() => {});
  };

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      await requestParentChildLink({
        parentUser: userAccount,
        studentId: studentIdInput,
        studentName: studentNameInput,
        relationship,
        verificationCode,
        notes,
      });
      setFeedback({ type: 'ok', text: 'Parent-child verification request submitted to Principal.' });
      setShowLinkModal(false);
      setStudentIdInput('');
      setStudentNameInput('');
      setVerificationCode('');
      setNotes('');
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not submit link request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStaffParentLinkDecision = async (
    link: ParentChildLink,
    nextStatus: 'verified' | 'revoked'
  ) => {
    if (!canApproveParentLinks) return;
    setFeedback(null);
    setSubmitting(true);
    try {
      await verifyOrRevokeParentLinkAuthorized({
        actor: userAccount,
        modules,
        linkId: link.linkId,
        parentUid: link.parentUid,
        studentId: link.studentId,
        studentName: link.studentName,
        relationship: link.relationship,
        nextStatus,
        storedHash: link.verificationCodeHash,
        notes: link.notes,
      });
      setFeedback({
        type: 'ok',
        text: `Parent link ${link.studentId} marked ${nextStatus}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Action denied by server authorization.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const permittedModulesCount = modules
    ? MODULE_KEYS.filter((k) => modules[k]?.view).length
    : 0;

  const verifiedLinksCount = parentLinks.filter((l) => l.status === 'verified').length;
  const pendingStaffRequestsCount = staffRequests.filter((r) => r.status === 'pending').length;
  const pendingStaffParentLinksCount = staffParentLinks.filter((l) => l.status === 'pending').length;

  const rolePrimaryTabLabel = isParent
    ? t.roleExperience.tabHome
    : isTeacher
    ? t.roleExperience.tabFaculty
    : t.roleExperience.tabDesk;

  // Dynamically generate authorized module nav items for Officer & Teacher
  const dynamicStaffModules = useMemo<MobileNavItem[]>(() => {
    if (isParent) return [];
    const items: MobileNavItem[] = [];
    if (canViewUsers) {
      items.push({
        id: 'users',
        label: t.nav.users,
        shortLabel: t.mobileShell.tabUsersShort,
        description: t.modules.userManagement.desc,
        icon: <Users className="w-5 h-5 shrink-0" />,
        badge: pendingStaffRequestsCount,
        onSelect: () => setActiveTab('users'),
      });
    }
    if (canViewParentLinks) {
      items.push({
        id: 'parentLinks',
        label: t.nav.parentLinks,
        shortLabel: t.mobileShell.tabParentLinksShort,
        description: t.modules.parentVerification.desc,
        icon: <Link2 className="w-5 h-5 shrink-0" />,
        badge: pendingStaffParentLinksCount,
        onSelect: () => setActiveTab('parentLinks'),
      });
    }
    if (canViewStudents) {
      items.push({
        id: 'students',
        label: isTeacher ? t.roleExperience.tabStudents : t.modules.studentRecords.title,
        shortLabel: t.mobileShell.tabStudentsShort,
        description: t.modules.studentRecords.desc,
        icon: <BookOpen className="w-5 h-5 shrink-0" />,
        onSelect: () => setActiveTab('students'),
      });
    }
    if (canViewPerms) {
      items.push({
        id: 'permissions',
        label: t.nav.permissions,
        shortLabel: t.mobileShell.tabPermsShort,
        description: t.modules.permissionsGovernance.desc,
        icon: <SlidersHorizontal className="w-5 h-5 shrink-0" />,
        onSelect: () => setActiveTab('permissions'),
      });
    }
    if (canViewAudit) {
      items.push({
        id: 'audit',
        label: t.nav.audit,
        shortLabel: t.mobileShell.tabAuditShort,
        description: t.modules.auditCompliance.desc,
        icon: <ClipboardList className="w-5 h-5 shrink-0" />,
        onSelect: () => setActiveTab('audit'),
      });
    }
    return items;
  }, [
    isParent,
    isTeacher,
    canViewUsers,
    canViewParentLinks,
    canViewStudents,
    canViewPerms,
    canViewAudit,
    pendingStaffRequestsCount,
    pendingStaffParentLinksCount,
    t,
  ]);

  // 4 Primary Bottom Bar Positions + Menu Position 5
  const { mobilePrimaryItems, mobileMenuModules } = useMemo(() => {
    const settingsCollegeItem: MobileNavItem = {
      id: 'collegeProfile',
      label: `${t.nav.settings} · ${t.nav.collegeProfile}`,
      description: t.collegeProfilePage.pageSubtitle,
      icon: <Building2 className="w-5 h-5 shrink-0" />,
      onSelect: () => setActiveTab('collegeProfile'),
    };

    if (isParent) {
      return {
        mobilePrimaryItems: [
          {
            id: 'access',
            label: t.roleExperience.tabHome,
            icon: <Shield className="w-5 h-5 shrink-0" />,
            onSelect: () => setActiveTab('access'),
          },
          {
            id: 'students',
            label: t.roleExperience.tabMyChild,
            icon: <Users className="w-5 h-5 shrink-0" />,
            badge: verifiedLinksCount > 0 ? verifiedLinksCount : undefined,
            onSelect: () => setActiveTab('students'),
          },
          {
            id: 'audit',
            label: t.mobileShell.tabAuditShort,
            icon: <ClipboardList className="w-5 h-5 shrink-0" />,
            onSelect: () => setActiveTab('audit'),
          },
          {
            id: 'profile',
            label: t.roleExperience.tabProfile,
            icon: <UserCircle2 className="w-5 h-5 shrink-0" />,
            onSelect: () => setActiveTab('profile'),
          },
        ] satisfies MobileNavItem[],
        mobileMenuModules: [settingsCollegeItem] satisfies MobileNavItem[],
      };
    }

    const RoleHomeIcon = isTeacher ? (
      <GraduationCap className="w-5 h-5 shrink-0" />
    ) : (
      <Briefcase className="w-5 h-5 shrink-0" />
    );

    const primary: MobileNavItem[] = [
      {
        id: 'access',
        label: rolePrimaryTabLabel,
        icon: RoleHomeIcon,
        onSelect: () => setActiveTab('access'),
      },
    ];

    const extra: MobileNavItem[] = [];
    for (const modItem of dynamicStaffModules) {
      if (primary.length < 4) {
        primary.push(modItem);
      } else {
        extra.push(modItem);
      }
    }

    // Fill remaining primary slots up to 4 with user's own Activity and/or Profile
    if (primary.length < 4 && !primary.some((p) => p.id === 'audit')) {
      primary.push({
        id: 'audit',
        label: t.mobileShell.tabAuditShort,
        icon: <ClipboardList className="w-5 h-5 shrink-0" />,
        onSelect: () => setActiveTab('audit'),
      });
    }
    if (primary.length < 4) {
      primary.push({
        id: 'profile',
        label: t.roleExperience.tabProfile,
        icon: <UserCircle2 className="w-5 h-5 shrink-0" />,
        onSelect: () => setActiveTab('profile'),
      });
    }

    extra.push(settingsCollegeItem);

    return {
      mobilePrimaryItems: primary,
      mobileMenuModules: extra,
    };
  }, [isParent, isTeacher, rolePrimaryTabLabel, dynamicStaffModules, verifiedLinksCount, t]);

  const mobileNotifications = useMemo<MobileNotificationItem[]>(() => {
    const list: MobileNotificationItem[] = [];
    if (isParent) {
      if (verifiedLinksCount > 0) {
        list.push({
          id: `parent-verified-${verifiedLinksCount}`,
          title: t.mobileShell.notifParentLinkVerified,
          description: t.mobileShell.notifParentLinkVerifiedDesc,
          count: verifiedLinksCount,
          targetTab: 'students',
          tone: 'blue',
        });
      }
      const pendingParentCount = parentLinks.filter((l) => l.status === 'pending').length;
      if (pendingParentCount > 0) {
        list.push({
          id: `parent-pending-${pendingParentCount}`,
          title: t.mobileShell.notifPendingLinks,
          description: t.mobileShell.notifPendingLinksDesc,
          count: pendingParentCount,
          targetTab: 'students',
          tone: 'gold',
        });
      }
      return list;
    }

    if (canViewUsers && pendingStaffRequestsCount > 0) {
      list.push({
        id: `staff-reqs-${pendingStaffRequestsCount}`,
        title: t.mobileShell.notifPendingRequests,
        description: t.mobileShell.notifPendingRequestsDesc,
        count: pendingStaffRequestsCount,
        targetTab: 'users',
        tone: 'gold',
      });
    }
    if (canViewParentLinks && pendingStaffParentLinksCount > 0) {
      list.push({
        id: `staff-links-${pendingStaffParentLinksCount}`,
        title: t.mobileShell.notifPendingLinks,
        description: t.mobileShell.notifPendingLinksDesc,
        count: pendingStaffParentLinksCount,
        targetTab: 'parentLinks',
        tone: 'blue',
      });
    }
    if (permittedModulesCount > 0) {
      list.push({
        id: `staff-perms-${permittedModulesCount}`,
        title: t.mobileShell.notifPermissionsActive,
        description: `${t.mobileShell.notifPermissionsActiveDesc} (${permittedModulesCount}/${MODULE_KEYS.length})`,
        targetTab: 'access',
        tone: 'blue',
      });
    }
    return list;
  }, [
    isParent,
    verifiedLinksCount,
    parentLinks,
    canViewUsers,
    pendingStaffRequestsCount,
    canViewParentLinks,
    pendingStaffParentLinksCount,
    permittedModulesCount,
    t,
  ]);

  const cardClass =
    'bg-white border border-[#D7E5F5] rounded-2xl p-4 sm:p-5 md:p-6 shadow-[0_6px_20px_-10px_rgba(21,62,117,0.1)] min-w-0';

  const inputClass =
    'w-full max-w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0]';

  const renderMobileRoleHero = () => {
    const heroTitle = isParent
      ? t.roleExperience.parentGuardianTitle
      : isTeacher
      ? t.roleExperience.teacherFacultyTitle
      : t.roleExperience.officerDeskTitle;

    const heroSubtitle = isParent
      ? t.roleExperience.parentGuardianSubtitle
      : isTeacher
      ? t.roleExperience.teacherFacultySubtitle
      : t.roleExperience.officerDeskSubtitle;

    const RoleIcon = isParent ? Lock : isTeacher ? GraduationCap : Briefcase;

    return (
      <div className="md:hidden bg-[#0B2045] text-white rounded-2xl p-4 sm:p-5 space-y-3 border border-[#D6B45C]/25 shadow-[0_12px_28px_-12px_rgba(11,32,69,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D6B45C]">
            <RoleIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{t.roles[userAccount.role]}</span>
          </span>
          <span className="text-xs font-mono text-[#D7E5F5] tabular-nums">
            {isParent
              ? `${verifiedLinksCount} ${t.labels.linkedChildren}`
              : `${permittedModulesCount}/${MODULE_KEYS.length}`}
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-display font-bold leading-snug">{heroTitle}</div>
          <div className="text-xs text-[#D7E5F5] leading-relaxed">{heroSubtitle}</div>
        </div>
        <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2 text-xs text-[#D7E5F5]">
          <span className="font-medium text-white truncate">{userAccount.fullName}</span>
          {userAccount.department && (
            <span className="truncate text-[#D6B45C] shrink-0">{userAccount.department}</span>
          )}
        </div>

        {isParent ? (
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="w-full min-h-[44px] mt-1 px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#1E63B3]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.labels.requestParentLink}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const firstMod = dynamicStaffModules[0];
                if (firstMod) {
                  firstMod.onSelect();
                } else {
                  setActiveTab('audit');
                }
              }}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-[#2878D0] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#1E63B3]"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {dynamicStaffModules[0]?.label ?? t.nav.audit}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="min-h-[42px] px-3 py-2 rounded-xl border border-white/25 bg-white/10 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-white/15"
            >
              <UserCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.roleExperience.tabProfile}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAccessOverview = () => (
    <div className="space-y-4 md:space-y-5">
      {renderMobileRoleHero()}

      {/* Desktop Account Identity Panel */}
      <div className={`hidden md:block ${cardClass} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#172B45]">{userAccount.fullName}</h2>
            <div className="text-xs text-[#4B6484] mt-1 flex flex-wrap items-center gap-2">
              <span className="font-medium text-[#153E75]">{t.roles[userAccount.role]}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{userAccount.email}</span>
              <span aria-hidden="true">·</span>
              <StatusText status={userAccount.status} />
            </div>
          </div>
          {isParent && (
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-[#1E63B3] transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.labels.requestParentLink}
            </button>
          )}
        </div>

        {isParent && (
          <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs text-[#153E75] flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#2878D0] shrink-0" />
            <span>{t.labels.parentReadOnlyNote}</span>
          </div>
        )}
      </div>

      {isParent && (
        <div className="md:hidden p-3.5 rounded-xl bg-white border border-[#D7E5F5] text-xs text-[#153E75] flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-[#2878D0] shrink-0" />
          <span>{t.labels.parentReadOnlyNote}</span>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs border flex items-center justify-between gap-2 ${
            feedback.type === 'ok'
              ? 'bg-[#EAF2FB] border-[#BFD6F2] text-[#153E75]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span className="min-w-0 break-words">{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role-Specific Mobile Scope Highlights */}
      {isOfficer && (
        <div className="md:hidden grid grid-cols-2 gap-3">
          <div className={`${cardClass} !p-3.5 space-y-1`}>
            <div className="text-[11px] text-[#4B6484] truncate">{t.modules.userManagement.title}</div>
            <div className="text-sm font-semibold text-[#153E75]">
              {canViewUsers ? `${staffUsers.length} · ${t.actions.view}` : t.roleExperience.noModulesAssigned}
            </div>
          </div>
          <div className={`${cardClass} !p-3.5 space-y-1`}>
            <div className="text-[11px] text-[#4B6484] truncate">{t.modules.parentVerification.title}</div>
            <div className="text-sm font-semibold text-[#153E75]">
              {canViewParentLinks
                ? `${staffParentLinks.length} · ${t.actions.view}`
                : t.roleExperience.noModulesAssigned}
            </div>
          </div>
        </div>
      )}

      {isTeacher && (
        <div className="md:hidden grid grid-cols-2 gap-3">
          <div className={`${cardClass} !p-3.5 space-y-1`}>
            <div className="text-[11px] text-[#4B6484] truncate">{t.modules.studentRecords.title}</div>
            <div className="text-sm font-semibold text-[#153E75]">
              {canViewStudents ? `${staffStudents.length} · ${t.actions.view}` : '—'}
            </div>
          </div>
          <div className={`${cardClass} !p-3.5 space-y-1`}>
            <div className="text-[11px] text-[#4B6484] truncate">{t.modules.academicOverview.title}</div>
            <div className="text-xs font-semibold text-[#2878D0]">
              {hasAcademicReserved ? t.statuses.active : t.statuses.pending}
            </div>
          </div>
        </div>
      )}

      {/* Explicit Permissions Matrix Summary */}
      <div className={`${cardClass} space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2FB] text-[#2878D0] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-[#172B45] truncate">
              {t.roleExperience.permittedActions}
            </h3>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#153E75] font-medium shrink-0">
            {permittedModulesCount}/{MODULE_KEYS.length}
          </span>
        </div>

        {permittedModulesCount === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-sm text-[#4B6484]">
            {t.labels.noPermissionsYet}
          </div>
        ) : (
          <div className="divide-y divide-[#EAF1FA]">
            {MODULE_KEYS.map((modKey) => {
              const perms = modules?.[modKey];
              if (!perms) return null;
              const allowedActions = ACTION_KEYS.filter((a) => perms[a]);
              if (allowedActions.length === 0) return null;
              return (
                <div
                  key={modKey}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#172B45] break-words">
                      {t.modules[modKey].title}
                    </div>
                    <div className="text-xs text-[#4B6484] mt-0.5 break-words">
                      {modKey === 'academicOverview'
                        ? t.mobileShell.reservedPhaseNote
                        : t.modules[modKey].desc}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[#2878D0] flex flex-wrap gap-x-1.5 gap-y-1 shrink-0">
                    {allowedActions.map((a) => t.actions[a]).join(' · ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="md:hidden">
        <PWAInstallButton variant="card" />
      </div>
    </div>
  );

  const renderUsersModule = () => (
    <div className="space-y-4">
      <div className={`${cardClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#172B45]">{t.nav.users}</h3>
          <span className="text-xs font-mono text-[#2878D0] tabular-nums">{staffUsers.length}</span>
        </div>
        {staffUsers.length === 0 ? (
          <div className="text-sm text-[#4B6484]">{t.labels.noData}</div>
        ) : (
          <div className="divide-y divide-[#EAF1FA]">
            {staffUsers.map((u) => (
              <div key={u.uid} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#172B45] truncate">{u.fullName}</div>
                  <div className="text-xs text-[#4B6484] truncate">
                    {t.roles[u.role]} · <span className="font-mono">{u.email}</span>
                  </div>
                </div>
                <StatusText status={u.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${cardClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#172B45]">{t.nav.approvals}</h3>
          <span className="text-xs text-[#4B6484]">{t.labels.principalExclusiveNote}</span>
        </div>
        {staffRequests.length === 0 ? (
          <div className="text-sm text-[#4B6484]">{t.labels.noData}</div>
        ) : (
          <div className="divide-y divide-[#EAF1FA]">
            {staffRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#172B45] truncate">{req.fullName}</div>
                  <div className="text-xs text-[#4B6484] truncate">
                    {t.roles[req.requestedRole]} · <span className="font-mono">{req.email}</span>
                  </div>
                </div>
                <StatusText status={req.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderParentLinksModule = () => (
    <div className={`${cardClass} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#172B45]">{t.nav.parentLinks}</h3>
        <span className="text-xs font-mono text-[#2878D0] tabular-nums">
          {staffParentLinks.length}
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            feedback.type === 'ok'
              ? 'bg-[#EAF2FB] border-[#BFD6F2] text-[#153E75]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {staffParentLinks.length === 0 ? (
        <div className="text-sm text-[#4B6484]">{t.labels.noData}</div>
      ) : (
        <div className="divide-y divide-[#EAF1FA]">
          {staffParentLinks.map((link) => (
            <div
              key={link.linkId}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#172B45] truncate">{link.studentName}</div>
                <div className="text-xs text-[#4B6484] font-mono truncate">
                  {link.studentId} · {t.labels[link.relationship]}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusText status={link.status} />
                {canApproveParentLinks && link.status !== 'verified' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleStaffParentLinkDecision(link, 'verified')}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-[#2878D0] text-white text-xs font-medium hover:bg-[#1E63B3]"
                  >
                    {t.labels.verifyParentLink}
                  </button>
                )}
                {canApproveParentLinks && link.status === 'verified' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleStaffParentLinkDecision(link, 'revoked')}
                    className="min-h-[36px] px-3 py-1 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-medium"
                  >
                    {t.labels.revokeParentLink}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPermissionsModule = () => (
    <div className={`${cardClass} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#172B45]">{t.nav.permissions}</h3>
        <span className="text-xs text-[#4B6484]">{t.labels.principalExclusiveNote}</span>
      </div>
      {staffPermissions.length === 0 ? (
        <div className="text-sm text-[#4B6484]">{t.labels.noData}</div>
      ) : (
        <div className="divide-y divide-[#EAF1FA]">
          {staffPermissions.map((prof) => {
            const count = MODULE_KEYS.filter((k) => prof.modules?.[k]?.view).length;
            return (
              <div key={prof.userId} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#172B45]">{t.roles[prof.role]}</div>
                  <div className="text-xs font-mono text-[#667D9B] truncate">{prof.userId}</div>
                </div>
                <span className="text-xs font-mono font-semibold text-[#2878D0] tabular-nums shrink-0">
                  {count}/{MODULE_KEYS.length}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStudentsModule = () => (
    <div className="space-y-5">
      {isParent ? (
        <>
          <div className={`${cardClass} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-[#172B45]">{t.labels.linkedChildren}</h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#2878D0] text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#1E63B3]"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.labels.requestParentLink}
              </button>
            </div>

            {parentLinks.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-sm text-[#4B6484]">
                {t.labels.noData}
              </div>
            ) : (
              <div className="divide-y divide-[#EAF1FA]">
                {parentLinks.map((link) => (
                  <div key={link.linkId} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#172B45] truncate">
                        {link.studentName}
                      </div>
                      <div className="text-xs text-[#4B6484] font-mono">
                        {link.studentId} · {t.labels[link.relationship]}
                      </div>
                    </div>
                    <StatusText status={link.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {canViewStudents && linkedStudents.length > 0 && (
            <div className={`${cardClass} space-y-3`}>
              <div className="text-xs text-[#4B6484]">{t.labels.demoDataBanner}</div>
              <div className="divide-y divide-[#EAF1FA]">
                {linkedStudents.map((stu) => (
                  <div key={stu.studentId} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#172B45] truncate">
                        {stu.fullName}
                      </div>
                      <div className="text-xs text-[#4B6484] truncate">
                        <span className="font-mono text-[#153E75]">{stu.studentId}</span> ·{' '}
                        {stu.programLevel}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2878D0] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {stu.enrollmentStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={`${cardClass} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[#172B45]">
              {t.modules.studentRecords.title}
            </h3>
            <span className="text-xs text-[#667D9B]">{t.labels.demoDataBanner}</span>
          </div>
          {!canViewStudents ? (
            <div className="text-sm text-[#4B6484]">{t.labels.noPermissionsYet}</div>
          ) : staffStudents.length === 0 ? (
            <div className="text-sm text-[#4B6484]">{t.labels.noData}</div>
          ) : (
            <div className="divide-y divide-[#EAF1FA]">
              {staffStudents.map((s) => (
                <div key={s.studentId} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#172B45] truncate">{s.fullName}</div>
                    <div className="text-xs text-[#4B6484] truncate">
                      <span className="font-mono text-[#153E75]">{s.studentId}</span> ·{' '}
                      {s.programLevel}
                    </div>
                  </div>
                  <span className="text-xs text-[#2878D0] font-semibold shrink-0">
                    {s.enrollmentStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAuditView = () => (
    <div className={`${cardClass} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#172B45]">{t.nav.audit}</h3>
        <span className="text-xs text-[#667D9B]">{t.labels.auditImmutableNote}</span>
      </div>
      {auditLogs.length === 0 ? (
        <div className="text-sm text-[#4B6484]">{t.labels.noData}</div>
      ) : (
        <div className="divide-y divide-[#EAF1FA]">
          {auditLogs.slice(0, 40).map((log) => (
            <div key={log.id} className="py-3 space-y-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-[#2878D0]">{log.action}</span>
                <span className="text-[#667D9B] font-mono tabular-nums truncate max-w-full">
                  {log.actorEmail}
                </span>
              </div>
              <div className="text-sm text-[#172B45] break-words">{log.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMobileProfileView = () => (
    <div className="space-y-4">
      <div className={`${cardClass} space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold text-[#172B45] truncate">
              {userAccount.fullName}
            </div>
            <div className="text-xs font-mono text-[#667D9B] truncate mt-0.5">
              {userAccount.email}
            </div>
          </div>
          <StatusText status={userAccount.status} />
        </div>

        <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#4B6484]">{t.labels.role}</span>
            <span className="font-semibold text-[#153E75]">{t.roles[userAccount.role]}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#4B6484]">{t.department}</span>
            <span className="font-medium text-[#172B45] truncate">
              {userAccount.department || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#4B6484]">{t.roleExperience.permittedActions}</span>
            <span className="font-mono font-semibold text-[#2878D0] tabular-nums">
              {permittedModulesCount}/{MODULE_KEYS.length}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-[#153E75]">{t.languageLabel}</div>
          <LanguageSelector onSelect={handleLanguageChange} />
        </div>
      </div>

      <PWAInstallButton variant="card" />

      <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] text-xs text-[#4B6484] text-center">
        {t.roleExperience.centralBackendNote}
      </div>

      <button
        type="button"
        onClick={() => signOut(auth)}
        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#0B2045] text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#153E75]"
      >
        <LogOut className="w-4 h-4 text-[#D6B45C]" />
        <span>{t.signOut}</span>
      </button>
    </div>
  );

  const renderActiveContent = (isDesktop = false) => {
    switch (activeTab) {
      case 'access':
        return renderAccessOverview();
      case 'users':
        return canViewUsers ? renderUsersModule() : renderAccessOverview();
      case 'parentLinks':
        return canViewParentLinks ? renderParentLinksModule() : renderAccessOverview();
      case 'permissions':
        return canViewPerms ? renderPermissionsModule() : renderAccessOverview();
      case 'students':
        return renderStudentsModule();
      case 'audit':
        return renderAuditView();
      case 'collegeProfile':
        return <CollegeProfilePage userAccount={userAccount} permissions={modules} />;
      case 'profile':
        return isDesktop ? renderAccessOverview() : renderMobileProfileView();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FD]">
      {/* DEDICATED DESKTOP SIDEBAR WORKSPACE */}
      <div className="hidden md:flex min-h-screen">
        <aside className="w-[272px] shrink-0 bg-[#153E75] text-white flex flex-col justify-between p-5 border-e border-[#102F5B]">
          <div className="space-y-6">
            <div className="pb-4 border-b border-white/15">
              <CollegeBrandMark variant="navy" compact />
            </div>
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'access'
                    ? 'bg-[#2878D0] text-white shadow-xs'
                    : 'text-[#D7E5F5] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>{t.nav.myAccess}</span>
              </button>

              {isParent ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === 'students'
                      ? 'bg-[#2878D0] text-white shadow-xs'
                      : 'text-[#D7E5F5] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{t.labels.linkedChildren}</span>
                </button>
              ) : (
                dynamicStaffModules.map((mod) => {
                  const active = activeTab === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={mod.onSelect}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#2878D0] text-white shadow-xs'
                          : 'text-[#D7E5F5] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {mod.icon}
                        <span className="truncate">{mod.label}</span>
                      </span>
                      {typeof mod.badge === 'number' && mod.badge > 0 && (
                        <span className="text-xs font-mono tabular-nums text-[#D6B45C]">
                          {mod.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              )}

              {(isParent || !canViewAudit) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === 'audit'
                      ? 'bg-[#2878D0] text-white shadow-xs'
                      : 'text-[#D7E5F5] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>{t.nav.audit}</span>
                </button>
              )}

              <div className="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#D6B66B]">
                {t.nav.settings}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('collegeProfile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'collegeProfile'
                    ? 'bg-[#2878D0] text-white shadow-xs'
                    : 'text-[#D7E5F5] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.nav.collegeProfile}</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-white/15 space-y-3">
            <div className="text-xs space-y-0.5">
              <div className="font-semibold text-white truncate">{userAccount.fullName}</div>
              <div className="text-[#D6B45C] font-medium">{t.roles[userAccount.role]}</div>
              <div className="font-mono text-[#D7E5F5]/80 truncate">{userAccount.email}</div>
            </div>
            <PWAInstallButton variant="navy" />
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-xs font-medium text-white hover:bg-white/15 inline-flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.signOut}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-[#D7E5F5] px-8 flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-[#153E75] truncate">
              {headerCollegeName} / {t.roles[userAccount.role]}
            </div>
            <LanguageSelector onSelect={handleLanguageChange} />
          </header>
          <main className="flex-1 p-8 max-w-5xl w-full mx-auto">
            {renderActiveContent(true)}
          </main>
        </div>
      </div>

      {/* DEDICATED ROLE-TAILORED MOBILE-FIRST INTERFACE */}
      <div className="md:hidden h-[100dvh] flex flex-col overflow-hidden bg-[#F4F8FD]">
        <MobileTopHeader
          userAccount={userAccount}
          notifications={mobileNotifications}
          onSelectLanguage={handleLanguageChange}
          onNavigateTab={(tabId) => setActiveTab(tabId as SubTab)}
          onOpenProfile={() => setActiveTab('profile')}
        />

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pt-3.5 sm:px-4 sm:pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-4 min-w-0">
          {renderActiveContent(false)}
        </main>

        <MobileBottomNav
          userAccount={userAccount}
          activeId={activeTab}
          primaryItems={mobilePrimaryItems}
          menuModules={mobileMenuModules}
          menuQuickActions={
            isParent
              ? [
                  {
                    id: 'parent-request-link',
                    label: t.labels.requestParentLink,
                    icon: <Plus className="w-4 h-4 shrink-0" />,
                    onSelect: () => setShowLinkModal(true),
                  },
                ]
              : []
          }
          onOpenProfile={() => setActiveTab('profile')}
        />
      </div>

      {/* Parent-Child Verification Request Modal / Mobile Bottom Sheet */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-[#153E75]/45 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl border border-[#D7E5F5] p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4 shadow-xl">
            <div className="w-10 h-1.5 bg-[#D7E5F5] rounded-full mx-auto md:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#172B45]">
                {t.labels.requestParentLink}
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#4B6484] hover:bg-[#F4F8FD]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestLink} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.labels.studentId}
                </label>
                <input
                  type="text"
                  required
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
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
                  required
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.labels.relationship}
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as ParentRelationship)}
                  className={inputClass}
                >
                  <option value="mother">{t.labels.mother}</option>
                  <option value="father">{t.labels.father}</option>
                  <option value="legal_guardian">{t.labels.legal_guardian}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.labels.verificationCode}
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  maxLength={64}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6+ character guardian code"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.labels.reviewNote}
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] text-sm font-medium text-[#172B45]"
                >
                  {t.labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3]"
                >
                  {submitting ? '...' : t.labels.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
