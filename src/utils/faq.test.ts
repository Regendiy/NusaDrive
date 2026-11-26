import test from 'node:test';
import assert from 'node:assert/strict';
import { BATAM_FAQ_ITEMS, filterFaqItems } from './faq';

test('filterFaqItems returns all items when category is Semua and query is empty', () => {
  const result = filterFaqItems(BATAM_FAQ_ITEMS, 'Semua', '');
  assert.equal(result.length, BATAM_FAQ_ITEMS.length);
});

test('filterFaqItems filters strictly by category', () => {
  const result = filterFaqItems(BATAM_FAQ_ITEMS, 'Syarat Sewa');
  assert.ok(result.length >= 1);
  assert.ok(result.every((item) => item.category === 'Syarat Sewa'));
});

test('filterFaqItems filters by keyword across question and answer case-insensitively', () => {
  const barelang = filterFaqItems(BATAM_FAQ_ITEMS, 'Semua', 'Barelang');
  assert.equal(barelang.length, 1);
  assert.equal(barelang[0].id, 'faq-wilayah-barelang');

  const none = filterFaqItems(BATAM_FAQ_ITEMS, 'Semua', 'katakuncitidakada');
  assert.equal(none.length, 0);
});
