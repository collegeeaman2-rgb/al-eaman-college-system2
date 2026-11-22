import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { LANGUAGE_LABELS } from '../i18n/translations';
import type { LanguageCode } from '../types/governance';

interface LanguageSelectorProps {
  onSelect?: (lang: LanguageCode) => void;
  compact?: boolean;
  variant?: 'light' | 'navy';
}

const LANGS: LanguageCode[] = ['en', 'ta', 'ar'];

export function LanguageSelector({
  onSelect,
  compact = false,
  variant = 'light',
}: LanguageSelectorProps) {
  const { lang, setLanguage, t } = useI18n();
  const isNavy = variant === 'navy';

  const handleChange = (code: LanguageCode) => {
    setLanguage(code);
    onSelect?.(code);
  };

  return (
    <div
      role="group"
      aria-label={t.languageLabel}
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-xl shrink-0 border ${
        isNavy
          ? 'bg-[#102F5B] border-white/20'
          : 'bg-[#EAF2FB] border-[#D7E5F5]'
      }`}
    >
      <Globe
        className={`w-3.5 h-3.5 ms-2 me-1 hidden sm:block shrink-0 ${
          isNavy ? 'text-[#D7E5F5]' : 'text-[#153E75]'
        }`}
      />
      {LANGS.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => handleChange(code)}
            aria-pressed={active}
            className={`min-h-[36px] md:min-h-[32px] px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2878D0] ${
              isNavy
                ? active
                  ? 'bg-[#2878D0] text-white shadow-xs'
                  : 'text-[#D7E5F5] hover:text-white'
                : active
                ? 'bg-white text-[#153E75] shadow-xs border border-[#D7E5F5]'
                : 'text-[#4B6484] hover:text-[#172B45]'
            } ${compact ? '!px-2 text-[11px] sm:text-xs' : ''}`}
          >
            {code === 'en' ? 'EN' : LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
