// Choose photos with previews; they are shrunk in the browser before they
// are handed to onChange. `files` is controlled by the parent.
import { useEffect, useMemo } from 'react';
import { t } from '../i18n.jsx';
import { shrinkImage } from '../images.js';

export default function PhotoPicker({ files, onChange, max = 6, existing = 0, id = 'photos' }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  const room = max - existing - files.length;

  async function add(e) {
    const picked = [...e.target.files].slice(0, Math.max(0, room));
    e.target.value = '';
    const small = await Promise.all(picked.map((f) => shrinkImage(f)));
    onChange([...files, ...small]);
  }

  return (
    <div>
      <div className="thumbs">
        {urls.map((u, i) => (
          <div key={u} className="thumb">
            <img src={u} alt="" />
            <button type="button" className="thumb-x" aria-label={t('Remove')} onClick={() => onChange(files.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {room > 0 && (
          <label className="thumb add" htmlFor={id}>
            <span aria-hidden>＋</span>
            <span className="small">{t('Add photos')}</span>
            <input id={id} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={add} hidden />
          </label>
        )}
      </div>
      <div className="hint">{t('{left} of {max} photos left', { left: Math.max(0, room), max })}</div>
    </div>
  );
}
