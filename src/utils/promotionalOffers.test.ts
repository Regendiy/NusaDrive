import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATAM_PROMO_OFFERS,
  formatOfferCountdown,
  getNextOfferIndex,
} from './promotionalOffers';

test('BATAM_PROMO_OFFERS defines valid Batam holiday and EV offers', () => {
  assert.ok(BATAM_PROMO_OFFERS.length >= 2);
  for (const offer of BATAM_PROMO_OFFERS) {
    assert.ok(offer.id.length > 0);
    assert.ok(offer.promoCode.length >= 4);
    assert.ok(offer.targetCategory.length > 0);
    assert.ok(Number.isFinite(Date.parse(offer.validUntilIso)));
  }
});

test('formatOfferCountdown returns accurate days, hours, and expired states', () => {
  const target = '2026-12-31T23:59:59+07:00';
  const targetMs = Date.parse(target);

  assert.equal(
    formatOfferCountdown(target, targetMs - 10 * 24 * 60 * 60 * 1000),
    '10 hari tersisa'
  );
  assert.equal(
    formatOfferCountdown(target, targetMs - 5 * 60 * 60 * 1000),
    '5 jam tersisa'
  );
  assert.equal(
    formatOfferCountdown(target, targetMs + 1000),
    'Periode promo berakhir'
  );
  assert.equal(formatOfferCountdown('invalid-date', targetMs), 'Periode terbatas');
});

test('getNextOfferIndex wraps cleanly across available offers', () => {
  assert.equal(getNextOfferIndex(0, 2), 1);
  assert.equal(getNextOfferIndex(1, 2), 0);
  assert.equal(getNextOfferIndex(0, 0), 0);
});
