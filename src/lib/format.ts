/**
 * Decimal rule used everywhere: a number with a fractional part shows exactly 2 decimals,
 * a whole number shows none.  ₹18,000 · ₹26,545.80 · ₹1.20L · 389.20 kg · 67.10%
 */
const TWO_DP = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger',
} as Intl.NumberFormatOptions;

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', ...TWO_DP });

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  ...TWO_DP,
});

const num = new Intl.NumberFormat('en-IN', TWO_DP);

/** ₹18,000 / ₹26,545.88 */
export const money = (v: number) => inr.format(v);
/** ₹1.23L / ₹53.20K / ₹3.40Cr — Indian compact notation (full amount under ₹1,000). */
export const moneyCompact = (v: number) => (Math.abs(v) < 1000 ? inr.format(v) : inrCompact.format(v));
const inrNoPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
/** Rupees only — paise dropped, not rounded: ₹1,20,515.28 → ₹1,20,515. */
export const moneyRupees = (v: number) => inrNoPaise.format(Math.trunc(v));
/** 1,648.95 / 389.20 / 800 */
export const number = (v: number) => num.format(v);
/** 23% / 67.10% / 0.45% */
export const percent = (v: number) => `${num.format(v)}%`;

/** Axis ticks in one unit per axis (₹0 / ₹0.70L / ₹1.40L — never ₹70K next to ₹1.40L). */
export function axisMoney(max: number) {
  const [div, suffix] = max >= 1e7 ? [1e7, 'Cr'] : max >= 1e5 ? [1e5, 'L'] : max >= 1e3 ? [1e3, 'K'] : [1, ''];
  return (v: number) => (v === 0 ? '₹0' : `₹${num.format(v / div)}${suffix}`);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 2026-04-21 → 21 Apr 2026 */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** 2026-04 → Apr 2026 (or Apr ’26 when short) */
export function formatMonth(key: string, short = false) {
  const [y, m] = key.split('-');
  return short ? `${MONTHS[Number(m) - 1]} ’${y.slice(2)}` : `${MONTHS[Number(m) - 1]} ${y}`;
}

export const MONTH_NAMES = MONTHS;

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function relativeTime(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString('en-IN');
}
