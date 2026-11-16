import type { Expense, LoadedData } from '../types';
import { toISO } from './format';

type Field = Exclude<keyof Expense, 'id' | 'due'> | 'due';

/**
 * Header aliases — normalised (lowercase, alphanumerics only).
 * Lets the dashboard read sheets whose columns are named slightly differently.
 */
const ALIASES: Record<Field, string[]> = {
  date: ['date', 'txndate', 'transactiondate', 'paymentdate', 'billdate', 'expensedate', 'day'],
  category: ['category', 'maincategory', 'head', 'expensehead', 'group', 'phase', 'stage'],
  subcategory: ['subcategory', 'subcat', 'item', 'itemname', 'material', 'type', 'expensetype'],
  details: ['details', 'detail', 'description', 'desc', 'notes', 'note', 'remarks', 'remark', 'narration', 'particulars'],
  vendor: ['vendor', 'supplier', 'payee', 'party', 'paidto', 'shop', 'contractor', 'vendorname'],
  unit: ['unit', 'units', 'uom'],
  quantity: ['quantity', 'qty', 'quantities', 'nos'],
  rate: ['rate', 'price', 'unitprice', 'rateperunit', 'unitrate'],
  gross: ['grossamount', 'gross', 'amount', 'total', 'totalamount', 'billamount', 'cost', 'totalcost'],
  paid: ['paidamount', 'paid', 'amountpaid', 'payment', 'paidamt'],
  due: ['dueamount', 'due', 'balance', 'balanceamount', 'pending', 'pendingamount', 'outstanding', 'dueamt'],
  status: ['paymentstatus', 'status'],
  mode: ['paymentmode', 'mode', 'paymentmethod', 'method', 'paidvia'],
  source: ['sourceoffunds', 'fundsource', 'sourceoffund', 'source', 'funding', 'fundedby', 'funds'],
};

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

function mapHeader(row: unknown[]): Partial<Record<Field, number>> {
  const map: Partial<Record<Field, number>> = {};
  row.forEach((cell, idx) => {
    const key = norm(cell);
    if (!key) return;
    for (const [field, aliases] of Object.entries(ALIASES) as [Field, string[]][]) {
      if (map[field] === undefined && aliases.includes(key)) {
        map[field] = idx;
        return;
      }
    }
  });
  return map;
}

/** "₹18,000.00", "Rs. 1,800", "1800", 1800 → 1800 */
export function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[₹,\s]|rs\.?|inr/gi, '');
  if (!s || s === '-') return null;
  const negative = /^\(.*\)$/.test(s);
  const n = parseFloat(s.replace(/[()]/g, ''));
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

const MON: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const iso = (y: number, m: number, d: number) => {
  if (y < 100) y += 2000;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return toISO(dt);
};

/**
 * Accepts Excel serials, Date objects, "21-Apr-2026", "2026-04-21",
 * "21/04/2026" (day-first, as used in India) and Google's "Date(2026,3,21)".
 */
export function parseDate(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : toISO(v);
  if (typeof v === 'number') {
    if (v < 1 || v > 2958465) return null;
    // Excel serial → calendar date (1900 date system; epoch 1899-12-30 absorbs Excel's 1900 leap-year bug).
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86_400_000);
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = String(v).trim();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^Date\((\d+),(\d+),(\d+)/))) return iso(+m[1], +m[2] + 1, +m[3]);
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return iso(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[-/. ]([A-Za-z]{3,9})[-/., ]+(\d{2,4})$/))) {
    const mon = MON[m[2].slice(0, 4).toLowerCase()] ?? MON[m[2].slice(0, 3).toLowerCase()];
    return mon ? iso(+m[3], mon, +m[1]) : null;
  }
  if ((m = s.match(/^([A-Za-z]{3,9})[ -](\d{1,2}),?[ -](\d{2,4})$/))) {
    const mon = MON[m[1].slice(0, 3).toLowerCase()];
    return mon ? iso(+m[3], mon, +m[2]) : null;
  }
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) {
    // Day-first by default; fall back to month-first only when day-first is impossible.
    return iso(+m[3], +m[2], +m[1]) ?? iso(+m[3], +m[1], +m[2]);
  }
  if (/^\d+(\.\d+)?$/.test(s)) return parseDate(Number(s));
  return null;
}

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

