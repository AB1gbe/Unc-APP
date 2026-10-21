import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Load data from the API: const { data, error, loading, reload } = useApi('/listings')
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      setState({ data: await api(path), error: null, loading: false });
    } catch (error) {
      setState({ data: null, error, loading: false });
    }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

let metaCache = null;
export function useMeta() {
  const [meta, setMeta] = useState(metaCache || { categories: [], currencies: ['USD'] });
  useEffect(() => {
    if (metaCache) return;
    api('/meta').then((m) => { metaCache = m; setMeta(m); }).catch(() => {});
  }, []);
  return meta;
}
