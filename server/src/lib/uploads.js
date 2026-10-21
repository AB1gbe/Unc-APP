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

export function saveFile(file, dir, { allowPdf = false } = {}) {
  const kind = sniff(file.buffer);
  if (!kind || (kind.ext === '.pdf' && !allowPdf)) {
    throw new HttpError(400, `"${file.fieldname}" must be a JPG, PNG or WEBP image${allowPdf ? ' or a PDF' : ''}.`);
  }
  fs.mkdirSync(dir, { recursive: true });
  const name = randomToken(18) + kind.ext;
  fs.writeFileSync(path.join(dir, name), file.buffer);
  return name;
}

export function mimeFor(filename) {
  return SIGNATURES.find((s) => s.ext === path.extname(filename))?.mime || 'application/octet-stream';
}
