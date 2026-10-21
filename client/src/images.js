// Shrinks a photo in the browser before uploading: a 4000 px, 4 MB phone
// photo becomes ~1600 px and a few hundred KB. Faster on mobile data, less
// storage. Falls back to the original file if the browser can't read it
// (e.g. some HEIC photos) - the server still checks every file.
export async function shrinkImage(file, maxSide = 1600, quality = 0.85) {
  if (!file || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 500 * 1024) return file; // already small
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
