// File upload handling. Files get random names (never the user's filename)
// and their real type is checked from the first bytes ("magic numbers"),
// because the browser-supplied mimetype can be faked.
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config.js';
import { randomToken } from './crypto.js';
import { HttpError } from './http.js';

export const KYC_DIR = () => path.join(config.uploadDir, 'kyc');         // private
export const LISTING_DIR = () => path.join(config.uploadDir, 'listings'); // public
export const AVATAR_DIR = () => path.join(config.uploadDir, 'avatars');   // public (profile photos)

export const avatarUrl = (file) => (file ? `/uploads/avatars/${file}` : null);

const SIGNATURES = [
  { ext: '.jpg', mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { ext: '.png', mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: '.webp', mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], extra: (b) => b.toString('ascii', 8, 12) === 'WEBP' },
  { ext: '.pdf', mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
];

export function sniff(buffer) {
  return SIGNATURES.find(
    (s) => s.bytes.every((b, i) => buffer[i] === b) && (!s.extra || s.extra(buffer)),
  );
}

// Keep files in memory first so we can inspect the bytes before saving.
export function memoryUpload(maxFiles) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadBytes, files: maxFiles },
  });
}

// Checks EVERY file first and only then writes them, so a bad second file
// can't leave the first one orphaned on disk. Returns the new names plus
// discard(), which deletes them again if the database step fails.
//   items: [{ file, allowPdf? }, ...]  (null/undefined entries are skipped)
export function saveFiles(dir, items) {
  for (const item of items) {
    if (!item) continue;
    const kind = sniff(item.file.buffer);
    if (!kind || (kind.ext === '.pdf' && !item.allowPdf)) {
      throw new HttpError(400, `"${item.file.fieldname}" must be a JPG, PNG or WEBP image${item.allowPdf ? ' or a PDF' : ''}.`, { field: item.file.fieldname });
    }
    item.ext = kind.ext;
  }
  fs.mkdirSync(dir, { recursive: true });
  const written = [];
  const names = items.map((item) => {
    if (!item) return null;
    const name = randomToken(18) + item.ext;
    fs.writeFileSync(path.join(dir, name), item.file.buffer);
    written.push(name);
    return name;
  });
  return {
    names,
    discard() {
      for (const name of written) fs.rmSync(path.join(dir, name), { force: true });
    },
  };
}

export function mimeFor(filename) {
  return SIGNATURES.find((s) => s.ext === path.extname(filename))?.mime || 'application/octet-stream';
}
