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

// A small copy for grids and lists (session 102): always resized to at most
// 480 px, under the server's 150 KB limit. null if the browser can't read
// the photo (the server then shows the full photo in grids).
export async function makeThumb(file, maxSide = 480, quality = 0.78) {
  if (!file || !file.type.startsWith('image/')) return null;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size > 150 * 1024) return null;
    return new File([blob], 'thumb.jpg', { type: 'image/jpeg' });
  } catch {
    return null;
  }
}

// Photos plus their thumbnails into a form (same order; the server pairs
// them). A photo whose thumbnail couldn't be made gets the full one used.
export async function appendPhotos(fd, files) {
  const thumbs = await Promise.all(files.map((f) => makeThumb(f)));
  files.forEach((f) => fd.append('images', f));
  if (thumbs.every(Boolean)) thumbs.forEach((x) => fd.append('thumbs', x));
}

