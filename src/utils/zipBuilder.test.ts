import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildZipArchive,
  computeCrc32,
  shouldIncludeInProjectZip,
} from './zipBuilder.ts';

test('computeCrc32 computes standard IEEE CRC32 for known input', () => {
  const crc = computeCrc32(Buffer.from('123456789', 'utf-8'));
  assert.equal(crc, 0xcbf43926);
});

test('buildZipArchive produces valid PKZIP headers and entry names', () => {
  const zip = buildZipArchive([
    { name: 'nusadrive/schema.sql', content: 'SELECT 1;' },
    { name: 'nusadrive/README.md', content: '# NusaDrive Batam' },
  ]);

  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  assert.ok(zip.includes(Buffer.from('nusadrive/schema.sql', 'utf-8')));
  assert.ok(zip.includes(Buffer.from('nusadrive/README.md', 'utf-8')));

  const eocdOffset = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocdOffset), 0x06054b50);
  assert.equal(zip.readUInt16LE(eocdOffset + 8), 2);
});

test('shouldIncludeInProjectZip keeps clean app files and excludes secrets, build artifacts, and archives', () => {
  assert.equal(shouldIncludeInProjectZip('src/App.tsx'), true);
  assert.equal(shouldIncludeInProjectZip('src/assets/images/hero.jpg'), true);
  assert.equal(shouldIncludeInProjectZip('server.ts'), true);
  assert.equal(shouldIncludeInProjectZip('package.json'), true);
  assert.equal(shouldIncludeInProjectZip('.env.example'), true);

  assert.equal(shouldIncludeInProjectZip('.env'), false);
  assert.equal(shouldIncludeInProjectZip('.env.local'), false);
  assert.equal(shouldIncludeInProjectZip('node_modules/react/index.js'), false);
  assert.equal(shouldIncludeInProjectZip('dist/assets/index.js'), false);
  assert.equal(shouldIncludeInProjectZip('.playwright-cli/snap.png'), false);
  assert.equal(shouldIncludeInProjectZip('.aistudio/artifacts/test.txt'), false);
  assert.equal(shouldIncludeInProjectZip('php-mysql/schema.sql'), false);
  assert.equal(shouldIncludeInProjectZip('nusadrive-batam.zip'), false);
});
