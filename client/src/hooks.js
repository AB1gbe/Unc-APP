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

// Runs `fn` now and then every `ms` milliseconds, but only while the browser
// tab is visible. Hidden tabs stop polling; coming back runs `fn` at once.
// Saves server work and phone battery.
export function usePolling(fn, ms, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    const start = () => {
      if (timer) return;
      fn();
      timer = setInterval(fn, ms);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fn, ms, enabled]);
}
