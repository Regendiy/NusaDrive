import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidImageDataUrl,
  normalizeNikNumber,
  validateKycSubmission,
} from './kycValidation.ts';

const SAMPLE_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAA==';
const SAMPLE_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test('normalizeNikNumber requires 16 numeric digits', () => {
  assert.equal(normalizeNikNumber('2171 0512 0894 0001').valid, true);
  assert.equal(normalizeNikNumber('2171 0512 0894 0001').normalized, '2171051208940001');
  assert.equal(normalizeNikNumber('21710512').valid, false);
});

test('isValidImageDataUrl rejects SVG, javascript URLs, and oversized payloads', () => {
  assert.equal(isValidImageDataUrl(SAMPLE_JPEG), true);
  assert.equal(isValidImageDataUrl(SAMPLE_PNG), true);
  assert.equal(isValidImageDataUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isValidImageDataUrl('javascript:alert(1)'), false);
  assert.equal(isValidImageDataUrl(''), false);
});

test('validateKycSubmission requires SIM A for lepas kunci and allows omitting SIM A with driver', () => {
  const missingSim = validateKycSubmission({
    ktpNumber: '2171051208940001',
    ktpPhotoData: SAMPLE_JPEG,
    kkPhotoData: SAMPLE_PNG,
    withDriver: false,
    termsAccepted: true,
  });
  assert.equal(missingSim.valid, false);

  const withDriverOk = validateKycSubmission({
    ktpNumber: '2171051208940001',
    ktpPhotoData: SAMPLE_JPEG,
    kkPhotoData: SAMPLE_PNG,
    withDriver: true,
    termsAccepted: true,
  });
  assert.equal(withDriverOk.valid, true);

  const lepasKunciOk = validateKycSubmission({
    ktpNumber: '2171051208940001',
    ktpPhotoData: SAMPLE_JPEG,
    kkPhotoData: SAMPLE_PNG,
    simPhotoData: SAMPLE_JPEG,
    selfiePhotoData: SAMPLE_PNG,
    withDriver: false,
    termsAccepted: true,
  });
  assert.equal(lepasKunciOk.valid, true);
});

test('validateKycSubmission requires termsAccepted to be true', () => {
  const res = validateKycSubmission({
    ktpNumber: '2171051208940001',
    ktpPhotoData: SAMPLE_JPEG,
    kkPhotoData: SAMPLE_PNG,
    simPhotoData: SAMPLE_JPEG,
    withDriver: false,
    termsAccepted: false,
  });
  assert.equal(res.valid, false);
});
