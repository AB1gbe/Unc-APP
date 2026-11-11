// The calm home page for visitors (session 72). Only four things: the
// banner, a few verified shops, a few categories and the newest requests,
// each with a link to its own tab (Shops, Categories, Requests).
import { Link } from 'react-router-dom';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';
import { ListingCard } from '../components/ui.jsx';
import { CategoryPreview, HeroStack, ShopsPreview } from '../components/Showcase.jsx';

export default function Landing() {
  const { data } = useApi('/listings');
  const latest = data?.listings ?? [];
  return (
    <>
      <section className="hero hero-art">
        <div className="hero-text">
          <h1>{t('Need something? Post it. Bahrain’s shops come to you.')}</h1>
          <p>{t('A PS5 in Riffa, a sofa for the majlis, a part nobody stocks. Say what you want and your budget, and verified shops send you their best price.')}</p>
          <Link className="btn" to="/register">{t('Post what you need')}</Link>
        </div>
        <HeroStack listings={latest} />
      </section>
      <ShopsPreview />
      <CategoryPreview />
      {latest.length > 0 && (
        <section className="latest">
          <div className="section-head">
            <h2>{t('Latest requests')}</h2>
            <Link to="/browse">{t('All requests')} <span className="flip">→</span></Link>
          </div>
          <div className="grid">{latest.slice(0, 3).map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        </section>
      )}
    </>
  );
}
