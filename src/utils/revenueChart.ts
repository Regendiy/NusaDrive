import { addDaysIsoDate, getTodayIsoDate } from './clientPricing';

export interface RevenueBookingSample {
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string | null;
  startDate: string;
}

export interface DailyRevenuePoint {
  date: string; // YYYY-MM-DD
  label: string; // DD/MM
  revenue: number;
  bookingCount: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  activeDays: number;
  averageDaily: number;
  peakDay: DailyRevenuePoint | null;
}

function extractIsoDate(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

export function buildDailyRevenueSeries(
  bookings: RevenueBookingSample[],
  referenceDate = getTodayIsoDate(),
  days = 30
): DailyRevenuePoint[] {
  const safeDays = Math.max(1, days);
  const startDate = addDaysIsoDate(referenceDate, -(safeDays - 1));

  const dayMap = new Map<string, DailyRevenuePoint>();
  for (let i = 0; i < safeDays; i++) {
    const iso = addDaysIsoDate(startDate, i);
    dayMap.set(iso, {
      date: iso,
      label: formatDayMonth(iso),
      revenue: 0,
      bookingCount: 0,
    });
  }

  for (const booking of bookings) {
    if (booking.bookingStatus === 'cancelled' || booking.paymentStatus !== 'paid') {
      continue;
    }

    const attributedDate =
      extractIsoDate(booking.paidAt) ||
      extractIsoDate(booking.createdAt) ||
      extractIsoDate(booking.startDate);

    if (!attributedDate) continue;

    const bucket = dayMap.get(attributedDate);
    if (!bucket) continue;

    bucket.revenue += Number.isFinite(booking.totalAmount) ? booking.totalAmount : 0;
    bucket.bookingCount += 1;
  }

  return Array.from(dayMap.values());
}

export function summarize30DayRevenue(series: DailyRevenuePoint[]): RevenueSummary {
  if (series.length === 0) {
    return {
      totalRevenue: 0,
      activeDays: 0,
      averageDaily: 0,
      peakDay: null,
    };
  }

  let totalRevenue = 0;
  let activeDays = 0;
  let peakDay: DailyRevenuePoint | null = null;

  for (const point of series) {
    totalRevenue += point.revenue;
    if (point.revenue > 0) {
      activeDays += 1;
    }
    if (!peakDay || point.revenue > peakDay.revenue) {
      peakDay = point;
    }
  }

  return {
    totalRevenue,
    activeDays,
    averageDaily: Math.round(totalRevenue / series.length),
    peakDay: peakDay && peakDay.revenue > 0 ? peakDay : null,
  };
}

export function formatCompactIdrAxis(value: number): string {
  if (value <= 0) return 'Rp 0';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted = Number.isInteger(millions)
      ? String(millions)
      : millions.toFixed(1).replace('.', ',');
    return `Rp ${formatted} jt`;
  }
  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000)} rb`;
  }
  return `Rp ${value}`;
}
