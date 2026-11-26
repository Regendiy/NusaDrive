import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATAM_TESTIMONIALS,
  filterTestimonials,
  summarizeTestimonials,
} from './testimonials';

test('filterTestimonials returns all items for Semua and filters by category', () => {
  const all = filterTestimonials(BATAM_TESTIMONIALS, 'Semua');
  assert.equal(all.length, BATAM_TESTIMONIALS.length);

  const korporat = filterTestimonials(BATAM_TESTIMONIALS, 'Korporat');
  assert.ok(korporat.length >= 1);
  assert.ok(korporat.every((item) => item.category === 'Korporat'));

  const keluarga = filterTestimonials(BATAM_TESTIMONIALS, 'Keluarga');
  assert.ok(keluarga.length >= 1);
  assert.ok(keluarga.every((item) => item.category === 'Keluarga'));
});

test('summarizeTestimonials calculates count and rounded rating accurately', () => {
  const summary = summarizeTestimonials(BATAM_TESTIMONIALS);
  assert.equal(summary.totalCount, BATAM_TESTIMONIALS.length);
  assert.equal(summary.averageRating, 5);

  const emptySummary = summarizeTestimonials([]);
  assert.deepEqual(emptySummary, { totalCount: 0, averageRating: 0 });
});
