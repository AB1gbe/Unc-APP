// Picture blocks for the front page (session 62): "How Unc works" in three
// illustrated steps, and a strip of category tiles to start browsing.
import { Link } from 'react-router-dom';
import { art, categoryArt } from '../art.js';
import { budget } from '../api.js';
import { t, tn } from '../i18n.jsx';
import { useApi, useMeta } from '../hooks.js';
import Icon from './Icon.jsx';

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

// The front page shows only a few categories (session 72); "All categories"
// opens /categories, which has a search bar and every category.
export const FEATURED_CATEGORIES = ['Electronics', 'Phones & Tablets', 'Home & Furniture', 'Vehicles & Parts'];

export function CategoryTile({ category }) {
  return (
    <div className="glow-wrap">
      <img className="glow" src={categoryArt(category)} alt="" aria-hidden="true" loading="lazy" />
      <Link className="cat-tile" to={`/browse?category=${encodeURIComponent(category)}`}>
        <img src={categoryArt(category)} alt="" loading="lazy" width="360" height="270" />
        <span>{t(category)}</span>
      </Link>
    </div>
  );
}

export function CategoryPreview() {
  const { categories } = useMeta();
  return (
    <section className="cat-tiles-wrap" aria-labelledby="catTitle">
      <div className="section-head">
        <h2 id="catTitle">{t('Browse by category')}</h2>
        <Link to="/categories">{t('All categories')} <span className="flip">→</span></Link>
      </div>
      <div className="cat-tiles cat-preview">
        {FEATURED_CATEGORIES.map((c) => <CategoryTile key={c} category={c} />)}
        <Link className="cat-tile cat-more" to="/categories">
          <span className="cat-more-n">{categories.length || ''}</span>
          <span>{t('All categories')}</span>
        </Link>
      </div>
    </section>
  );
}

// A verified shop (session 72: Unc puts businesses first).
export function ShopCard({ shop }) {
  const photo = shop.coverUrl || shop.avatarUrl;
  return (
    <div className="glow-wrap">
      {photo && <img className="glow" src={photo} alt="" aria-hidden="true" loading="lazy" />}
      <Link className="shop-card" to={`/members/${shop.id}`}>
        <div className="shop-card-cover">{photo && <img src={photo} alt="" loading="lazy" />}</div>
        <div className="shop-card-body">
          <div className="shop-card-name"><bdi>{shop.displayName}</bdi> <Icon name="check" className="verified-icon" /></div>
          <div className="muted small">
            {shop.shopArea || shop.city ? <><Icon name="pin" /> <bdi>{shop.shopArea || shop.city}</bdi></> : null}
            {shop.rating?.count > 0 && <> · <Icon name="star" /> {shop.rating.average.toFixed(1)} ({shop.rating.count})</>}
            {shop.sales > 0 && <> · {tn(shop.sales, '{n} sale', '{n} sales')}</>}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function ShopsPreview() {
  const { data } = useApi('/shops?limit=4');
  if (!data?.shops?.length) return null;
  return (
    <section className="shops-preview" aria-labelledby="shopsTitle">
      <div className="section-head">
        <h2 id="shopsTitle">{t('Verified shops')}</h2>
        <Link to="/shops">{t('All shops')} <span className="flip">→</span></Link>
      </div>
      <p className="muted small" style={{ marginTop: '-.4rem' }}>{t('Real businesses in Bahrain, checked by Unc. They answer requests with offers.')}</p>
      <div className="shop-grid">{data.shops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
    </section>
  );
}
