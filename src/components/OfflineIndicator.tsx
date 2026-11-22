import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useI18n } from '../i18n/I18nContext';

export function OfflineIndicator() {
  const { t } = useI18n();
  const isOnline = useOnlineStatus();
  const [updateNeeded, setUpdateNeeded] = useState(false);
  const [updateSWFn, setUpdateSWFn] = useState<((reloadPage?: boolean) => Promise<void>) | null>(
    null
  );

  useEffect(() => {
    let intervalId: number | undefined;
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdateNeeded(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        // Periodically check for app updates so 200+ users stay current without manual APKs
        intervalId = window.setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);
      },
      onRegisterError() {
        // Non-fatal in preview or restricted WebView contexts
      },
    });
    setUpdateSWFn(() => updateSW);
    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  if (isOnline && !updateNeeded) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-5 inset-x-4 md:inset-x-auto md:end-5 z-50 flex flex-col gap-2 max-w-sm ms-auto pointer-events-none">
      {!isOnline && (
        <div
          role="status"
          className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-[#153E75] border border-[#D6B66B]/50 px-3.5 py-2.5 text-xs font-medium text-white shadow-lg"
        >
          <WifiOff className="w-4 h-4 text-[#D6B66B] shrink-0" />
          <span className="leading-snug">{t.pwa.offlineBanner}</span>
        </div>
      )}

      {updateNeeded && (
        <div
          role="status"
          className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl bg-[#2878D0] border border-white/25 px-3.5 py-2.5 text-xs font-medium text-white shadow-lg"
        >
          <span className="leading-snug">{t.pwa.updateReadyTitle}</span>
          <button
            type="button"
            onClick={() => updateSWFn?.(true)}
            className="min-h-[36px] px-3 py-1 rounded-lg bg-white text-[#153E75] font-semibold inline-flex items-center gap-1.5 shrink-0 hover:bg-[#F4F8FD]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.pwa.updateNow}</span>
          </button>
        </div>
      )}
    </div>
  );
}
