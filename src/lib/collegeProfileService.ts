import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { authorizeActionOnServer } from './firestoreService';
import {
  BLUEPRINT_LIMITS,
  clampString,
  createFullPrincipalModules,
  OFFICIAL_COLLEGE_DEFAULTS,
  ORIGINAL_COLLEGE_LOGO_URL,
  type AuditAction,
  type CollegeAsset,
  type CollegeAssetType,
  type CollegeIdentitySnapshot,
  type CollegeProfile,
  type CollegeRevisionTargetType,
  type ModulePermissions,
  type PublicCollegeIdentity,
  type UserAccount,
} from '../types/governance';

export interface CollegeProfileEditableInput {
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
}

const PROFILE_TRACKED_KEYS: (keyof CollegeProfileEditableInput)[] = [
  'nameEn',
  'nameTa',
  'nameAr',
  'shortName',
  'establishedYear',
  'addressEn',
  'addressTa',
  'addressAr',
  'city',
  'district',
  'province',
  'country',
  'postalCode',
  'telephone',
  'alternateTelephone',
  'email',
  'website',
  'registrationNumber',
  'introductionEn',
  'introductionTa',
  'introductionAr',
  'visionEn',
  'visionTa',
  'visionAr',
  'missionEn',
  'missionTa',
  'missionAr',
  'principalStaffId',
];

export function createBlankCollegeProfileInput(): CollegeProfileEditableInput {
  return {
    nameEn: OFFICIAL_COLLEGE_DEFAULTS.nameEn,
    nameTa: OFFICIAL_COLLEGE_DEFAULTS.nameTa,
    nameAr: OFFICIAL_COLLEGE_DEFAULTS.nameAr,
    shortName: OFFICIAL_COLLEGE_DEFAULTS.shortName,
    establishedYear: OFFICIAL_COLLEGE_DEFAULTS.establishedYear,
    addressEn: '',
    addressTa: '',
    addressAr: '',
    city: '',
    district: '',
    province: '',
    country: '',
    postalCode: '',
    telephone: '',
    alternateTelephone: '',
    email: '',
    website: '',
    registrationNumber: '',
    introductionEn: '',
    introductionTa: '',
    introductionAr: '',
    visionEn: '',
    visionTa: '',
    visionAr: '',
    missionEn: '',
    missionTa: '',
    missionAr: '',
    principalStaffId: '',
  };
}

export function profileToEditableInput(profile: CollegeProfile | null): CollegeProfileEditableInput {
  const base = createBlankCollegeProfileInput();
  if (!profile) return base;
  return {
    nameEn: profile.nameEn || base.nameEn,
    nameTa: profile.nameTa || base.nameTa,
    nameAr: profile.nameAr || base.nameAr,
    shortName: profile.shortName ?? base.shortName,
    establishedYear:
      typeof profile.establishedYear === 'number' && Number.isFinite(profile.establishedYear)
        ? profile.establishedYear
        : base.establishedYear,
    addressEn: profile.addressEn ?? '',
    addressTa: profile.addressTa ?? '',
    addressAr: profile.addressAr ?? '',
    city: profile.city ?? '',
    district: profile.district ?? '',
    province: profile.province ?? '',
    country: profile.country ?? '',
    postalCode: profile.postalCode ?? '',
    telephone: profile.telephone ?? '',
    alternateTelephone: profile.alternateTelephone ?? '',
    email: profile.email ?? '',
    website: profile.website ?? '',
    registrationNumber: profile.registrationNumber ?? '',
    introductionEn: profile.introductionEn ?? '',
    introductionTa: profile.introductionTa ?? '',
    introductionAr: profile.introductionAr ?? '',
    visionEn: profile.visionEn ?? '',
    visionTa: profile.visionTa ?? '',
    visionAr: profile.visionAr ?? '',
    missionEn: profile.missionEn ?? '',
    missionTa: profile.missionTa ?? '',
    missionAr: profile.missionAr ?? '',
    principalStaffId: profile.principalStaffId ?? '',
  };
}

