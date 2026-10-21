import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, ListingCard, Loading } from '../components/ui.jsx';
import { useMeta } from '../hooks.js';

export default function Browse() {
  const { user } = useAuth();
  const { categories } = useMeta();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState({ q: params.get('q') || '', city: params.get('city') || '', category: params.get('category') || '' });
  const [result, setResult] = useState({ listings: [], hasMore: false, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api(`/listings?${params.toString()}`)
      .then((r) => { setResult(r); setError(null); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [params]);

  function search(e) {
    e.preventDefault();
    const next = {};
    Object.entries(draft).forEach(([k, v]) => v && (next[k] = v));
    setParams(next);
  }

  const page = Number(params.get('page') || 1);
  const goPage = (p) => { const n = new URLSearchParams(params); n.set('page', p); setParams(n); };

  return (
    <>
      {!user && (
        <section className="hero">
          <h1>Tell people what you want. Let them come to you.</h1>
          <p>Post a request for anything — a used phone, a sofa, a hard-to-find part. Verified shops and finders contact you privately with offers.</p>
          <Link className="btn" to="/register">Post your first request</Link>
        </section>
      )}
      <form className="searchbar" onSubmit={search}>
        <input placeholder="What are people looking for?" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} aria-label="Search" />
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} aria-label="City" />
        <button className="btn">Search</button>
      </form>
      <ErrorBox error={error} />
      {loading ? <Loading /> : result.listings.length === 0 ? (
        <div className="card empty">
          <p>No open requests match your search.</p>
          {user && <Link className="btn" to="/requests/new">Post a request</Link>}
        </div>
      ) : (
        <div className="grid">
          {result.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
      {(page > 1 || result.hasMore) && (
        <div className="row" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="btn secondary" disabled={page <= 1} onClick={() => goPage(page - 1)}>← Newer</button>
          <span className="muted">Page {page}</span>
          <button className="btn secondary" disabled={!result.hasMore} onClick={() => goPage(page + 1)}>Older →</button>
        </div>
      )}
    </>
  );
}
