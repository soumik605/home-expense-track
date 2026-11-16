import type { Theme } from '../hooks/useTheme';

/**
 * Categorical palette (validated for color-vision deficiency on adjacent pairs, both modes).
 * Order matters — assign in this order, never cycled. A 9th value folds into "Other".
 */
const SERIES: Record<Theme, string[]> = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'],
};
export const OTHER_COLOR: Record<Theme, string> = { light: '#a3a29b', dark: '#6b6a64' };

export const CHART_INK: Record<Theme, { grid: string; axis: string; muted: string; surface: string; text: string; secondary: string }> = {
  light: { grid: '#e8e7e1', axis: '#c3c2b7', muted: '#7a7973', surface: '#ffffff', text: '#0b0b0b', secondary: '#52514e' },
  dark: { grid: '#2c2c2a', axis: '#383835', muted: '#8f8e88', surface: '#1a1a19', text: '#f0efec', secondary: '#c3c2b7' },
};

/** Status colors are reserved — never used for a series. Always shown with an icon + label. */
export const STATUS_COLOR = { good: '#0ca30c', warning: '#fab219', critical: '#d03b3b' };

export function statusTone(status: string): 'good' | 'warning' | 'critical' {
  const s = status.toLowerCase();
  if (/partial|part|advance/.test(s)) return 'warning';
  if (/^paid$|complete|done|settled|cleared/.test(s)) return 'good';
  return 'critical';
}

/**
 * Color follows the entity, not its rank: `order` is the all-time ordering of a dimension,
 * so filtering never repaints the values that survive.
 */
export function colorMap(order: string[], theme: Theme, offset = 0): Map<string, string> {
  const m = new Map<string, string>();
  const slots = SERIES[theme].slice(offset);
  order.forEach((k, i) => m.set(k, i < slots.length ? slots[i] : OTHER_COLOR[theme]));
  return m;
}

export const seriesColor = (i: number, theme: Theme) => SERIES[theme][i % SERIES[theme].length];