/** Title-case short labels so "upi", "UPI " and "Upi" don't become three filter values. */
function label(v: unknown) {
  const s = text(v).replace(/\s+/g, ' ');
  if (!s) return '';
  if (s.length <= 4 && s === s.toUpperCase()) return s; // UPI, JCB, NEFT
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function deriveStatus(gross: number, paid: number) {
  if (gross <= 0) return 'Paid';
  if (paid >= gross - 0.005) return 'Paid';
  if (paid > 0) return 'Partially Paid';
  return 'Unpaid';
}

/** Turn a 2D array of cells (first matching row = header) into expenses. */
export function rowsToExpenses(grid: unknown[][]): LoadedData | null {
  let headerIdx = -1;
  let map: Partial<Record<Field, number>> = {};
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const candidate = mapHeader(grid[i] ?? []);
    const hits = Object.keys(candidate).length;
    if (candidate.date !== undefined && (candidate.gross !== undefined || candidate.paid !== undefined || hits >= 3)) {
      headerIdx = i;
      map = candidate;
      break;
    }
  }
  if (headerIdx < 0) return null;

  const columns = new Set<keyof Expense>(['date', 'gross', 'paid', 'due']);
  (Object.keys(map) as Field[]).forEach((f) => columns.add(f));

  const get = (row: unknown[], f: Field) => (map[f] === undefined ? undefined : row[map[f]!]);
  const rows: Expense[] = [];
  const warnings: string[] = [];
  let badDates = 0;

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const r = grid[i] ?? [];
    if (!r.some((c) => text(c) !== '')) continue;
    if (r.some((c) => typeof c === 'string' && /^\s*(grand\s+|sub\s*)?totals?\s*:?\s*$/i.test(c))) continue; // summary rows

    const date = parseDate(get(r, 'date'));
    const quantity = parseNumber(get(r, 'quantity'));
    const rate = parseNumber(get(r, 'rate'));
    let gross = parseNumber(get(r, 'gross'));
    if (gross === null && quantity !== null && rate !== null) gross = quantity * rate;
    let paid = parseNumber(get(r, 'paid'));
    const dueCell = parseNumber(get(r, 'due'));
    const rawStatus = label(get(r, 'status'));

    if (gross === null && paid === null) continue; // totals rows, notes, empty template rows
    if (!date) {
      badDates++;
      continue;
    }
    if (gross === null) gross = (paid ?? 0) + (dueCell ?? 0);
    if (paid === null) {
      if (dueCell !== null) paid = gross - dueCell;
      else if (map.status !== undefined && rawStatus && !/^paid$/i.test(rawStatus)) paid = 0;
      else paid = gross;
    }
    const due = dueCell ?? Math.max(0, gross - paid);

    rows.push({
      id: `r${i}`,
      date,
      category: label(get(r, 'category')),
      subcategory: label(get(r, 'subcategory')) || 'Uncategorised',
      details: text(get(r, 'details')),
      vendor: text(get(r, 'vendor')),
      unit: label(get(r, 'unit')),
      quantity,
      rate,
      gross,
      paid,
      due,
      status: rawStatus || deriveStatus(gross, paid),
      mode: label(get(r, 'mode')),
      source: label(get(r, 'source')),
    });
  }

  if (badDates) warnings.push(`${badDates} row${badDates > 1 ? 's' : ''} skipped because the date couldn't be read.`);
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id, undefined, { numeric: true }));
  return { rows, columns, warnings };
}

/** Parse a workbook (xlsx / xls / ods / csv bytes) and pick the sheet that looks like the expense table. */
export async function parseWorkbook(data: ArrayBuffer | string, isCsv: boolean): Promise<LoadedData> {
  // SheetJS is loaded on demand — the dashboard itself doesn't need it.
  const XLSX = await import('xlsx');
  const wb =
    typeof data === 'string'
      ? XLSX.read(data, { type: 'string', raw: true })
      : XLSX.read(data, { type: 'array', raw: isCsv, cellDates: false });

  let best: LoadedData | null = null;
  const ordered = [...wb.SheetNames].sort((a, b) => Number(/expense/i.test(b)) - Number(/expense/i.test(a)));
  for (const name of ordered) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: null, blankrows: false });
    const parsed = rowsToExpenses(grid);
    if (parsed && (!best || parsed.rows.length > best.rows.length)) best = { ...parsed, sheetName: name };
  }
  if (!best) {
    throw new Error(
      'Couldn’t find an expense table. Make sure the sheet has a header row with at least a “Date” and an “Amount” (e.g. “Gross Amount”) column.',
    );
  }
  if (best.rows.length === 0) throw new Error(`Found the header in “${best.sheetName}”, but no expense rows under it.`);
  return best;
}
