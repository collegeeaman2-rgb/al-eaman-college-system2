import type { LanguageCode, ModuleKey, ActionKey, UserRole, AccountStatus } from '../types/governance';

export const COLLEGE_NAMES: Record<LanguageCode, string> = {
  en: 'Al EAMAN Muslim Ladies Arabic College',
  ta: 'அல் ஈமான் முஸ்லிம் மகளிர் அரபிக் கல்லூரி',
  ar: 'كلية الإيمان العربية للبنات المسلمات',
};

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  ta: 'தமிழ்',
  ar: 'العربية',
};

export interface TranslationDictionary {
  collegeName: string;
  portalSubtitle: string;
  phaseBadge: string;
  logoSlotLabel: string;
  languageLabel: string;
  signIn: string;
  signOut: string;
  createRequest: string;
  principalSetupTitle: string;
  principalSetupSubtitle: string;
  principalSetupPolicy: string;
  principalSetupAuthorizedEmail: string;
  principalSetupButton: string;
  continueWithGoogle: string;
  emailAddress: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  department: string;
  requestedRole: string;
  justification: string;
  studentReferenceCode: string;
  studentNameClaim: string;
  useEmailPassword: string;
  signInWithEmail: string;
  registerAndRequest: string;
  emailProviderHintTitle: string;
  emailProviderHintBody: string;
  verifyEmailTitle: string;
  verifyEmailBody: string;
  verifyEmailSpamHint: string;
  resendVerification: string;
  resendVerificationCountdown: string;
  verificationEmailSent: string;
  verificationAccountCreated: string;
  tooManyRequestsError: string;
  refreshVerification: string;
  pendingTitle: string;
  pendingBody: string;
  suspendedTitle: string;
  suspendedBody: string;
  revokedTitle: string;
  revokedBody: string;
  rejectedTitle: string;
  rejectedBody: string;
  inviteDetectedTitle: string;
  inviteDetectedBody: string;
  claimInviteButton: string;
  nav: {
    overview: string;
    approvals: string;
    users: string;
    permissions: string;
    parentLinks: string;
    audit: string;
    myAccess: string;
    settings: string;
    collegeProfile: string;
  };
  establishedLabel: string;
  roles: Record<UserRole, string>;
  statuses: Record<AccountStatus, string>;
  modules: Record<ModuleKey, { title: string; desc: string }>;
  actions: Record<ActionKey, string>;
  stats: {
    activeUsers: string;
    pendingRequests: string;
    verifiedLinks: string;
    auditEvents: string;
  };
  labels: {
    searchUsers: string;
    filterAll: string;
    approve: string;
    reject: string;
    suspend: string;
    reactivate: string;
    revoke: string;
    createAccountInvite: string;
    savePermissions: string;
    reviewNote: string;
    noData: string;
    seedDemoStudents: string;
    demoDataBanner: string;
    parentReadOnlyNote: string;
    verifyParentLink: string;
    revokeParentLink: string;
    requestParentLink: string;
    studentId: string;
    relationship: string;
    verificationCode: string;
    generateCode: string;
    mother: string;
    father: string;
    legal_guardian: string;
    linkedChildren: string;
    noPermissionsYet: string;
    phase1BoundaryNote: string;
    principalExclusiveNote: string;
    auditImmutableNote: string;
    cancel: string;
    submit: string;
    close: string;
    editPermissions: string;
    changeRole: string;
    status: string;
    role: string;
    email: string;
    actionsCol: string;
    timestamp: string;
    actor: string;
    event: string;
    target: string;
  };
  passwordRules: {
    title: string;
    min_length: string;
    uppercase: string;
    lowercase: string;
    digit: string;
    symbol: string;
    common_or_institutional_word: string;
    contains_email: string;
  };
  pwa: {
    installApp: string;
    installOnPhone: string;
    installShort: string;
    installedBadge: string;
    installSubtitle: string;
    guideTitle: string;
    iosGuideTitle: string;
    iosStep1: string;
    iosStep2: string;
    iosStep3: string;
    androidGuideTitle: string;
    androidStep1: string;
    androidStep2: string;
    offlineBanner: string;
    updateReadyTitle: string;
    updateNow: string;
  };
  roleExperience: {
    officerDeskTitle: string;
    officerDeskSubtitle: string;
    teacherFacultyTitle: string;
    teacherFacultySubtitle: string;
    parentGuardianTitle: string;
    parentGuardianSubtitle: string;
    principalCommandTitle: string;
    principalCommandSubtitle: string;
    tabDesk: string;
    tabDirectory: string;
    tabFaculty: string;
    tabStudents: string;
    tabHome: string;
    tabMyChild: string;
    tabProfile: string;
    permittedActions: string;
    noModulesAssigned: string;
    centralBackendNote: string;
  };
  mobileShell: {
    brandShort: string;
    menu: string;
    notifications: string;
    unreadLabel: string;
    markAllRead: string;
    noNotifications: string;
    accountSecurity: string;
    securityEnforcedNote: string;
    authorizedModules: string;
    remainingModules: string;
    quickControls: string;
    noExtraModules: string;
    reservedPhaseNote: string;
    notifPendingRequests: string;
    notifPendingRequestsDesc: string;
    notifPendingLinks: string;
    notifPendingLinksDesc: string;
    notifParentLinkVerified: string;
    notifParentLinkVerifiedDesc: string;
    notifPermissionsActive: string;
    notifPermissionsActiveDesc: string;
    openModule: string;
    tabParentLinksShort: string;
    tabAuditShort: string;
    tabAccessShort: string;
    tabUsersShort: string;
    tabPermsShort: string;
    tabStudentsShort: string;
    tabSettingsShort: string;
  };
  collegeProfilePage: {
    pageTitle: string;
    pageSubtitle: string;
    settingsSectionLabel: string;
    editProfileBtn: string;
    cancelEditBtn: string;
    saveChangesBtn: string;
    savingBtn: string;
    initializeRecordBtn: string;
    notInitializedNotice: string;
    readOnlyStaffBanner: string;
    readOnlyParentBanner: string;
    editableStaffBanner: string;
    principalAssetsOnlyNote: string;
    versionBadge: string;
    lastUpdatedBy: string;
    tabDetails: string;
    tabAssets: string;
    tabHistory: string;
    sectionIdentity: string;
    sectionAddress: string;
    sectionContact: string;
    sectionAbout: string;
    sectionGovernance: string;
    nameEnLabel: string;
    nameTaLabel: string;
    nameArLabel: string;
    shortNameLabel: string;
    establishedYearLabel: string;
    registrationNumberLabel: string;
    addressEnLabel: string;
    addressTaLabel: string;
    addressArLabel: string;
    cityLabel: string;
    districtLabel: string;
    provinceLabel: string;
    countryLabel: string;
    postalCodeLabel: string;
    telephoneLabel: string;
    alternateTelephoneLabel: string;
    emailLabel: string;
    websiteLabel: string;
    introductionEnLabel: string;
    introductionTaLabel: string;
    introductionArLabel: string;
    visionEnLabel: string;
    visionTaLabel: string;
    visionArLabel: string;
    missionEnLabel: string;
    missionTaLabel: string;
    missionArLabel: string;
    principalStaffIdLabel: string;
    principalStaffIdHint: string;
    notProvidedYet: string;
    reasonPromptTitle: string;
    reasonPlaceholder: string;
    reasonRequiredError: string;
    savedSuccess: string;
    assetsTitle: string;
    assetsSubtitle: string;
    assetLogoTitle: string;
    assetLogoDesc: string;
    assetSealTitle: string;
    assetSealDesc: string;
    assetSignatureTitle: string;
    assetSignatureDesc: string;
    uploadImageBtn: string;
    restoreOriginalLogoBtn: string;
    removeAssetBtn: string;
    assetUploadHint: string;
    assetNotUploaded: string;
    assetSavedSuccess: string;
    assetReasonDefaultUpload: string;
    assetReasonDefaultRestore: string;
    assetReasonDefaultRemove: string;
    assetDimensionsLabel: string;
    originalCrestActiveLabel: string;
    historyTitle: string;
    historySubtitle: string;
    noRevisionsYet: string;
    previousValueLabel: string;
    newValueLabel: string;
    changedFieldsLabel: string;
    revisionReasonLabel: string;
    emptyValueLabel: string;
    targetProfile: string;
    targetLogo: string;
    targetSeal: string;
    targetSignature: string;
    documentSnapshotNote: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    collegeName: COLLEGE_NAMES.en,
    portalSubtitle: 'Identity, Access Governance & User Management Portal',
    phaseBadge: 'Phase 1 · Login & User Management',
    logoSlotLabel: 'Al EAMAN Official College Crest',
    languageLabel: 'Language',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    createRequest: 'Request Account',
    principalSetupTitle: 'One-Time Principal Initialization',
    principalSetupSubtitle:
      'Establish the single primary Principal account for Al EAMAN Muslim Ladies Arabic College. This setup locks permanently after completion.',
    principalSetupPolicy:
      'No public default password exists. Only the verified institutional administrator email may complete this one-time ceremony.',
    principalSetupAuthorizedEmail: 'Authorized Bootstrap Email',
    principalSetupButton: 'Complete One-Time Principal Setup',
    continueWithGoogle: 'Continue with Google',
    emailAddress: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    phone: 'Contact Phone',
    department: 'Department / Section',
    requestedRole: 'Requested Role',
    justification: 'Purpose & Role Justification',
    studentReferenceCode: 'Student Reference ID (Optional)',
    studentNameClaim: 'Student Full Name (For Parent Verification)',
    useEmailPassword: 'Or use Email & Password',
    signInWithEmail: 'Sign In with Email',
    registerAndRequest: 'Create Account & Submit Request',
    emailProviderHintTitle: 'Enable Email/Password in Firebase Console',
    emailProviderHintBody:
      'Email/Password sign-in is not yet toggled on in this Firebase project. Use Google Sign-In now, or enable Email/Password under Firebase Console > Authentication > Sign-in method.',
    verifyEmailTitle: 'Email Verification Required',
    verifyEmailBody:
      'For institutional security, your email address must be verified before accessing college records or submitting requests.',
    verifyEmailSpamHint:
      'If you do not see the verification email within 1–2 minutes, please check your Spam / Junk and Promotions folders.',
    resendVerification: 'Resend Verification Email',
    resendVerificationCountdown: 'Resend available in {seconds}s',
    verificationEmailSent:
      'Verification email sent. Please check your Inbox, Spam, and Promotions folders.',
    verificationAccountCreated:
      'Account created. Verification link sent to your email. Please check your Inbox, Spam, and Promotions folders.',
    tooManyRequestsError:
      'Too many verification or sign-in attempts in a short time. Please wait 60 seconds and check your Inbox, Spam, and Promotions folders before trying again.',
    refreshVerification: 'I Verified My Email — Refresh',
    pendingTitle: 'Account Request Pending Principal Approval',
    pendingBody:
      'Your request has been securely recorded. No account becomes active until reviewed and approved by the Principal.',
    suspendedTitle: 'Account Temporarily Suspended',
    suspendedBody:
      'Your access has been suspended by the Principal. Please contact college administration for review.',
    revokedTitle: 'Account Access Revoked',
    revokedBody:
      'This account has been permanently revoked by the Principal and can no longer access the management system.',
    rejectedTitle: 'Account Request Declined',
    rejectedBody:
      'Your account request was declined by the Principal. Review notes are managed by college administration.',
    inviteDetectedTitle: 'Pre-Approved College Invitation Found',
    inviteDetectedBody:
      'The Principal has pre-authorized your email address with an assigned role and permission profile.',
    claimInviteButton: 'Activate My College Account',
    nav: {
      overview: 'Overview',
      approvals: 'Approvals',
      users: 'Users',
      permissions: 'Permissions',
      parentLinks: 'Parent Links',
      audit: 'Audit Logs',
      myAccess: 'My Access',
      settings: 'Settings',
      collegeProfile: 'College Profile',
    },
    establishedLabel: 'Est. {year}',
    roles: {
      principal: 'Principal',
      officer: 'Officer',
      teacher: 'Teacher',
      parent: 'Parent',
    },
    statuses: {
      pending: 'Pending',
      active: 'Active',
      suspended: 'Suspended',
      revoked: 'Revoked',
      rejected: 'Rejected',
    },
    modules: {
      userManagement: {
        title: 'User & Approval Management',
        desc: 'View directory, review pending requests, and manage account lifecycle.',
      },
      permissionsGovernance: {
        title: 'Permissions Governance',
        desc: 'Configure module-level and action-level access controls.',
      },
      parentVerification: {
        title: 'Parent-Child Verification',
        desc: 'Verify guardian links to specific students before read-only access.',
      },
      auditCompliance: {
        title: 'Audit & Compliance Logs',
        desc: 'Inspect immutable security, approval, and administrative trails.',
      },
      studentRecords: {
        title: 'Student Profile Directory',
        desc: 'View enrolled student summary records (Parent access restricted to verified linked child).',
      },
      collegeProfile: {
        title: 'College Profile',
        desc: 'Manage official institutional identity, address, contact details, and revision history (Official assets remain Principal-only).',
      },
      academicOverview: {
        title: 'Academic Module (Reserved)',
        desc: 'Permission slot prepared for future Academic Management phases.',
      },
    },
    actions: {
      view: 'View',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      approve: 'Approve',
    },
    stats: {
      activeUsers: 'Active Accounts',
      pendingRequests: 'Pending Requests',
      verifiedLinks: 'Verified Parent Links',
      auditEvents: 'Audit Events',
    },
    labels: {
      searchUsers: 'Search name, email, or department...',
      filterAll: 'All',
      approve: 'Approve',
      reject: 'Reject',
      suspend: 'Suspend',
      reactivate: 'Reactivate',
      revoke: 'Revoke',
      createAccountInvite: 'Pre-Approve User',
      savePermissions: 'Save Permissions',
      reviewNote: 'Review Note',
      noData: 'No records match the current filter.',
      seedDemoStudents: 'Load Synthetic Demo Students',
      demoDataBanner: 'Development Demo Data Only — No real student or staff personal data is stored.',
      parentReadOnlyNote: 'Parent accounts are strictly read-only and restricted to verified linked children.',
      verifyParentLink: 'Verify Link',
      revokeParentLink: 'Revoke Link',
      requestParentLink: 'Request Child Verification',
      studentId: 'Student ID',
      relationship: 'Relationship',
      verificationCode: 'Verification Passcode',
      generateCode: 'Generate Code',
      mother: 'Mother',
      father: 'Father',
      legal_guardian: 'Legal Guardian',
      linkedChildren: 'Verified Linked Children',
      noPermissionsYet: 'No module permissions have been assigned by the Principal yet.',
      phase1BoundaryNote: 'Official College Profile, Identity & Governance, Permissions Matrix, Parent Verification & Audit Trail.',
      principalExclusiveNote: 'Only the single primary Principal account can approve accounts or modify permissions.',
      auditImmutableNote: 'Audit records are append-only and enforced by Firestore security rules.',
      cancel: 'Cancel',
      submit: 'Submit',
      close: 'Close',
      editPermissions: 'Permissions',
      changeRole: 'Role',
      status: 'Status',
      role: 'Role',
      email: 'Email',
      actionsCol: 'Actions',
      timestamp: 'Timestamp',
      actor: 'Actor',
      event: 'Event',
      target: 'Target',
    },
    passwordRules: {
      title: 'Password Policy (12+ chars)',
      min_length: 'At least 12 characters',
      uppercase: 'One uppercase letter',
      lowercase: 'One lowercase letter',
      digit: 'One number',
      symbol: 'One special symbol',
      common_or_institutional_word: 'Avoid common or college-name passwords',
      contains_email: 'Cannot contain your email name',
    },
    pwa: {
      installApp: 'Install App',
      installOnPhone: 'Install College App',
      installShort: 'Install',
      installedBadge: 'Installed on Device',
      installSubtitle:
        'Install once on Android or iPhone. App updates arrive automatically from the central college URL.',
      guideTitle: 'Install Mobile App',
      iosGuideTitle: 'iPhone / iPad (Safari)',
      iosStep1: '1. Open this college link in Safari and tap the Share button.',
      iosStep2: '2. Scroll down and tap "Add to Home Screen".',
      iosStep3: '3. Tap "Add" to launch Al EAMAN full-screen like a native app.',
      androidGuideTitle: 'Android Phone (Chrome)',
      androidStep1: '1. Tap "Install App" below or open Chrome menu (⋮).',
      androidStep2: '2. Tap "Install app" or "Add to Home screen" to finish.',
      offlineBanner: 'Offline Mode — Showing cached interface. Reconnect to sync live records.',
      updateReadyTitle: 'New App Update Available',
      updateNow: 'Refresh Now',
    },
    roleExperience: {
      officerDeskTitle: 'Officer Administrative Desk',
      officerDeskSubtitle: 'Delegated operations enforced live by Principal permissions',
      teacherFacultyTitle: 'Teacher Faculty Portal',
      teacherFacultySubtitle: 'Authorized classroom & student directory scope',
      parentGuardianTitle: 'Parent Guardian Portal',
      parentGuardianSubtitle: 'Read-only access strictly for verified linked children',
      principalCommandTitle: 'Principal Governance Console',
      principalCommandSubtitle: 'Central authority over college accounts & permissions',
      tabDesk: 'Desk',
      tabDirectory: 'Directory',
      tabFaculty: 'Faculty',
      tabStudents: 'Students',
      tabHome: 'Home',
      tabMyChild: 'My Child',
      tabProfile: 'Profile',
      permittedActions: 'Permitted Modules',
      noModulesAssigned: 'No modules enabled yet by Principal',
      centralBackendNote: 'Connected to central Firebase backend · Live permission enforcement',
    },
    mobileShell: {
      brandShort: 'AL EAMAN',
      menu: 'Menu',
      notifications: 'Notifications',
      unreadLabel: 'unread',
      markAllRead: 'Mark all read',
      noNotifications: 'You are all caught up. No new alerts.',
      accountSecurity: 'Account & Security',
      securityEnforcedNote: 'Permissions are enforced live by Firestore security rules and server checks.',
      authorizedModules: 'Authorized Modules',
      remainingModules: 'More Authorized Modules',
      quickControls: 'Quick Controls',
      noExtraModules: 'All assigned modules are pinned on your bottom bar.',
      reservedPhaseNote: 'Reserved for Phase 2 Academic Management. Not active in Phase 1.',
      notifPendingRequests: 'Pending Account Requests',
      notifPendingRequestsDesc: 'Account requests awaiting Principal approval.',
      notifPendingLinks: 'Parent Link Verifications',
      notifPendingLinksDesc: 'Guardian-student links waiting for verification.',
      notifParentLinkVerified: 'Child Link Status Updated',
      notifParentLinkVerifiedDesc: 'Review your verified parent-child link records.',
      notifPermissionsActive: 'Role Permissions Synchronized',
      notifPermissionsActiveDesc: 'Active module access enforced from your permission profile.',
      openModule: 'Open',
      tabParentLinksShort: 'Links',
      tabAuditShort: 'Audit',
      tabAccessShort: 'Access',
      tabUsersShort: 'Users',
      tabPermsShort: 'Perms',
      tabStudentsShort: 'Students',
      tabSettingsShort: 'Settings',
    },
    collegeProfilePage: {
      pageTitle: 'College Profile',
      pageSubtitle: 'Central official institutional identity, address, contact records, assets, and revision history.',
      settingsSectionLabel: 'Settings · Institutional Identity',
      editProfileBtn: 'Edit College Profile',
      cancelEditBtn: 'Cancel Editing',
      saveChangesBtn: 'Save Revision',
      savingBtn: 'Saving...',
      initializeRecordBtn: 'Initialize Central Profile Record',
      notInitializedNotice:
        'Official institutional defaults are active. Complete address, contact, and mission details when ready—no unverified data is auto-filled.',
      readOnlyStaffBanner:
        'Read-only view. Editing requires explicit College Profile Edit authorization from the Principal.',
      readOnlyParentBanner:
        'Read-only official college information. Administrative fields, seal, signature, and edits are restricted.',
      editableStaffBanner:
        'Authorized staff edit access granted by the Principal. Official logo, seal, and signature remain strictly Principal-only.',
      principalAssetsOnlyNote: 'Only the Principal can upload or change the official logo, seal, and authorized signature.',
      versionBadge: 'Version {version}',
      lastUpdatedBy: 'Last updated by {actor}',
      tabDetails: 'Official Details',
      tabAssets: 'Official Assets',
      tabHistory: 'Revision History',
      sectionIdentity: 'Official College Identity',
      sectionAddress: 'Institutional Address',
      sectionContact: 'Official Contact Information',
      sectionAbout: 'About, Vision & Mission',
      sectionGovernance: 'Institutional Reference',
      nameEnLabel: 'Official Name (English)',
      nameTaLabel: 'Official Name (Tamil)',
      nameArLabel: 'Official Name (Arabic)',
      shortNameLabel: 'Short Name / Header Label',
      establishedYearLabel: 'Established Year',
      registrationNumberLabel: 'Registration Number (Optional)',
      addressEnLabel: 'Address (English)',
      addressTaLabel: 'Address (Tamil)',
      addressArLabel: 'Address (Arabic)',
      cityLabel: 'City / Town',
      districtLabel: 'District',
      provinceLabel: 'Province',
      countryLabel: 'Country',
      postalCodeLabel: 'Postal Code',
      telephoneLabel: 'Official Telephone',
      alternateTelephoneLabel: 'Alternate Telephone',
      emailLabel: 'Official Email',
      websiteLabel: 'Official Website',
      introductionEnLabel: 'College Introduction (English)',
      introductionTaLabel: 'College Introduction (Tamil)',
      introductionArLabel: 'College Introduction (Arabic)',
      visionEnLabel: 'Vision (English)',
      visionTaLabel: 'Vision (Tamil)',
      visionArLabel: 'Vision (Arabic)',
      missionEnLabel: 'Mission (English)',
      missionTaLabel: 'Mission (Tamil)',
      missionArLabel: 'Mission (Arabic)',
      principalStaffIdLabel: 'Reserved Principal Staff Reference ID',
      principalStaffIdHint: 'Reserved link for future Staff Management integration (not personal staff records).',
      notProvidedYet: 'Not entered yet',
      reasonPromptTitle: 'Revision Note / Reason for Update',
      reasonPlaceholder: 'Explain why this official college information is being initialized or updated...',
      reasonRequiredError: 'Please enter a brief revision reason (at least 3 characters) to preserve the audit trail.',
      savedSuccess: 'College Profile v{version} saved and recorded in revision history.',
      assetsTitle: 'Separate Official Institutional Assets',
      assetsSubtitle: 'Stored individually with aspect ratio preserved for headers, letters, reports, and certificates.',
      assetLogoTitle: 'Official College Crest / Logo',
      assetLogoDesc: 'Original emblem preserved cleanly without cropping, recoloring, or distortion.',
      assetSealTitle: 'Official College Stamp / Seal',
      assetSealDesc: 'Separate stamp image reserved for official letters, reports, and certificates.',
      assetSignatureTitle: 'Authorized Principal Signature',
      assetSignatureDesc: 'Separate signature graphic reserved strictly for official institutional documents.',
      uploadImageBtn: 'Upload Image (PNG / JPG / WEBP)',
      restoreOriginalLogoBtn: 'Restore Original Logo',
      removeAssetBtn: 'Clear Asset',
      assetUploadHint: 'Recommended: transparent PNG with crisp proportions. SVG is blocked for security.',
      assetNotUploaded: 'No separate file uploaded yet',
      assetSavedSuccess: 'Updated institutional asset (v{version}) and logged revision.',
      assetReasonDefaultUpload: 'Uploaded official institutional asset',
      assetReasonDefaultRestore: 'Restored original official college logo',
      assetReasonDefaultRemove: 'Cleared institutional asset slot',
      assetDimensionsLabel: '{width} × {height} px',
      originalCrestActiveLabel: 'Original Official Emblem Active',
      historyTitle: 'Immutable Revision History',
      historySubtitle: 'Every official change is logged with previous values, updated values, reason, actor, and timestamp.',
      noRevisionsYet: 'No profile or asset revisions recorded yet.',
      previousValueLabel: 'Previous',
      newValueLabel: 'Updated',
      changedFieldsLabel: 'Changed Fields',
      revisionReasonLabel: 'Reason',
      emptyValueLabel: '(blank)',
      targetProfile: 'College Profile',
      targetLogo: 'Official Logo',
      targetSeal: 'Official Seal',
      targetSignature: 'Authorized Signature',
      documentSnapshotNote: 'Document Identity Snapshot Ready (v{version}) — synced live for future certificates, letters, and reports.',
    },
  },
  ta: {
    collegeName: COLLEGE_NAMES.ta,
    portalSubtitle: 'அடையாளம், அணுகல் நிர்வாகம் மற்றும் பயனர் மேலாண்மை தளம்',
    phaseBadge: 'கட்டம் 1 · உள்நுழைவு மற்றும் பயனர் மேலாண்மை',
    logoSlotLabel: 'அல் ஈமான் அதிகாரப்பூர்வ கல்லூரி சின்னம்',
    languageLabel: 'மொழி',
    signIn: 'உள்நுழைய',
    signOut: 'வெளியேறு',
    createRequest: 'கணக்கு கோரிக்கை',
    principalSetupTitle: 'ஒருமுறை முதல்வர் கணக்கு அமைப்பு',
    principalSetupSubtitle:
      'அல் ஈமான் முஸ்லிம் மகளிர் அரபிக் கல்லூரிக்கான ஒரே முதன்மை முதல்வர் கணக்கை உருவாக்கவும். முடிந்தவுடன் இது நிரந்தரமாகப் பூட்டப்படும்.',
    principalSetupPolicy:
      'பொதுவான இயல்புநிலை கடவுச்சொல் இல்லை. சரிபார்க்கப்பட்ட நிறுவன நிர்வாகி மின்னஞ்சல் மட்டுமே இந்த அமைப்பை முடிக்க முடியும்.',
    principalSetupAuthorizedEmail: 'அங்கீகரிக்கப்பட்ட முதல்வர் மின்னஞ்சல்',
    principalSetupButton: 'முதல்வர் அமைப்பை நிறைவு செய்',
    continueWithGoogle: 'Google மூலம் தொடரவும்',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்து',
    fullName: 'முழுப் பெயர்',
    phone: 'தொலைபேசி எண்',
    department: 'துறை / பிரிவு',
    requestedRole: 'கோரும் பொறுப்பு',
    justification: 'கோரிக்கைக்கான காரணம்',
    studentReferenceCode: 'மாணவி குறிப்பு எண் (விருப்பம்)',
    studentNameClaim: 'மாணவியின் முழுப் பெயர் (பெற்றோர் சரிபார்ப்புக்கு)',
    useEmailPassword: 'அல்லது மின்னஞ்சல் மற்றும் கடவுச்சொல் மூலம்',
    signInWithEmail: 'மின்னஞ்சல் மூலம் உள்நுழைய',
    registerAndRequest: 'கணக்கு உருவாக்கி கோரிக்கை அனுப்பு',
    emailProviderHintTitle: 'Firebase Console-இல் Email/Password இயக்கவும்',
    emailProviderHintBody:
      'இந்த Firebase திட்டத்தில் மின்னஞ்சல்/கடவுச்சொல் உள்நுழைவு இன்னும் இயக்கப்படவில்லை. இப்போது Google உள்நுழைவைப் பயன்படுத்தவும்.',
    verifyEmailTitle: 'மின்னஞ்சல் சரிபார்ப்பு தேவை',
    verifyEmailBody:
      'கல்லூரி பாதுகாப்பிற்காக, கோரிக்கைகளைச் சமர்ப்பிக்க அல்லது அணுக உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்.',
    verifyEmailSpamHint:
      '1–2 நிமிடங்களில் சரிபார்ப்பு மின்னஞ்சல் வரவில்லை எனில், தயவுசெய்து உங்கள் Spam / Junk மற்றும் Promotions கோப்புறைகளைச் சரிபார்க்கவும்.',
    resendVerification: 'சரிபார்ப்பு மின்னஞ்சலை மீண்டும் அனுப்பு',
    resendVerificationCountdown: '{seconds} வினாடிகளில் மீண்டும் அனுப்பலாம்',
    verificationEmailSent:
      'சரிபார்ப்பு மின்னஞ்சல் அனுப்பப்பட்டது. Inbox, Spam மற்றும் Promotions கோப்புறைகளைச் சரிபார்க்கவும்.',
    verificationAccountCreated:
      'கணக்கு உருவாக்கப்பட்டது. உங்கள் மின்னஞ்சலுக்குச் சரிபார்ப்பு இணைப்பு அனுப்பப்பட்டுள்ளது. Inbox, Spam மற்றும் Promotions கோப்புறைகளைச் சரிபார்க்கவும்.',
    tooManyRequestsError:
      'குறுகிய நேரத்தில் அதிக முயற்சிகள் செய்யப்பட்டுள்ளன. தயவுசெய்து 60 வினாடிகள் காத்திருந்து, மீண்டும் முயற்சிக்கும் முன் Inbox, Spam மற்றும் Promotions கோப்புறைகளைச் சரிபார்க்கவும்.',
    refreshVerification: 'சரிபார்த்தேன் — புதுப்பி',
    pendingTitle: 'முதல்வர் ஒப்புதலுக்காகக் காத்திருக்கிறது',
    pendingBody:
      'உங்கள் கணக்கு கோரிக்கை பதிவு செய்யப்பட்டுள்ளது. முதல்வரின் ஒப்புதல் இல்லாமல் எந்தக் கணக்கும் செயல்படாது.',
    suspendedTitle: 'கணக்கு தற்காலிகமாக இடைநிறுத்தப்பட்டது',
    suspendedBody:
      'உங்கள் அணுகல் முதல்வரால் இடைநிறுத்தப்பட்டுள்ளது. விவரங்களுக்கு கல்லூரி நிர்வாகத்தைத் தொடர்பு கொள்ளவும்.',
    revokedTitle: 'கணக்கு அணுகல் ரத்து செய்யப்பட்டது',
    revokedBody:
      'இந்தக் கணக்கு முதல்வரால் நிரந்தரமாக ரத்து செய்யப்பட்டுள்ளது.',
    rejectedTitle: 'கணக்கு கோரிக்கை நிராகரிக்கப்பட்டது',
    rejectedBody:
      'உங்கள் கணக்கு கோரிக்கை முதல்வரால் நிராகரிக்கப்பட்டது.',
    inviteDetectedTitle: 'முன்-அங்கீகரிக்கப்பட்ட கல்லூரி அழைப்பு',
    inviteDetectedBody:
      'முதல்வர் உங்கள் மின்னஞ்சலுக்குப் பொறுப்பு மற்றும் அனுமதிகளை முன்-அங்கீகரித்துள்ளார்.',
    claimInviteButton: 'எனது கல்லூரி கணக்கை இயக்கு',
    nav: {
      overview: 'மேலோட்டம்',
      approvals: 'ஒப்புதல்கள்',
      users: 'பயனர்கள்',
      permissions: 'அனுமதிகள்',
      parentLinks: 'பெற்றோர் இணைப்பு',
      audit: 'தணிக்கை பதிவு',
      myAccess: 'எனது அணுகல்',
      settings: 'அமைப்புகள்',
      collegeProfile: 'கல்லூரி சுயவிவரம்',
    },
    establishedLabel: 'நிறுவப்பட்டது {year}',
    roles: {
      principal: 'முதல்வர்',
      officer: 'அலுவலர்',
      teacher: 'ஆசிரியை',
      parent: 'பெற்றோர்',
    },
    statuses: {
      pending: 'நிலுவையில்',
      active: 'செயலில்',
      suspended: 'இடைநிறுத்தம்',
      revoked: 'ரத்து',
      rejected: 'நிராகரிப்பு',
    },
    modules: {
      userManagement: {
        title: 'பயனர் மற்றும் ஒப்புதல் மேலாண்மை',
        desc: 'பயனர் பட்டியல், நிலுவை கோரிக்கைகள் மற்றும் கணக்கு நிலை.',
      },
      permissionsGovernance: {
        title: 'அனுமதி நிர்வாகம்',
        desc: 'தொகுதி மற்றும் செயல் அளவிலான அனுமதிகள்.',
      },
      parentVerification: {
        title: 'பெற்றோர்-மாணவி சரிபார்ப்பு',
        desc: 'பெற்றோர் கணக்கை சரிபார்க்கப்பட்ட மாணவியுடன் இணைத்தல்.',
      },
      auditCompliance: {
        title: 'தணிக்கை பதிவுகள்',
        desc: 'மாற்ற முடியாத பாதுகாப்பு மற்றும் நிர்வாக பதிவுகள்.',
      },
      studentRecords: {
        title: 'மாணவி சுயவிவரப் பட்டியல்',
        desc: 'மாணவி விவரங்கள் (பெற்றோருக்கு சரிபார்க்கப்பட்ட மகள் மட்டும்).',
      },
      collegeProfile: {
        title: 'கல்லூரி சுயவிவரம்',
        desc: 'அதிகாரப்பூர்வ கல்லூரி அடையாளம், முகவரி, தொடர்பு விவரங்கள் மற்றும் மாற்ற வரலாறு.',
      },
      academicOverview: {
        title: 'கல்வித் தொகுதி (ஒதுக்கப்பட்டது)',
        desc: 'எதிர்கால கல்வி மேலாண்மை கட்டத்திற்கான அனுமதி இடம்.',
      },
    },
    actions: {
      view: 'பார்வை',
      create: 'உருவாக்கு',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      approve: 'ஒப்புதல்',
    },
    stats: {
      activeUsers: 'செயலில் உள்ள கணக்குகள்',
      pendingRequests: 'நிலுவை கோரிக்கைகள்',
      verifiedLinks: 'சரிபார்க்கப்பட்ட இணைப்புகள்',
      auditEvents: 'தணிக்கை நிகழ்வுகள்',
    },
    labels: {
      searchUsers: 'பெயர், மின்னஞ்சல் அல்லது துறை தேடுக...',
      filterAll: 'அனைத்தும்',
      approve: 'ஒப்புதல் அளி',
      reject: 'நிராகரி',
      suspend: 'இடைநிறுத்து',
      reactivate: 'மீண்டும் இயக்கு',
      revoke: 'ரத்து செய்',
      createAccountInvite: 'பயனரை முன்-அங்கீகரி',
      savePermissions: 'அனுமதிகளைச் சேமி',
      reviewNote: 'மதிப்பாய்வுக் குறிப்பு',
      noData: 'பொருந்தும் பதிவுகள் இல்லை.',
      seedDemoStudents: 'மாதிரி மாணவி தரவை ஏற்று',
      demoDataBanner: 'மேம்பாட்டு மாதிரி தரவு மட்டுமே — உண்மையான மாணவி/ஊழியர் தரவு இல்லை.',
      parentReadOnlyNote: 'பெற்றோர் கணக்குகள் படிக்க மட்டுமே (Read-Only) மற்றும் சரிபார்க்கப்பட்ட மகளுக்கு மட்டுமே.',
      verifyParentLink: 'இணைப்பைச் சரிபார்',
      revokeParentLink: 'இணைப்பை ரத்து செய்',
      requestParentLink: 'மாணவி இணைப்பு கோரிக்கை',
      studentId: 'மாணவி எண்',
      relationship: 'உறவுமுறை',
      verificationCode: 'சரிபார்ப்புக் குறியீடு',
      generateCode: 'குறியீடு உருவாக்கு',
      mother: 'தாய்',
      father: 'தந்தை',
      legal_guardian: 'சட்டப்பூர்வ பாதுகாவலர்',
      linkedChildren: 'சரிபார்க்கப்பட்ட மாணவிகள்',
      noPermissionsYet: 'முதல்வர் இன்னும் எந்தத் தொகுதி அனுமதிகளையும் வழங்கவில்லை.',
      phase1BoundaryNote: 'அதிகாரப்பூர்வ கல்லூரி சுயவிவரம், உள்நுழைவு, முதல்வர் நிர்வாகம், அனுமதி அட்டவணை, பெற்றோர் சரிபார்ப்பு & தணிக்கை.',
      principalExclusiveNote: 'முதன்மை முதல்வர் மட்டுமே கணக்குகளை அங்கீகரிக்கவும் அனுமதிகளை மாற்றவும் முடியும்.',
      auditImmutableNote: 'தணிக்கை பதிவுகள் திருத்த முடியாதவை மற்றும் Firestore விதிகளால் பாதுகாக்கப்படுகின்றன.',
      cancel: 'ரத்து',
      submit: 'சமர்ப்பி',
      close: 'மூடு',
      editPermissions: 'அனுமதிகள்',
      changeRole: 'பொறுப்பு',
      status: 'நிலை',
      role: 'பொறுப்பு',
      email: 'மின்னஞ்சல்',
      actionsCol: 'செயல்கள்',
      timestamp: 'நேரம்',
      actor: 'செயலாளர்',
      event: 'நிகழ்வு',
      target: 'இலக்கு',
    },
    passwordRules: {
      title: 'கடவுச்சொல் விதி (12+ எழுத்துகள்)',
      min_length: 'குறைந்தது 12 எழுத்துகள்',
      uppercase: 'ஒரு பெரிய ஆங்கில எழுத்து',
      lowercase: 'ஒரு சிறிய ஆங்கில எழுத்து',
      digit: 'ஒரு எண்',
      symbol: 'ஒரு சிறப்பு குறியீடு',
      common_or_institutional_word: 'பொதுவான அல்லது கல்லூரிப் பெயர் சொற்களைத் தவிர்க்கவும்',
      contains_email: 'உங்கள் மின்னஞ்சல் பெயரைக் கொண்டிருக்கக் கூடாது',
    },
    pwa: {
      installApp: 'செயலியை நிறுவு',
      installOnPhone: 'கல்லூரி செயலியை நிறுவு',
      installShort: 'நிறுவு',
      installedBadge: 'சாதனத்தில் நிறுவப்பட்டது',
      installSubtitle:
        'Android அல்லது iPhone முகப்புத் திரையில் நிறுவவும். புதிய பதிப்புகள் தானாகப் புதுப்பிக்கப்படும்.',
      guideTitle: 'மொபைல் செயலி நிறுவல்',
      iosGuideTitle: 'iPhone / iPad (Safari)',
      iosStep1: '1. Safari உலாவியில் இந்த இணைப்பைத் திறந்து Share பொத்தானைத் தட்டவும்.',
      iosStep2: '2. கீழே சென்று "Add to Home Screen" என்பதைத் தேர்வு செய்யவும்.',
      iosStep3: '3. "Add" என்பதைத் தட்டினால் தனிச் செயலி போல் திறக்கும்.',
      androidGuideTitle: 'Android தொலைபேசி (Chrome)',
      androidStep1: '1. கீழே உள்ள "செயலியை நிறுவு" அல்லது Chrome மெனு (⋮) தட்டவும்.',
      androidStep2: '2. "Install app" அல்லது "Add to Home screen" என்பதைத் தட்டவும்.',
      offlineBanner: 'இணையம் இல்லை — சேமித்த திரை காட்டப்படுகிறது. நேரடி தரவுக்கு இணையவும்.',
      updateReadyTitle: 'புதிய செயலி புதுப்பிப்பு தயாராக உள்ளது',
      updateNow: 'புதுப்பி',
    },
    roleExperience: {
      officerDeskTitle: 'அலுவலர் நிர்வாகப் பிரிவு',
      officerDeskSubtitle: 'முதல்வரின் அனுமதிகளுக்கு உட்பட்ட நிர்வாக அணுகல்',
      teacherFacultyTitle: 'ஆசிரியை கல்வித் தளம்',
      teacherFacultySubtitle: 'அங்கீகரிக்கப்பட்ட வகுப்பு மற்றும் மாணவி பட்டியல் அணுகல்',
      parentGuardianTitle: 'பெற்றோர் பாதுகாவலர் தளம்',
      parentGuardianSubtitle: 'சரிபார்க்கப்பட்ட மகளின் தகவலுக்கு படிக்க மட்டுமே அணுகல்',
      principalCommandTitle: 'முதல்வர் நிர்வாக மையம்',
      principalCommandSubtitle: 'கல்லூரி கணக்குகள் மற்றும் அனுமதிகளின் முதன்மை அதிகாரம்',
      tabDesk: 'பிரிவு',
      tabDirectory: 'பட்டியல்',
      tabFaculty: 'ஆசிரியை',
      tabStudents: 'மாணவி',
      tabHome: 'முகப்பு',
      tabMyChild: 'என் மகள்',
      tabProfile: 'சுயவிவரம்',
      permittedActions: 'அனுமதிக்கப்பட்ட தொகுதிகள்',
      noModulesAssigned: 'முதல்வர் இன்னும் தொகுதிகளை ஒதுக்கவில்லை',
      centralBackendNote: 'மைய Firebase தரவுத்தளத்துடன் இணைக்கப்பட்டுள்ளது · நேரடி அனுமதி பாதுகாப்பு',
    },
    mobileShell: {
      brandShort: 'AL EAMAN',
      menu: 'பட்டியல்',
      notifications: 'அறிவிப்புகள்',
      unreadLabel: 'படிக்காதவை',
      markAllRead: 'அனைத்தும் படித்ததாக குறி',
      noNotifications: 'புதிய அறிவிப்புகள் எதுவும் இல்லை.',
      accountSecurity: 'கணக்கு & பாதுகாப்பு',
      securityEnforcedNote: 'Firestore பாதுகாப்பு விதிகள் மற்றும் சேவையக சரிபார்ப்பால் அனுமதிகள் செயல்படுத்தப்படுகின்றன.',
      authorizedModules: 'அங்கீகரிக்கப்பட்ட தொகுதிகள்',
      remainingModules: 'மேலும் அங்கீகரிக்கப்பட்ட தொகுதிகள்',
      quickControls: 'விரைவு கட்டுப்பாடுகள்',
      noExtraModules: 'அனைத்து அனுமதிக்கப்பட்ட தொகுதிகளும் கீழ் பட்டியில் உள்ளன.',
      reservedPhaseNote: 'கட்டம் 2 கல்வி மேலாண்மைக்காக ஒதுக்கப்பட்டது. கட்டம் 1-இல் செயலில் இல்லை.',
      notifPendingRequests: 'நிலுவை கணக்கு கோரிக்கைகள்',
      notifPendingRequestsDesc: 'முதல்வர் ஒப்புதலுக்காகக் காத்திருக்கும் கணக்கு கோரிக்கைகள்.',
      notifPendingLinks: 'பெற்றோர் இணைப்பு சரிபார்ப்புகள்',
      notifPendingLinksDesc: 'சரிபார்ப்புக்காகக் காத்திருக்கும் பெற்றோர்-மாணவி இணைப்புகள்.',
      notifParentLinkVerified: 'மாணவி இணைப்பு நிலை புதுப்பிக்கப்பட்டது',
      notifParentLinkVerifiedDesc: 'உங்கள் சரிபார்க்கப்பட்ட மாணவி இணைப்புகளைப் பார்க்கவும்.',
      notifPermissionsActive: 'பொறுப்பு அனுமதிகள் ஒத்திசைக்கப்பட்டன',
      notifPermissionsActiveDesc: 'உங்கள் அனுமதி சுயவிவரத்தின்படி நேரடி அணுகல் செயலில் உள்ளது.',
      openModule: 'திற',
      tabParentLinksShort: 'இணைப்பு',
      tabAuditShort: 'தணிக்கை',
      tabAccessShort: 'அணுகல்',
      tabUsersShort: 'பயனர்கள்',
      tabPermsShort: 'அனுமதி',
      tabStudentsShort: 'மாணவி',
      tabSettingsShort: 'அமைப்பு',
    },
    collegeProfilePage: {
      pageTitle: 'கல்லூரி சுயவிவரம்',
      pageSubtitle: 'அதிகாரப்பூர்வ நிறுவன அடையாளம், முகவரி, தொடர்பு விவரங்கள், சின்னங்கள் மற்றும் மாற்ற வரலாறு.',
      settingsSectionLabel: 'அமைப்புகள் · நிறுவன அடையாளம்',
      editProfileBtn: 'கல்லூரி சுயவிவரத்தைத் திருத்து',
      cancelEditBtn: 'திருத்தத்தை ரத்து செய்',
      saveChangesBtn: 'மாற்றத்தைச் சேமி',
      savingBtn: 'சேமிக்கிறது...',
      initializeRecordBtn: 'மைய கல்லூரி சுயவிவரத்தைத் தொடங்கு',
      notInitializedNotice:
        'அதிகாரப்பூர்வ கல்லூரி அடிப்படைத் தகவல்கள் செயலில் உள்ளன. தயாரானதும் முகவரி, தொடர்பு மற்றும் நோக்க விவரங்களை நிரப்பவும்.',
      readOnlyStaffBanner:
        'படிக்க மட்டுமே (Read-Only). திருத்த முதல்வரின் கல்லூரி சுயவிவர திருத்த அனுமதி தேவை.',
      readOnlyParentBanner:
        'அதிகாரப்பூர்வ கல்லூரி தகவல் (படிக்க மட்டுமே). நிர்வாகத் திருத்தங்கள், முத்திரை மற்றும் கையொப்பம் அணுகல் இல்லை.',
      editableStaffBanner:
        'முதல்வரால் வழங்கப்பட்ட திருத்த அனுமதி செயலில் உள்ளது. சின்னம், முத்திரை மற்றும் கையொப்பத்தை முதல்வர் மட்டுமே மாற்ற முடியும்.',
      principalAssetsOnlyNote: 'அதிகாரப்பூர்வ சின்னம், முத்திரை மற்றும் கையொப்பத்தை முதல்வர் மட்டுமே மாற்ற முடியும்.',
      versionBadge: 'பதிப்பு {version}',
      lastUpdatedBy: 'கடைசியாகப் புதுப்பித்தவர்: {actor}',
      tabDetails: 'அதிகாரப்பூர்வ விவரம்',
      tabAssets: 'சின்னம் & முத்திரை',
      tabHistory: 'மாற்ற வரலாறு',
      sectionIdentity: 'அதிகாரப்பூர்வ கல்லூரி அடையாளம்',
      sectionAddress: 'கல்லூரி முகவரி',
      sectionContact: 'அதிகாரப்பூர்வ தொடர்பு விவரங்கள்',
      sectionAbout: 'அறிமுகம், தொலைநோக்கு & பணி',
      sectionGovernance: 'நிறுவன குறிப்பு',
      nameEnLabel: 'அதிகாரப்பூர்வ பெயர் (ஆங்கிலம்)',
      nameTaLabel: 'அதிகாரப்பூர்வ பெயர் (தமிழ்)',
      nameArLabel: 'அதிகாரப்பூர்வ பெயர் (அரபு)',
      shortNameLabel: 'சுருக்கப் பெயர்',
      establishedYearLabel: 'நிறுவப்பட்ட ஆண்டு',
      registrationNumberLabel: 'பதிவு எண் (விருப்பம்)',
      addressEnLabel: 'முகவரி (ஆங்கிலம்)',
      addressTaLabel: 'முகவரி (தமிழ்)',
      addressArLabel: 'முகவரி (அரபு)',
      cityLabel: 'நகரம் / ஊர்',
      districtLabel: 'மாவட்டம்',
      provinceLabel: 'மாகாணம்',
      countryLabel: 'நாடு',
      postalCodeLabel: 'அஞ்சல் குறியீடு',
      telephoneLabel: 'அலுவலக தொலைபேசி',
      alternateTelephoneLabel: 'மாற்று தொலைபேசி',
      emailLabel: 'அதிகாரப்பூர்வ மின்னஞ்சல்',
      websiteLabel: 'இணையதளம்',
      introductionEnLabel: 'கல்லூரி அறிமுகம் (ஆங்கிலம்)',
      introductionTaLabel: 'கல்லூரி அறிமுகம் (தமிழ்)',
      introductionArLabel: 'கல்லூரி அறிமுகம் (அரபு)',
      visionEnLabel: 'தொலைநோக்கு (ஆங்கிலம்)',
      visionTaLabel: 'தொலைநோக்கு (தமிழ்)',
      visionArLabel: 'தொலைநோக்கு (அரபு)',
      missionEnLabel: 'பணி / இலக்கு (ஆங்கிலம்)',
      missionTaLabel: 'பணி / இலக்கு (தமிழ்)',
      missionArLabel: 'பணி / இலக்கு (அரபு)',
      principalStaffIdLabel: 'முதல்வர் பணியாளர் குறிப்பு எண் (ஒதுக்கப்பட்டது)',
      principalStaffIdHint: 'எதிர்கால பணியாளர் மேலாண்மை இணைப்பிற்காக ஒதுக்கப்பட்ட இடம்.',
      notProvidedYet: 'இன்னும் உள்ளிடப்படவில்லை',
      reasonPromptTitle: 'மாற்றத்திற்கான காரணம் / குறிப்பு',
      reasonPlaceholder: 'இந்த அதிகாரப்பூர்வ கல்லூரித் தகவல் ஏன் புதுப்பிக்கப்படுகிறது என்பதைக் குறிப்பிடவும்...',
      reasonRequiredError: 'மாற்ற வரலாற்றைப் பாதுகாக்கக் காரணத்தை (குறைந்தது 3 எழுத்துகள்) உள்ளிடவும்.',
      savedSuccess: 'கல்லூரி சுயவிவரம் பதிப்பு {version} சேமிக்கப்பட்டு வரலாற்றில் பதிவு செய்யப்பட்டது.',
      assetsTitle: 'தனிப்பட்ட அதிகாரப்பூர்வ நிறுவன ஆவணப் படங்கள்',
      assetsSubtitle: 'தலைப்புகள், கடிதங்கள் மற்றும் சான்றிதழ்களுக்காகத் தனித்தனியாக அசல் விகிதத்தில் சேமிக்கப்படுகின்றன.',
      assetLogoTitle: 'கல்லூரி அதிகாரப்பூர்வ சின்னம்',
      assetLogoDesc: 'அசல் சின்னம் வண்ணம் அல்லது வடிவம் மாறாமல் பாதுகாக்கப்படுகிறது.',
      assetSealTitle: 'கல்லூரி அதிகாரப்பூர்வ முத்திரை',
      assetSealDesc: 'அதிகாரப்பூர்வ கடிதங்கள் மற்றும் சான்றிதழ்களுக்கான தனி முத்திரை.',
      assetSignatureTitle: 'அங்கீகரிக்கப்பட்ட முதல்வர் கையொப்பம்',
      assetSignatureDesc: 'அதிகாரப்பூர்வ ஆவணங்களுக்கான தனி கையொப்பப் படம்.',
      uploadImageBtn: 'படம் பதிவேற்று (PNG / JPG / WEBP)',
      restoreOriginalLogoBtn: 'அசல் சின்னத்தை மீட்டெடு',
      removeAssetBtn: 'அகற்று',
      assetUploadHint: 'பரிந்துரை: தெளிவான PNG படம். பாதுகாப்பிற்காக SVG அனுமதிக்கப்படாது.',
      assetNotUploaded: 'இன்னும் தனிப் படம் பதிவேற்றப்படவில்லை',
      assetSavedSuccess: 'நிறுவனப் படம் (பதிப்பு {version}) புதுப்பிக்கப்பட்டு பதிவு செய்யப்பட்டது.',
      assetReasonDefaultUpload: 'அதிகாரப்பூர்வ நிறுவனப் படம் பதிவேற்றப்பட்டது',
      assetReasonDefaultRestore: 'அசல் கல்லூரி சின்னம் மீட்டெடுக்கப்பட்டது',
      assetReasonDefaultRemove: 'நிறுவனப் பட இடம் காலி செய்யப்பட்டது',
      assetDimensionsLabel: '{width} × {height} px',
      originalCrestActiveLabel: 'அசல் அதிகாரப்பூர்வ சின்னம் செயலில்',
      historyTitle: 'மாற்ற முடியாத திருத்த வரலாறு',
      historySubtitle: 'ஒவ்வொரு அதிகாரப்பூர்வ மாற்றமும் முந்தைய மதிப்பு, புதிய மதிப்பு மற்றும் காரணத்துடன் சேமிக்கப்படும்.',
      noRevisionsYet: 'இன்னும் மாற்றங்கள் எதுவும் பதிவு செய்யப்படவில்லை.',
      previousValueLabel: 'முந்தைய மதிப்பு',
      newValueLabel: 'புதிய மதிப்பு',
      changedFieldsLabel: 'மாற்றப்பட்ட புலங்கள்',
      revisionReasonLabel: 'காரணம்',
      emptyValueLabel: '(காலி)',
      targetProfile: 'கல்லூரி சுயவிவரம்',
      targetLogo: 'அதிகாரப்பூர்வ சின்னம்',
      targetSeal: 'அதிகாரப்பூர்வ முத்திரை',
      targetSignature: 'முதல்வர் கையொப்பம்',
      documentSnapshotNote: 'ஆவண அடையாள நகல் தயார் (v{version}) — எதிர்கால கடிதங்கள் மற்றும் சான்றிதழ்களுடன் இணைக்கப்பட்டது.',
    },
  },
  ar: {
    collegeName: COLLEGE_NAMES.ar,
    portalSubtitle: 'بوابة الهوية وحوكمة الصلاحيات وإدارة المستخدمين',
    phaseBadge: 'المرحلة ١ · تسجيل الدخول وإدارة المستخدمين',
    logoSlotLabel: 'شعار كلية الإيمان الرسمي',
    languageLabel: 'اللغة',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    createRequest: 'طلب حساب',
    principalSetupTitle: 'الإعداد الأولي لحساب المديرة (مرة واحدة)',
    principalSetupSubtitle:
      'إنشاء حساب المديرة الأساسي الوحيد لكلية الإيمان العربية للبنات المسلمات. يُقفل هذا الإعداد نهائياً بعد إكماله.',
    principalSetupPolicy:
      'لا توجد كلمة مرور افتراضية عامة. يُسمح فقط للبريد الإداري المعتمد بإتمام هذه العملية لمرة واحدة.',
    principalSetupAuthorizedEmail: 'البريد المعتمد للإعداد الأولي',
    principalSetupButton: 'إتمام إعداد حساب المديرة',
    continueWithGoogle: 'المتابعة باستخدام Google',
    emailAddress: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    department: 'القسم / الشعبة',
    requestedRole: 'الدور المطلوب',
    justification: 'سبب الطلب ومبرر الدور',
    studentReferenceCode: 'الرقم المرجعي للطالبة (اختياري)',
    studentNameClaim: 'الاسم الكامل للطالبة (للتحقق من ولي الأمر)',
    useEmailPassword: 'أو باستخدام البريد الإلكتروني وكلمة المرور',
    signInWithEmail: 'الدخول بالبريد الإلكتروني',
    registerAndRequest: 'إنشاء حساب وإرسال الطلب',
    emailProviderHintTitle: 'تفعيل البريد وكلمة المرور في Firebase Console',
    emailProviderHintBody:
      'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل حالياً في المشروع. يمكنك استخدام دخول Google الآن أو تفعيله من وحدة تحكم Firebase.',
    verifyEmailTitle: 'مطلوب تأكيد البريد الإلكتروني',
    verifyEmailBody:
      'لأمان الكلية، يجب تأكيد بريدك الإلكتروني قبل الوصول إلى سجلات الكلية أو تقديم الطلبات.',
    verifyEmailSpamHint:
      'إذا لم تصلك رسالة التحقق خلال دقيقة إلى دقيقتين، يُرجى فحص مجلد الرسائل غير المرغوب فيها (Spam) ومجلد العروض الترويجية (Promotions).',
    resendVerification: 'إعادة إرسال رابط التحقق',
    resendVerificationCountdown: 'إعادة الإرسال متاحة خلال {seconds} ث',
    verificationEmailSent:
      'تم إرسال رابط التحقق. يُرجى فحص البريد الوارد ومجلدي Spam وPromotions.',
    verificationAccountCreated:
      'تم إنشاء الحساب وإرسال رابط التحقق إلى بريدك الإلكتروني. يُرجى فحص البريد الوارد ومجلدي Spam وPromotions.',
    tooManyRequestsError:
      'تم إرسال عدة طلبات خلال وقت قصير. يُرجى الانتظار 60 ثانية وفحص البريد الوارد ومجلدي Spam وPromotions قبل المحاولة مجدداً.',
    refreshVerification: 'تم التحقق — تحديث الحالة',
    pendingTitle: 'طلب الحساب بانتظار موافقة المديرة',
    pendingBody:
      'تم تسجيل طلبك بأمان. لا يُفعّل أي حساب دون مراجعة وموافقة المديرة.',
    suspendedTitle: 'الحساب موقوف مؤقتاً',
    suspendedBody:
      'تم تعليق وصولك من قبل المديرة. يرجى التواصل مع إدارة الكلية.',
    revokedTitle: 'تم إلغاء صلاحية الحساب',
    revokedBody:
      'تم إلغاء هذا الحساب نهائياً من قبل المديرة ولا يمكنه الدخول إلى النظام.',
    rejectedTitle: 'تم رفض طلب الحساب',
    rejectedBody:
      'تم رفض طلبك من قبل المديرة. تحتفظ الإدارة بملاحظات المراجعة.',
    inviteDetectedTitle: 'تم العثور على دعوة كلية معتمدة مسبقاً',
    inviteDetectedBody:
      'قامت المديرة باعتماد بريدك الإلكتروني مسبقاً مع الدور والصلاحيات المخصصة لك.',
    claimInviteButton: 'تفعيل حساب الكلية الخاص بي',
    nav: {
      overview: 'نظرة عامة',
      approvals: 'الموافقات',
      users: 'المستخدمون',
      permissions: 'الصلاحيات',
      parentLinks: 'روابط أولياء الأمور',
      audit: 'سجل التدقيق',
      myAccess: 'صلاحياتي',
      settings: 'الإعدادات',
      collegeProfile: 'ملف الكلية',
    },
    establishedLabel: 'تأسست {year}',
    roles: {
      principal: 'المديرة',
      officer: 'موظفة إدارية',
      teacher: 'معلمة',
      parent: 'ولي أمر',
    },
    statuses: {
      pending: 'قيد الانتظار',
      active: 'نشط',
      suspended: 'معلق',
      revoked: 'ملغى',
      rejected: 'مرفوض',
    },
    modules: {
      userManagement: {
        title: 'إدارة المستخدمين والموافقات',
        desc: 'عرض الدليل، مراجعة الطلبات المعلقة، وإدارة حالة الحسابات.',
      },
      permissionsGovernance: {
        title: 'حوكمة الصلاحيات',
        desc: 'ضبط الصلاحيات على مستوى الوحدة والإجراء.',
      },
      parentVerification: {
        title: 'التحقق من ولي الأمر والطالبة',
        desc: 'توثيق ارتباط ولي الأمر بطالبة محددة قبل منح القراءة فقط.',
      },
      auditCompliance: {
        title: 'سجلات التدقيق والامتثال',
        desc: 'مراجعة السجل غير القابل للتعديل للأحداث الأمنية والإدارية.',
      },
      studentRecords: {
        title: 'دليل ملفات الطالبات',
        desc: 'عرض ملخص الطالبات (وصول ولي الأمر مقصور على ابنته الموثقة فقط).',
      },
      collegeProfile: {
        title: 'ملف الكلية',
        desc: 'إدارة الهوية الرسمية للكلية والعنوان وبيانات التواصل وسجل التعديلات (الأصول الرسمية للمديرة فقط).',
      },
      academicOverview: {
        title: 'الوحدة الأكاديمية (محجوزة)',
        desc: 'خانات صلاحيات مجهزة لمراحل الإدارة الأكاديمية القادمة.',
      },
    },
    actions: {
      view: 'عرض',
      create: 'إنشاء',
      edit: 'تعديل',
      delete: 'حذف',
      approve: 'اعتماد',
    },
    stats: {
      activeUsers: 'الحسابات النشطة',
      pendingRequests: 'الطلبات المعلقة',
      verifiedLinks: 'الروابط الموثقة',
      auditEvents: 'أحداث التدقيق',
    },
    labels: {
      searchUsers: 'ابحث بالاسم أو البريد أو القسم...',
      filterAll: 'الكل',
      approve: 'اعتماد',
      reject: 'رفض',
      suspend: 'تعليق',
      reactivate: 'إعادة تفعيل',
      revoke: 'إلغاء نهائي',
      createAccountInvite: 'دعوة حساب معتمد',
      savePermissions: 'حفظ الصلاحيات',
      reviewNote: 'ملاحظة المراجعة',
      noData: 'لا توجد سجلات مطابقة.',
      seedDemoStudents: 'تحميل بيانات طالبات تجريبية',
      demoDataBanner: 'بيانات تجريبية للتطوير فقط — لا توجد بيانات شخصية حقيقية.',
      parentReadOnlyNote: 'حسابات أولياء الأمور للقراءة فقط ومقصورة على البنات الموثقات.',
      verifyParentLink: 'توثيق الارتباط',
      revokeParentLink: 'إلغاء الارتباط',
      requestParentLink: 'طلب توثيق ابنة',
      studentId: 'معرّف الطالبة',
      relationship: 'صلة القرابة',
      verificationCode: 'رمز التحقق',
      generateCode: 'توليد رمز',
      mother: 'الأم',
      father: 'الأب',
      legal_guardian: 'ولي أمر قانوني',
      linkedChildren: 'البنات الموثقات',
      noPermissionsYet: 'لم تمنح المديرة أي صلاحيات وحدات بعد.',
      phase1BoundaryNote: 'ملف الكلية الرسمي، الدخول، حوكمة المديرة، مصفوفة الصلاحيات، توثيق ولي الأمر، وسجل التدقيق.',
      principalExclusiveNote: 'المديرة الأساسية فقط تملك صلاحية اعتماد الحسابات وتعديل الصلاحيات.',
      auditImmutableNote: 'سجلات التدقيق للإضافة فقط ومحمية بقواعد أمان Firestore.',
      cancel: 'إلغاء',
      submit: 'إرسال',
      close: 'إغلاق',
      editPermissions: 'الصلاحيات',
      changeRole: 'الدور',
      status: 'الحالة',
      role: 'الدور',
      email: 'البريد',
      actionsCol: 'الإجراءات',
      timestamp: 'الوقت',
      actor: 'المنفّذ',
      event: 'الحدث',
      target: 'الهدف',
    },
    passwordRules: {
      title: 'سياسة كلمة المرور (١٢+ حرفاً)',
      min_length: '١٢ حرفاً على الأقل',
      uppercase: 'حرف إنجليزي كبير واحد',
      lowercase: 'حرف إنجليزي صغير واحد',
      digit: 'رقم واحد على الأقل',
      symbol: 'رمز خاص واحد على الأقل',
      common_or_institutional_word: 'تجنب الكلمات الشائعة أو اسم الكلية',
      contains_email: 'لا يمكن أن تحتوي على اسم بريدك',
    },
    pwa: {
      installApp: 'تثبيت التطبيق',
      installOnPhone: 'تثبيت تطبيق الكلية',
      installShort: 'تثبيت',
      installedBadge: 'مثبّت على الجهاز',
      installSubtitle:
        'ثبّت التطبيق على شاشة Android أو iPhone. تصلك التحديثات تلقائياً دون الحاجة لملفات APK.',
      guideTitle: 'تثبيت تطبيق الهاتف',
      iosGuideTitle: 'أجهزة iPhone / iPad (متصفح Safari)',
      iosStep1: '١. افتح رابط الكلية في Safari واضغط على زر المشاركة (Share).',
      iosStep2: '٢. مرّر للأسفل واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).',
      iosStep3: '٣. اضغط "إضافة" ليفتح التطبيق بملء الشاشة.',
      androidGuideTitle: 'هواتف Android (متصفح Chrome)',
      androidStep1: '١. اضغط على زر "تثبيت التطبيق" أو قائمة Chrome (⋮).',
      androidStep2: '٢. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".',
      offlineBanner: 'وضع عدم الاتصال — يتم عرض الواجهة المخزنة. أعد الاتصال لمزامنة البيانات.',
      updateReadyTitle: 'يتوفر تحديث جديد للتطبيق',
      updateNow: 'تحديث الآن',
    },
    roleExperience: {
      officerDeskTitle: 'مكتب الموظفة الإدارية',
      officerDeskSubtitle: 'عمليات مفوّضة وتخضع مباشرة لصلاحيات المديرة',
      teacherFacultyTitle: 'بوابة المعلمة والأكاديمية',
      teacherFacultySubtitle: 'نطاق دليل الطالبات والوحدات المصرح بها',
      parentGuardianTitle: 'بوابة ولي الأمر',
      parentGuardianSubtitle: 'وصول للقراءة فقط ومقصور على الابنة الموثقة',
      principalCommandTitle: 'لوحة حوكمة المديرة',
      principalCommandSubtitle: 'السلطة المركزية على حسابات الكلية وصلاحياتها',
      tabDesk: 'المكتب',
      tabDirectory: 'الدليل',
      tabFaculty: 'التدريس',
      tabStudents: 'الطالبات',
      tabHome: 'الرئيسية',
      tabMyChild: 'ابنتي',
      tabProfile: 'حسابي',
      permittedActions: 'الوحدات المصرح بها',
      noModulesAssigned: 'لم تقم المديرة بتعيين وحدات بعد',
      centralBackendNote: 'متصل بقاعدة بيانات Firebase المركزية · إنفاذ فوري للصلاحيات',
    },
    mobileShell: {
      brandShort: 'AL EAMAN',
      menu: 'القائمة',
      notifications: 'الإشعارات',
      unreadLabel: 'غير مقروء',
      markAllRead: 'تحديد الكل كمقروء',
      noNotifications: 'لا توجد تنبيهات جديدة حالياً.',
      accountSecurity: 'الحساب والأمان',
      securityEnforcedNote: 'يتم فرض الصلاحيات مباشرة عبر قواعد أمان Firestore والتحقق الخادمي.',
      authorizedModules: 'الوحدات المصرح بها',
      remainingModules: 'وحدات مصرح بها إضافية',
      quickControls: 'أدوات سريعة',
      noExtraModules: 'جميع الوحدات المخصصة لك ظاهرة في الشريط السفلي.',
      reservedPhaseNote: 'محجوزة للمرحلة ٢ (الإدارة الأكاديمية). غير مفعّلة في المرحلة ١.',
      notifPendingRequests: 'طلبات حسابات معلقة',
      notifPendingRequestsDesc: 'طلبات بانتظار موافقة المديرة.',
      notifPendingLinks: 'توثيق روابط أولياء الأمور',
      notifPendingLinksDesc: 'طلبات ربط بانتظار التوثيق.',
      notifParentLinkVerified: 'تحديث حالة ربط الابنة',
      notifParentLinkVerifiedDesc: 'راجع حالة روابط الطالبة الخاصة بك.',
      notifPermissionsActive: 'مزامنة صلاحيات الدور',
      notifPermissionsActiveDesc: 'الصلاحيات النشطة مطبّقة مباشرة من ملفك.',
      openModule: 'فتح',
      tabParentLinksShort: 'الروابط',
      tabAuditShort: 'التدقيق',
      tabAccessShort: 'الوصول',
      tabUsersShort: 'المستخدمون',
      tabPermsShort: 'الصلاحيات',
      tabStudentsShort: 'الطالبات',
      tabSettingsShort: 'الإعدادات',
    },
    collegeProfilePage: {
      pageTitle: 'ملف الكلية',
      pageSubtitle: 'الهوية المؤسسية الرسمية والعنوان وبيانات التواصل والأصول وسجل التعديلات المركزي.',
      settingsSectionLabel: 'الإعدادات · الهوية المؤسسية',
      editProfileBtn: 'تعديل ملف الكلية',
      cancelEditBtn: 'إلغاء التعديل',
      saveChangesBtn: 'حفظ المراجعة',
      savingBtn: 'جارٍ الحفظ...',
      initializeRecordBtn: 'تأسيس السجل المركزي للكلية',
      notInitializedNotice:
        'البيانات التأسيسية الرسمية للكلية مفعّلة. يمكنك إدخال العنوان والتواصل والرسالة عند الجاهزية دون أي بيانات افتراضية مختلقة.',
      readOnlyStaffBanner:
        'عرض للقراءة فقط. يتطلب التعديل صلاحية تعديل ملف الكلية الممنوحة من المديرة.',
      readOnlyParentBanner:
        'معلومات الكلية الرسمية للقراءة فقط. التعديل والختم الرسمي والتوقيع المعتمد مقصورة على الإدارة.',
      editableStaffBanner:
        'صلاحية تعديل ملف الكلية ممنوحة من المديرة. يبقى الشعار والختم والتوقيع حصراً للمديرة.',
      principalAssetsOnlyNote: 'المديرة فقط تملك صلاحية تحديث الشعار والختم الرسمي والتوقيع المعتمد.',
      versionBadge: 'الإصدار {version}',
      lastUpdatedBy: 'آخر تحديث بواسطة {actor}',
      tabDetails: 'البيانات الرسمية',
      tabAssets: 'الأصول الرسمية',
      tabHistory: 'سجل التعديلات',
      sectionIdentity: 'الهوية الرسمية للكلية',
      sectionAddress: 'عنوان الكلية',
      sectionContact: 'بيانات التواصل الرسمية',
      sectionAbout: 'نبذة عن الكلية والرؤية والرسالة',
      sectionGovernance: 'المرجع المؤسسي',
      nameEnLabel: 'الاسم الرسمي (بالإنجليزية)',
      nameTaLabel: 'الاسم الرسمي (بالتاميلية)',
      nameArLabel: 'الاسم الرسمي (بالعربية)',
      shortNameLabel: 'الاسم المختصر',
      establishedYearLabel: 'سنة التأسيس',
      registrationNumberLabel: 'رقم التسجيل الرسمي (اختياري)',
      addressEnLabel: 'العنوان (بالإنجليزية)',
      addressTaLabel: 'العنوان (بالتاميلية)',
      addressArLabel: 'العنوان (بالعربية)',
      cityLabel: 'المدينة / البلدة',
      districtLabel: 'المنطقة / المديرية',
      provinceLabel: 'المحافظة / الولاية',
      countryLabel: 'الدولة',
      postalCodeLabel: 'الرمز البريدي',
      telephoneLabel: 'الهاتف الرسمي',
      alternateTelephoneLabel: 'هاتف بديل',
      emailLabel: 'البريد الإلكتروني الرسمي',
      websiteLabel: 'الموقع الإلكتروني',
      introductionEnLabel: 'نبذة عن الكلية (بالإنجليزية)',
      introductionTaLabel: 'نبذة عن الكلية (بالتاميلية)',
      introductionArLabel: 'نبذة عن الكلية (بالعربية)',
      visionEnLabel: 'الرؤية (بالإنجليزية)',
      visionTaLabel: 'الرؤية (بالتاميلية)',
      visionArLabel: 'الرؤية (بالعربية)',
      missionEnLabel: 'الرسالة (بالإنجليزية)',
      missionTaLabel: 'الرسالة (بالتاميلية)',
      missionArLabel: 'الرسالة (بالعربية)',
      principalStaffIdLabel: 'معرّف المديرة في شؤون الموظفات (محجوز)',
      principalStaffIdHint: 'حقل محجوز للربط المستقبلي مع وحدة شؤون الموظفات دون تكرار السجلات.',
      notProvidedYet: 'لم يُدخل بعد',
      reasonPromptTitle: 'سبب التعديل / ملاحظة المراجعة',
      reasonPlaceholder: 'اذكر سبب حفظ أو تحديث بيانات الكلية الرسمية...',
      reasonRequiredError: 'يرجى كتابة سبب موجز للتعديل (٣ أحرف على الأقل) لحفظ سجل المراجعة.',
      savedSuccess: 'تم حفظ ملف الكلية (الإصدار {version}) وتسجيله في سجل التعديلات.',
      assetsTitle: 'الأصول الرسمية المنفصلة للكلية',
      assetsSubtitle: 'تُحفظ بشكل منفصل مع الحفاظ التام على الأبعاد الأصلية للتقارير والخطابات والشهادات.',
      assetLogoTitle: 'الشعار الرسمي للكلية',
      assetLogoDesc: 'يُحفظ الشعار الأصلي كما هو دون قص أو تغيير ألوان أو تشويه.',
      assetSealTitle: 'الختم الرسمي للكلية',
      assetSealDesc: 'صورة ختم منفصلة مخصصة للخطابات والتقارير والشهادات الرسمية.',
      assetSignatureTitle: 'التوقيع المعتمد للمديرة',
      assetSignatureDesc: 'صورة توقيع منفصلة مخصصة حصراً للوثائق الرسمية المعتمدة.',
      uploadImageBtn: 'رفع صورة (PNG / JPG / WEBP)',
      restoreOriginalLogoBtn: 'استعادة الشعار الأصلي',
      removeAssetBtn: 'إزالة',
      assetUploadHint: 'يُفضّل ملف PNG واضح. يتم حظر ملفات SVG لأسباب أمنية.',
      assetNotUploaded: 'لم يتم رفع ملف منفصل بعد',
      assetSavedSuccess: 'تم تحديث الأصل الرسمي (الإصدار {version}) وتسجيله في المراجعة.',
      assetReasonDefaultUpload: 'رفع أصل رسمي للكلية',
      assetReasonDefaultRestore: 'استعادة الشعار الرسمي الأصلي للكلية',
      assetReasonDefaultRemove: 'إزالة الأصل الرسمي من الخانة',
      assetDimensionsLabel: '{width} × {height} بكسل',
      originalCrestActiveLabel: 'الشعار الرسمي الأصلي مفعّل',
      historyTitle: 'سجل التعديلات غير القابل للتعديل',
      historySubtitle: 'يُحفظ كل تغيير رسمي مع القيم السابقة والجديدة والسبب واسم المنفّذ والوقت.',
      noRevisionsYet: 'لم تُسجّل تعديلات على ملف الكلية بعد.',
      previousValueLabel: 'السابق',
      newValueLabel: 'المحدّث',
      changedFieldsLabel: 'الحقول المعدّلة',
      revisionReasonLabel: 'السبب',
      emptyValueLabel: '(فارغ)',
      targetProfile: 'ملف الكلية',
      targetLogo: 'الشعار الرسمي',
      targetSeal: 'الختم الرسمي',
      targetSignature: 'التوقيع المعتمد',
      documentSnapshotNote: 'لقطة الهوية الرسمية للوثائق جاهزة (v{version}) — متزامنة للشهادات والخطابات المستقبلية.',
    },
  },
};
