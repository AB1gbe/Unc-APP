// Picture blocks for the front page (session 62): "How Unc works" in three
// illustrated steps, and a strip of category tiles to start browsing.
import { Link } from 'react-router-dom';
import { art, categoryArt } from '../art.js';
import { budget } from '../api.js';
import { t } from '../i18n.jsx';

// The banner's right side: the newest real requests as a plain photo grid
// (session 68; before: tilted cards).
export function HeroPhotos({ listings }) {
  // Four photos when there are four requests, otherwise two (no gaps).
  const all = listings || [];
  if (all.length < 2) return null;
  const top = all.slice(0, all.length >= 4 ? 4 : 2);
  return (
    <div className="hero-photos">
      {top.map((l) => (
        <Link key={l.id} to={`/requests/${l.id}`} aria-label={l.title}>
          <img src={l.images?.[0] || categoryArt(l.category)} alt="" />
          <span>{budget(l)}</span>
        </Link>
      ))}
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    ['step-post.jpg', t('1. Post what you need'), t('A used phone, a sofa, a part. Add a photo and your budget.')],
    ['step-offers.jpg', t('2. Offers come to you'), t('Verified shops and finders reply privately, only about your request.')],
    ['step-deal.jpg', t('3. Pick the best deal'), t('Compare prices and ratings, agree in the chat, and rate each other.')],
  ];
  return (
    <section className="how" aria-labelledby="howTitle">
      <h2 id="howTitle" className="section-title">{t('How Unc works')}</h2>
      <div className="how-steps">
        {steps.map(([img, title, text]) => (
          <div key={img} className="how-step">
            <img src={art(img)} alt="" loading="lazy" width="400" height="300" />
            <h3>{title}</h3>
            <p className="muted small">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoryTiles({ categories }) {
  if (!categories?.length) return null;
  return (
    <section className="cat-tiles-wrap" aria-labelledby="catTitle">
      <h2 id="catTitle" className="section-title">{t('Browse by category')}</h2>
      <div className="cat-tiles">
        {categories.map((c) => (
          <Link key={c} className="cat-tile" to={`/browse?category=${encodeURIComponent(c)}`}>
            <img src={categoryArt(c)} alt="" loading="lazy" width="360" height="270" />
            <span>{t(c)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
