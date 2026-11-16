import { useCallback, useEffect, useState } from 'react';
import type { DatePreset, Filters, MultiFilterKey } from '../types';

export const EMPTY_FILTERS: Filters = {
  search: '',
  preset: 'all',
  from: '',
  to: '',
  categories: [],
  subcategories: [],
  sources: [],
  modes: [],
  statuses: [],
};

const MULTI: MultiFilterKey[] = ['categories', 'subcategories', 'sources', 'modes', 'statuses'];
const PRESETS: DatePreset[] = ['all', 'thisMonth', 'lastMonth', 'last30', 'last90', 'thisYear', 'custom'];

/** Filters live in the URL (?sub=Sand,Steel&range=last30) so a view can be bookmarked or shared. */
function fromUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  const list = (k: string) => (p.get(k) ? p.get(k)!.split('|').filter(Boolean) : []);
  const preset = (p.get('range') as DatePreset) ?? 'all';
  return {
    search: p.get('q') ?? '',
    preset: PRESETS.includes(preset) ? preset : 'all',
    from: p.get('from') ?? '',
    to: p.get('to') ?? '',
    categories: list('cat'),
    subcategories: list('sub'),
    sources: list('src'),
    modes: list('mode'),
    statuses: list('status'),
  };
}

const URL_KEYS: Record<MultiFilterKey, string> = {
  categories: 'cat',
  subcategories: 'sub',
  sources: 'src',
  modes: 'mode',
  statuses: 'status',
};

function toUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.search) p.set('q', f.search);
  if (f.preset !== 'all') p.set('range', f.preset);
  if (f.preset === 'custom') {
    if (f.from) p.set('from', f.from);
    if (f.to) p.set('to', f.to);
  }
  MULTI.forEach((k) => f[k].length && p.set(URL_KEYS[k], f[k].join('|')));
  const qs = p.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, '', next);
  }
}

export function activeFilterCount(f: Filters) {
  return MULTI.reduce((n, k) => n + (f[k].length ? 1 : 0), 0) + (f.preset !== 'all' ? 1 : 0) + (f.search ? 1 : 0);
}

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(fromUrl);

  useEffect(() => toUrl(filters), [filters]);

  const set = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const toggle = useCallback((key: MultiFilterKey, value: string) => {
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  }, []);

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return { filters, set, toggle, reset, setFilters };
}
