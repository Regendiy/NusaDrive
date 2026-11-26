import test from 'node:test';
import assert from 'node:assert/strict';
import type { Booking } from '../types';
import {
  buildReceiptPlainText,
  computeReceiptSummary,
  formatReceiptNumber,
  formatReceiptTimestamp,
} from './receiptLogic.ts';

const sampleBooking: Booking = {
  id: 42,
  bookingCode: 'NDV-20261122-AB12',
  userUid: 'user-1',
  customerName: 'Rizky Pratama',
  customerEmail: 'rizky@example.com',
  customerWhatsapp: '6281234567890',
  vehicleId: 1,
  startDate: '2026-11-24',
  endDate: '2026-11-26',
  totalDays: 2,
  withDriver: true,
  pickupLocation: 'Batam Centre · Pelabuhan Ferry Internasional',
  notes: null,
  ktpNumber: '2171051208940001',
  ktpPhotoData: '',
  kkPhotoData: '',
  simPhotoData: '',
  selfiePhotoData: '',
  termsAccepted: true,
  kycStatus: 'verified',
  kycNotes: '',
  baseAmount: 3000000,
  driverAmount: 400000,
  taxAmount: 374000,
  totalAmount: 3774000,
  bookingStatus: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'QRIS Otomatis',
  paymentReference: 'PAY-99AABB11',
  paidAt: '2026-11-22T07:30:00.000Z',
  createdAt: '2026-11-22T07:00:00.000Z',
  vehicle: {
    id: 1,
    name: 'Toyota Alphard Hybrid',
    brand: 'Toyota',
    category: 'MPV',
    plateNumber: 'BP 1188 ND',
    year: 2025,
    transmission: 'Otomatis',
    fuelType: 'Hybrid',
    seats: 7,
    dailyRate: 1500000,
    driverFeePerDay: 200000,
    imageUrl: '/src/assets/images/car_mpv_zenix_1794672684036.jpg',
    status: 'available',
    features: '[]',
  },
};

test('formatReceiptNumber prefers payment reference when available', () => {
  assert.equal(
    formatReceiptNumber({ bookingCode: 'NDV-1', paymentReference: 'pay-77ff' }),
    'STRUK-PAY-77FF'
  );
  assert.equal(
    formatReceiptNumber({ bookingCode: 'NDV-2026-01', paymentReference: null }),
    'STRUK-NDV-2026-01'
  );
});

test('formatReceiptTimestamp formats WIB timestamp deterministically', () => {
  const formatted = formatReceiptTimestamp('2026-11-22T07:30:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /14:30 WIB/);
  assert.equal(formatReceiptTimestamp(null), 'Menunggu konfirmasi waktu');
});

test('computeReceiptSummary returns paid status and itemized totals', () => {
  const summary = computeReceiptSummary(sampleBooking);
  assert.equal(summary.receiptNumber, 'STRUK-PAY-99AABB11');
  assert.equal(summary.isPaid, true);
  assert.equal(summary.statusLabel, 'LUNAS TERVERIFIKASI');
  assert.equal(summary.subtotalAmount, 3400000);
  assert.equal(summary.totalAmount, 3774000);
});

test('buildReceiptPlainText includes Batam branding and payment details', () => {
  const txt = buildReceiptPlainText(sampleBooking);
  assert.ok(txt.includes('Batam'));
  assert.ok(txt.includes('STRUK-PAY-99AABB11'));
  assert.ok(txt.includes('LUNAS TERVERIFIKASI'));
  assert.ok(txt.includes('Toyota Alphard Hybrid'));
  assert.ok(txt.includes('QRIS Otomatis'));
});