function sanitizeEditableInput(
  input: CollegeProfileEditableInput,
  existingProfile: CollegeProfile | null,
  isPrincipalActor: boolean
): CollegeProfileEditableInput {
  const estYear = Math.trunc(Number(input.establishedYear));
  if (!Number.isFinite(estYear) || estYear < 1800 || estYear > 2100) {
    throw new Error('Established year must be a valid four-digit year (1800–2100).');
  }

  const nameEn = clampString(input.nameEn, BLUEPRINT_LIMITS.COLLEGE_NAME_MAX);
  const nameTa = clampString(input.nameTa, BLUEPRINT_LIMITS.COLLEGE_NAME_MAX);
  const nameAr = clampString(input.nameAr, BLUEPRINT_LIMITS.COLLEGE_NAME_MAX);
  if (
    nameEn.length < BLUEPRINT_LIMITS.COLLEGE_NAME_MIN ||
    nameTa.length < BLUEPRINT_LIMITS.COLLEGE_NAME_MIN ||
    nameAr.length < BLUEPRINT_LIMITS.COLLEGE_NAME_MIN
  ) {
    throw new Error('Official English, Tamil, and Arabic college names are required.');
  }

  const email = clampString(input.email, BLUEPRINT_LIMITS.EMAIL_MAX);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Official email address format is invalid.');
  }

  const website = clampString(input.website, BLUEPRINT_LIMITS.WEBSITE_MAX);
  if (website && !/^https?:\/\/[^\s]+$/i.test(website)) {
    throw new Error('Website URL must start with https:// or http://');
  }

  const principalStaffId = isPrincipalActor
    ? clampString(input.principalStaffId, BLUEPRINT_LIMITS.UID_MAX)
    : existingProfile?.principalStaffId ?? '';

  return {
    nameEn,
    nameTa,
    nameAr,
    shortName: clampString(input.shortName, BLUEPRINT_LIMITS.SHORT_NAME_MAX),
    establishedYear: estYear,
    addressEn: clampString(input.addressEn, BLUEPRINT_LIMITS.ADDRESS_MAX),
    addressTa: clampString(input.addressTa, BLUEPRINT_LIMITS.ADDRESS_MAX),
    addressAr: clampString(input.addressAr, BLUEPRINT_LIMITS.ADDRESS_MAX),
    city: clampString(input.city, BLUEPRINT_LIMITS.CITY_MAX),
    district: clampString(input.district, BLUEPRINT_LIMITS.CITY_MAX),
    province: clampString(input.province, BLUEPRINT_LIMITS.CITY_MAX),
    country: clampString(input.country, BLUEPRINT_LIMITS.CITY_MAX),
    postalCode: clampString(input.postalCode, BLUEPRINT_LIMITS.POSTAL_CODE_MAX),
    telephone: clampString(input.telephone, BLUEPRINT_LIMITS.PHONE_MAX),
    alternateTelephone: clampString(input.alternateTelephone, BLUEPRINT_LIMITS.PHONE_MAX),
    email,
    website,
    registrationNumber: clampString(input.registrationNumber, BLUEPRINT_LIMITS.REG_NUMBER_MAX),
    introductionEn: clampString(input.introductionEn, BLUEPRINT_LIMITS.INTRO_MAX),
    introductionTa: clampString(input.introductionTa, BLUEPRINT_LIMITS.INTRO_MAX),
    introductionAr: clampString(input.introductionAr, BLUEPRINT_LIMITS.INTRO_MAX),
    visionEn: clampString(input.visionEn, BLUEPRINT_LIMITS.VISION_MISSION_MAX),
    visionTa: clampString(input.visionTa, BLUEPRINT_LIMITS.VISION_MISSION_MAX),
    visionAr: clampString(input.visionAr, BLUEPRINT_LIMITS.VISION_MISSION_MAX),
    missionEn: clampString(input.missionEn, BLUEPRINT_LIMITS.VISION_MISSION_MAX),
    missionTa: clampString(input.missionTa, BLUEPRINT_LIMITS.VISION_MISSION_MAX),
    missionAr: clampString(input.missionAr, BLUEPRINT_LIMITS.VISION_MISSION_MAX),
    principalStaffId,
  };
}

