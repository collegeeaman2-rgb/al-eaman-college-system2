import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Activity,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Database,
  LayoutDashboard,
  Link2,
  LogOut,
  Plus,
  Search,
  SlidersHorizontal,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  changeUserLifecycleAsPrincipal,
  createPreApprovedInviteAsPrincipal,
  reviewAccountRequestAsPrincipal,
  seedDemoStudentsAsPrincipal,
  updateOwnLanguagePreference,
  updatePermissionsAndRoleAsPrincipal,
  verifyOrRevokeParentLinkAsPrincipal,
} from '../lib/firestoreService';
import { useI18n } from '../i18n/I18nContext';
import { useCollegeProfile } from '../context/CollegeProfileContext';
import {
  createDefaultModulesForRole,
  createEmptyModules,
  normalizeModulePermissions,
  type AccountRequest,
  type AssignableRole,
  type AuditLog,
  type DemoStudent,
  type LanguageCode,
  type ModulePermissions,
  type ParentChildLink,
  type ParentRelationship,
  type PermissionProfile,
  type PreApprovedInvite,
  type UserAccount,
} from '../types/governance';
import { CollegeBrandMark } from './CollegeBrandMark';
import { CollegeProfilePage } from './CollegeProfilePage';
import { LanguageSelector } from './LanguageSelector';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileTopHeader, type MobileNotificationItem } from './MobileTopHeader';
import { PermissionMatrixEditor } from './PermissionMatrixEditor';
import { PWAInstallButton } from './PWAInstallButton';
import { StatusText } from './StatusText';

interface PrincipalWorkspaceProps {
  principal: UserAccount;
}

type PrincipalNavTab =
  | 'overview'
  | 'approvals'
  | 'users'
  | 'permissions'
  | 'parentLinks'
  | 'audit'
  | 'collegeProfile';

