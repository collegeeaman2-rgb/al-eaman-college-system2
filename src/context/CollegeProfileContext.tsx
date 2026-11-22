import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { createOfficialDocumentIdentitySnapshot } from '../lib/collegeProfileService';
import {
  OFFICIAL_COLLEGE_DEFAULTS,
  type CollegeAsset,
  type CollegeIdentitySnapshot,
  type CollegeProfile,
  type CollegeProfileRevision,
  type PublicCollegeIdentity,
  type UserRole,
} from '../types/governance';

interface CollegeProfileContextValue {
  publicIdentity: PublicCollegeIdentity;
  collegeProfile: CollegeProfile | null;
  logoAsset: CollegeAsset | null;
  sealAsset: CollegeAsset | null;
  signatureAsset: CollegeAsset | null;
  revisions: CollegeProfileRevision[];
  effectiveLogoUrl: string;
  loading: boolean;
  buildDocumentIdentitySnapshot: () => CollegeIdentitySnapshot;
}

const DEFAULT_PUBLIC_IDENTITY: PublicCollegeIdentity = {
  nameEn: OFFICIAL_COLLEGE_DEFAULTS.nameEn,
  nameTa: OFFICIAL_COLLEGE_DEFAULTS.nameTa,
  nameAr: OFFICIAL_COLLEGE_DEFAULTS.nameAr,
  shortName: OFFICIAL_COLLEGE_DEFAULTS.shortName,
  establishedYear: OFFICIAL_COLLEGE_DEFAULTS.establishedYear,
  logoUrl: OFFICIAL_COLLEGE_DEFAULTS.logoUrl,
  updatedAt: null,
};

const CollegeProfileContext = createContext<CollegeProfileContextValue | null>(null);

interface CollegeProfileProviderProps {
  children: React.ReactNode;
  isActiveUser: boolean;
  userRole: UserRole | null;
}

export function CollegeProfileProvider({
  children,
  isActiveUser,
  userRole,
}: CollegeProfileProviderProps) {
  const [publicIdentity, setPublicIdentity] = useState<PublicCollegeIdentity>(DEFAULT_PUBLIC_IDENTITY);
  const [collegeProfile, setCollegeProfile] = useState<CollegeProfile | null>(null);
  const [logoAsset, setLogoAsset] = useState<CollegeAsset | null>(null);
  const [sealAsset, setSealAsset] = useState<CollegeAsset | null>(null);
  const [signatureAsset, setSignatureAsset] = useState<CollegeAsset | null>(null);
  const [revisions, setRevisions] = useState<CollegeProfileRevision[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaffOrPrincipal =
    isActiveUser && (userRole === 'principal' || userRole === 'officer' || userRole === 'teacher');

  // 1. Public institutional identity (safe unauthenticated read for Login screen & headers)
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'collegeProfile', 'publicIdentity'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PublicCollegeIdentity;
          setPublicIdentity({
            nameEn: data.nameEn || OFFICIAL_COLLEGE_DEFAULTS.nameEn,
            nameTa: data.nameTa || OFFICIAL_COLLEGE_DEFAULTS.nameTa,
            nameAr: data.nameAr || OFFICIAL_COLLEGE_DEFAULTS.nameAr,
            shortName: data.shortName || OFFICIAL_COLLEGE_DEFAULTS.shortName,
            establishedYear:
              typeof data.establishedYear === 'number' && Number.isFinite(data.establishedYear)
                ? data.establishedYear
                : OFFICIAL_COLLEGE_DEFAULTS.establishedYear,
            logoUrl: data.logoUrl || OFFICIAL_COLLEGE_DEFAULTS.logoUrl,
            updatedAt: data.updatedAt ?? null,
          });
        } else {
          setPublicIdentity(DEFAULT_PUBLIC_IDENTITY);
        }
        setLoading(false);
      },
      () => {
        setPublicIdentity(DEFAULT_PUBLIC_IDENTITY);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // 2. Full official profile + official logo (readable by any active college user)
  useEffect(() => {
    if (!isActiveUser) {
      setCollegeProfile(null);
      setLogoAsset(null);
      return;
    }

    const unsubProfile = onSnapshot(
      doc(db, 'collegeProfile', 'official'),
      (snap) => {
        setCollegeProfile(snap.exists() ? (snap.data() as CollegeProfile) : null);
      },
      (err) => {
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.GET, 'collegeProfile/official');
        }
      }
    );

    const unsubLogo = onSnapshot(
      doc(db, 'collegeAssets', 'logo'),
      (snap) => {
        setLogoAsset(snap.exists() ? (snap.data() as CollegeAsset) : null);
      },
      (err) => {
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.GET, 'collegeAssets/logo');
        }
      }
    );

    return () => {
      unsubProfile();
      unsubLogo();
    };
  }, [isActiveUser]);

  // 3. Official seal, authorized signature, and revision history (Principal & active Staff only)
  useEffect(() => {
    if (!isStaffOrPrincipal) {
      setSealAsset(null);
      setSignatureAsset(null);
      setRevisions([]);
      return;
    }

    const unsubSeal = onSnapshot(
      doc(db, 'collegeAssets', 'seal'),
      (snap) => {
        setSealAsset(snap.exists() ? (snap.data() as CollegeAsset) : null);
      },
      (err) => {
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.GET, 'collegeAssets/seal');
        }
      }
    );

    const unsubSignature = onSnapshot(
      doc(db, 'collegeAssets', 'signature'),
      (snap) => {
        setSignatureAsset(snap.exists() ? (snap.data() as CollegeAsset) : null);
      },
      (err) => {
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.GET, 'collegeAssets/signature');
        }
      }
    );

    const unsubRevisions = onSnapshot(
      query(collection(db, 'collegeProfileRevisions'), orderBy('createdAt', 'desc')),
      (snap) => {
        setRevisions(snap.docs.map((d) => d.data() as CollegeProfileRevision));
      },
      (err) => {
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.LIST, 'collegeProfileRevisions');
        }
      }
    );

    return () => {
      unsubSeal();
      unsubSignature();
      unsubRevisions();
    };
  }, [isStaffOrPrincipal]);

  const effectiveLogoUrl = useMemo(
    () => logoAsset?.dataUrl || publicIdentity.logoUrl || OFFICIAL_COLLEGE_DEFAULTS.logoUrl,
    [logoAsset, publicIdentity.logoUrl]
  );

  const value = useMemo<CollegeProfileContextValue>(
    () => ({
      publicIdentity,
      collegeProfile,
      logoAsset,
      sealAsset,
      signatureAsset,
      revisions,
      effectiveLogoUrl,
      loading,
      buildDocumentIdentitySnapshot: () =>
        createOfficialDocumentIdentitySnapshot({
          profile: collegeProfile,
          publicIdentity,
          logoAsset,
          sealAsset,
          signatureAsset,
        }),
    }),
    [
      publicIdentity,
      collegeProfile,
      logoAsset,
      sealAsset,
      signatureAsset,
      revisions,
      effectiveLogoUrl,
      loading,
    ]
  );

  return (
    <CollegeProfileContext.Provider value={value}>{children}</CollegeProfileContext.Provider>
  );
}

export function useCollegeProfile(): CollegeProfileContextValue {
  const ctx = useContext(CollegeProfileContext);
  if (!ctx) {
    throw new Error('useCollegeProfile must be used within CollegeProfileProvider');
  }
  return ctx;
}
