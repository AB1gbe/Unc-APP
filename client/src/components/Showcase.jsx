// Picture blocks for the front page (session 62): "How Unc works" in three
// illustrated steps, and a strip of category tiles to start browsing.
import { Link } from 'react-router-dom';
import { art, categoryArt } from '../art.js';
import { budget } from '../api.js';
import { t } from '../i18n.jsx';

// The banner's right side: the newest real requests, fanned like cards,
// instead of a drawing (session 62).
export function HeroStack({ listings }) {
  const top = (listings || []).slice(0, 2);
  if (!top.length) return null;
  return (
    <div className="hero-stack" aria-hidden="true">
      <img className="glow hero-glow" src={top[top.length - 1].images?.[0] || categoryArt(top[top.length - 1].category)} alt="" />
      {top.map((l, i) => (
        <div key={l.id} className={`hero-card hero-card-${i}`}>
          <img src={l.images?.[0] || categoryArt(l.category)} alt="" />
          <div className="hero-card-body">
            <div className="hero-card-title" dir="auto">{l.title}</div>
            <div className="hero-card-price">{budget(l)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// One slim, sideways-scrolling row of categories (session 72), like the
// category bar on Vinted or Depop. Replaces the How-it-works strip and the
// 16 big tiles, which took over the front page.
export function CategoryBar({ categories, active }) {
  if (!categories?.length) return null;
  return (
    <nav className="cat-bar" aria-label={t('Categories')}>
      <Link to="/browse" className={`cat-chip ${!active ? 'on' : ''}`}>
        <span>{t('All')}</span>
      </Link>
      {categories.map((c) => (
        <Link key={c} to={`/browse?category=${encodeURIComponent(c)}`} className={`cat-chip ${active === c ? 'on' : ''}`}>
          <img src={categoryArt(c)} alt="" loading="lazy" width="40" height="40" />
          <span>{t(c)}</span>
        </Link>
      ))}
    </nav>
  );
}
