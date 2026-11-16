import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { totals } from '../lib/analytics';
import { formatDate, money, number } from '../lib/format';
import type { Expense } from '../types';
import { StatusBadge } from './StatusBadge';

type SortKey = 'date' | 'subcategory' | 'quantity' | 'rate' | 'gross' | 'paid' | 'due' | 'status' | 'mode' | 'source';

interface Props {
  rows: Expense[];
  columns: Set<keyof Expense>;
  sourceColors: Map<string, string>;
}

const PAGE_SIZES = [20, 50, 100];

export function TransactionsTable({ rows, columns, sourceColors }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'date', dir: -1 });
  const [page, setPage] = useState(0);
  const { item, itemLang } = useLanguage();
  const [size, setSize] = useState(100);

  // Back to page 1 whenever the filtered rows change.
  const [prevRows, setPrevRows] = useState(rows);
  if (prevRows !== rows) {
    setPrevRows(rows);
    setPage(0);
  }

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      // Item names sort by what's on screen (Bengali or English).
      const av = sort.key === 'subcategory' ? item(a.subcategory) : a[sort.key];
      const bv = sort.key === 'subcategory' ? item(b.subcategory) : b[sort.key];
      let c: number;
      if (typeof av === 'string' && typeof bv === 'string') c = av.localeCompare(bv);
      else {
        // Numeric columns: blanks sort below every number.
        const an = typeof av === 'number' ? av : -Infinity;
        const bn = typeof bv === 'number' ? bv : -Infinity;
        c = an === bn ? 0 : an < bn ? -1 : 1;
      }
      return c * sort.dir || (b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }));
    });
    return out;
  }, [rows, sort, item]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const view = sorted.slice(page * size, page * size + size);
  const t = totals(rows);
  const showDue = columns.has('due') && t.due > 0;
  const has = (k: keyof Expense) => columns.has(k);
  const showQty = has('quantity') || has('unit');

  const th = (key: SortKey, label: string, cls = '') => {
    const active = sort.key === key;
    const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th scope="col" className={cls} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className={`sort ${active ? 'is-active' : ''}`}
          onClick={() => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'date' || cls.includes('num') ? -1 : 1 }))}
        >
          {label}
          <Icon size={13} aria-hidden />
        </button>
      </th>
    );
  };

  if (!rows.length) {
    return <div className="chart-empty">No entries match these filters.</div>;
  }

  return (
    <>
      {/* Desktop / tablet: real table */}
      <div className="table-scroll tx-table">
        <table className="table">
          <thead>
            <tr>
              {th('date', 'Date')}
              {th('subcategory', 'Item')}
              <th scope="col">Details</th>
              {showQty && th('quantity', 'Qty', 'num')}
              {has('rate') && th('rate', 'Rate', 'num')}
              {th('gross', 'Gross', 'num')}
              {th('paid', 'Paid', 'num')}
              {showDue && th('due', 'Due', 'num')}
              {th('status', 'Status')}
              {has('mode') && th('mode', 'Mode')}
              {has('source') && th('source', 'Funds')}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id}>
                <td className="nowrap">{formatDate(r.date)}</td>
                <td>
                  <span className="strong" lang={itemLang(r.subcategory)}>
                    {item(r.subcategory)}
                  </span>
                  {r.category && <span className="cell-sub">{r.category}</span>}
                </td>
                <td className="details">
                  {r.details || r.vendor ? (
                    <>
                      {r.details}
                      {r.vendor && <span className="cell-sub">{r.vendor}</span>}
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                {showQty && (
                  <td className="num nowrap">
                    {r.quantity !== null ? (
                      <>
                        {number(r.quantity)} <span className="unit">{r.unit}</span>
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                )}
                {has('rate') && <td className="num">{r.rate !== null ? number(r.rate) : <span className="muted">—</span>}</td>}
                <td className="num strong nowrap">{money(r.gross)}</td>
                <td className="num nowrap">{money(r.paid)}</td>
                {showDue && <td className={`num nowrap ${r.due > 0 ? 'due' : 'muted'}`}>{r.due > 0 ? money(r.due) : '—'}</td>}
                <td>
                  <StatusBadge status={r.status} />
                </td>
                {has('mode') && <td className="nowrap">{r.mode || <span className="muted">—</span>}</td>}
                {has('source') && (
                  <td className="nowrap">
                    {r.source ? (
                      <span className="keyed">
                        <span className="swatch" style={{ background: sourceColors.get(r.source) }} aria-hidden />
                        {r.source}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2 + 1 + (showQty ? 1 : 0) + (has('rate') ? 1 : 0)}>
                Total · {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              </th>
              <td className="num strong nowrap">{money(t.gross)}</td>
              <td className="num strong nowrap">{money(t.paid)}</td>
              {showDue && <td className="num strong nowrap due">{money(t.due)}</td>}
              <td colSpan={1 + (has('mode') ? 1 : 0) + (has('source') ? 1 : 0)} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Phone: stacked cards */}
      <ul className="tx-cards">
        {view.map((r) => (
          <li key={r.id} className="tx-card">
            <div className="tx-card-top">
              <div>
                <div className="strong" lang={itemLang(r.subcategory)}>
                  {item(r.subcategory)}
                </div>
                <div className="cell-sub">
                  {formatDate(r.date)}
                  {r.details && <> · {r.details}</>}
                </div>
              </div>
              <div className="tx-amount">{money(r.gross)}</div>
            </div>
            <div className="tx-card-meta">
              <StatusBadge status={r.status} />
              {r.quantity !== null && (
                <span className="pill">
                  {number(r.quantity)} {r.unit}
                  {r.rate !== null && <> × {number(r.rate)}</>}
                </span>
              )}
              {r.mode && <span className="pill">{r.mode}</span>}
              {r.source && (
                <span className="pill keyed">
                  <span className="swatch" style={{ background: sourceColors.get(r.source) }} aria-hidden />
                  {r.source}
                </span>
              )}
              {r.due > 0 && <span className="pill due">Due {money(r.due)}</span>}
            </div>
          </li>
        ))}
      </ul>

      <div className="pager">
        <label className="pager-size">
          <span>Rows</span>
          <select value={size} onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}>
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <span className="pager-info">
          {page * size + 1}–{Math.min(sorted.length, page * size + size)} of {sorted.length}
        </span>
        <div className="pager-btns">
          <button type="button" className="icon-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous page">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= pages - 1} aria-label="Next page">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
