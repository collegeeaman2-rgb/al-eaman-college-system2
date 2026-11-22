import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { ChevronRight, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useI18n } from '../i18n/I18nContext';
import type { UserAccount } from '../types/governance';
import { PWAInstallButton } from './PWAInstallButton';

export interface MobileNavItem {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  icon: React.ReactNode;
  badge?: number;
  isReserved?: boolean;
  onSelect: () => void;
}

interface MobileBottomNavProps {
  userAccount: UserAccount;
  activeId: string;
  primaryItems: MobileNavItem[];
  menuModules: MobileNavItem[];
  menuQuickActions?: MobileNavItem[];
  onOpenProfile?: () => void;
}

export function MobileBottomNav({
  userAccount,
  activeId,
  primaryItems,
  menuModules,
  menuQuickActions = [],
  onOpenProfile,
}: MobileBottomNavProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Up to 4 primary items + 5th Menu position
  const visiblePrimary = primaryItems.slice(0, 4);
  const isMenuModuleActive = menuModules.some((m) => m.id === activeId);
  const menuBadgeCount = menuModules.reduce((acc, m) => acc + (m.badge ?? 0), 0);

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden shrink-0 z-40 bg-[#101629] border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-8px_rgba(16,22,41,0.55)]"
      >
        <div className="grid grid-cols-5 gap-1 px-1.5 py-1.5 min-h-[62px]">
          {visiblePrimary.map((item) => {
            const active = activeId === item.id && !menuOpen;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  item.onSelect();
                }}
                className={`relative min-w-0 flex flex-col items-center justify-center min-h-[50px] px-1 py-1 rounded-xl transition-colors ${
                  active
                    ? 'bg-[#0F3D3E] text-[#5EEAD4] border border-[#5EEAD4]/25 shadow-xs'
                    : 'text-[#8D9DB8] hover:text-[#CBD5E1] border border-transparent'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {item.icon}
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -end-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold tabular-nums flex items-center justify-center ring-2 ring-[#101629] ${
                        active
                          ? 'bg-[#5EEAD4] text-[#0B2045]'
                          : 'bg-[#D6B45C] text-[#0B2045]'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[10px] leading-tight font-medium truncate max-w-full px-0.5">
                  {item.shortLabel || item.label}
                </span>
              </button>
            );
          })}

          {/* Keep 5-column alignment even if fewer than 4 primary items are supplied */}
          {Array.from({ length: Math.max(0, 4 - visiblePrimary.length) }).map((_, idx) => (
            <div key={`spacer-${idx}`} aria-hidden="true" />
          ))}

          {/* Position 5: Gold Menu Button */}
          <button
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`relative min-w-0 flex flex-col items-center justify-center min-h-[50px] px-1 py-1 rounded-xl transition-colors ${
              menuOpen || isMenuModuleActive
                ? 'bg-[#D6B45C]/18 text-[#F3D786] border border-[#D6B45C]/45'
                : 'text-[#D6B45C] hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Menu className="w-5 h-5 shrink-0" />
              {menuBadgeCount > 0 && (
                <span className="absolute -top-1.5 -end-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D6B45C] text-[#0B2045] text-[9px] font-mono font-bold tabular-nums flex items-center justify-center ring-2 ring-[#101629]">
                  {menuBadgeCount > 99 ? '99+' : menuBadgeCount}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px] leading-tight font-semibold truncate max-w-full px-0.5">
              {t.mobileShell.menu}
            </span>
          </button>
        </div>
      </nav>

      {/* Authorized Modules & Quick Controls Sheet */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-[#0B2045]/55 backdrop-blur-[1px] flex items-end justify-center"
          onClick={() => setMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[82dvh] flex flex-col bg-white rounded-t-3xl border-t border-[#D7E5F5] shadow-[0_-18px_45px_-12px_rgba(11,32,69,0.5)] overflow-hidden pb-[env(safe-area-inset-bottom)]"
          >
            {/* Navy Sheet Header */}
            <div className="shrink-0 bg-[#0B2045] text-white px-5 pt-3 pb-4 space-y-2.5">
              <div className="w-10 h-1 rounded-full bg-white/25 mx-auto" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#D6B45C] uppercase tracking-wider">
                    {t.roles[userAccount.role]}
                  </div>
                  <h3 className="text-base font-display font-bold text-white truncate">
                    {t.mobileShell.remainingModules}
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label={t.labels.close}
                  onClick={() => setMenuOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Authorized Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#F4F8FD]">
              <div className="space-y-2">
                {menuModules.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-[#D7E5F5] text-xs text-[#4B6484] text-center">
                    {t.mobileShell.noExtraModules}
                  </div>
                ) : (
                  menuModules.map((mod) => {
                    const active = activeId === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          mod.onSelect();
                        }}
                        className={`w-full text-start p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                          active
                            ? 'bg-[#0F3D3E] border-[#5EEAD4]/40 text-white shadow-xs'
                            : 'bg-white border-[#D7E5F5] text-[#172B45] hover:border-[#2878D0]'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              active
                                ? 'bg-white/15 text-[#5EEAD4]'
                                : 'bg-[#EAF2FB] text-[#0B2045]'
                            }`}
                          >
                            {mod.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold truncate">{mod.label}</span>
                              {typeof mod.badge === 'number' && mod.badge > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#D6B45C] text-[#0B2045] text-[10px] font-mono font-bold tabular-nums shrink-0">
                                  {mod.badge}
                                </span>
                              )}
                            </div>
                            {mod.description && (
                              <p
                                className={`text-xs mt-0.5 leading-snug ${
                                  active ? 'text-[#CCFBF1]' : 'text-[#4B6484]'
                                }`}
                              >
                                {mod.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 rtl:rotate-180 ${
                            active ? 'text-[#5EEAD4]' : 'text-[#667D9B]'
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>

              {menuQuickActions.length > 0 && (
                <div className="space-y-2">
                  <div className="px-1 text-[11px] font-semibold text-[#153E75]">
                    {t.mobileShell.quickControls}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {menuQuickActions.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          act.onSelect();
                        }}
                        className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-white border border-[#D7E5F5] hover:border-[#2878D0] text-start flex items-center justify-between gap-2.5 text-xs font-semibold text-[#0B2045]"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-[#EAF2FB] text-[#2878D0] flex items-center justify-center shrink-0">
                            {act.icon}
                          </span>
                          <span className="truncate">{act.label}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#667D9B] shrink-0 rtl:rotate-180" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <PWAInstallButton variant="card" />

              <div className="flex items-center gap-2 pt-1">
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#D7E5F5] bg-white text-xs font-semibold text-[#0B2045] inline-flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#2878D0]" />
                    <span className="truncate">{t.roleExperience.tabProfile}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut(auth);
                  }}
                  className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#0B2045] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4 text-[#D6B45C]" />
                  <span>{t.signOut}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
