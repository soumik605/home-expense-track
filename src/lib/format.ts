const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** ₹18,000 / ₹26,545.88 */
export const money = (v: number) => inr.format(v);
/** ₹18,000 (rounded) */
export const moneyWhole = (v: number) => inrWhole.format(Math.round(v));
/** ₹1.2L / ₹3.4Cr / ₹18T — Indian compact notation. */
export const moneyCompact = (v: number) => (Math.abs(v) < 1000 ? inrWhole.format(v) : inrCompact.format(v));
export const number = (v: number) => num.format(v);

/** Axis ticks in one unit per axis (₹0 / ₹0.7L / ₹1.4L — never ₹70K next to ₹1.4L). */
export function axisMoney(max: number) {
  const [div, suffix] = max >= 1e7 ? [1e7, 'Cr'] : max >= 1e5 ? [1e5, 'L'] : max >= 1e3 ? [1e3, 'K'] : [1, ''];
  return (v: number) => (v === 0 ? '₹0' : `₹${Number((v / div).toFixed(div === 1 ? 0 : 1))}${suffix}`);
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
