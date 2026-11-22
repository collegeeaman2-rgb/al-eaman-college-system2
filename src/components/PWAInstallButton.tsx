import { useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useI18n } from '../i18n/I18nContext';

interface PWAInstallButtonProps {
  variant?: 'light' | 'navy' | 'card';
  compact?: boolean;
}

export function PWAInstallButton({ variant = 'light', compact = false }: PWAInstallButtonProps) {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress install prompt when already running in standalone installed mode
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="p-3.5 rounded-xl bg-[#EAF2FB] border border-[#BFD6F2] text-xs text-[#153E75] flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#2878D0] shrink-0" />
          <span className="font-medium">{t.pwa.installedBadge}</span>
        </div>
      );
    }
    return null;
  }

  const handleTrigger = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  const renderButton = () => {
    if (variant === 'card') {
      return (
        <div className="bg-white border border-[#D7E5F5] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-[0_6px_20px_-10px_rgba(21,62,117,0.08)]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2FB] border border-[#D7E5F5] text-[#2878D0] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#172B45]">{t.pwa.installOnPhone}</div>
              <p className="text-xs text-[#4B6484] mt-0.5 leading-relaxed">{t.pwa.installSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTrigger}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2878D0] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1E63B3] transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{t.pwa.installApp}</span>
          </button>
        </div>
      );
    }

    if (variant === 'navy') {
      return (
        <button
          type="button"
          onClick={handleTrigger}
          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#D6B66B] shrink-0" />
          <span>{compact ? t.pwa.installShort : t.pwa.installApp}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleTrigger}
        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2878D0] hover:bg-[#1E63B3] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{compact ? t.pwa.installShort : t.pwa.installApp}</span>
      </button>
    );
  };

  return (
    <>
      {renderButton()}

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-[#153E75]/50 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl border border-[#D7E5F5] p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4 shadow-xl">
            <div className="w-10 h-1.5 bg-[#D7E5F5] rounded-full mx-auto md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#153E75] text-white flex items-center justify-center shrink-0">
                  {isIOS ? (
                    <Share className="w-4 h-4 text-[#D6B66B]" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-[#D6B66B]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[#172B45] truncate">
                    {t.pwa.guideTitle}
                  </h3>
                  <p className="text-xs text-[#4B6484]">{t.collegeName}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label={t.labels.close}
                onClick={() => setShowGuide(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#4B6484] hover:bg-[#F4F8FD] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  !isIOS
                    ? 'bg-[#EAF2FB] border-[#2878D0]/40'
                    : 'bg-[#F4F8FD] border-[#D7E5F5]'
                }`}
              >
                <div className="text-xs font-semibold text-[#153E75]">{t.pwa.androidGuideTitle}</div>
                <p className="text-xs text-[#172B45] leading-relaxed">{t.pwa.androidStep1}</p>
                <p className="text-xs text-[#172B45] leading-relaxed">{t.pwa.androidStep2}</p>
              </div>

              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isIOS
                    ? 'bg-[#EAF2FB] border-[#2878D0]/40'
                    : 'bg-[#F4F8FD] border-[#D7E5F5]'
                }`}
              >
                <div className="text-xs font-semibold text-[#153E75]">{t.pwa.iosGuideTitle}</div>
                <p className="text-xs text-[#172B45] leading-relaxed">{t.pwa.iosStep1}</p>
                <p className="text-xs text-[#172B45] leading-relaxed">{t.pwa.iosStep2}</p>
                <p className="text-xs text-[#172B45] leading-relaxed">{t.pwa.iosStep3}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#153E75] text-white text-sm font-medium hover:bg-[#102F5B] transition-colors"
            >
              {t.labels.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
