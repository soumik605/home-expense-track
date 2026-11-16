import { CalendarDays, CircleDollarSign, CreditCard, Layers, Package, Search, SlidersHorizontal, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { activeFilterCount } from '../hooks/useFilters';
import { useLanguage } from '../hooks/useLanguage';
import { applyFilters, BLANK, distinct, rangeSummary } from '../lib/analytics';
import type { Expense, Filters, MultiFilterKey } from '../types';
import { DateRange, DateRangePanel } from './DateRange';
import { MultiSelect, OptionList, type Option } from './MultiSelect';
import { Sheet } from './Sheet';

interface Dimension {
  key: MultiFilterKey;
  label: string;
  field: keyof Expense;
  icon: ReactNode;
}

const DIMENSIONS: Dimension[] = [
  { key: 'categories', label: 'Category', field: 'category', icon: <Layers size={16} aria-hidden /> },
  { key: 'subcategories', label: 'Item', field: 'subcategory', icon: <Package size={16} aria-hidden /> },
  { key: 'sources', label: 'Funds', field: 'source', icon: <CircleDollarSign size={16} aria-hidden /> },
  { key: 'modes', label: 'Mode', field: 'mode', icon: <CreditCard size={16} aria-hidden /> },
  { key: 'statuses', label: 'Status', field: 'status', icon: <Tag size={16} aria-hidden /> },
];

interface Props {
  rows: Expense[];
  columns: Set<keyof Expense>;
  filters: Filters;
  resultCount: number;
  colors: Partial<Record<MultiFilterKey, Map<string, string>>>;
  onPatch: (patch: Partial<Filters>) => void;
  onToggle: (key: MultiFilterKey, value: string) => void;
  onReset: () => void;
}

export function FilterBar({ rows, columns, filters, resultCount, colors, onPatch, onToggle, onReset }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { item, itemLang } = useLanguage();
  // Only item names are translated; other values show exactly as in the sheet.
  const fmt = (key: MultiFilterKey) => (key === 'subcategories' ? { format: item, formatLang: itemLang } : {});
  const [search, setSearch] = useState(filters.search);

  // Debounce typing so the charts don't re-render on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => search !== filters.search && onPatch({ search }), 180);
    return () => clearTimeout(t);
  }, [search, filters.search, onPatch]);
  // Pick up outside changes (chip removed, "Clear all") without an effect.
  const [prevSearch, setPrevSearch] = useState(filters.search);
  if (prevSearch !== filters.search) {
    setPrevSearch(filters.search);
    setSearch(filters.search);
  }

  const dims = useMemo(
    () =>
      DIMENSIONS.filter((d) => {
        if (d.key === 'statuses') return true;
        if (!columns.has(d.field)) return false;
        return d.key !== 'categories' || distinct(rows, (r) => String(r[d.field])).length > 1;
      }),
    [rows, columns],
  );

  // Faceted counts: each list counts rows matching every *other* active filter.
  const options = useMemo(() => {
    const out = {} as Record<MultiFilterKey, Option[]>;
    for (const d of dims) {
      const all = distinct(rows, (r) => String(r[d.field] ?? ''));
      const facet = applyFilters(rows, filters, d.key);
      const counts = new Map<string, number>();
      facet.forEach((r) => {
        const v = String(r[d.field] ?? '') || BLANK;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      });
      out[d.key] = all.map((v) => ({ value: v, count: counts.get(v) ?? 0, color: colors[d.key]?.get(v) }));
    }
    return out;
  }, [dims, rows, filters, colors]);

  const minDate = rows[0]?.date;
  const maxDate = rows[rows.length - 1]?.date;
  const count = activeFilterCount(filters);

  const only = (key: MultiFilterKey) => (v: string) => onPatch({ [key]: [v] } as Partial<Filters>);

  return (
    <div className="filterbar" role="search">
      <div className="filterbar-row">
        <label className="search">
          <Search size={17} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item, details, payee…"
            aria-label="Search expenses"
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </label>

        <div className="filter-controls">
          <DateRange filters={filters} minDate={minDate} maxDate={maxDate} onChange={onPatch} />
          {dims.map((d) => (
            <MultiSelect
              key={d.key}
              label={d.label}
              icon={d.icon}
              options={options[d.key]}
              selected={filters[d.key]}
              onToggle={(v) => onToggle(d.key, v)}
              onClear={() => onPatch({ [d.key]: [] } as Partial<Filters>)}
              onOnly={only(d.key)}
              {...fmt(d.key)}
            />
          ))}
        </div>

        <button type="button" className="fbtn mobile-filter-btn" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal size={16} aria-hidden />
          <span className="fbtn-label">Filters</span>
          {count > 0 && <span className="count-dot">{count}</span>}
        </button>
      </div>

      {count > 0 && (
        <div className="chips" aria-label="Active filters">
          <span className="chips-result">
            {resultCount} {resultCount === 1 ? 'entry' : 'entries'}
          </span>
          {filters.search && (
            <Chip onRemove={() => onPatch({ search: '' })} label={`“${filters.search}”`} />
          )}
          {filters.preset !== 'all' && (
            <Chip
              icon={<CalendarDays size={13} aria-hidden />}
              onRemove={() => onPatch({ preset: 'all', from: '', to: '' })}
              label={rangeSummary(filters)}
            />
          )}
          {dims.flatMap((d) =>
            filters[d.key].map((v) => (
              <Chip
                key={`${d.key}:${v}`}
                swatch={colors[d.key]?.get(v)}
                label={d.key === 'subcategories' ? item(v) : v}
                prefix={d.label}
                onRemove={() => onToggle(d.key, v)}
              />
            )),
          )}
          <button type="button" className="link chips-clear" onClick={onReset}>
            Clear all
          </button>
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={onReset} disabled={!count}>
              Clear all
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setSheetOpen(false)}>
              Show {resultCount} {resultCount === 1 ? 'entry' : 'entries'}
            </button>
          </>
        }
      >
        <section className="sheet-section">
          <h3>Date range</h3>
          <DateRangePanel filters={filters} minDate={minDate} maxDate={maxDate} onChange={onPatch} />
        </section>
        {dims.map((d) => (
          <section className="sheet-section" key={d.key}>
            <h3>{d.label}</h3>
            <OptionList
              options={options[d.key]}
              selected={filters[d.key]}
              onToggle={(v) => onToggle(d.key, v)}
              onClear={() => onPatch({ [d.key]: [] } as Partial<Filters>)}
              {...fmt(d.key)}
            />
          </section>
        ))}
      </Sheet>
    </div>
  );
}

function Chip({ label, prefix, swatch, icon, onRemove }: { label: string; prefix?: string; swatch?: string; icon?: ReactNode; onRemove: () => void }) {
  return (
    <span className="chip">
      {icon}
      {swatch && <span className="swatch" style={{ background: swatch }} aria-hidden />}
      {prefix && <span className="chip-prefix">{prefix}:</span>}
      <span className="chip-label">{label}</span>
      <button type="button" onClick={onRemove} aria-label={`Remove filter ${prefix ? `${prefix} ` : ''}${label}`}>
        <X size={13} />
      </button>
    </span>
  );
}
