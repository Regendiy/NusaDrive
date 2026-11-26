export const BATAM_PICKUP_LOCATIONS = [
  'Batam Centre · Pelabuhan Ferry Internasional',
  'Bandara Internasional Hang Nadim (BTH)',
  'Nagoya / Lubuk Baja',
  'Harbour Bay Ferry Terminal (Batu Ampar)',
  'Nongsa / Kabil Industrial Estate',
  'Sekupang Ferry Terminal',
] as const;

export interface PricingInput {
  dailyRate: number;
  driverFeePerDay: number;
  startDate: string;
  endDate: string;
  withDriver: boolean;
  taxRate?: number;
}

export interface PricingResult {
  valid: boolean;
  totalDays: number;
  baseAmount: number;
  driverAmount: number;
  taxAmount: number;
  totalAmount: number;
  error?: string;
}

export interface DateRangeBooking {
  startDate: string;
  endDate: string;
  bookingStatus: string;
}

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
}

export function calculateRentalDays(startDate: string, endDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return 0;
  }
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export function calculateBookingPrice(input: PricingInput): PricingResult {
  const totalDays = calculateRentalDays(input.startDate, input.endDate);
  if (totalDays <= 0) {
    return {
      valid: false,
      totalDays: 0,
      baseAmount: 0,
      driverAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      error: 'Tanggal selesai harus sama atau setelah tanggal mulai sewa.',
    };
  }

  const taxRate = input.taxRate ?? 0.11;
  const baseAmount = Math.round(input.dailyRate * totalDays);
  const driverAmount = input.withDriver ? Math.round(input.driverFeePerDay * totalDays) : 0;
  const subtotal = baseAmount + driverAmount;
  const taxAmount = Math.round(subtotal * taxRate);
  const totalAmount = subtotal + taxAmount;

  return {
    valid: true,
    totalDays,
    baseAmount,
    driverAmount,
    taxAmount,
    totalAmount,
  };
}

export function normalizeWhatsappNumber(phone: string): {
  valid: boolean;
  formatted: string;
  error?: string;
} {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (!cleaned) {
    return { valid: false, formatted: '', error: 'Nomor WhatsApp wajib diisi.' };
  }

  let normalized = cleaned;
  if (normalized.startsWith('+')) {
    normalized = normalized.slice(1);
  }
  if (normalized.startsWith('0')) {
    normalized = `62${normalized.slice(1)}`;
  }

  if (!/^628\d{8,12}$/.test(normalized)) {
    return {
      valid: false,
      formatted: '',
      error: 'Masukkan nomor WhatsApp Indonesia yang valid (contoh: 081234567890).',
    };
  }

  return { valid: true, formatted: normalized };
}

export function hasDateOverlap(
  existingBookings: DateRangeBooking[],
  startDate: string,
  endDate: string
): boolean {
  const activeStatuses = new Set(['pending', 'confirmed', 'active']);
  return existingBookings.some((b) => {
    if (!activeStatuses.has(b.bookingStatus)) {
      return false;
    }
    return startDate <= b.endDate && endDate >= b.startDate;
  });
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function addDaysIsoDate(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}
