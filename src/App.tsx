import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { fetchPublicSystemStatus } from './lib/firestoreService';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { CollegeProfileProvider } from './context/CollegeProfileContext';
import type { PermissionProfile, UserAccount } from './types/governance';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthPortal } from './components/AuthPortal';
import { PrincipalWorkspace } from './components/PrincipalWorkspace';
import { StaffAndParentWorkspace } from './components/StaffAndParentWorkspace';
import { OfflineIndicator } from './components/OfflineIndicator';

function AppRoot() {
  const { setLanguage } = useI18n();
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [principalConfigured, setPrincipalConfigured] = useState<boolean | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [userDocLoaded, setUserDocLoaded] = useState(false);
  const [permissionProfile, setPermissionProfile] = useState<PermissionProfile | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshSystemStatus = useCallback(async () => {
    const status = await fetchPublicSystemStatus();
    setPrincipalConfigured(Boolean(status?.principalConfigured));
  }, []);

  useEffect(() => {
    testConnection();
    refreshSystemStatus().catch(() => setPrincipalConfigured(false));
  }, [refreshSystemStatus]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setUserAccount(null);
        setPermissionProfile(null);
        setUserDocLoaded(true);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to authenticated user's profile & permission profile
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) {
      setUserAccount(null);
      setPermissionProfile(null);
      setUserDocLoaded(true);
      return;
    }

    setUserDocLoaded(false);
    const userPath = `users/${firebaseUser.uid}`;
    const unsubUser = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          const account = snap.data() as UserAccount;
          setUserAccount(account);
          if (account.preferredLanguage) {
            setLanguage(account.preferredLanguage);
          }
        } else {
          setUserAccount(null);
        }
        setUserDocLoaded(true);
      },
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.GET, userPath);
      }
    );

    const permPath = `permissions/${firebaseUser.uid}`;
    const unsubPerm = onSnapshot(
      doc(db, 'permissions', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setPermissionProfile(snap.data() as PermissionProfile);
        } else {
          setPermissionProfile(null);
        }
      },
      (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.GET, permPath);
      }
    );

    return () => {
      unsubUser();
      unsubPerm();
    };
  }, [authReady, firebaseUser, refreshTick, setLanguage]);

  const handleRefreshState = async () => {
    await refreshSystemStatus();
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setFirebaseUser(auth.currentUser);
      setRefreshTick((n) => n + 1);
    }
  };

  const isActiveUser = Boolean(
    authReady &&
      firebaseUser &&
      firebaseUser.emailVerified &&
      principalConfigured &&
      userAccount &&
      userAccount.status === 'active'
  );
  const activeRole = isActiveUser ? userAccount?.role ?? null : null;

  let content: React.ReactNode;

  if (!authReady || principalConfigured === null || (firebaseUser?.emailVerified && !userDocLoaded)) {
    content = (
      <div className="min-h-screen bg-[#F4F8FD] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border border-[#D7E5F5] rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="h-4 w-40 bg-[#D7E5F5] rounded animate-pulse" />
          <div className="h-3 w-full bg-[#EAF2FB] rounded animate-pulse" />
          <div className="h-10 w-full bg-[#EAF2FB] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  } else if (!isActiveUser || !userAccount) {
    // Gate: Unauthenticated, unverified email, Principal uninitialized, no account, or non-active account
    content = (
      <AuthPortal
        firebaseUser={firebaseUser}
        userAccount={userAccount}
        principalConfigured={principalConfigured}
        onRefreshState={handleRefreshState}
      />
    );
  } else if (userAccount.role === 'principal') {
    content = <PrincipalWorkspace principal={userAccount} />;
  } else {
    content = (
      <StaffAndParentWorkspace
        userAccount={userAccount}
        permissionProfile={permissionProfile}
      />
    );
  }

  return (
    <CollegeProfileProvider isActiveUser={isActiveUser} userRole={activeRole}>
      {content}
    </CollegeProfileProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AppRoot />
        <OfflineIndicator />
      </I18nProvider>
    </ErrorBoundary>
  );
}
