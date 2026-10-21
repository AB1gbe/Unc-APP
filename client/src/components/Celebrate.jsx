// Little moments of joy: a short message ("toast") and, for big moments,
// confetti. Any page calls celebrate({ text, confetti: true }); the
// <Celebrations /> in Layout shows it, even across a page change.
// No library: ~60 coloured squares on a canvas for 1.8 s. People who asked
// their phone for less motion get the message without the confetti.
import { useEffect, useRef, useState } from 'react';

export function celebrate({ text, confetti = false }) {
  window.dispatchEvent(new CustomEvent('unc:celebrate', { detail: { text, confetti } }));
}

const COLORS = ['#2f6fed', '#ffd166', '#06d6a0', '#ef476f', '#118ab2'];

export default function Celebrations() {
  const [toast, setToast] = useState(null);
  const canvas = useRef(null);

  useEffect(() => {
    let hide;
    function on(e) {
      setToast({ text: e.detail.text, key: Date.now() });
      clearTimeout(hide);
      hide = setTimeout(() => setToast(null), 3500);
      const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (e.detail.confetti && !calm) burst(canvas.current);
    }
    window.addEventListener('unc:celebrate', on);
    return () => { window.removeEventListener('unc:celebrate', on); clearTimeout(hide); };
  }, []);

  return (
    <>
      <canvas ref={canvas} className="confetti" aria-hidden />
      {toast && <div key={toast.key} className="toast" role="status">{toast.text}</div>}
    </>
  );
}

function burst(el) {
  if (!el) return;
  const ctx = el.getContext('2d');
  const w = (el.width = window.innerWidth);
  const h = (el.height = window.innerHeight);
  const bits = Array.from({ length: 60 }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h * 0.35,
    vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4,
    size: 6 + Math.random() * 6, color: COLORS[Math.floor(Math.random() * COLORS.length)],
    spin: Math.random() * Math.PI,
  }));
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    if (t > 1800) return;
    ctx.globalAlpha = Math.max(0, 1 - t / 1800);
    for (const b of bits) {
      b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.spin += 0.2;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin);
      ctx.fillStyle = b.color; ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  })(start);
}
