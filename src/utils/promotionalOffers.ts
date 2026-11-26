export interface PromotionalOffer {
  id: string;
  seasonLabel: string;
  title: string;
  description: string;
  discountSummary: string;
  promoCode: string;
  validPeriodLabel: string;
  validUntilIso: string;
  targetCategory: string;
}

export const BATAM_PROMO_OFFERS: PromotionalOffer[] = [
  {
    id: 'batam-holiday-2026',
    seasonLabel: 'Penawaran Libur Akhir Tahun Batam',
    title: 'Hemat 15% untuk Sewa MPV Keluarga & Eksekutif Minimal 3 Hari',
    description:
      'Berlaku untuk penjemputan di Bandara Hang Nadim, Pelabuhan Ferry Batam Centre, dan Harbour Bay selama periode liburan.',
    discountSummary: 'Diskon 15%',
    promoCode: 'BATAMLIBUR15',
    validPeriodLabel: '23 Nov – 31 Des 2026',
    validUntilIso: '2026-12-31T23:59:59+07:00',
    targetCategory: 'MPV',
  },
  {
    id: 'batam-ev-weekend',
    seasonLabel: 'Promo Terbatas Mobilitas Hijau Batam',
    title: 'Potongan Langsung Rp 150.000/Hari untuk Unit Mobil Listrik (EV)',
    description:
      'Nikmati perjalanan bebas bising keliling Nagoya, Nongsa, hingga Jembatan Barelang dengan dukungan pengisian daya penuh sebelum serah terima.',
    discountSummary: 'Hemat Rp 150.000/hari',
    promoCode: 'EVBATAM150',
    validPeriodLabel: 'Berlaku s/d 15 Des 2026',
    validUntilIso: '2026-12-15T23:59:59+07:00',
    targetCategory: 'EV',
  },
];

export function formatOfferCountdown(
  validUntilIso: string,
  nowMs: number = Date.now()
): string {
  const targetMs = Date.parse(validUntilIso);
  if (!Number.isFinite(targetMs)) {
    return 'Periode terbatas';
  }

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return 'Periode promo berakhir';
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) {
    const safeHours = Math.max(1, totalHours);
    return `${safeHours} jam tersisa`;
  }

  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${daysRemaining} hari tersisa`;
}

export function getNextOfferIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}
