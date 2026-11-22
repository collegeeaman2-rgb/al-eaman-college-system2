import { CheckCircle2, Clock, Ban, PauseCircle, XCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { AccountStatus, ParentLinkStatus, RequestStatus } from '../types/governance';

type AnyStatus = AccountStatus | RequestStatus | ParentLinkStatus;

const VERIFIED_LABELS = {
  en: 'Verified',
  ta: 'சரிபார்க்கப்பட்டது',
  ar: 'موثّق',
} as const;

export function StatusText({ status }: { status: AnyStatus }) {
  const { t, lang } = useI18n();

  const labelMap: Record<AnyStatus, string> = {
    active: t.statuses.active,
    pending: t.statuses.pending,
    suspended: t.statuses.suspended,
    revoked: t.statuses.revoked,
    rejected: t.statuses.rejected,
    approved: t.labels.approve,
    verified: VERIFIED_LABELS[lang],
  };

  if (status === 'active' || status === 'approved' || status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E60B2] whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{labelMap[status]}</span>
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A6700] whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{labelMap[status]}</span>
      </span>
    );
  }
  if (status === 'suspended') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412] whitespace-nowrap">
        <PauseCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{labelMap[status]}</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{labelMap[status]}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#991B1B] whitespace-nowrap">
      <Ban className="w-3.5 h-3.5 shrink-0" />
      <span>{labelMap[status]}</span>
    </span>
  );
}
