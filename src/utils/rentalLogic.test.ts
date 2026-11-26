import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsappMessage,
  calculateBookingPrice,
  calculateRentalDays,
  formatRupiah,
  generateBookingCode,
  hasDateOverlap,
  normalizeWhatsappNumber,
  parseValidGatewayUrl,
  signWebhookPayload,
  verifyWebhookSignature,
} from './rentalLogic';

test('calculateRentalDays handles same-day, multi-day, and invalid ranges', () => {
  assert.equal(calculateRentalDays('2026-11-20', '2026-11-20'), 1);
  assert.equal(calculateRentalDays('2026-11-20', '2026-11-23'), 3);
  assert.equal(calculateRentalDays('2026-11-25', '2026-11-20'), 0);
  assert.equal(calculateRentalDays('invalid', '2026-11-20'), 0);
});

test('calculateBookingPrice calculates base, driver fee, 11% tax, and total accurately', () => {
  const selfDrive = calculateBookingPrice({
    dailyRate: 1000000,
    driverFeePerDay: 200000,
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    withDriver: false,
  });

  assert.equal(selfDrive.valid, true);
  assert.equal(selfDrive.totalDays, 2);
  assert.equal(selfDrive.baseAmount, 2000000);
  assert.equal(selfDrive.driverAmount, 0);
  assert.equal(selfDrive.taxAmount, 220000);
  assert.equal(selfDrive.totalAmount, 2220000);

  const withDriver = calculateBookingPrice({
    dailyRate: 1000000,
    driverFeePerDay: 200000,
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    withDriver: true,
  });

  assert.equal(withDriver.valid, true);
  assert.equal(withDriver.driverAmount, 400000);
  assert.equal(withDriver.taxAmount, 264000);
  assert.equal(withDriver.totalAmount, 2664000);
});

test('normalizeWhatsappNumber validates and formats Indonesian mobile numbers', () => {
  assert.deepEqual(normalizeWhatsappNumber('0812-3456-7890'), {
    valid: true,
    formatted: '6281234567890',
  });
  assert.deepEqual(normalizeWhatsappNumber('+62 811 2233 4455'), {
    valid: true,
    formatted: '6281122334455',
  });
  assert.equal(normalizeWhatsappNumber('12345').valid, false);
  assert.equal(normalizeWhatsappNumber('').valid, false);
});

test('hasDateOverlap blocks overlapping active/pending/confirmed bookings but ignores cancelled/completed', () => {
  const existing = [
    { startDate: '2026-12-01', endDate: '2026-12-04', bookingStatus: 'confirmed' },
    { startDate: '2026-12-10', endDate: '2026-12-12', bookingStatus: 'cancelled' },
  ];

  assert.equal(hasDateOverlap(existing, '2026-12-03', '2026-12-06'), true);
  assert.equal(hasDateOverlap(existing, '2026-11-29', '2026-12-01'), true);
  assert.equal(hasDateOverlap(existing, '2026-12-05', '2026-12-09'), false);
  assert.equal(hasDateOverlap(existing, '2026-12-10', '2026-12-12'), false);
});

test('webhook signature verification validates matching HMAC and rejects tampering', () => {
  const secret = 'nusadrive_webhook_secret';
  const sig = signWebhookPayload('NDV-20261120-AB12', 2220000, secret);
  assert.equal(verifyWebhookSignature('NDV-20261120-AB12', 2220000, secret, sig), true);
  assert.equal(verifyWebhookSignature('NDV-20261120-AB12', 1000000, secret, sig), false);
});

test('formatRupiah, generateBookingCode, and buildWhatsappMessage produce expected output', () => {
  assert.match(formatRupiah(1500000), /Rp\s?1\.500\.000/);
  assert.match(generateBookingCode(new Date('2026-11-14T00:00:00Z')), /^NDV-20261114-[A-F0-9]{4}$/);
  const msg = buildWhatsappMessage('payment_confirmed', {
    customerName: 'Budi Santoso',
    bookingCode: 'NDV-20261114-1234',
    vehicleName: 'Toyota Alphard Hybrid',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    totalAmount: 2220000,
    pickupLocation: 'Bandara Soekarno-Hatta Terminal 3',
    paymentMethod: 'QRIS Otomatis',
  });
  assert.match(msg, /Pembayaran Diterima/);
  assert.match(msg, /NDV-20261114-1234/);
  assert.match(msg, /QRIS Otomatis/);
});

test('parseValidGatewayUrl validates HTTP/HTTPS gateway URLs and rejects invalid inputs like 2', () => {
  assert.equal(parseValidGatewayUrl('https://api.fonnte.com/send'), 'https://api.fonnte.com/send');
  assert.equal(parseValidGatewayUrl(' http://localhost:8080/hook '), 'http://localhost:8080/hook');
  assert.equal(parseValidGatewayUrl('2'), null);
  assert.equal(parseValidGatewayUrl('http://2'), null);
  assert.equal(parseValidGatewayUrl(''), null);
  assert.equal(parseValidGatewayUrl(undefined), null);
  assert.equal(parseValidGatewayUrl('ftp://example.com/send'), null);
});
