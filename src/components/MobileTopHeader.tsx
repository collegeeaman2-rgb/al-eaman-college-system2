import React, { useEffect, useId, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Globe,
  LogOut,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useI18n } from '../i18n/I18nContext';
import { useCollegeProfile } from '../context/CollegeProfileContext';
import { LANGUAGE_LABELS } from '../i18n/translations';
import type { LanguageCode, UserAccount } from '../types/governance';
import { PWAInstallButton } from './PWAInstallButton';
import { StatusText } from './StatusText';

export interface MobileNotificationItem {
  id: string;
  title: string;
  description: string;
  count?: number;
  targetTab?: string;
  tone?: 'gold' | 'blue';
}

interface MobileTopHeaderProps {
  userAccount: UserAccount;
  notifications?: MobileNotificationItem[];
  onSelectLanguage?: (lang: LanguageCode) => void;
  onNavigateTab?: (tabId: string) => void;
  onOpenProfile?: () => void;
}

const LANGS: LanguageCode[] = ['en', 'ta', 'ar'];

const SHORT_LANG_LABELS: Record<LanguageCode, string> = {
  en: 'EN',
  ta: 'தமிழ்',
  ar: 'AR',
};

export function MobileTopHeader({
  userAccount,
  notifications = [],
  onSelectLanguage,
  onNavigateTab,
  onOpenProfile,
}: MobileTopHeaderProps) {
  const { t, lang, setLanguage } = useI18n();
  const { publicIdentity, effectiveLogoUrl } = useCollegeProfile();
  const patternId = useId();
  const [openMenu, setOpenMenu] = useState<'lang' | 'notif' | 'security' | null>(null);

  const storageKey = `aleaman_read_notifs_${userAccount.uid}`;
  const [readIds, setReadIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setReadIds(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setReadIds({});
    }
  }, [storageKey]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const persistReadIds = (next: Record<string, boolean>) => {
    setReadIds(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.reduce((acc, item) => {
      if (readIds[item.id]) return acc;
      return acc + (typeof item.count === 'number' && item.count > 0 ? item.count : 1);
    }, 0);
  }, [notifications, readIds]);

  const handleLanguagePick = (code: LanguageCode) => {
    setLanguage(code);
    onSelectLanguage?.(code);
    setOpenMenu(null);
  };

  const handleMarkAllRead = () => {
    const next: Record<string, boolean> = { ...readIds };
    for (const item of notifications) {
      next[item.id] = true;
    }
    persistReadIds(next);
  };

  const handleNotificationClick = (item: MobileNotificationItem) => {
    persistReadIds({ ...readIds, [item.id]: true });
    setOpenMenu(null);
    if (item.targetTab) {
      onNavigateTab?.(item.targetTab);
    }
  };

  return (
    <>
      <header className="relative shrink-0 z-40 bg-[#0B2045] text-white border-b border-[#D6B45C]/30 pt-[env(safe-area-inset-top)] overflow-hidden shadow-[0_6px_22px_-8px_rgba(11,32,69,0.65)]">
        {/* Subtle Islamic Geometric 8-Point Star Pattern */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
        >
          <defs>
            <pattern
              id={patternId}
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
              <circle cx="0" cy="0" r="3" fill="none" stroke="#D6B45C" strokeWidth="0.6" />
              <circle cx="44" cy="0" r="3" fill="none" stroke="#D6B45C" strokeWidth="0.6" />
              <circle cx="0" cy="44" r="3" fill="none" stroke="#D6B45C" strokeWidth="0.6" />
              <circle cx="44" cy="44" r="3" fill="none" stroke="#D6B45C" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>

        <div className="relative h-[60px] px-3 flex items-center justify-between gap-2 min-w-0">
          {/* Crest + AL EAMAN + Actual Logged-In Role */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              data-logo-slot="college-crest"
              title={t.logoSlotLabel}
              className="relative w-10 h-10 rounded-xl bg-white border border-[#D6B45C] p-0.5 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.45)] flex items-center justify-center shrink-0 overflow-hidden select-none"
            >
              <img
                src={effectiveLogoUrl}
                alt={t.logoSlotLabel}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-[15px] tracking-wide text-white leading-tight truncate">
                {publicIdentity.shortName || t.mobileShell.brandShort}
              </div>
              <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6B45C] shrink-0" />
                <span className="text-[11px] font-semibold text-[#D6B45C] leading-none truncate">
                  {t.roles[userAccount.role]}
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Language Selector (Globe) + Notification Bell + Gold Security Shield */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Globe Language Selector */}
            <button
              type="button"
              aria-label={t.languageLabel}
              aria-expanded={openMenu === 'lang'}
              onClick={() => setOpenMenu((m) => (m === 'lang' ? null : 'lang'))}
              className={`h-9 px-2 rounded-xl border inline-flex items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                openMenu === 'lang'
                  ? 'bg-[#17366E] border-[#D6B45C] text-white'
                  : 'bg-[#122D5C]/90 border-[#D6B45C]/40 text-[#E5EEFA] hover:bg-[#17366E]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#D6B45C] shrink-0" />
              <span className="leading-none whitespace-nowrap">{SHORT_LANG_LABELS[lang]}</span>
            </button>

            {/* Live Notification Bell */}
            <button
              type="button"
              aria-label={t.mobileShell.notifications}
              aria-expanded={openMenu === 'notif'}
              onClick={() => setOpenMenu((m) => (m === 'notif' ? null : 'notif'))}
              className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                openMenu === 'notif'
                  ? 'bg-[#17366E] border-[#D6B45C] text-white'
                  : 'bg-[#122D5C]/90 border-white/15 text-[#E5EEFA] hover:bg-[#17366E]'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#D6B45C] text-[#0B2045] text-[10px] font-mono font-bold tabular-nums flex items-center justify-center ring-2 ring-[#0B2045]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Gold Shield Account & Security Dropdown */}
            <button
              type="button"
              aria-label={t.mobileShell.accountSecurity}
              aria-expanded={openMenu === 'security'}
              onClick={() => setOpenMenu((m) => (m === 'security' ? null : 'security'))}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                openMenu === 'security'
                  ? 'bg-[#D6B45C] border-[#D6B45C] text-[#0B2045]'
                  : 'bg-[#122D5C]/90 border-[#D6B45C]/70 text-[#D6B45C] hover:bg-[#17366E]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* Dropdown Backdrop & Panels */}
      {openMenu && (
        <div
          className="fixed inset-0 z-50 bg-[#0B2045]/45 backdrop-blur-[1px]"
          onClick={() => setOpenMenu(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-[calc(64px+env(safe-area-inset-top))] inset-x-3 sm:inset-x-auto sm:end-3 sm:w-80 bg-white border border-[#D7E5F5] rounded-2xl shadow-[0_20px_48px_-12px_rgba(11,32,69,0.45)] overflow-hidden text-[#172B45]"
          >
            {/* 1. Language Picker Popover */}
            {openMenu === 'lang' && (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-[#EAF1FA]">
                  <span className="text-xs font-semibold text-[#0B2045] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#2878D0]" />
                    {t.languageLabel}
                  </span>
                  <button
                    type="button"
                    aria-label={t.labels.close}
                    onClick={() => setOpenMenu(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#667D9B] hover:bg-[#F4F8FD]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {LANGS.map((code) => {
                    const active = lang === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleLanguagePick(code)}
                        className={`w-full min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-between text-sm font-medium transition-colors ${
                          active
                            ? 'bg-[#0B2045] text-white'
                            : 'bg-[#F4F8FD] text-[#172B45] hover:bg-[#EAF2FB]'
                        }`}
                      >
                        <span>{LANGUAGE_LABELS[code]}</span>
                        {active && <Check className="w-4 h-4 text-[#D6B45C] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Notifications Popover */}
            {openMenu === 'notif' && (
              <div className="divide-y divide-[#EAF1FA]">
                <div className="px-4 py-3 bg-[#0B2045] text-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Bell className="w-4 h-4 text-[#D6B45C] shrink-0" />
                    <span className="text-sm font-semibold truncate">
                      {t.mobileShell.notifications}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#D6B45C] text-[#0B2045] text-[10px] font-mono font-bold tabular-nums">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {notifications.length > 0 && unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-[#D6B45C] inline-flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{t.mobileShell.markAllRead}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={t.labels.close}
                      onClick={() => setOpenMenu(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D7E5F5] hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 bg-[#F4F8FD]">
                  {notifications.length === 0 ? (
                    <div className="p-5 text-center rounded-xl bg-white border border-[#D7E5F5] text-xs text-[#4B6484]">
                      {t.mobileShell.noNotifications}
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const isRead = Boolean(readIds[item.id]);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full text-start p-3 rounded-xl border transition-colors flex items-start justify-between gap-2.5 ${
                            isRead
                              ? 'bg-white/75 border-[#E2ECF7] opacity-80'
                              : 'bg-white border-[#BFD6F2] shadow-xs hover:border-[#2878D0]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              {!isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#D6B45C] shrink-0" />
                              )}
                              <span className="text-xs font-semibold text-[#0B2045] truncate">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#4B6484] leading-snug">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            {typeof item.count === 'number' && item.count > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#EAF2FB] text-[#153E75] text-[11px] font-mono font-bold tabular-nums">
                                {item.count}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-[#667D9B] rtl:rotate-180" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. Account & Security Dropdown */}
            {openMenu === 'security' && (
              <div>
                <div className="px-4 py-3.5 bg-[#0B2045] text-white space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#133267] border border-[#D6B45C]/70 text-[#D6B45C] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {userAccount.fullName}
                        </div>
                        <div className="text-[11px] font-semibold text-[#D6B45C]">
                          {t.roles[userAccount.role]}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={t.labels.close}
                      onClick={() => setOpenMenu(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D7E5F5] hover:bg-white/10 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-[#D7E5F5]/90 truncate">
                    {userAccount.email}
                  </div>
                </div>

                <div className="p-3.5 space-y-3">
                  <div className="p-2.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#4B6484]">{t.labels.status}</span>
                    <StatusText status={userAccount.status} />
                  </div>

                  <p className="text-[11px] text-[#4B6484] leading-relaxed">
                    {t.mobileShell.securityEnforcedNote}
                  </p>

                  {onOpenProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenProfile();
                      }}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D7E5F5] bg-[#F4F8FD] hover:bg-[#EAF2FB] text-xs font-semibold text-[#0B2045] flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2">
                        <UserCircle2 className="w-4 h-4 text-[#2878D0]" />
                        <span>{t.roleExperience.tabProfile}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#667D9B] rtl:rotate-180" />
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <PWAInstallButton compact />
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        signOut(auth);
                      }}
                      className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-[#0B2045] hover:bg-[#153E75] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5 text-[#D6B45C]" />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
