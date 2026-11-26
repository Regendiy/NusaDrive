import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyRevenueSeries,
  formatCompactIdrAxis,
  summarize30DayRevenue,
} from './revenueChart';

test('buildDailyRevenueSeries returns 30 consecutive days zero-filled when bookings are empty', () => {
  const series = buildDailyRevenueSeries([], '2026-11-14', 30);
  assert.equal(series.length, 30);
  assert.equal(series[0].date, '2026-10-16');
  assert.equal(series[29].date, '2026-11-14');
  assert.equal(series.every((p) => p.revenue === 0 && p.bookingCount === 0), true);
});

test('buildDailyRevenueSeries aggregates paid non-cancelled bookings by day and excludes unpaid/cancelled/out-of-window', () => {
  const bookings = [
    {
      totalAmount: 2450000,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paidAt: '2026-11-14T08:15:00.000Z',
      createdAt: '2026-11-14T08:00:00.000Z',
      startDate: '2026-11-20',
    },
    {
      totalAmount: 1150000,
      bookingStatus: 'completed',
      paymentStatus: 'paid',
      paidAt: '2026-11-14T10:00:00.000Z',
      createdAt: '2026-11-12T08:00:00.000Z',
      startDate: '2026-11-13',
    },
    {
      totalAmount: 950000,
      bookingStatus: 'active',
      paymentStatus: 'paid',
      paidAt: null,
      createdAt: '2026-11-10T09:00:00.000Z',
      startDate: '2026-11-10',
    },
    {
      // Unpaid should not be included
      totalAmount: 4200000,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      paidAt: null,
      createdAt: '2026-11-14T09:00:00.000Z',
      startDate: '2026-11-15',
    },
    {
      // Cancelled should not be included even if paid flag existed
      totalAmount: 1650000,
      bookingStatus: 'cancelled',
      paymentStatus: 'paid',
      paidAt: '2026-11-13T09:00:00.000Z',
      createdAt: '2026-11-13T08:00:00.000Z',
      startDate: '2026-11-15',
    },
    {
      // Outside 30-day window (more than 29 days prior to 2026-11-14)
      totalAmount: 3600000,
      bookingStatus: 'completed',
      paymentStatus: 'paid',
      paidAt: '2026-10-01T08:00:00.000Z',
      createdAt: '2026-10-01T08:00:00.000Z',
      startDate: '2026-10-02',
    },
  ];

  const series = buildDailyRevenueSeries(bookings, '2026-11-14', 30);
  const nov14 = series.find((d) => d.date === '2026-11-14');
  const nov10 = series.find((d) => d.date === '2026-11-10');
  const nov13 = series.find((d) => d.date === '2026-11-13');

  assert.equal(nov14?.revenue, 3600000);
  assert.equal(nov14?.bookingCount, 2);
  assert.equal(nov10?.revenue, 950000);
  assert.equal(nov10?.bookingCount, 1);
  assert.equal(nov13?.revenue, 0);

  const summary = summarize30DayRevenue(series);
  assert.equal(summary.totalRevenue, 4550000);
  assert.equal(summary.activeDays, 2);
  assert.equal(summary.peakDay?.date, '2026-11-14');
  assert.equal(summary.averageDaily, Math.round(4550000 / 30));
});

test('formatCompactIdrAxis formats Rupiah axis ticks concisely', () => {
  assert.equal(formatCompactIdrAxis(0), 'Rp 0');
  assert.equal(formatCompactIdrAxis(500000), 'Rp 500 rb');
  assert.equal(formatCompactIdrAxis(2000000), 'Rp 2 jt');
  assert.equal(formatCompactIdrAxis(2500000), 'Rp 2,5 jt');
});
