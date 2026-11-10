// Choose a short video (session 58): checks type, size and length in the
// browser, then shows a small preview with ✕.
import { useEffect, useState } from 'react';
import { t } from '../i18n.jsx';
import { VIDEO_MAX_MB, VIDEO_MAX_SECONDS, videoLength, videoProblem } from '../videos.js';

export async function pickVideo(file) {
  const problem = videoProblem(file);
  if (problem === 'type') return { error: t('Please choose an MP4, MOV or WebM video.') };
  if (problem === 'size') return { error: t('That video is over {mb} MB. Please choose a shorter one.', { mb: VIDEO_MAX_MB }) };
  const seconds = await videoLength(file);
  if (seconds && seconds > VIDEO_MAX_SECONDS + 1) return { error: t('Videos can be up to 1 minute long.') };
  return { file };
}

export function VideoPreview({ file, onRemove }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="attach-preview video-preview">
      <video src={url} muted playsInline preload="metadata" />
      <button type="button" className="thumb-x" onClick={onRemove} aria-label={t('Remove')}>✕</button>
    </div>
  );
}
