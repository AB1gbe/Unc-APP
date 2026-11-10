// Short videos in chats (session 58). The server checks the type and the
// size too; this only saves people from waiting for an upload that would
// be refused. The length (1 minute) can only be read in the browser.
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const VIDEO_MAX_MB = 25;
export const VIDEO_MAX_SECONDS = 60;

// null when fine, else 'type' | 'size' (length is checked by videoLength).
export function videoProblem(file) {
  if (!VIDEO_TYPES.includes(file.type)) return 'type';
  if (file.size > VIDEO_MAX_MB * 1024 * 1024) return 'size';
  return null;
}

// Resolves to the video's length in seconds (or null if it can't be read).
export function videoLength(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Number.isFinite(v.duration) ? v.duration : null); };
    v.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    v.src = url;
  });
}