export function PrincipalWorkspace({ principal }: PrincipalWorkspaceProps) {
  const { t, lang } = useI18n();
  const { publicIdentity } = useCollegeProfile();
  const [activeTab, setActiveTab] = useState<PrincipalNavTab>('overview');

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [invites, setInvites] = useState<PreApprovedInvite[]>([]);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, PermissionProfile>>({});
  const [demoStudents, setDemoStudents] = useState<DemoStudent[]>([]);
  const [parentLinks, setParentLinks] = useState<ParentChildLink[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [requestFilter, setRequestFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [approvalModules, setApprovalModules] = useState<ModulePermissions>(createEmptyModules());

  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserAccount | null>(null);
  const [editedRole, setEditedRole] = useState<AssignableRole>('teacher');
  const [editedModules, setEditedModules] = useState<ModulePermissions>(createEmptyModules());

  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableRole>('teacher');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteRef, setInviteRef] = useState('');
  const [inviteModules, setInviteModules] = useState<ModulePermissions>(
    createDefaultModulesForRole('teacher')
  );

  const [showParentLinkDrawer, setShowParentLinkDrawer] = useState(false);
  const [linkParentUid, setLinkParentUid] = useState('');
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState<ParentRelationship>('mother');
  const [linkCode, setLinkCode] = useState('');
  const [linkNotes, setLinkNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => setUsers(snap.docs.map((d) => d.data() as UserAccount)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );

    const unsubRequests = onSnapshot(
      query(collection(db, 'accountRequests'), orderBy('createdAt', 'desc')),
      (snap) =>
        setRequests(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccountRequest))
        ),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'accountRequests');
      }
    );

    const unsubInvites = onSnapshot(
      query(collection(db, 'preApprovedInvites'), orderBy('createdAt', 'desc')),
      (snap) => setInvites(snap.docs.map((d) => d.data() as PreApprovedInvite)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'preApprovedInvites');
      }
    );

    const unsubPerms = onSnapshot(
      collection(db, 'permissions'),
      (snap) => {
        const map: Record<string, PermissionProfile> = {};
        for (const docSnap of snap.docs) {
          map[docSnap.id] = docSnap.data() as PermissionProfile;
        }
        setPermissionsMap(map);
      },
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'permissions');
      }
    );

    const unsubStudents = onSnapshot(
      collection(db, 'demoStudents'),
      (snap) => setDemoStudents(snap.docs.map((d) => d.data() as DemoStudent)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'demoStudents');
      }
    );

    const unsubLinks = onSnapshot(
      collection(db, 'parentChildLinks'),
      (snap) => setParentLinks(snap.docs.map((d) => d.data() as ParentChildLink)),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'parentChildLinks');
      }
    );

    const unsubAudit = onSnapshot(
      query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc')),
      (snap) =>
        setAuditLogs(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog))
        ),
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, 'auditLogs');
      }
    );

    return () => {
      unsubUsers();
      unsubRequests();
      unsubInvites();
      unsubPerms();
      unsubStudents();
      unsubLinks();
      unsubAudit();
    };
  }, []);

  const nonPrincipalUsers = useMemo(
    () => users.filter((u) => u.role !== 'principal'),
    [users]
  );

  const pendingRequestsCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests]
  );

  const activeUsersCount = useMemo(
    () => users.filter((u) => u.status === 'active').length,
    [users]
  );

  const verifiedLinksCount = useMemo(
    () => parentLinks.filter((l) => l.status === 'verified').length,
    [parentLinks]
  );

  const pendingLinksCount = useMemo(
    () => parentLinks.filter((l) => l.status === 'pending').length,
    [parentLinks]
  );

  const mobileNotifications = useMemo<MobileNotificationItem[]>(() => {
    const items: MobileNotificationItem[] = [];
    if (pendingRequestsCount > 0) {
      items.push({
        id: `principal-reqs-${pendingRequestsCount}`,
        title: t.mobileShell.notifPendingRequests,
        description: t.mobileShell.notifPendingRequestsDesc,
        count: pendingRequestsCount,
        targetTab: 'approvals',
        tone: 'gold',
      });
    }
    if (pendingLinksCount > 0) {
      items.push({
        id: `principal-links-${pendingLinksCount}`,
        title: t.mobileShell.notifPendingLinks,
        description: t.mobileShell.notifPendingLinksDesc,
        count: pendingLinksCount,
        targetTab: 'parentLinks',
        tone: 'blue',
      });
    }
    return items;
  }, [pendingRequestsCount, pendingLinksCount, t]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (u.fullName ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.department ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, statusFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) =>
      requestFilter === 'all' ? true : r.status === requestFilter
    );
  }, [requests, requestFilter]);

  const filteredAuditLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return auditLogs.slice(0, 60);
    return auditLogs
      .filter(
        (l) =>
          (l.actorEmail ?? '').toLowerCase().includes(q) ||
          (l.action ?? '').toLowerCase().includes(q) ||
          (l.summary ?? '').toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [auditLogs, searchQuery]);

  const notify = (type: 'ok' | 'err', text: string) => {
    setBannerMsg({ type, text });
    setTimeout(() => setBannerMsg(null), 5000);
  };

  const openRequestReview = (req: AccountRequest) => {
    setSelectedRequest(req);
    setReviewNote('');
    setApprovalModules(createDefaultModulesForRole(req.requestedRole));
  };

  const handleReviewDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    setBusy(true);
    try {
      await reviewAccountRequestAsPrincipal({
        principal,
        request: selectedRequest,
        decision,
        reviewNote,
        initialModules: approvalModules,
      });
      setSelectedRequest(null);
      notify('ok', `Request ${decision} for ${selectedRequest.email}.`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to process request.');
    } finally {
      setBusy(false);
    }
  };

  const openUserPermissions = (user: UserAccount) => {
    if (user.role === 'principal') return;
    setSelectedUserForPerms(user);
    setEditedRole(user.role as AssignableRole);
    setEditedModules(
      normalizeModulePermissions(
        permissionsMap[user.uid]?.modules ??
          createDefaultModulesForRole(user.role as AssignableRole)
      )
    );
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUserForPerms) return;
    setBusy(true);
    try {
      await updatePermissionsAndRoleAsPrincipal({
        principal,
        targetUser: selectedUserForPerms,
        nextRole: editedRole,
        modules: editedModules,
      });
      setSelectedUserForPerms(null);
      notify('ok', `Updated role & permissions for ${selectedUserForPerms.email}.`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to save permissions.');
    } finally {
      setBusy(false);
    }
  };

  const handleLifecycleChange = async (
    user: UserAccount,
    nextStatus: 'active' | 'suspended' | 'revoked'
  ) => {
    setBusy(true);
    try {
      await changeUserLifecycleAsPrincipal({
        principal,
        targetUser: user,
        nextStatus,
      });
      notify('ok', `Account ${user.email} is now ${nextStatus}.`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Could not update account status.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createPreApprovedInviteAsPrincipal({
        principal,
        email: inviteEmail,
        fullName: inviteName,
        phone: invitePhone,
        role: inviteRole,
        department: inviteDept,
        referenceCode: inviteRef,
        modules: inviteModules,
      });
      setShowInviteDrawer(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      setInviteDept('');
      setInviteRef('');
      notify('ok', `Pre-approved ${inviteRole} invitation created for ${inviteEmail}.`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to create invite.');
    } finally {
      setBusy(false);
    }
  };

  const handleSeedDemoStudents = async () => {
    setBusy(true);
    try {
      await seedDemoStudentsAsPrincipal(principal);
      notify('ok', 'Synthetic development demo students loaded.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Could not seed demo students.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateVerifiedParentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = demoStudents.find((s) => s.studentId === linkStudentId);
    if (!student || !linkParentUid) return;
    setBusy(true);
    try {
      await verifyOrRevokeParentLinkAsPrincipal({
        principal,
        linkId: `${linkParentUid}_${student.studentId}`,
        parentUid: linkParentUid,
        studentId: student.studentId,
        studentName: student.fullName,
        relationship: linkRelationship,
        nextStatus: 'verified',
        verificationCodeInput: linkCode,
        notes: linkNotes || 'Verified directly by Principal',
      });
      setShowParentLinkDrawer(false);
      setLinkCode('');
      setLinkNotes('');
      notify('ok', 'Parent-child relationship verified.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Could not verify parent link.');
    } finally {
      setBusy(false);
    }
  };

  const handleParentLinkAction = async (
    link: ParentChildLink,
    nextStatus: 'verified' | 'rejected' | 'revoked'
  ) => {
    setBusy(true);
    try {
      await verifyOrRevokeParentLinkAsPrincipal({
        principal,
        linkId: link.linkId,
        parentUid: link.parentUid,
        studentId: link.studentId,
        studentName: link.studentName,
        relationship: link.relationship,
        nextStatus,
        storedHash: link.verificationCodeHash,
        notes: link.notes,
      });
      notify('ok', `Parent link ${link.studentId} marked ${nextStatus}.`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to update parent link.');
    } finally {
      setBusy(false);
    }
  };

  const handleLanguageChange = (nextLang: LanguageCode) => {
    updateOwnLanguagePreference(principal, nextLang).catch(() => {});
  };

  const navItems: { id: PrincipalNavTab; label: string; icon: React.ReactNode; count?: number; isSettings?: boolean }[] = [
    { id: 'overview', label: t.nav.overview, icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    {
      id: 'approvals',
      label: t.nav.approvals,
      icon: <ClipboardCheck className="w-4 h-4 shrink-0" />,
      count: pendingRequestsCount,
    },
    { id: 'users', label: t.nav.users, icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'permissions', label: t.nav.permissions, icon: <SlidersHorizontal className="w-4 h-4 shrink-0" /> },
    { id: 'parentLinks', label: t.nav.parentLinks, icon: <Link2 className="w-4 h-4 shrink-0" /> },
    { id: 'audit', label: t.nav.audit, icon: <ClipboardList className="w-4 h-4 shrink-0" /> },
    {
      id: 'collegeProfile',
      label: t.nav.collegeProfile,
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      isSettings: true,
    },
  ];

  const headerCollegeName =
    lang === 'ta'
      ? publicIdentity.nameTa
      : lang === 'ar'
      ? publicIdentity.nameAr
      : publicIdentity.nameEn;

  const cardClass =
    'bg-white border border-[#D7E5F5] rounded-2xl shadow-[0_6px_20px_-10px_rgba(21,62,117,0.1)] min-w-0';

  const inputClass =
    'w-full max-w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0]';

  const renderOverview = () => (
    <div className="space-y-5 md:space-y-6">
      {/* Mobile-Only Deep Navy Principal Command Card */}
      <div className="md:hidden bg-[#0B2045] text-white rounded-2xl p-4 sm:p-5 space-y-3 border border-[#D6B45C]/25 shadow-[0_12px_28px_-12px_rgba(11,32,69,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#D6B45C]">{t.roles.principal}</span>
          <span className="text-[11px] font-mono text-[#D7E5F5] truncate">
            {t.establishedLabel.replace('{year}', String(publicIdentity.establishedYear))}
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-display font-bold leading-snug">
            {t.roleExperience.principalCommandTitle}
          </div>
          <div className="text-xs text-[#D7E5F5] leading-relaxed">
            {t.roleExperience.principalCommandSubtitle}
          </div>
        </div>
        <div className="text-xs text-[#D7E5F5]/90 truncate pt-1 border-t border-white/15">
          {principal.fullName} · {principal.email}
        </div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className="w-full min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl bg-[#2878D0] text-white text-[11px] min-[390px]:text-xs font-semibold inline-flex items-center justify-center gap-1.5 text-center leading-tight hover:bg-[#1E63B3]"
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span className="whitespace-normal break-words">
              {t.nav.approvals} ({pendingRequestsCount})
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInviteRole('teacher');
              setInviteModules(createDefaultModulesForRole('teacher'));
              setShowInviteDrawer(true);
            }}
            className="w-full min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl border border-white/25 bg-white/10 text-white text-[11px] min-[390px]:text-xs font-semibold inline-flex items-center justify-center gap-1.5 text-center leading-tight hover:bg-white/15"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-normal break-words">{t.labels.createAccountInvite}</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className={`${cardClass} p-4 md:p-5 flex items-start justify-between gap-2`}>
          <div>
            <div className="text-xs text-[#4B6484]">{t.stats.activeUsers}</div>
            <div className="text-2xl md:text-3xl font-semibold text-[#153E75] tabular-nums mt-1.5">
              {activeUsersCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#EAF2FB] text-[#2878D0] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className={`${cardClass} p-4 md:p-5 flex items-start justify-between gap-2`}>
          <div>
            <div className="text-xs text-[#4B6484]">{t.stats.pendingRequests}</div>
            <div className="text-2xl md:text-3xl font-semibold text-[#9A6700] tabular-nums mt-1.5">
              {pendingRequestsCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4 h-4" />
          </div>
        </div>
        <div className={`${cardClass} p-4 md:p-5 flex items-start justify-between gap-2`}>
          <div>
            <div className="text-xs text-[#4B6484]">{t.stats.verifiedLinks}</div>
            <div className="text-2xl md:text-3xl font-semibold text-[#2878D0] tabular-nums mt-1.5">
              {verifiedLinksCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#EAF2FB] text-[#2878D0] flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </div>
        </div>
        <div className={`${cardClass} p-4 md:p-5 flex items-start justify-between gap-2`}>
          <div>
            <div className="text-xs text-[#4B6484]">{t.stats.auditEvents}</div>
            <div className="text-2xl md:text-3xl font-semibold text-[#172B45] tabular-nums mt-1.5">
              {auditLogs.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#EAF2FB] text-[#153E75] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Pending Approvals Summary */}
      <div className={`${cardClass} p-5 md:p-6 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#172B45]">{t.nav.approvals}</h2>
            <p className="text-xs text-[#4B6484] mt-0.5">{t.labels.principalExclusiveNote}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className="text-xs font-semibold text-[#2878D0] hover:underline whitespace-nowrap"
          >
            {t.labels.filterAll} ({requests.length})
          </button>
        </div>

        {pendingRequestsCount === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-sm text-[#4B6484]">
            {t.labels.noData}
          </div>
        ) : (
          <div className="divide-y divide-[#EAF1FA]">
            {requests
              .filter((r) => r.status === 'pending')
              .slice(0, 5)
              .map((req) => (
                <div
                  key={req.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#172B45] truncate">
                      {req.fullName}
                    </div>
                    <div className="text-xs text-[#4B6484] truncate">
                      {t.roles[req.requestedRole]} · <span className="font-mono">{req.email}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openRequestReview(req)}
                    className="min-h-[42px] px-4 py-1.5 rounded-xl bg-[#2878D0] text-white text-xs font-medium hover:bg-[#1E63B3] whitespace-nowrap self-start sm:self-auto"
                  >
                    {t.labels.approve} / {t.labels.reject}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Development Demo Seed Utility */}
      <div
        className={`${cardClass} p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[#172B45]">{t.labels.seedDemoStudents}</div>
          <div className="text-xs text-[#4B6484]">{t.labels.demoDataBanner}</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleSeedDemoStudents}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] bg-[#F4F8FD] hover:bg-[#EAF2FB] text-xs font-semibold text-[#153E75] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <Database className="w-4 h-4 text-[#2878D0]" />
          {t.labels.seedDemoStudents} ({demoStudents.length})
        </button>
      </div>

      {/* PWA Mobile Install Card & Central Backend Indicator */}
      <div className="md:hidden space-y-3">
        <PWAInstallButton variant="card" />
        <div className="px-3 text-[11px] text-[#4B6484] text-center">
          {t.roleExperience.centralBackendNote}
        </div>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto items-center gap-1 p-1 bg-[#EAF2FB] border border-[#D7E5F5] rounded-xl">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setRequestFilter(st)}
              className={`min-h-[40px] sm:min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors truncate ${
                requestFilter === st
                  ? 'bg-[#2878D0] text-white shadow-xs'
                  : 'text-[#153E75] hover:bg-white/70'
              }`}
            >
              {st === 'all'
                ? t.labels.filterAll
                : st === 'pending'
                ? t.statuses.pending
                : st === 'approved'
                ? t.labels.approve
                : t.statuses.rejected}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className={`${cardClass} p-8 text-center text-sm text-[#4B6484]`}>
          {t.labels.noData}
        </div>
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className={`hidden md:block ${cardClass} overflow-hidden`}>
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[#D7E5F5] bg-[#F4F8FD] text-xs font-semibold text-[#153E75]">
                  <th className="py-3 px-4 text-start">{t.fullName}</th>
                  <th className="py-3 px-4 text-start">{t.labels.role}</th>
                  <th className="py-3 px-4 text-start">{t.department}</th>
                  <th className="py-3 px-4 text-start">{t.labels.status}</th>
                  <th className="py-3 px-4 text-end">{t.labels.actionsCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF1FA]">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F8FBFF] transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-[#172B45]">{req.fullName}</div>
                      <div className="text-xs font-mono text-[#667D9B]">{req.email}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#153E75] font-medium">
                      {t.roles[req.requestedRole]}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B6484]">
                      <div>{req.department || '—'}</div>
                      {req.studentReferenceCode && (
                        <div className="font-mono text-[#2878D0] mt-0.5">
                          {req.studentReferenceCode} · {req.studentNameClaim}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-end">
                      {req.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => openRequestReview(req)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2878D0] text-white text-xs font-medium hover:bg-[#1E63B3]"
                        >
                          {t.labels.approve} / {t.labels.reject}
                        </button>
                      ) : (
                        <span className="text-xs text-[#667D9B]">{req.reviewNote || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Touch List */}
          <div className="md:hidden space-y-2.5">
            {filteredRequests.map((req) => (
              <div key={req.id} className={`${cardClass} p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#172B45] truncate">
                      {req.fullName}
                    </div>
                    <div className="text-xs font-mono text-[#667D9B] truncate">{req.email}</div>
                  </div>
                  <StatusText status={req.status} />
                </div>
                <div className="text-xs text-[#4B6484] space-y-1">
                  <div className="font-medium text-[#153E75]">
                    {t.roles[req.requestedRole]} · {req.department || '—'}
                  </div>
                  <div className="text-[#172B45]">{req.justification}</div>
                </div>
                {req.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => openRequestReview(req)}
                    className="w-full min-h-[44px] rounded-xl bg-[#2878D0] text-white text-xs font-medium"
                  >
                    {t.labels.approve} / {t.labels.reject}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#667D9B] absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.labels.searchUsers}
            className="w-full max-w-full min-h-[44px] ps-10 pe-3.5 py-2 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-[#D7E5F5] bg-white text-xs font-medium text-[#172B45]"
          >
            <option value="all">{t.labels.filterAll}</option>
            <option value="active">{t.statuses.active}</option>
            <option value="pending">{t.statuses.pending}</option>
            <option value="suspended">{t.statuses.suspended}</option>
            <option value="revoked">{t.statuses.revoked}</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setInviteRole('teacher');
              setInviteModules(createDefaultModulesForRole('teacher'));
              setShowInviteDrawer(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#1E63B3] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {t.labels.createAccountInvite}
          </button>
        </div>
      </div>

      {/* Desktop Users Table */}
      <div className={`hidden md:block ${cardClass} overflow-hidden`}>
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-[#D7E5F5] bg-[#F4F8FD] text-xs font-semibold text-[#153E75]">
              <th className="py-3 px-4 text-start">{t.fullName}</th>
              <th className="py-3 px-4 text-start">{t.labels.role}</th>
              <th className="py-3 px-4 text-start">{t.department}</th>
              <th className="py-3 px-4 text-start">{t.labels.status}</th>
              <th className="py-3 px-4 text-end">{t.labels.actionsCol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAF1FA]">
            {filteredUsers.map((u) => (
              <tr key={u.uid} className="hover:bg-[#F8FBFF] transition-colors">
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-[#172B45]">{u.fullName}</div>
                  <div className="text-xs font-mono text-[#667D9B]">{u.email}</div>
                </td>
                <td className="py-3 px-4 text-sm text-[#153E75] font-medium">
                  {t.roles[u.role]}
                </td>
                <td className="py-3 px-4 text-xs text-[#4B6484]">{u.department || '—'}</td>
                <td className="py-3 px-4">
                  <StatusText status={u.status} />
                </td>
                <td className="py-3 px-4 text-end">
                  {u.role === 'principal' ? (
                    <span className="text-xs font-medium text-[#153E75]">Primary Authority</span>
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openUserPermissions(u)}
                        className="px-2.5 py-1 rounded-lg border border-[#D7E5F5] bg-[#F4F8FD] text-xs font-medium text-[#153E75] hover:bg-[#EAF2FB]"
                      >
                        {t.labels.editPermissions}
                      </button>
                      {u.status === 'active' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleLifecycleChange(u, 'suspended')}
                          className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-xs font-medium text-amber-900 hover:bg-amber-100"
                        >
                          {t.labels.suspend}
                        </button>
                      )}
                      {(u.status === 'suspended' || u.status === 'pending') && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleLifecycleChange(u, 'active')}
                          className="px-2.5 py-1 rounded-lg border border-[#BFD6F2] bg-[#EAF2FB] text-xs font-medium text-[#153E75] hover:bg-[#D7E5F5]"
                        >
                          {t.labels.reactivate}
                        </button>
                      )}
                      {u.status !== 'revoked' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleLifecycleChange(u, 'revoked')}
                          className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-900 hover:bg-red-100"
                        >
                          {t.labels.revoke}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Touch User Cards */}
      <div className="md:hidden space-y-2.5">
        {filteredUsers.map((u) => (
          <div key={u.uid} className={`${cardClass} p-4 space-y-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#172B45] truncate">{u.fullName}</div>
                <div className="text-xs font-mono text-[#667D9B] truncate">{u.email}</div>
              </div>
              <StatusText status={u.status} />
            </div>
            <div className="text-xs text-[#4B6484]">
              <span className="font-medium text-[#153E75]">{t.roles[u.role]}</span> ·{' '}
              {u.department || '—'}
            </div>
            {u.role !== 'principal' && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openUserPermissions(u)}
                  className="flex-1 min-w-[110px] min-h-[44px] px-3 rounded-xl border border-[#D7E5F5] bg-[#F4F8FD] text-xs font-medium text-[#153E75]"
                >
                  {t.labels.editPermissions}
                </button>
                {u.status === 'active' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleLifecycleChange(u, 'suspended')}
                    className="flex-1 min-w-[110px] min-h-[44px] px-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900"
                  >
                    {t.labels.suspend}
                  </button>
                ) : u.status !== 'revoked' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleLifecycleChange(u, 'active')}
                    className="flex-1 min-w-[110px] min-h-[44px] px-3 rounded-xl bg-[#EAF2FB] border border-[#BFD6F2] text-xs font-medium text-[#153E75]"
                  >
                    {t.labels.reactivate}
                  </button>
                ) : null}
                {u.status !== 'revoked' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleLifecycleChange(u, 'revoked')}
                    className="flex-1 min-w-[100px] min-h-[44px] px-3 rounded-xl border border-red-200 bg-red-50 text-xs font-medium text-red-900"
                  >
                    {t.labels.revoke}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pre-Approved Invites List */}
      {invites.length > 0 && (
        <div className={`${cardClass} p-5 space-y-3`}>
          <h3 className="text-sm font-semibold text-[#172B45]">{t.labels.createAccountInvite}</h3>
          <div className="divide-y divide-[#EAF1FA]">
            {invites.map((inv) => (
              <div key={inv.inviteId} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#172B45] truncate">{inv.fullName}</div>
                  <div className="text-xs font-mono text-[#667D9B] truncate">
                    {inv.email} · {t.roles[inv.role]}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#2878D0] uppercase">{inv.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPermissionsView = () => (
    <div className="space-y-4">
      <div className={`${cardClass} p-5 md:p-6 space-y-4`}>
        <div>
          <div className="text-base font-semibold text-[#172B45]">{t.nav.permissions}</div>
          <p className="text-xs text-[#4B6484] mt-0.5">{t.labels.principalExclusiveNote}</p>
        </div>
        {nonPrincipalUsers.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs text-[#4B6484]">
            {t.labels.noData}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nonPrincipalUsers.map((u) => (
              <button
                key={u.uid}
                type="button"
                onClick={() => openUserPermissions(u)}
                className="text-start p-4 rounded-xl border border-[#D7E5F5] hover:border-[#2878D0] bg-[#F4F8FD] hover:bg-white transition-colors space-y-1.5 min-h-[72px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#172B45] truncate">
                    {u.fullName}
                  </span>
                  <StatusText status={u.status} />
                </div>
                <div className="text-xs text-[#4B6484] truncate">
                  <span className="font-medium text-[#153E75]">{t.roles[u.role]}</span> ·{' '}
                  <span className="font-mono">{u.email}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderParentLinksView = () => {
    const parentUsers = users.filter((u) => u.role === 'parent' && u.status === 'active');
    return (
      <div className="space-y-5">
        <div
          className={`${cardClass} p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
        >
          <div>
            <h3 className="text-base font-semibold text-[#172B45]">{t.nav.parentLinks}</h3>
            <p className="text-xs text-[#4B6484] mt-0.5">{t.labels.parentReadOnlyNote}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {demoStudents.length === 0 && (
              <button
                type="button"
                onClick={handleSeedDemoStudents}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D7E5F5] bg-[#F4F8FD] text-xs font-medium text-[#153E75]"
              >
                {t.labels.seedDemoStudents}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setLinkParentUid(parentUsers[0]?.uid ?? '');
                setLinkStudentId(demoStudents[0]?.studentId ?? '');
                setShowParentLinkDrawer(true);
              }}
              disabled={parentUsers.length === 0 || demoStudents.length === 0}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-[#1E63B3]"
            >
              <Plus className="w-4 h-4" />
              {t.labels.verifyParentLink}
            </button>
          </div>
        </div>

        {/* Demo Students Reference */}
        <div className={`${cardClass} p-5 md:p-6 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[#172B45]">
              {t.modules.studentRecords.title}
            </h4>
            <span className="text-xs text-[#667D9B]">{t.labels.demoDataBanner}</span>
          </div>
          {demoStudents.length === 0 ? (
            <div className="text-xs text-[#4B6484]">{t.labels.noData}</div>
          ) : (
            <div className="divide-y divide-[#EAF1FA]">
              {demoStudents.map((s) => (
                <div key={s.studentId} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#172B45]">{s.fullName}</div>
                    <div className="text-xs text-[#4B6484]">
                      <span className="font-mono text-[#2878D0]">{s.studentId}</span> ·{' '}
                      {s.programLevel}
                    </div>
                  </div>
                  <span className="text-xs text-[#667D9B]">{s.guardianHint}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parent-Child Links Queue */}
        <div className={`${cardClass} p-5 md:p-6 space-y-3`}>
          <h4 className="text-sm font-semibold text-[#172B45]">Verification Queue & Active Links</h4>
          {parentLinks.length === 0 ? (
            <div className="text-xs text-[#4B6484]">{t.labels.noData}</div>
          ) : (
            <div className="divide-y divide-[#EAF1FA]">
              {parentLinks.map((link) => {
                const parentUser = users.find((u) => u.uid === link.parentUid);
                return (
                  <div
                    key={link.linkId}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#172B45]">
                        {parentUser?.fullName ?? link.parentUid} → {link.studentName}
                      </div>
                      <div className="text-xs text-[#4B6484] font-mono">
                        {link.studentId} · {t.labels[link.relationship]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusText status={link.status} />
                      {link.status !== 'verified' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleParentLinkAction(link, 'verified')}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-[#2878D0] text-white text-xs font-medium hover:bg-[#1E63B3]"
                        >
                          {t.labels.verifyParentLink}
                        </button>
                      )}
                      {link.status === 'verified' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleParentLinkAction(link, 'revoked')}
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-medium"
                        >
                          {t.labels.revokeParentLink}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAuditView = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#667D9B] absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.labels.searchUsers}
            className="w-full max-w-full min-h-[44px] ps-10 pe-3.5 py-2 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0]"
          />
        </div>
        <span className="text-xs text-[#667D9B]">{t.labels.auditImmutableNote}</span>
      </div>

      {/* Desktop Audit Table */}
      <div className={`hidden md:block ${cardClass} overflow-hidden`}>
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-[#D7E5F5] bg-[#F4F8FD] text-xs font-semibold text-[#153E75]">
              <th className="py-3 px-4 text-start">{t.labels.event}</th>
              <th className="py-3 px-4 text-start">{t.labels.actor}</th>
              <th className="py-3 px-4 text-start">{t.labels.target}</th>
              <th className="py-3 px-4 text-start">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAF1FA]">
            {filteredAuditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-[#F8FBFF] transition-colors">
                <td className="py-3 px-4 font-mono text-xs font-medium text-[#2878D0] whitespace-nowrap">
                  {log.action}
                </td>
                <td className="py-3 px-4 text-xs text-[#153E75]">
                  <span className="font-mono">{log.actorEmail}</span>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-[#667D9B]">
                  {log.targetResource}
                </td>
                <td className="py-3 px-4 text-sm text-[#172B45]">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Audit Cards */}
      <div className="md:hidden space-y-2.5">
        {filteredAuditLogs.map((log) => (
          <div key={log.id} className={`${cardClass} p-4 space-y-1.5`}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-[#2878D0]">{log.action}</span>
              <span className="font-mono text-[#667D9B] truncate">{log.actorEmail}</span>
            </div>
            <div className="text-sm text-[#172B45]">{log.summary}</div>
            <div className="text-[11px] font-mono text-[#667D9B] truncate">
              {log.targetResource}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'approvals':
        return renderApprovals();
      case 'users':
        return renderUsers();
      case 'permissions':
        return renderPermissionsView();
      case 'parentLinks':
        return renderParentLinksView();
      case 'audit':
        return renderAuditView();
      case 'collegeProfile':
        return <CollegeProfilePage userAccount={principal} permissions={null} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FD]">
      {/* DEDICATED DESKTOP SIDEBAR WORKSPACE */}
      <div className="hidden md:flex min-h-screen">
        <aside className="w-[272px] shrink-0 bg-[#153E75] text-white border-e border-[#102F5B] flex flex-col justify-between p-5">
          <div className="space-y-6">
            <div className="pb-4 border-b border-white/15">
              <CollegeBrandMark variant="navy" compact />
            </div>
            <nav className="space-y-1.5">
              {navItems
                .filter((i) => !i.isSettings)
                .map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#2878D0] text-white shadow-xs'
                          : 'text-[#D7E5F5] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span
                          className={`text-xs font-mono tabular-nums ${
                            active ? 'text-white' : 'text-[#D6B66B]'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}

              <div className="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#D6B66B]">
                {t.nav.settings}
              </div>
              {navItems
                .filter((i) => i.isSettings)
                .map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#2878D0] text-white shadow-xs'
                          : 'text-[#D7E5F5] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </span>
                    </button>
                  );
                })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/15 space-y-3">
            <div className="space-y-0.5 text-xs">
              <div className="font-semibold text-white truncate">{principal.fullName}</div>
              <div className="text-[#D6B66B] font-medium">{t.roles.principal}</div>
              <div className="font-mono text-[#D7E5F5]/80 truncate">{principal.email}</div>
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
              {headerCollegeName} / {navItems.find((n) => n.id === activeTab)?.label}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <LanguageSelector onSelect={handleLanguageChange} />
            </div>
          </header>

          <main className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-5">
            {bannerMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs border flex items-center justify-between ${
                  bannerMsg.type === 'ok'
                    ? 'bg-[#EAF2FB] border-[#BFD6F2] text-[#153E75]'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <span>{bannerMsg.text}</span>
                <button type="button" onClick={() => setBannerMsg(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {renderActiveContent()}
          </main>
        </div>
      </div>

      {/* DEDICATED MOBILE-FIRST TOUCH WORKSPACE */}
      <div className="md:hidden h-[100dvh] flex flex-col overflow-hidden bg-[#F4F8FD]">
        <MobileTopHeader
          userAccount={principal}
          notifications={mobileNotifications}
          onSelectLanguage={handleLanguageChange}
          onNavigateTab={(tabId) => setActiveTab(tabId as PrincipalNavTab)}
        />

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pt-3.5 sm:px-4 sm:pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-4 min-w-0">
          {bannerMsg && (
            <div
              className={`p-3 rounded-xl text-xs border flex items-center justify-between gap-2 ${
                bannerMsg.type === 'ok'
                  ? 'bg-[#EAF2FB] border-[#BFD6F2] text-[#153E75]'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <span className="min-w-0 break-words">{bannerMsg.text}</span>
              <button type="button" onClick={() => setBannerMsg(null)} className="shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {renderActiveContent()}
        </main>

        <MobileBottomNav
          userAccount={principal}
          activeId={activeTab}
          primaryItems={[
            {
              id: 'overview',
              label: t.nav.overview,
              icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
              onSelect: () => setActiveTab('overview'),
            },
            {
              id: 'approvals',
              label: t.nav.approvals,
              icon: <ClipboardCheck className="w-5 h-5 shrink-0" />,
              badge: pendingRequestsCount,
              onSelect: () => setActiveTab('approvals'),
            },
            {
              id: 'users',
              label: t.nav.users,
              shortLabel: t.mobileShell.tabUsersShort,
              icon: <Users className="w-5 h-5 shrink-0" />,
              onSelect: () => setActiveTab('users'),
            },
            {
              id: 'permissions',
              label: t.nav.permissions,
              shortLabel: t.mobileShell.tabPermsShort,
              icon: <SlidersHorizontal className="w-5 h-5 shrink-0" />,
              onSelect: () => setActiveTab('permissions'),
            },
          ]}
          menuModules={[
            {
              id: 'collegeProfile',
              label: `${t.nav.settings} · ${t.nav.collegeProfile}`,
              description: t.collegeProfilePage.pageSubtitle,
              icon: <Building2 className="w-5 h-5 shrink-0" />,
              onSelect: () => setActiveTab('collegeProfile'),
            },
            {
              id: 'parentLinks',
              label: t.nav.parentLinks,
              description: t.modules.parentVerification.desc,
              icon: <Link2 className="w-5 h-5 shrink-0" />,
              badge: pendingLinksCount,
              onSelect: () => setActiveTab('parentLinks'),
            },
            {
              id: 'audit',
              label: t.nav.audit,
              description: t.modules.auditCompliance.desc,
              icon: <ClipboardList className="w-5 h-5 shrink-0" />,
              onSelect: () => setActiveTab('audit'),
            },
          ]}
          menuQuickActions={[
            {
              id: 'create-invite',
              label: t.labels.createAccountInvite,
              icon: <Plus className="w-4 h-4 shrink-0" />,
              onSelect: () => {
                setInviteRole('teacher');
                setInviteModules(createDefaultModulesForRole('teacher'));
                setShowInviteDrawer(true);
              },
            },
            {
              id: 'seed-students',
              label: `${t.labels.seedDemoStudents} (${demoStudents.length})`,
              icon: <Database className="w-4 h-4 shrink-0" />,
              onSelect: () => {
                void handleSeedDemoStudents();
              },
            },
          ]}
        />
      </div>

      {/* DRAWER 1: REVIEW ACCOUNT REQUEST */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-[#153E75]/45 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl border border-[#D7E5F5] p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5 shadow-xl">
            <div className="w-10 h-1.5 bg-[#D7E5F5] rounded-full mx-auto md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#172B45]">
                  {selectedRequest.fullName}
                </h3>
                <p className="text-xs text-[#4B6484] mt-0.5">
                  <span className="font-medium text-[#153E75]">
                    {t.roles[selectedRequest.requestedRole]}
                  </span>{' '}
                  · <span className="font-mono">{selectedRequest.email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#4B6484] hover:bg-[#F4F8FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-sm text-[#172B45] space-y-1">
              <div className="text-xs font-medium text-[#153E75]">{t.justification}</div>
              <div>{selectedRequest.justification}</div>
              {selectedRequest.studentReferenceCode && (
                <div className="text-xs font-mono text-[#2878D0] pt-1">
                  Student Claim: {selectedRequest.studentReferenceCode} ·{' '}
                  {selectedRequest.studentNameClaim}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-[#172B45]">{t.nav.permissions}</div>
              <PermissionMatrixEditor
                role={selectedRequest.requestedRole}
                modules={approvalModules}
                onChange={setApprovalModules}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#153E75] mb-1">
                {t.labels.reviewNote}
              </label>
              <input
                type="text"
                maxLength={500}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Optional note for audit record"
                className={inputClass}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleReviewDecision('rejected')}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-900 text-sm font-medium hover:bg-red-100"
              >
                {t.labels.reject}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleReviewDecision('approved')}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3]"
              >
                {t.labels.approve}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER 2: EDIT USER ROLE & PERMISSIONS MATRIX */}
      {selectedUserForPerms && (
        <div className="fixed inset-0 z-50 bg-[#153E75]/45 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl border border-[#D7E5F5] p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5 shadow-xl">
            <div className="w-10 h-1.5 bg-[#D7E5F5] rounded-full mx-auto md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#172B45]">
                  {selectedUserForPerms.fullName}
                </h3>
                <p className="text-xs font-mono text-[#667D9B]">{selectedUserForPerms.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForPerms(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#4B6484] hover:bg-[#F4F8FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#153E75] mb-1">
                {t.labels.changeRole}
              </label>
              <select
                value={editedRole}
                onChange={(e) => setEditedRole(e.target.value as AssignableRole)}
                className="w-full sm:w-64 min-h-[44px] px-3 py-2 rounded-xl border border-[#D7E5F5] text-base sm:text-sm text-[#172B45] bg-white focus:outline-none focus:border-[#2878D0]"
              >
                <option value="officer">{t.roles.officer}</option>
                <option value="teacher">{t.roles.teacher}</option>
                <option value="parent">{t.roles.parent}</option>
              </select>
            </div>

            <PermissionMatrixEditor
              role={editedRole}
              modules={editedModules}
              onChange={setEditedModules}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForPerms(null)}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] text-sm font-medium text-[#172B45]"
              >
                {t.labels.cancel}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleSaveUserPermissions}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3]"
              >
                {busy ? '...' : t.labels.savePermissions}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER 3: PRE-APPROVE / CREATE USER INVITE */}
      {showInviteDrawer && (
        <div className="fixed inset-0 z-50 bg-[#153E75]/45 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl border border-[#D7E5F5] p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5 shadow-xl">
            <div className="w-10 h-1.5 bg-[#D7E5F5] rounded-full mx-auto md:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#172B45]">
                {t.labels.createAccountInvite}
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteDrawer(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#4B6484] hover:bg-[#F4F8FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4">
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
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {t.emailAddress}
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {t.labels.role}
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => {
                      const next = e.target.value as AssignableRole;
                      setInviteRole(next);
                      setInviteModules(createDefaultModulesForRole(next));
                    }}
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
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
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
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  Reference Code
                </label>
                <input
                  type="text"
                  maxLength={64}
                  value={inviteRef}
                  onChange={(e) => setInviteRef(e.target.value)}
                  placeholder="STF-2026-01"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <PermissionMatrixEditor
                role={inviteRole}
                modules={inviteModules}
                onChange={setInviteModules}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteDrawer(false)}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] text-sm font-medium text-[#172B45]"
                >
                  {t.labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-medium hover:bg-[#1E63B3]"
                >
                  {busy ? '...' : t.labels.createAccountInvite}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER 4: VERIFY PARENT-CHILD LINK */}
      {showParentLinkDrawer && (
        <div className="fixed inset-0 z-50 bg-[#153E75]/45 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl border border-[#D7E5F5] p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4 shadow-xl">
            <div className="w-10 h-1.5 bg-[#D7E5F5] rounded-full mx-auto md:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#172B45]">
                {t.labels.verifyParentLink}
              </h3>
              <button
                type="button"
                onClick={() => setShowParentLinkDrawer(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#4B6484] hover:bg-[#F4F8FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVerifiedParentLink} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.roles.parent}
                </label>
                <select
                  required
                  value={linkParentUid}
                  onChange={(e) => setLinkParentUid(e.target.value)}
                  className={inputClass}
                >
                  {users
                    .filter((u) => u.role === 'parent' && u.status === 'active')
                    .map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.fullName} ({p.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.labels.studentId}
                </label>
                <select
                  required
                  value={linkStudentId}
                  onChange={(e) => setLinkStudentId(e.target.value)}
                  className={inputClass}
                >
                  {demoStudents.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.studentId} — {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {t.labels.relationship}
                </label>
                <select
                  value={linkRelationship}
                  onChange={(e) => setLinkRelationship(e.target.value as ParentRelationship)}
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
                  minLength={6}
                  maxLength={64}
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  placeholder="Optional 6+ char guardian code"
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
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParentLinkDrawer(false)}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] text-sm font-medium text-[#172B45]"
                >
                  {t.labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#1E63B3]"
                >
                  <UserCheck className="w-4 h-4" />
                  {busy ? '...' : t.labels.verifyParentLink}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
