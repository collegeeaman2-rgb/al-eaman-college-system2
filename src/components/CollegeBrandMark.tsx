import { useI18n } from '../i18n/I18nContext';
import { useCollegeProfile } from '../context/CollegeProfileContext';

interface CollegeBrandMarkProps {
  compact?: boolean;
  showSubtitles?: boolean;
  variant?: 'light' | 'navy';
  showEstablished?: boolean;
}

/**
 * Institutional brand mark displaying the preserved original official Al EAMAN crest
 * from the central CollegeProfileContext alongside trilingual institutional titles.
 */
export function CollegeBrandMark({
  compact = false,
  showSubtitles = false,
  variant = 'light',
  showEstablished = false,
}: CollegeBrandMarkProps) {
  const { t, lang } = useI18n();
  const { publicIdentity, effectiveLogoUrl } = useCollegeProfile();
  const isNavy = variant === 'navy';

  const primaryName =
    lang === 'ta'
      ? publicIdentity.nameTa
      : lang === 'ar'
      ? publicIdentity.nameAr
      : publicIdentity.nameEn;

  return (
    <div className={`flex ${showSubtitles ? 'items-start' : 'items-center'} gap-3 min-w-0`}>
      <div
        data-logo-slot="college-crest"
        title={t.logoSlotLabel}
        className={`relative shrink-0 flex items-center justify-center select-none overflow-hidden bg-white ${
          compact
            ? 'w-11 h-11 rounded-xl p-1'
            : showSubtitles
            ? 'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl p-1.5'
            : 'w-14 h-14 rounded-2xl p-1'
        } ${
          isNavy
            ? 'border-2 border-[#D6B45C] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)]'
            : 'border border-[#D6B66B]/85 shadow-[0_6px_18px_-6px_rgba(21,62,117,0.28)]'
        }`}
      >
        <img
          src={effectiveLogoUrl}
          alt={t.logoSlotLabel}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`font-display font-bold leading-snug ${
            compact
              ? 'text-sm md:text-base truncate'
              : 'text-[15px] sm:text-lg md:text-xl break-words'
          } ${isNavy ? 'text-white' : 'text-[#172B45]'}`}
        >
          {primaryName}
        </div>
        {showSubtitles && (
          <div
            className={`mt-1 space-y-0.5 text-[11px] sm:text-xs leading-snug ${
              isNavy ? 'text-[#D7E5F5]' : 'text-[#4B6484]'
            }`}
          >
            {lang !== 'ta' && <div className="break-words">{publicIdentity.nameTa}</div>}
            {lang !== 'ar' && (
              <div className="break-words">
                <span dir="rtl" className="inline-block">
                  {publicIdentity.nameAr}
                </span>
              </div>
            )}
            {lang !== 'en' && <div className="break-words">{publicIdentity.nameEn}</div>}
          </div>
        )}
        {showEstablished && (
          <div
            className={`mt-1.5 inline-flex items-center text-[11px] font-semibold tracking-wide ${
              isNavy ? 'text-[#D6B45C]' : 'text-[#2878D0]'
            }`}
          >
            {t.establishedLabel.replace('{year}', String(publicIdentity.establishedYear))}
          </div>
        )}
      </div>
    </div>
  );
}