export async function saveCollegeProfileAtomically(params: {
  actor: UserAccount;
  permissions: ModulePermissions | null;
  input: CollegeProfileEditableInput;
  existingProfile: CollegeProfile | null;
  currentLogoUrl: string;
  reason: string;
}): Promise<{ version: number; changedFields: string[] }> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) {
    throw new Error('Verified authentication session is required.');
  }

  if (params.actor.role === 'parent') {
    throw new Error('Parent accounts cannot edit College Profile.');
  }

  const isPrincipalActor = params.actor.role === 'principal';
  if (!isPrincipalActor && !params.existingProfile) {
    throw new Error('Only the Principal can initialize the official College Profile record.');
  }

  await authorizeActionOnServer({
    role: params.actor.role,
    status: params.actor.status,
    modules: isPrincipalActor ? createFullPrincipalModules() : params.permissions,
    moduleKey: 'collegeProfile',
    action: 'edit',
  });

  const safeReason = clampString(params.reason, BLUEPRINT_LIMITS.REVISION_REASON_MAX);
  if (safeReason.length < 3) {
    throw new Error('A brief revision reason is required before saving changes.');
  }

  const sanitized = sanitizeEditableInput(
    params.input,
    params.existingProfile,
    isPrincipalActor
  );

  const prevComparable = params.existingProfile
    ? profileToEditableInput(params.existingProfile)
    : createBlankCollegeProfileInput();

  const changedFields: string[] = [];
  const previousSnapshot: Record<string, string | number | boolean | null> = {};
  const newSnapshot: Record<string, string | number | boolean | null> = {};

  if (!params.existingProfile) {
    for (const key of PROFILE_TRACKED_KEYS) {
      const val = sanitized[key];
      if (val !== '' || key === 'nameEn' || key === 'nameTa' || key === 'nameAr' || key === 'establishedYear') {
        changedFields.push(key);
        previousSnapshot[key] = null;
        newSnapshot[key] = val;
      }
    }
  } else {
    for (const key of PROFILE_TRACKED_KEYS) {
      if (prevComparable[key] !== sanitized[key]) {
        changedFields.push(key);
        previousSnapshot[key] = prevComparable[key];
        newSnapshot[key] = sanitized[key];
      }
    }
  }

  if (changedFields.length === 0) {
    throw new Error('No changes detected to save.');
  }

  const nextVersion = params.existingProfile ? params.existingProfile.version + 1 : 1;
  const revRef = doc(collection(db, 'collegeProfileRevisions'));
  const logRef = doc(collection(db, 'auditLogs'));
  const officialRef = doc(db, 'collegeProfile', 'official');
  const publicRef = doc(db, 'collegeProfile', 'publicIdentity');

  const safeActorName = clampString(
    params.actor.fullName || params.actor.email,
    BLUEPRINT_LIMITS.FULL_NAME_MAX
  );
  const safeActorEmail = clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX);
  const effectiveLogoUrl =
    params.currentLogoUrl && params.currentLogoUrl.length <= BLUEPRINT_LIMITS.ASSET_DATA_URL_MAX
      ? params.currentLogoUrl
      : ORIGINAL_COLLEGE_LOGO_URL;

  const batch = writeBatch(db);

  if (!params.existingProfile) {
    batch.set(officialRef, {
      ...sanitized,
      version: nextVersion,
      lastRevisionId: revRef.id,
      createdBy: user.uid,
      updatedBy: user.uid,
      updatedByEmail: safeActorEmail,
      updatedByName: safeActorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(officialRef, {
      ...sanitized,
      version: nextVersion,
      lastRevisionId: revRef.id,
      updatedBy: user.uid,
      updatedByEmail: safeActorEmail,
      updatedByName: safeActorName,
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(publicRef, {
    nameEn: sanitized.nameEn,
    nameTa: sanitized.nameTa,
    nameAr: sanitized.nameAr,
    shortName: sanitized.shortName || OFFICIAL_COLLEGE_DEFAULTS.shortName,
    establishedYear: sanitized.establishedYear,
    logoUrl: effectiveLogoUrl,
    updatedAt: serverTimestamp(),
  });

  batch.set(revRef, {
    revisionId: revRef.id,
    targetType: 'profile' satisfies CollegeRevisionTargetType,
    version: nextVersion,
    reason: safeReason,
    changedFields: changedFields.slice(0, 40),
    previousSnapshot,
    newSnapshot,
    actorUid: user.uid,
    actorEmail: safeActorEmail,
    actorName: safeActorName,
    actorRole: params.actor.role as 'principal' | 'officer' | 'teacher',
    createdAt: serverTimestamp(),
  });

  batch.set(logRef, {
    actorUid: user.uid,
    actorEmail: safeActorEmail,
    actorRole: params.actor.role,
    action: 'college_profile_updated' satisfies AuditAction,
    targetUid: user.uid,
    targetResource: `collegeProfile/official#v${nextVersion}`,
    summary: clampString(
      `Updated College Profile v${nextVersion} (${changedFields.slice(0, 6).join(', ')}${
        changedFields.length > 6 ? ', ...' : ''
      }): ${safeReason}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'collegeProfile/official');
  }

  return { version: nextVersion, changedFields };
}

export interface PreparedAssetPayload {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

const ALLOWED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode selected image file.'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Unable to read image file.'));
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates PNG/JPEG/WEBP files (never SVG).
 * Preserves exact original bytes if within Firestore asset threshold, or scales proportionally
 * without cropping, recoloring, or distorting aspect ratio.
 */
export async function prepareImageAssetUpload(file: File): Promise<PreparedAssetPayload> {
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    throw new Error('Only PNG, JPEG, or WEBP image files are permitted.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(rawDataUrl);
  const naturalWidth = img.naturalWidth || 0;
  const naturalHeight = img.naturalHeight || 0;

  if (naturalWidth < 16 || naturalHeight < 16) {
    throw new Error('Image dimensions are too small (minimum 16x16 px).');
  }

  // Keep exact original file bytes if already fits cleanly in Firestore doc cap
  if (rawDataUrl.length <= 420000) {
    return {
      dataUrl: rawDataUrl,
      fileName: clampString(file.name, 160),
      mimeType: file.type,
      width: naturalWidth,
      height: naturalHeight,
      sizeBytes: rawDataUrl.length,
    };
  }

  // Proportionally scale down only if oversized while maintaining exact aspect ratio
  const outputMime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  let scale = Math.min(1, 900 / Math.max(naturalWidth, naturalHeight));
  let finalDataUrl = rawDataUrl;
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  for (let attempt = 0; attempt < 5; attempt++) {
    targetWidth = Math.max(32, Math.round(naturalWidth * scale));
    targetHeight = Math.max(32, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas image processing is unavailable.');
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    finalDataUrl =
      outputMime === 'image/jpeg'
        ? canvas.toDataURL('image/jpeg', 0.88)
        : canvas.toDataURL('image/png');
    if (finalDataUrl.length <= 420000) {
      break;
    }
    scale *= 0.75;
  }

  if (finalDataUrl.length > BLUEPRINT_LIMITS.ASSET_DATA_URL_MAX) {
    throw new Error('Image file is too large even after proportional optimization. Please choose a smaller file.');
  }

  return {
    dataUrl: finalDataUrl,
    fileName: clampString(file.name, 160),
    mimeType: outputMime,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: finalDataUrl.length,
  };
}

export async function saveCollegeAssetAsPrincipal(params: {
  principal: UserAccount;
  assetType: CollegeAssetType;
  existingAsset: CollegeAsset | null;
  payload: PreparedAssetPayload;
  reason: string;
  publicIdentity: PublicCollegeIdentity;
}): Promise<{ version: number }> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) {
    throw new Error('Verified authentication session is required.');
  }
  if (params.principal.role !== 'principal') {
    throw new Error('Only the Principal may update official institutional assets.');
  }

  await authorizeActionOnServer({
    role: params.principal.role,
    status: params.principal.status,
    modules: createFullPrincipalModules(),
    moduleKey: 'collegeProfile',
    action: 'edit',
  });

  const safeReason = clampString(params.reason, BLUEPRINT_LIMITS.REVISION_REASON_MAX);
  if (safeReason.length < 3) {
    throw new Error('A brief revision reason is required before saving asset changes.');
  }

  if (params.payload.dataUrl.length > BLUEPRINT_LIMITS.ASSET_DATA_URL_MAX) {
    throw new Error('Asset payload exceeds maximum allowed size.');
  }

  const nextVersion = params.existingAsset ? params.existingAsset.version + 1 : 1;
  const revRef = doc(collection(db, 'collegeProfileRevisions'));
  const logRef = doc(collection(db, 'auditLogs'));
  const assetRef = doc(db, 'collegeAssets', params.assetType);
  const safeActorEmail = clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX);
  const safeActorName = clampString(
    params.principal.fullName || params.principal.email,
    BLUEPRINT_LIMITS.FULL_NAME_MAX
  );

  const assetDocData = {
    assetType: params.assetType,
    dataUrl: params.payload.dataUrl,
    fileName: clampString(params.payload.fileName, 160),
    mimeType: clampString(params.payload.mimeType, 64),
    width: Math.max(0, Math.min(10000, Math.trunc(params.payload.width))),
    height: Math.max(0, Math.min(10000, Math.trunc(params.payload.height))),
    sizeBytes: Math.max(0, Math.min(450000, Math.trunc(params.payload.sizeBytes))),
    version: nextVersion,
    lastRevisionId: revRef.id,
    updatedBy: user.uid,
    updatedByEmail: safeActorEmail,
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  if (!params.existingAsset) {
    batch.set(assetRef, assetDocData);
  } else {
    batch.update(assetRef, assetDocData);
  }

  if (params.assetType === 'logo') {
    batch.set(doc(db, 'collegeProfile', 'publicIdentity'), {
      nameEn: params.publicIdentity.nameEn || OFFICIAL_COLLEGE_DEFAULTS.nameEn,
      nameTa: params.publicIdentity.nameTa || OFFICIAL_COLLEGE_DEFAULTS.nameTa,
      nameAr: params.publicIdentity.nameAr || OFFICIAL_COLLEGE_DEFAULTS.nameAr,
      shortName: params.publicIdentity.shortName || OFFICIAL_COLLEGE_DEFAULTS.shortName,
      establishedYear:
        params.publicIdentity.establishedYear || OFFICIAL_COLLEGE_DEFAULTS.establishedYear,
      logoUrl: params.payload.dataUrl || ORIGINAL_COLLEGE_LOGO_URL,
      updatedAt: serverTimestamp(),
    });
  }

  const targetTypeMap: Record<CollegeAssetType, CollegeRevisionTargetType> = {
    logo: 'asset_logo',
    seal: 'asset_seal',
    signature: 'asset_signature',
  };

  batch.set(revRef, {
    revisionId: revRef.id,
    targetType: targetTypeMap[params.assetType],
    version: nextVersion,
    reason: safeReason,
    changedFields: [params.assetType],
    previousSnapshot: params.existingAsset
      ? {
          fileName: params.existingAsset.fileName,
          mimeType: params.existingAsset.mimeType,
          width: params.existingAsset.width,
          height: params.existingAsset.height,
          sizeBytes: params.existingAsset.sizeBytes,
          hasAsset: Boolean(params.existingAsset.dataUrl),
        }
      : {
          fileName: params.assetType === 'logo' ? '1781688019967_907a1671.png' : '',
          mimeType: params.assetType === 'logo' ? 'image/png' : '',
          width: params.assetType === 'logo' ? 1083 : 0,
          height: params.assetType === 'logo' ? 976 : 0,
          sizeBytes: 0,
          hasAsset: params.assetType === 'logo',
        },
    newSnapshot: {
      fileName: assetDocData.fileName,
      mimeType: assetDocData.mimeType,
      width: assetDocData.width,
      height: assetDocData.height,
      sizeBytes: assetDocData.sizeBytes,
      hasAsset: Boolean(assetDocData.dataUrl),
    },
    actorUid: user.uid,
    actorEmail: safeActorEmail,
    actorName: safeActorName,
    actorRole: 'principal',
    createdAt: serverTimestamp(),
  });

  batch.set(logRef, {
    actorUid: user.uid,
    actorEmail: safeActorEmail,
    actorRole: 'principal',
    action: 'college_asset_updated' satisfies AuditAction,
    targetUid: user.uid,
    targetResource: `collegeAssets/${params.assetType}#v${nextVersion}`,
    summary: clampString(
      `Updated official college ${params.assetType} asset v${nextVersion}: ${safeReason}`,
      BLUEPRINT_LIMITS.SUMMARY_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `collegeAssets/${params.assetType}`);
  }

  return { version: nextVersion };
}

/**
 * Builds a self-contained official college identity snapshot for future PDF reports,
 * official letters, and certificates.
 */
export function createOfficialDocumentIdentitySnapshot(params: {
  profile: CollegeProfile | null;
  publicIdentity: PublicCollegeIdentity;
  logoAsset: CollegeAsset | null;
  sealAsset: CollegeAsset | null;
  signatureAsset: CollegeAsset | null;
}): CollegeIdentitySnapshot {
  const { profile, publicIdentity, logoAsset, sealAsset, signatureAsset } = params;
  return {
    capturedAtIso: new Date().toISOString(),
    profileVersion: profile?.version ?? 0,
    nameEn: profile?.nameEn || publicIdentity.nameEn || OFFICIAL_COLLEGE_DEFAULTS.nameEn,
    nameTa: profile?.nameTa || publicIdentity.nameTa || OFFICIAL_COLLEGE_DEFAULTS.nameTa,
    nameAr: profile?.nameAr || publicIdentity.nameAr || OFFICIAL_COLLEGE_DEFAULTS.nameAr,
    shortName:
      profile?.shortName || publicIdentity.shortName || OFFICIAL_COLLEGE_DEFAULTS.shortName,
    establishedYear:
      profile?.establishedYear ||
      publicIdentity.establishedYear ||
      OFFICIAL_COLLEGE_DEFAULTS.establishedYear,
    addressEn: profile?.addressEn ?? '',
    addressTa: profile?.addressTa ?? '',
    addressAr: profile?.addressAr ?? '',
    city: profile?.city ?? '',
    district: profile?.district ?? '',
    province: profile?.province ?? '',
    country: profile?.country ?? '',
    postalCode: profile?.postalCode ?? '',
    telephone: profile?.telephone ?? '',
    alternateTelephone: profile?.alternateTelephone ?? '',
    email: profile?.email ?? '',
    website: profile?.website ?? '',
    registrationNumber: profile?.registrationNumber ?? '',
    logoUrl:
      logoAsset?.dataUrl || publicIdentity.logoUrl || OFFICIAL_COLLEGE_DEFAULTS.logoUrl,
    sealUrl: sealAsset?.dataUrl ?? '',
    signatureUrl: signatureAsset?.dataUrl ?? '',
  };
}
