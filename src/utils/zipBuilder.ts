import zlib from 'node:zlib';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface ZipEntryInput {
  name: string;
  content: Buffer | string;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function computeCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

export function buildZipArchive(entries: ZipEntryInput[], now = new Date()): Buffer {
  const { dosTime, dosDate } = getDosDateTime(now);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const cleanName = entry.name.replace(/^\/+/, '');
    const nameBuf = Buffer.from(cleanName, 'utf-8');
    const rawData = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(entry.content, 'utf-8');
    const crc = computeCrc32(rawData);
    const compressed = zlib.deflateRawSync(rawData);

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(8, 8); // compression method: deflate
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra len

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    centralHeader.writeUInt16LE(8, 10); // deflate
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk start
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // relative offset

    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralBuffer = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // EOCD signature
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // central dir disk
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralBuffer.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([...localParts, centralBuffer, endRecord]);
}

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.aistudio',
  '.playwright-cli',
  'dist',
  'php-mysql',
]);

export function shouldIncludeInProjectZip(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return false;

  const segments = normalized.split('/');
  if (segments.some((seg) => EXCLUDED_DIRS.has(seg))) {
    return false;
  }

  const baseName = segments[segments.length - 1];
  if (
    baseName === '.env' ||
    (baseName.startsWith('.env.') && baseName !== '.env.example') ||
    baseName.endsWith('.zip') ||
    baseName.endsWith('.log')
  ) {
    return false;
  }

  return true;
}

export async function collectProjectZipEntries(
  rootDir: string,
  archivePrefix = 'nusadrive-batam'
): Promise<ZipEntryInput[]> {
  const entries: ZipEntryInput[] = [];

  async function walk(currentDir: string, relDir: string) {
    const dirents = await fs.readdir(currentDir, { withFileTypes: true });
    dirents.sort((a, b) => a.name.localeCompare(b.name));

    for (const dirent of dirents) {
      const relPath = relDir ? `${relDir}/${dirent.name}` : dirent.name;
      if (!shouldIncludeInProjectZip(relPath)) continue;

      const fullPath = path.join(currentDir, dirent.name);
      if (dirent.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (dirent.isFile()) {
        const content = await fs.readFile(fullPath);
        entries.push({
          name: archivePrefix ? `${archivePrefix}/${relPath}` : relPath,
          content,
        });
      }
    }
  }

  await walk(rootDir, '');
  return entries;
}
