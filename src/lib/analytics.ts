import type { DatePreset, Expense, Filters } from '../types';
import { formatDate, toISO } from './format';
import { bengaliItem } from './itemNames';

/** Label used for blank cells (e.g. no payment mode recorded). */
export const BLANK = 'Not set';

export const PRESET_LABELS: Record<DatePreset, string> = {
  all: 'All time',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  last30: 'Last 30 days',
  last90: 'Last 90 days',
  thisYear: 'This year',
  custom: 'Custom range',
};

export function presetRange(f: Pick<Filters, 'preset' | 'from' | 'to'>, today = new Date()): [string, string] | null {
  const y = today.getFullYear();
  const m = today.getMonth();
  const ago = (days: number) => toISO(new Date(y, m, today.getDate() - days));
  switch (f.preset) {
    case 'all':
      return null;
    case 'thisMonth':
      return [toISO(new Date(y, m, 1)), toISO(today)];
    case 'lastMonth':
      return [toISO(new Date(y, m - 1, 1)), toISO(new Date(y, m, 0))];
    case 'last30':
      return [ago(29), toISO(today)];
    case 'last90':
      return [ago(89), toISO(today)];
    case 'thisYear':
      return [toISO(new Date(y, 0, 1)), toISO(today)];
    case 'custom':
      if (!f.from && !f.to) return null;
      return [f.from || '0000-01-01', f.to || '9999-12-31'];
  }
}

export function rangeSummary(f: Filters) {
  if (f.preset !== 'custom') return PRESET_LABELS[f.preset];
  const r = presetRange(f);
  if (!r) return 'All time';
  if (!f.from) return `Until ${formatDate(f.to)}`;
  if (!f.to) return `From ${formatDate(f.from)}`;
  return `${formatDate(r[0])} – ${formatDate(r[1])}`;
}

export function applyFilters(rows: Expense[], f: Filters, skip?: keyof Filters): Expense[] {
  const range = skip === 'preset' ? null : presetRange(f);
  const q = f.search.trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];
  const inList = (list: string[], v: string, key: keyof Filters) =>
    skip === key || list.length === 0 || list.includes(v || BLANK);

  return rows.filter((r) => {
    if (range && (r.date < range[0] || r.date > range[1])) return false;
    if (!inList(f.categories, r.category, 'categories')) return false;
    if (!inList(f.subcategories, r.subcategory, 'subcategories')) return false;
    if (!inList(f.sources, r.source, 'sources')) return false;
    if (!inList(f.modes, r.mode, 'modes')) return false;
    if (!inList(f.statuses, r.status, 'statuses')) return false;
    if (terms.length) {
      const hay = `${r.subcategory} ${bengaliItem(r.subcategory) ?? ''} ${r.category} ${r.details} ${r.vendor} ${r.unit} ${r.mode} ${r.source} ${r.status} ${r.gross}`.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export interface Totals {
  gross: number;
  paid: number;
  due: number;
  count: number;
}

export function totals(rows: Expense[]): Totals {
  return rows.reduce(
    (t, r) => ({ gross: t.gross + r.gross, paid: t.paid + r.paid, due: t.due + r.due, count: t.count + 1 }),
    { gross: 0, paid: 0, due: 0, count: 0 },
  );
}

export interface Group {
  key: string;
  gross: number;
  paid: number;
  due: number;
  count: number;
}

export function groupBy(rows: Expense[], key: (r: Expense) => string): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const k = key(r) || BLANK;
    const g = map.get(k) ?? { key: k, gross: 0, paid: 0, due: 0, count: 0 };
    g.gross += r.gross;
    g.paid += r.paid;
    g.due += r.due;
    g.count++;
    map.set(k, g);
  }
  return [...map.values()].sort((a, b) => b.gross - a.gross);
}

/** Distinct values ordered by all-time spend — also the stable color order for that dimension. */
export function distinct(rows: Expense[], key: (r: Expense) => string): string[] {
  return groupBy(rows, key).map((g) => g.key);
}

/** Every month between the first and last expense, so gaps show as empty columns rather than vanishing. */
export function monthly(rows: Expense[], stackKey: (r: Expense) => string, stacks: string[]) {
  if (!rows.length) return [];
  const first = rows.reduce((a, r) => (r.date < a ? r.date : a), rows[0].date);
  const last = rows.reduce((a, r) => (r.date > a ? r.date : a), rows[0].date);
  const months: string[] = [];
  let [y, m] = first.slice(0, 7).split('-').map(Number);
  const end = last.slice(0, 7);
  for (let guard = 0; guard < 240; guard++) {
    const k = `${y}-${String(m).padStart(2, '0')}`;
    months.push(k);
    if (k >= end) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  const data = months.map((month) => {
    const row: Record<string, number | string> = { month, total: 0 };
    stacks.forEach((s) => (row[s] = 0));
    return row;
  });
  const idx = new Map(months.map((k, i) => [k, i]));
  for (const r of rows) {
    const row = data[idx.get(r.date.slice(0, 7))!];
    const s = stackKey(r) || BLANK;
    row[s] = ((row[s] as number) ?? 0) + r.gross;
    row.total = (row.total as number) + r.gross;
  }
  return data;
}

/** Running total of spend by date. */
export function cumulative(rows: Expense[]) {
  const byDate = new Map<string, number>();
  for (const r of rows) byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.gross);
  let run = 0;
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => {
      run += amount;
      return { date, ts: new Date(`${date}T00:00:00`).getTime(), amount, total: run };
    });
}

export interface MaterialRow {
  subcategory: string;
  unit: string;
  quantity: number;
  gross: number;
  avgRate: number;
  minRate: number;
  maxRate: number;
  count: number;
}

/** Quantity-tracked items (rows that have a unit + quantity) rolled up per item & unit. */
export function materials(rows: Expense[]): MaterialRow[] {
  const map = new Map<string, MaterialRow>();
  for (const r of rows) {
    if (!r.unit || r.quantity === null || r.quantity === 0) continue;
    const k = `${r.subcategory}__${r.unit}`;
    const rate = r.rate ?? r.gross / r.quantity;
    const g = map.get(k) ?? {
      subcategory: r.subcategory,
      unit: r.unit,
      quantity: 0,
      gross: 0,
      avgRate: 0,
      minRate: Infinity,
      maxRate: -Infinity,
      count: 0,
    };
    g.quantity += r.quantity;
    g.gross += r.gross;
    g.minRate = Math.min(g.minRate, rate);
    g.maxRate = Math.max(g.maxRate, rate);
    g.count++;
    map.set(k, g);
  }
  return [...map.values()]
    .map((g) => ({ ...g, avgRate: g.gross / g.quantity }))
    .sort((a, b) => b.gross - a.gross);
}

export function toCsv(rows: Expense[]) {
  const head = ['Date', 'Category', 'Subcategory', 'Details', 'Vendor', 'Unit', 'Quantity', 'Rate', 'Gross Amount', 'Paid Amount', 'Due Amount', 'Payment Status', 'Payment Mode', 'Source of Funds'];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [r.date, r.category, r.subcategory, r.details, r.vendor, r.unit, r.quantity, r.rate, r.gross, r.paid, r.due, r.status, r.mode, r.source]
      .map(esc)
      .join(','),
  );
  return [head.join(','), ...lines].join('\n');
}
