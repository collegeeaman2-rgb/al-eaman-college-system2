import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  FileBadge2,
  Globe,
  History,
  Image as ImageIcon,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useCollegeProfile } from '../context/CollegeProfileContext';
import {
  createBlankCollegeProfileInput,
  prepareImageAssetUpload,
  profileToEditableInput,
  saveCollegeAssetAsPrincipal,
  saveCollegeProfileAtomically,
  type CollegeProfileEditableInput,
  type PreparedAssetPayload,
} from '../lib/collegeProfileService';
import {
  BLUEPRINT_LIMITS,
  normalizeModulePermissions,
  ORIGINAL_COLLEGE_LOGO_URL,
  type CollegeAsset,
  type CollegeAssetType,
  type CollegeProfileRevision,
  type ModulePermissions,
  type UserAccount,
} from '../types/governance';

interface CollegeProfilePageProps {
  userAccount: UserAccount;
  permissions: ModulePermissions | null;
}

type ProfileSubTab = 'details' | 'assets' | 'history';

interface PendingAssetAction {
  assetType: CollegeAssetType;
  existingAsset: CollegeAsset | null;
  payload: PreparedAssetPayload;
  defaultReason: string;
  previewLabel: string;
}

function formatFirestoreDate(value: unknown, locale: string): string {
  if (!value) return '—';
  try {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    const date =
      typeof maybeTimestamp.toDate === 'function'
        ? maybeTimestamp.toDate()
        : typeof maybeTimestamp.seconds === 'number'
        ? new Date(maybeTimestamp.seconds * 1000)
        : value instanceof Date
        ? value
        : null;
    if (!date || Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}

function isSafeHttpUrl(url: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(url.trim());
}

export function CollegeProfilePage({ userAccount, permissions }: CollegeProfilePageProps) {
  const { t, lang } = useI18n();
  const cp = t.collegeProfilePage;
  const {
    publicIdentity,
    collegeProfile,
    logoAsset,
    sealAsset,
    signatureAsset,
    revisions,
    effectiveLogoUrl,
  } = useCollegeProfile();

  const isPrincipal = userAccount.role === 'principal';
  const isParent = userAccount.role === 'parent';
  const normalizedPerms = useMemo(() => normalizeModulePermissions(permissions), [permissions]);
  const canEditDetails =
    isPrincipal || (!isParent && Boolean(normalizedPerms.collegeProfile?.edit));
  const canManageAssets = isPrincipal;

  const [subTab, setSubTab] = useState<ProfileSubTab>('details');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CollegeProfileEditableInput>(() =>
    profileToEditableInput(collegeProfile)
  );
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [pendingAssetAction, setPendingAssetAction] = useState<PendingAssetAction | null>(null);
  const [assetReason, setAssetReason] = useState('');
  const [assetBusy, setAssetBusy] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const sealInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  // Parent may only inspect official public/contact details (never assets or history)
  useEffect(() => {
    if (isParent && subTab !== 'details') {
      setSubTab('details');
    }
  }, [isParent, subTab]);

  // Keep form synchronized when exiting edit mode or receiving live snapshot updates
  useEffect(() => {
    if (!editing) {
      setForm(profileToEditableInput(collegeProfile));
    }
  }, [collegeProfile, editing]);

  const currentVersion = collegeProfile?.version ?? 0;
  const displayData = useMemo(
    () => (collegeProfile ? profileToEditableInput(collegeProfile) : createBlankCollegeProfileInput()),
    [collegeProfile]
  );

  const displayNameEn = collegeProfile?.nameEn || publicIdentity.nameEn;
  const displayNameTa = collegeProfile?.nameTa || publicIdentity.nameTa;
  const displayNameAr = collegeProfile?.nameAr || publicIdentity.nameAr;
  const displayShortName = collegeProfile?.shortName || publicIdentity.shortName;
  const displayEstYear = collegeProfile?.establishedYear || publicIdentity.establishedYear;

  const localeForDates = lang === 'ta' ? 'ta-LK' : lang === 'ar' ? 'ar-SA' : 'en-GB';

  const fieldLabels = useMemo<Record<string, string>>(
    () => ({
      nameEn: cp.nameEnLabel,
      nameTa: cp.nameTaLabel,
      nameAr: cp.nameArLabel,
      shortName: cp.shortNameLabel,
      establishedYear: cp.establishedYearLabel,
      registrationNumber: cp.registrationNumberLabel,
      addressEn: cp.addressEnLabel,
      addressTa: cp.addressTaLabel,
      addressAr: cp.addressArLabel,
      city: cp.cityLabel,
      district: cp.districtLabel,
      province: cp.provinceLabel,
      country: cp.countryLabel,
      postalCode: cp.postalCodeLabel,
      telephone: cp.telephoneLabel,
      alternateTelephone: cp.alternateTelephoneLabel,
      email: cp.emailLabel,
      website: cp.websiteLabel,
      introductionEn: cp.introductionEnLabel,
      introductionTa: cp.introductionTaLabel,
      introductionAr: cp.introductionArLabel,
      visionEn: cp.visionEnLabel,
      visionTa: cp.visionTaLabel,
      visionAr: cp.visionArLabel,
      missionEn: cp.missionEnLabel,
      missionTa: cp.missionTaLabel,
      missionAr: cp.missionArLabel,
      principalStaffId: cp.principalStaffIdLabel,
      logo: cp.assetLogoTitle,
      seal: cp.assetSealTitle,
      signature: cp.assetSignatureTitle,
    }),
    [cp]
  );

  const cardClass =
    'bg-white border border-[#D7E5F5] rounded-2xl p-4 sm:p-5 md:p-6 shadow-[0_6px_20px_-10px_rgba(21,62,117,0.1)] min-w-0';
  const inputClass =
    'w-full max-w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0] focus:ring-2 focus:ring-[#2878D0]/15';
  const textareaClass =
    'w-full max-w-full px-3.5 py-2.5 rounded-xl border border-[#D7E5F5] bg-white text-base sm:text-sm text-[#172B45] focus:outline-none focus:border-[#2878D0] focus:ring-2 focus:ring-[#2878D0]/15';

  const startEditing = () => {
    if (!canEditDetails) return;
    setFeedback(null);
    setForm(profileToEditableInput(collegeProfile));
    setReason('');
    setEditing(true);
    setSubTab('details');
  };

  const cancelEditing = () => {
    setEditing(false);
    setForm(profileToEditableInput(collegeProfile));
    setReason('');
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDetails) return;
    setFeedback(null);

    if (reason.trim().length < 3) {
      setFeedback({ type: 'err', text: cp.reasonRequiredError });
      return;
    }

    setSaving(true);
    try {
      const result = await saveCollegeProfileAtomically({
        actor: userAccount,
        permissions,
        input: form,
        existingProfile: collegeProfile,
        currentLogoUrl: effectiveLogoUrl,
        reason,
      });
      setEditing(false);
      setReason('');
      setFeedback({
        type: 'ok',
        text: cp.savedSuccess.replace('{version}', String(result.version)),
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : cp.reasonRequiredError,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFilePick = async (
    assetType: CollegeAssetType,
    existingAsset: CollegeAsset | null,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canManageAssets) return;
    setFeedback(null);

    try {
      const payload = await prepareImageAssetUpload(file);
      const labelMap: Record<CollegeAssetType, string> = {
        logo: cp.assetLogoTitle,
        seal: cp.assetSealTitle,
        signature: cp.assetSignatureTitle,
      };
      setPendingAssetAction({
        assetType,
        existingAsset,
        payload,
        defaultReason: cp.assetReasonDefaultUpload,
        previewLabel: labelMap[assetType],
      });
      setAssetReason(cp.assetReasonDefaultUpload);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to process selected image.',
      });
    }
  };

  const handleRestoreOriginalLogoPrompt = () => {
    if (!canManageAssets) return;
    setFeedback(null);
    setPendingAssetAction({
      assetType: 'logo',
      existingAsset: logoAsset,
      payload: {
        dataUrl: '',
        fileName: '1781688019967_907a1671.png',
        mimeType: 'image/png',
        width: 1083,
        height: 976,
        sizeBytes: 0,
      },
      defaultReason: cp.assetReasonDefaultRestore,
      previewLabel: cp.assetLogoTitle,
    });
    setAssetReason(cp.assetReasonDefaultRestore);
  };

  const handleClearAssetPrompt = (
    assetType: 'seal' | 'signature',
    existingAsset: CollegeAsset | null
  ) => {
    if (!canManageAssets) return;
    setFeedback(null);
    setPendingAssetAction({
      assetType,
      existingAsset,
      payload: {
        dataUrl: '',
        fileName: '',
        mimeType: '',
        width: 0,
        height: 0,
        sizeBytes: 0,
      },
      defaultReason: cp.assetReasonDefaultRemove,
      previewLabel: assetType === 'seal' ? cp.assetSealTitle : cp.assetSignatureTitle,
    });
    setAssetReason(cp.assetReasonDefaultRemove);
  };

  const handleConfirmAssetSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAssetAction || !canManageAssets) return;
    if (assetReason.trim().length < 3) {
      setFeedback({ type: 'err', text: cp.reasonRequiredError });
      return;
    }

    setAssetBusy(true);
    setFeedback(null);
    try {
      const res = await saveCollegeAssetAsPrincipal({
        principal: userAccount,
        assetType: pendingAssetAction.assetType,
        existingAsset: pendingAssetAction.existingAsset,
        payload: pendingAssetAction.payload,
        reason: assetReason,
        publicIdentity,
      });
      setPendingAssetAction(null);
      setAssetReason('');
      setFeedback({
        type: 'ok',
        text: cp.assetSavedSuccess.replace('{version}', String(res.version)),
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save official asset.',
      });
    } finally {
      setAssetBusy(false);
    }
  };

  const renderFieldValue = (val: string, rtl = false) => {
    if (!val.trim()) {
      return <span className="text-xs italic text-[#667D9B]">{cp.notProvidedYet}</span>;
    }
    return (
      <div
        dir={rtl ? 'rtl' : undefined}
        className="text-sm font-medium text-[#172B45] break-words whitespace-pre-line"
      >
        {val}
      </div>
    );
  };

  const getRevisionTargetLabel = (targetType: CollegeProfileRevision['targetType']) => {
    switch (targetType) {
      case 'profile':
        return cp.targetProfile;
      case 'asset_logo':
        return cp.targetLogo;
      case 'asset_seal':
        return cp.targetSeal;
      case 'asset_signature':
        return cp.targetSignature;
    }
  };

  const formatSnapshotVal = (val: string | number | boolean | null | undefined) => {
    if (val === null || val === undefined || val === '') return cp.emptyValueLabel;
    return String(val);
  };

  const renderDetailsTab = () => {
    if (editing && canEditDetails) {
      return (
        <form onSubmit={handleSaveDetails} className="space-y-5">
          {/* Section 1: Official Identity */}
          <div className={`${cardClass} space-y-4`}>
            <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
              <Building2 className="w-4 h-4 text-[#2878D0] shrink-0" />
              <h3>{cp.sectionIdentity}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.nameEnLabel}
                </label>
                <input
                  type="text"
                  required
                  minLength={BLUEPRINT_LIMITS.COLLEGE_NAME_MIN}
                  maxLength={BLUEPRINT_LIMITS.COLLEGE_NAME_MAX}
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.nameTaLabel}
                </label>
                <input
                  type="text"
                  required
                  minLength={BLUEPRINT_LIMITS.COLLEGE_NAME_MIN}
                  maxLength={BLUEPRINT_LIMITS.COLLEGE_NAME_MAX}
                  value={form.nameTa}
                  onChange={(e) => setForm((f) => ({ ...f, nameTa: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.nameArLabel}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  required
                  minLength={BLUEPRINT_LIMITS.COLLEGE_NAME_MIN}
                  maxLength={BLUEPRINT_LIMITS.COLLEGE_NAME_MAX}
                  value={form.nameAr}
                  onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.shortNameLabel}
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.SHORT_NAME_MAX}
                  value={form.shortName}
                  onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.establishedYearLabel}
                </label>
                <input
                  type="number"
                  required
                  min={1800}
                  max={2100}
                  value={form.establishedYear}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      establishedYear: Number(e.target.value) || 2010,
                    }))
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.registrationNumberLabel}
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.REG_NUMBER_MAX}
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, registrationNumber: e.target.value }))
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div className={`${cardClass} space-y-4`}>
            <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
              <MapPin className="w-4 h-4 text-[#2878D0] shrink-0" />
              <h3>{cp.sectionAddress}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.addressEnLabel}
                </label>
                <textarea
                  rows={2}
                  maxLength={BLUEPRINT_LIMITS.ADDRESS_MAX}
                  value={form.addressEn}
                  onChange={(e) => setForm((f) => ({ ...f, addressEn: e.target.value }))}
                  className={textareaClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.addressTaLabel}
                </label>
                <textarea
                  rows={2}
                  maxLength={BLUEPRINT_LIMITS.ADDRESS_MAX}
                  value={form.addressTa}
                  onChange={(e) => setForm((f) => ({ ...f, addressTa: e.target.value }))}
                  className={textareaClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.addressArLabel}
                </label>
                <textarea
                  rows={2}
                  dir="rtl"
                  maxLength={BLUEPRINT_LIMITS.ADDRESS_MAX}
                  value={form.addressAr}
                  onChange={(e) => setForm((f) => ({ ...f, addressAr: e.target.value }))}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.cityLabel}
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.CITY_MAX}
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.districtLabel}
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.CITY_MAX}
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.provinceLabel}
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.CITY_MAX}
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.countryLabel}
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.CITY_MAX}
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.postalCodeLabel}
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.POSTAL_CODE_MAX}
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
          <div className={`${cardClass} space-y-4`}>
            <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
              <Phone className="w-4 h-4 text-[#2878D0] shrink-0" />
              <h3>{cp.sectionContact}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.telephoneLabel}
                </label>
                <input
                  type="tel"
                  maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.alternateTelephoneLabel}
                </label>
                <input
                  type="tel"
                  maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
                  value={form.alternateTelephone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, alternateTelephone: e.target.value }))
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.emailLabel}
                </label>
                <input
                  type="email"
                  maxLength={BLUEPRINT_LIMITS.EMAIL_MAX}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#153E75] mb-1">
                  {cp.websiteLabel}
                </label>
                <input
                  type="url"
                  maxLength={BLUEPRINT_LIMITS.WEBSITE_MAX}
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 4: About / Vision / Mission */}
          <div className={`${cardClass} space-y-4`}>
            <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
              <Sparkles className="w-4 h-4 text-[#2878D0] shrink-0" />
              <h3>{cp.sectionAbout}</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.introductionEnLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.INTRO_MAX}
                    value={form.introductionEn}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, introductionEn: e.target.value }))
                    }
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.introductionTaLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.INTRO_MAX}
                    value={form.introductionTa}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, introductionTa: e.target.value }))
                    }
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.introductionArLabel}
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    maxLength={BLUEPRINT_LIMITS.INTRO_MAX}
                    value={form.introductionAr}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, introductionAr: e.target.value }))
                    }
                    className={textareaClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-[#EAF1FA]">
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.visionEnLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.VISION_MISSION_MAX}
                    value={form.visionEn}
                    onChange={(e) => setForm((f) => ({ ...f, visionEn: e.target.value }))}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.visionTaLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.VISION_MISSION_MAX}
                    value={form.visionTa}
                    onChange={(e) => setForm((f) => ({ ...f, visionTa: e.target.value }))}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.visionArLabel}
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    maxLength={BLUEPRINT_LIMITS.VISION_MISSION_MAX}
                    value={form.visionAr}
                    onChange={(e) => setForm((f) => ({ ...f, visionAr: e.target.value }))}
                    className={textareaClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-[#EAF1FA]">
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.missionEnLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.VISION_MISSION_MAX}
                    value={form.missionEn}
                    onChange={(e) => setForm((f) => ({ ...f, missionEn: e.target.value }))}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.missionTaLabel}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.VISION_MISSION_MAX}
                    value={form.missionTa}
                    onChange={(e) => setForm((f) => ({ ...f, missionTa: e.target.value }))}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#153E75] mb-1">
                    {cp.missionArLabel}
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    maxLength={BLUEPRINT_LIMITS.VISION_MISSION_MAX}
                    value={form.missionAr}
                    onChange={(e) => setForm((f) => ({ ...f, missionAr: e.target.value }))}
                    className={textareaClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Reserved Principal Staff Reference ID (Principal edits only) */}
          <div className={`${cardClass} space-y-3`}>
            <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
              <FileBadge2 className="w-4 h-4 text-[#2878D0] shrink-0" />
              <h3>{cp.sectionGovernance}</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#153E75] mb-1">
                {cp.principalStaffIdLabel}
              </label>
              <input
                type="text"
                disabled={!isPrincipal}
                maxLength={BLUEPRINT_LIMITS.UID_MAX}
                value={form.principalStaffId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, principalStaffId: e.target.value }))
                }
                className={`${inputClass} font-mono ${!isPrincipal ? 'opacity-60 bg-[#F4F8FD]' : ''}`}
              />
              <p className="text-xs text-[#4B6484] mt-1">{cp.principalStaffIdHint}</p>
            </div>
          </div>

          {/* Mandatory Audited Revision Reason & Submit Actions */}
          <div className={`${cardClass} border-[#2878D0]/40 bg-[#F8FBFF] space-y-4`}>
            <div>
              <label className="block text-xs font-semibold text-[#0B2045] mb-1">
                {cp.reasonPromptTitle} *
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={BLUEPRINT_LIMITS.REVISION_REASON_MAX}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={cp.reasonPlaceholder}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={cancelEditing}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] bg-white text-sm font-medium text-[#172B45] hover:bg-[#F4F8FD]"
              >
                {cp.cancelEditBtn}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-semibold hover:bg-[#1E63B3] inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>{saving ? cp.savingBtn : cp.saveChangesBtn}</span>
              </button>
            </div>
          </div>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        {/* Identity Summary */}
        <div className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
            <Building2 className="w-4 h-4 text-[#2878D0] shrink-0" />
            <h3>{cp.sectionIdentity}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.nameEnLabel}</div>
              {renderFieldValue(displayNameEn)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.nameTaLabel}</div>
              {renderFieldValue(displayNameTa)}
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-[#4B6484]">{cp.nameArLabel}</div>
              {renderFieldValue(displayNameAr, true)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.shortNameLabel}</div>
              {renderFieldValue(displayShortName)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.establishedYearLabel}</div>
              <div className="text-sm font-mono font-semibold text-[#172B45] tabular-nums">
                {displayEstYear}
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-[#4B6484]">{cp.registrationNumberLabel}</div>
              {renderFieldValue(displayData.registrationNumber)}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
            <MapPin className="w-4 h-4 text-[#2878D0] shrink-0" />
            <h3>{cp.sectionAddress}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-[#4B6484]">{cp.addressEnLabel}</div>
              {renderFieldValue(displayData.addressEn)}
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-[#4B6484]">{cp.addressTaLabel}</div>
              {renderFieldValue(displayData.addressTa)}
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-[#4B6484]">{cp.addressArLabel}</div>
              {renderFieldValue(displayData.addressAr, true)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.cityLabel}</div>
              {renderFieldValue(displayData.city)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.districtLabel}</div>
              {renderFieldValue(displayData.district)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.provinceLabel}</div>
              {renderFieldValue(displayData.province)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.countryLabel}</div>
              {renderFieldValue(displayData.country)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.postalCodeLabel}</div>
              {renderFieldValue(displayData.postalCode)}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
            <Phone className="w-4 h-4 text-[#2878D0] shrink-0" />
            <h3>{cp.sectionContact}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#2878D0]" />
                <span>{cp.telephoneLabel}</span>
              </div>
              {renderFieldValue(displayData.telephone)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#4B6484]" />
                <span>{cp.alternateTelephoneLabel}</span>
              </div>
              {renderFieldValue(displayData.alternateTelephone)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#2878D0]" />
                <span>{cp.emailLabel}</span>
              </div>
              {renderFieldValue(displayData.email)}
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2878D0]" />
                <span>{cp.websiteLabel}</span>
              </div>
              {displayData.website && isSafeHttpUrl(displayData.website) ? (
                <a
                  href={displayData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#2878D0] hover:underline break-all inline-block"
                >
                  {displayData.website}
                </a>
              ) : (
                renderFieldValue(displayData.website)
              )}
            </div>
          </div>
        </div>

        {/* Introduction, Vision & Mission */}
        <div className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
            <Sparkles className="w-4 h-4 text-[#2878D0] shrink-0" />
            <h3>{cp.sectionAbout}</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.introductionEnLabel}</div>
                {renderFieldValue(displayData.introductionEn)}
              </div>
              <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.introductionTaLabel}</div>
                {renderFieldValue(displayData.introductionTa)}
              </div>
              <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.introductionArLabel}</div>
                {renderFieldValue(displayData.introductionAr, true)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.visionEnLabel}</div>
                {renderFieldValue(displayData.visionEn)}
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.visionTaLabel}</div>
                {renderFieldValue(displayData.visionTa)}
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.visionArLabel}</div>
                {renderFieldValue(displayData.visionAr, true)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.missionEnLabel}</div>
                {renderFieldValue(displayData.missionEn)}
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.missionTaLabel}</div>
                {renderFieldValue(displayData.missionTa)}
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] space-y-1">
                <div className="text-xs font-medium text-[#153E75]">{cp.missionArLabel}</div>
                {renderFieldValue(displayData.missionAr, true)}
              </div>
            </div>
          </div>
        </div>

        {/* Administrative Reference (Principal & Staff only — hidden from Parents) */}
        {!isParent && (
          <div className={`${cardClass} space-y-2`}>
            <div className="flex items-center gap-2 text-[#0B2045] font-semibold text-base">
              <FileBadge2 className="w-4 h-4 text-[#2878D0] shrink-0" />
              <h3>{cp.sectionGovernance}</h3>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-[#4B6484]">{cp.principalStaffIdLabel}</div>
              {displayData.principalStaffId ? (
                <div className="text-sm font-mono text-[#172B45] break-all">
                  {displayData.principalStaffId}
                </div>
              ) : (
                <span className="text-xs italic text-[#667D9B]">{cp.notProvidedYet}</span>
              )}
              <p className="text-xs text-[#667D9B]">{cp.principalStaffIdHint}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAssetsTab = () => {
    const isCustomLogoUploaded = Boolean(logoAsset?.dataUrl);
    return (
      <div className="space-y-4">
        <div className={`${cardClass} space-y-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#172B45]">{cp.assetsTitle}</h3>
              <p className="text-xs text-[#4B6484] mt-0.5">{cp.assetsSubtitle}</p>
            </div>
            {!canManageAssets && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#153E75] bg-[#EAF2FB] border border-[#D7E5F5] px-3 py-1.5 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-[#2878D0]" />
                <span>{cp.principalAssetsOnlyNote}</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1. Official College Crest / Logo */}
          <div className={`${cardClass} flex flex-col justify-between gap-4`}>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[#0B2045]">{cp.assetLogoTitle}</div>
                <p className="text-xs text-[#4B6484] mt-0.5">{cp.assetLogoDesc}</p>
              </div>
              <div className="h-44 rounded-xl bg-white border border-[#D7E5F5] p-3 flex items-center justify-center overflow-hidden">
                <img
                  src={effectiveLogoUrl}
                  alt={t.logoSlotLabel}
                  className="max-h-full max-w-full w-auto h-auto object-contain"
                />
              </div>
              <div className="text-xs text-[#4B6484] space-y-0.5">
                <div className="font-medium text-[#153E75]">
                  {isCustomLogoUploaded ? logoAsset?.fileName : cp.originalCrestActiveLabel}
                </div>
                <div className="font-mono text-[11px] text-[#667D9B]">
                  {isCustomLogoUploaded && logoAsset?.width
                    ? cp.assetDimensionsLabel
                        .replace('{width}', String(logoAsset.width))
                        .replace('{height}', String(logoAsset.height))
                    : cp.assetDimensionsLabel
                        .replace('{width}', '1083')
                        .replace('{height}', '976')}
                </div>
              </div>
            </div>

            {canManageAssets && (
              <div className="space-y-2 pt-2 border-t border-[#EAF1FA]">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFilePick('logo', logoAsset, e)}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#2878D0] text-white text-xs font-semibold hover:bg-[#1E63B3] inline-flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>{cp.uploadImageBtn}</span>
                </button>
                {isCustomLogoUploaded && effectiveLogoUrl !== ORIGINAL_COLLEGE_LOGO_URL && (
                  <button
                    type="button"
                    onClick={handleRestoreOriginalLogoPrompt}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D7E5F5] bg-[#F4F8FD] text-[#153E75] text-xs font-medium hover:bg-[#EAF2FB] inline-flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>{cp.restoreOriginalLogoBtn}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Official College Stamp / Seal */}
          <div className={`${cardClass} flex flex-col justify-between gap-4`}>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[#0B2045]">{cp.assetSealTitle}</div>
                <p className="text-xs text-[#4B6484] mt-0.5">{cp.assetSealDesc}</p>
              </div>
              <div className="h-44 rounded-xl bg-white border border-[#D7E5F5] p-3 flex items-center justify-center overflow-hidden">
                {sealAsset?.dataUrl ? (
                  <img
                    src={sealAsset.dataUrl}
                    alt={cp.assetSealTitle}
                    className="max-h-full max-w-full w-auto h-auto object-contain"
                  />
                ) : (
                  <div className="text-center space-y-1.5 text-[#667D9B]">
                    <ImageIcon className="w-7 h-7 mx-auto opacity-45" />
                    <div className="text-xs">{cp.assetNotUploaded}</div>
                  </div>
                )}
              </div>
              {sealAsset?.dataUrl && (
                <div className="text-xs text-[#4B6484] space-y-0.5">
                  <div className="font-medium text-[#153E75] truncate">{sealAsset.fileName}</div>
                  <div className="font-mono text-[11px] text-[#667D9B]">
                    {cp.assetDimensionsLabel
                      .replace('{width}', String(sealAsset.width))
                      .replace('{height}', String(sealAsset.height))}
                  </div>
                </div>
              )}
            </div>

            {canManageAssets && (
              <div className="space-y-2 pt-2 border-t border-[#EAF1FA]">
                <input
                  ref={sealInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFilePick('seal', sealAsset, e)}
                />
                <button
                  type="button"
                  onClick={() => sealInputRef.current?.click()}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#2878D0] text-white text-xs font-semibold hover:bg-[#1E63B3] inline-flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>{cp.uploadImageBtn}</span>
                </button>
                {sealAsset?.dataUrl && (
                  <button
                    type="button"
                    onClick={() => handleClearAssetPrompt('seal', sealAsset)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs font-medium hover:bg-red-100 inline-flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{cp.removeAssetBtn}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. Authorized Principal Signature */}
          <div className={`${cardClass} flex flex-col justify-between gap-4`}>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[#0B2045]">{cp.assetSignatureTitle}</div>
                <p className="text-xs text-[#4B6484] mt-0.5">{cp.assetSignatureDesc}</p>
              </div>
              <div className="h-44 rounded-xl bg-white border border-[#D7E5F5] p-3 flex items-center justify-center overflow-hidden">
                {signatureAsset?.dataUrl ? (
                  <img
                    src={signatureAsset.dataUrl}
                    alt={cp.assetSignatureTitle}
                    className="max-h-full max-w-full w-auto h-auto object-contain"
                  />
                ) : (
                  <div className="text-center space-y-1.5 text-[#667D9B]">
                    <ImageIcon className="w-7 h-7 mx-auto opacity-45" />
                    <div className="text-xs">{cp.assetNotUploaded}</div>
                  </div>
                )}
              </div>
              {signatureAsset?.dataUrl && (
                <div className="text-xs text-[#4B6484] space-y-0.5">
                  <div className="font-medium text-[#153E75] truncate">
                    {signatureAsset.fileName}
                  </div>
                  <div className="font-mono text-[11px] text-[#667D9B]">
                    {cp.assetDimensionsLabel
                      .replace('{width}', String(signatureAsset.width))
                      .replace('{height}', String(signatureAsset.height))}
                  </div>
                </div>
              )}
            </div>

            {canManageAssets && (
              <div className="space-y-2 pt-2 border-t border-[#EAF1FA]">
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFilePick('signature', signatureAsset, e)}
                />
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#2878D0] text-white text-xs font-semibold hover:bg-[#1E63B3] inline-flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>{cp.uploadImageBtn}</span>
                </button>
                {signatureAsset?.dataUrl && (
                  <button
                    type="button"
                    onClick={() => handleClearAssetPrompt('signature', signatureAsset)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs font-medium hover:bg-red-100 inline-flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{cp.removeAssetBtn}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#EAF2FB] border border-[#D7E5F5] text-xs text-[#153E75]">
          {cp.assetUploadHint}
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className={`${cardClass} space-y-1.5`}>
        <h3 className="text-base font-semibold text-[#172B45]">{cp.historyTitle}</h3>
        <p className="text-xs text-[#4B6484]">{cp.historySubtitle}</p>
      </div>

      {revisions.length === 0 ? (
        <div className={`${cardClass} text-center py-8 text-sm text-[#4B6484]`}>
          {cp.noRevisionsYet}
        </div>
      ) : (
        <div className="space-y-3">
          {revisions.map((rev) => (
            <div key={rev.revisionId} className={`${cardClass} space-y-3`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#0B2045] text-[#D6B45C] text-[11px] font-semibold">
                      {getRevisionTargetLabel(rev.targetType)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#EAF2FB] text-[#153E75] text-[11px] font-mono font-semibold tabular-nums">
                      {cp.versionBadge.replace('{version}', String(rev.version))}
                    </span>
                  </div>
                  <div className="text-xs text-[#4B6484] flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-[#172B45]">{rev.actorName}</span>
                    <span>({t.roles[rev.actorRole]})</span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">{rev.actorEmail}</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-[#667D9B] inline-flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatFirestoreDate(rev.createdAt, localeForDates)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs space-y-1">
                <div className="font-semibold text-[#153E75]">{cp.revisionReasonLabel}</div>
                <div className="text-[#172B45]">{rev.reason}</div>
              </div>

              {rev.changedFields.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#4B6484]">
                    {cp.changedFieldsLabel}:{' '}
                    <span className="text-[#153E75]">
                      {rev.changedFields.map((f) => fieldLabels[f] ?? f).join(', ')}
                    </span>
                  </div>

                  {rev.targetType === 'profile' && (
                    <div className="divide-y divide-[#EAF1FA] border border-[#EAF1FA] rounded-xl overflow-hidden">
                      {rev.changedFields.map((fieldKey) => (
                        <div
                          key={fieldKey}
                          className="p-2.5 bg-white grid grid-cols-1 md:grid-cols-12 gap-2 text-xs"
                        >
                          <div className="md:col-span-4 font-medium text-[#153E75]">
                            {fieldLabels[fieldKey] ?? fieldKey}
                          </div>
                          <div className="md:col-span-4 text-[#667D9B] break-words">
                            <span className="font-semibold text-[11px] uppercase me-1">
                              {cp.previousValueLabel}:
                            </span>
                            {formatSnapshotVal(rev.previousSnapshot?.[fieldKey])}
                          </div>
                          <div className="md:col-span-4 text-[#172B45] font-medium break-words">
                            <span className="font-semibold text-[11px] uppercase text-[#2878D0] me-1">
                              {cp.newValueLabel}:
                            </span>
                            {formatSnapshotVal(rev.newSnapshot?.[fieldKey])}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Official Institutional Showcase Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B2045] text-white p-5 md:p-6 border border-[#D6B45C]/35 shadow-[0_14px_34px_-14px_rgba(11,32,69,0.55)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-[#D6B45C] p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <img
                src={effectiveLogoUrl}
                alt={t.logoSlotLabel}
                className="max-h-full max-w-full w-auto h-auto object-contain"
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="text-[11px] font-semibold text-[#D6B45C] tracking-wide">
                {cp.settingsSectionLabel}
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold leading-snug text-white break-words">
                {displayNameEn}
              </h2>
              <div className="text-xs sm:text-sm text-[#D7E5F5] leading-snug break-words">
                {displayNameTa}
              </div>
              <div className="text-xs sm:text-sm text-[#E5EEFA] leading-snug break-words" dir="rtl">
                {displayNameAr}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#153E75] border border-[#D6B45C]/40 text-[#D6B45C] font-semibold">
                  {t.establishedLabel.replace('{year}', String(displayEstYear))}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-[#E5EEFA] font-mono tabular-nums">
                  {cp.versionBadge.replace('{version}', String(currentVersion))}
                </span>
              </div>
            </div>
          </div>

          {canEditDetails && !editing && (
            <button
              type="button"
              onClick={startEditing}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] hover:bg-[#1E63B3] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 self-start sm:self-center shadow-sm"
            >
              <Edit3 className="w-4 h-4 shrink-0" />
              <span>
                {!collegeProfile && isPrincipal ? cp.initializeRecordBtn : cp.editProfileBtn}
              </span>
            </button>
          )}
        </div>

        {collegeProfile && (
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#D7E5F5]">
            <span>
              {cp.lastUpdatedBy.replace(
                '{actor}',
                collegeProfile.updatedByName || collegeProfile.updatedByEmail
              )}{' '}
              · {formatFirestoreDate(collegeProfile.updatedAt, localeForDates)}
            </span>
            {!isParent && (
              <span className="text-[#D6B45C]">
                {cp.documentSnapshotNote.replace('{version}', String(currentVersion))}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Role & Initialization Status Banner */}
      {!collegeProfile && (
        <div className="p-3.5 rounded-xl bg-[#EAF2FB] border border-[#BFD6F2] text-xs text-[#153E75] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#2878D0] shrink-0 mt-0.5" />
          <span>{cp.notInitializedNotice}</span>
        </div>
      )}

      {isParent ? (
        <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] text-xs text-[#153E75] flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#2878D0] shrink-0 mt-0.5" />
          <span>{cp.readOnlyParentBanner}</span>
        </div>
      ) : !isPrincipal && canEditDetails ? (
        <div className="p-3.5 rounded-xl bg-[#EAF2FB] border border-[#BFD6F2] text-xs text-[#153E75] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#2878D0] shrink-0 mt-0.5" />
          <span>{cp.editableStaffBanner}</span>
        </div>
      ) : !isPrincipal ? (
        <div className="p-3.5 rounded-xl bg-white border border-[#D7E5F5] text-xs text-[#153E75] flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#2878D0] shrink-0 mt-0.5" />
          <span>{cp.readOnlyStaffBanner}</span>
        </div>
      ) : null}

      {/* Feedback Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs border flex items-center justify-between gap-2 ${
            feedback.type === 'ok'
              ? 'bg-[#EAF2FB] border-[#BFD6F2] text-[#153E75]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0 break-words">
            {feedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2878D0] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-navigation Tabs (Hidden from Parents) */}
      {!isParent && (
        <div className="flex flex-wrap items-center gap-2 bg-white border border-[#D7E5F5] p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setSubTab('details')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors ${
              subTab === 'details'
                ? 'bg-[#0B2045] text-white'
                : 'text-[#153E75] hover:bg-[#F4F8FD]'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{cp.tabDetails}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setSubTab('assets');
            }}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors ${
              subTab === 'assets'
                ? 'bg-[#0B2045] text-white'
                : 'text-[#153E75] hover:bg-[#F4F8FD]'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>{cp.tabAssets}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setSubTab('history');
            }}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors ${
              subTab === 'history'
                ? 'bg-[#0B2045] text-white'
                : 'text-[#153E75] hover:bg-[#F4F8FD]'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>{cp.tabHistory}</span>
            {revisions.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                  subTab === 'history'
                    ? 'bg-[#D6B45C] text-[#0B2045] font-bold'
                    : 'bg-[#EAF2FB] text-[#153E75]'
                }`}
              >
                {revisions.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Active Sub-Tab Body */}
      {subTab === 'details' && renderDetailsTab()}
      {!isParent && subTab === 'assets' && renderAssetsTab()}
      {!isParent && subTab === 'history' && renderHistoryTab()}

      {/* Asset Confirmation Modal with Revision Reason */}
      {pendingAssetAction && (
        <div className="fixed inset-0 z-50 bg-[#153E75]/50 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <form
            onSubmit={handleConfirmAssetSave}
            className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl border border-[#D7E5F5] p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4 shadow-xl"
          >
            <div className="w-10 h-1.5 bg-[#D7E5F5] rounded-full mx-auto md:hidden" />
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-[#172B45]">
                {pendingAssetAction.previewLabel}
              </h4>
              <button
                type="button"
                onClick={() => setPendingAssetAction(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#4B6484] hover:bg-[#F4F8FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-36 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] p-3 flex items-center justify-center overflow-hidden">
              {(() => {
                const previewSrc =
                  pendingAssetAction.payload.dataUrl ||
                  (pendingAssetAction.assetType === 'logo' ? ORIGINAL_COLLEGE_LOGO_URL : '');
                if (previewSrc) {
                  return (
                    <img
                      src={previewSrc}
                      alt={pendingAssetAction.previewLabel}
                      className="max-h-full max-w-full w-auto h-auto object-contain"
                    />
                  );
                }
                return <span className="text-xs text-[#667D9B]">{cp.assetNotUploaded}</span>;
              })()}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#153E75] mb-1">
                {cp.reasonPromptTitle} *
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={BLUEPRINT_LIMITS.REVISION_REASON_MAX}
                value={assetReason}
                onChange={(e) => setAssetReason(e.target.value)}
                placeholder={cp.reasonPlaceholder}
                className={inputClass}
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={assetBusy}
                onClick={() => setPendingAssetAction(null)}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#D7E5F5] text-sm font-medium text-[#172B45]"
              >
                {t.labels.cancel}
              </button>
              <button
                type="submit"
                disabled={assetBusy}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-sm font-semibold hover:bg-[#1E63B3]"
              >
                {assetBusy ? cp.savingBtn : cp.saveChangesBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
