import { useCallback, useEffect, useRef, useState } from 'react';
import { sampleData } from '../data/sample';
import { loadFromFile, loadFromUrl } from '../lib/sources';
import type { Expense, LoadedData, SourceConfig } from '../types';

const CONFIG_KEY = 'hbt:source';
const CACHE_KEY = 'hbt:cache';
const ENV_KEY = 'hbt:defaultSheet';

/**
 * Default sheet from the environment (.env / .env.local):
 *   VITE_DEFAULT_SHEET=https://docs.google.com/spreadsheets/d/…   (Google Sheet link)
 *   VITE_DEFAULT_SHEET=expenses.xlsx                              (file in /public)
 * A bare file name is resolved against the app's base path, so it works under sub-paths too.
 */
export const DEFAULT_SHEET: string | null = (() => {
  const raw = (import.meta.env.VITE_DEFAULT_SHEET || import.meta.env.VITE_SHEET_URL || '').trim();
  if (!raw) return null;
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('/')) return raw;
  return `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${raw.replace(/^\.\//, '')}`;
})();

interface Cache {
  rows: Expense[];
  columns: (keyof Expense)[];
  sheetName?: string;
  syncedAt: number;
  sourceKey: string;
}

const sourceKey = (c: SourceConfig) => (c.kind === 'url' ? `url:${c.url}` : c.kind === 'file' ? `file:${c.name}` : 'sample');

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the app still works, it just won't remember */
  }
}

/**
 * Which source to open with:
 * 1. A newly set or changed default sheet always wins, so editing .env takes effect.
 * 2. Otherwise the source last picked in this browser (connect dialog) is kept.
 * 3. Otherwise the default sheet, or sample data if none is configured.
 */
function resolveInitialConfig(): SourceConfig {
  const fallback: SourceConfig = DEFAULT_SHEET ? { kind: 'url', url: DEFAULT_SHEET } : { kind: 'sample' };
  const seenDefault = read<string>(ENV_KEY);
  if (DEFAULT_SHEET && seenDefault !== DEFAULT_SHEET) {
    write(ENV_KEY, DEFAULT_SHEET);
    write(CONFIG_KEY, fallback);
    return fallback;
  }
  if (!DEFAULT_SHEET && seenDefault) {
    // Default was removed from .env: drop a stored choice that only pointed at it.
    try {
      localStorage.removeItem(ENV_KEY);
    } catch {
      /* ignore */
    }
    const stored = read<SourceConfig>(CONFIG_KEY);
    if (stored?.kind === 'url' && stored.url === seenDefault) return fallback;
  }
  return read<SourceConfig>(CONFIG_KEY) ?? fallback;
}

let initial: SourceConfig | null = null;
/** Resolved once per page load (the hook's two lazy initialisers share it). */
const initialConfig = () => (initial ??= resolveInitialConfig());

function fromCache(config: SourceConfig): { data: LoadedData; syncedAt: number } | null {
  const c = read<Cache>(CACHE_KEY);
  if (!c || c.sourceKey !== sourceKey(config)) return null;
  return { data: { rows: c.rows, columns: new Set(c.columns), sheetName: c.sheetName, warnings: [] }, syncedAt: c.syncedAt };
}

export type LoadStatus = 'idle' | 'loading' | 'error';

export function useExpenseData() {
  const [config, setConfig] = useState<SourceConfig>(initialConfig);
  const [state, setState] = useState(() => {
    const cfg = initialConfig();
    if (cfg.kind === 'sample') return { data: sampleData(), syncedAt: Date.now() };
    return fromCache(cfg) ?? { data: null as LoadedData | null, syncedAt: 0 };
  });
  const [status, setStatus] = useState<LoadStatus>(config.kind === 'url' ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef(0);

  const commit = useCallback((cfg: SourceConfig, data: LoadedData) => {
    const syncedAt = Date.now();
    setConfig(cfg);
    setState({ data, syncedAt });
    setError(null);
    setStatus('idle');
    write(CONFIG_KEY, cfg);
    if (cfg.kind !== 'sample') {
      write(CACHE_KEY, {
        rows: data.rows,
        columns: [...data.columns],
        sheetName: data.sheetName,
        syncedAt,
        sourceKey: sourceKey(cfg),
      } satisfies Cache);
    }
  }, []);

  const fetchUrl = useCallback(
    async (cfg: Extract<SourceConfig, { kind: 'url' }>, { throwOnError = false } = {}) => {
      const ticket = ++inflight.current;
      setStatus('loading');
      try {
        const data = await loadFromUrl(cfg.url);
        if (ticket === inflight.current) commit(cfg, data);
      } catch (e) {
        if (ticket !== inflight.current) return;
        const msg = e instanceof Error ? e.message : String(e);
        setStatus('error');
        setError(msg);
        if (throwOnError) throw e;
      }
    },
    [commit],
  );

  // Initial load for a linked sheet (cached data stays on screen meanwhile).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (config.kind === 'url') void fetchUrl(config);
  }, [config, fetchUrl]);

  // Re-sync a linked sheet when the tab regains focus (at most once a minute).
  useEffect(() => {
    if (config.kind !== 'url') return;
    const onFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - state.syncedAt > 60_000) void fetchUrl(config);
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [config, state.syncedAt, fetchUrl]);

  const connectUrl = useCallback((url: string) => fetchUrl({ kind: 'url', url }, { throwOnError: true }), [fetchUrl]);

  const connectFile = useCallback(
    async (file: File) => {
      inflight.current++;
      setStatus('loading');
      try {
        const data = await loadFromFile(file);
        commit({ kind: 'file', name: file.name }, data);
      } catch (e) {
        setStatus('idle');
        throw e;
      }
    },
    [commit],
  );

  const loadSample = useCallback(() => {
    inflight.current++;
    commit({ kind: 'sample' }, sampleData());
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
  }, [commit]);

  const loadDefault = useCallback(() => {
    if (!DEFAULT_SHEET) return Promise.resolve();
    return fetchUrl({ kind: 'url', url: DEFAULT_SHEET }, { throwOnError: true });
  }, [fetchUrl]);

  const refresh = useCallback(() => {
    if (config.kind === 'url') void fetchUrl(config);
  }, [config, fetchUrl]);

  return {
    config,
    data: state.data,
    syncedAt: state.syncedAt,
    status,
    error,
    dismissError: () => setError(null),
    refresh,
    connectUrl,
    connectFile,
    loadSample,
    loadDefault,
    defaultSheet: DEFAULT_SHEET,
    isDefault: config.kind === 'url' && config.url === DEFAULT_SHEET,
  };
}
