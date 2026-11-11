// All categories (session 72), opened from "All categories" on the front
// page. The search bar filters the categories as you type; pressing Search
// looks for requests with those words.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import { CategoryTile } from '../components/Showcase.jsx';

export default function Categories() {
  const { categories } = useMeta();
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const words = q.trim().toLowerCase();
  const shown = categories.filter((c) => !words || c.toLowerCase().includes(words) || t(c).toLowerCase().includes(words));
  return (
    <div className="stack">
      <h1>{t('All categories')}</h1>
      <form className="searchbar searchbar-simple" onSubmit={(e) => { e.preventDefault(); navigate(`/browse?${new URLSearchParams(words ? { q: q.trim() } : {})}`); }}>
        <input autoFocus placeholder={t('Search categories or requests')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search')} />
        <button className="btn">{t('Search')}</button>
      </form>
      {shown.length === 0 ? <p className="muted">{t('No category matches. Press Search to look through requests instead.')}</p>
        : <div className="cat-tiles cat-all">{shown.map((c) => <CategoryTile key={c} category={c} />)}</div>}
    </div>
  );
}
