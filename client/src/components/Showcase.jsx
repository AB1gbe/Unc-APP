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

export function HowItWorks() {
  const steps = [
    ['step-post.jpg', t('1. Post what you need'), t('A used phone, a sofa, a part. Add a photo and your budget.')],
    ['step-offers.jpg', t('2. Offers come to you'), t('Verified shops and finders reply privately, only about your request.')],
    ['step-deal.jpg', t('3. Pick the best deal'), t('Compare prices and ratings, agree in the chat, and rate each other.')],
  ];
  return (
    <section className="how" aria-labelledby="howTitle">
      <h2 id="howTitle">{t('How Unc works')}</h2>
      <div className="how-steps">
        {steps.map(([img, title, text]) => (
          <div key={img} className="glow-wrap">
            <img className="glow" src={art(img)} alt="" aria-hidden="true" loading="lazy" />
            <div className="how-step">
            <img src={art(img)} alt="" loading="lazy" width="400" height="300" />
            <h3>{title}</h3>
            <p className="muted small">{text}</p>
          </div>
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
      <h2 id="catTitle">{t('Browse by category')}</h2>
      <div className="cat-tiles">
        {categories.map((c) => (
          <div key={c} className="glow-wrap">
            <img className="glow" src={categoryArt(c)} alt="" aria-hidden="true" loading="lazy" />
            <Link className="cat-tile" to={`/browse?category=${encodeURIComponent(c)}`}>
              <img src={categoryArt(c)} alt="" loading="lazy" width="360" height="270" />
              <span>{t(c)}</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
