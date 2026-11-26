import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Copy, Tag, X } from 'lucide-react';
import {
  BATAM_PROMO_OFFERS,
  formatOfferCountdown,
  getNextOfferIndex,
  type PromotionalOffer,
} from '../utils/promotionalOffers';

interface PromotionalBannerProps {
  offers?: PromotionalOffer[];
  onApplyOfferCategory?: (category: string, offer: PromotionalOffer) => void;
}

export function PromotionalBanner({
  offers = BATAM_PROMO_OFFERS,
  onApplyOfferCategory,
}: PromotionalBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (dismissed || offers.length === 0) {
    return null;
  }

  const currentOffer = offers[activeIndex % offers.length];
  const countdownText = formatOfferCountdown(currentOffer.validUntilIso, nowMs);
  const isCopied = copiedCode === currentOffer.promoCode;

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentOffer.promoCode);
      }
    } catch {
      // Clipboard may be restricted in non-HTTPS or headless environments; still show feedback
    }
    setCopiedCode(currentOffer.promoCode);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === currentOffer.promoCode ? null : prev));
    }, 2200);
  };

  return (
    <aside
      aria-label="Penawaran promosi sewa mobil Batam"
      data-testid="promotional-banner"
      className="animate-promo-slide-down mb-8 rounded-xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-r from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-4 sm:px-6 sm:py-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          {/* Unboxed typographic metadata line (no pills) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-blue-800 dark:text-blue-300">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span>{currentOffer.discountSummary}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentOffer.seasonLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
              {currentOffer.validPeriodLabel} ({countdownText})
            </span>
          </div>

          <h3 className="font-display text-base sm:text-lg font-semibold text-slate-950 dark:text-white tracking-tight text-balance">
            {currentOffer.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            {currentOffer.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label={`Salin kode promo ${currentOffer.promoCode}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:border-blue-700 dark:hover:border-blue-500 transition-colors whitespace-nowrap shrink-0"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tersalin: {currentOffer.promoCode}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Kode: {currentOffer.promoCode}</span>
              </>
            )}
          </button>

          {onApplyOfferCategory && (
            <button
              type="button"
              onClick={() => onApplyOfferCategory(currentOffer.targetCategory, currentOffer)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat Unit {currentOffer.targetCategory}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {offers.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => getNextOfferIndex(prev, offers.length))}
              aria-label={`Lihat promo berikutnya (${activeIndex + 1} dari ${offers.length})`}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <span className="font-mono tabular-nums">
                {activeIndex + 1}/{offers.length}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Tutup banner promosi"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
