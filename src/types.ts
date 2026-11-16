export interface Expense {
  id: string;
  /** ISO date (YYYY-MM-DD), local calendar date — no timezone. */
  date: string;
  category: string;
  subcategory: string;
  details: string;
  vendor: string;
  unit: string;
  quantity: number | null;
  rate: number | null;
  gross: number;
  paid: number;
  due: number;
  status: string;
  mode: string;
  source: string;
}

export type SourceConfig =
  | { kind: 'sample' }
  | { kind: 'url'; url: string; label?: string }
  | { kind: 'file'; name: string };

export interface LoadedData {
  rows: Expense[];
  /** Which optional columns were actually present in the sheet. */
  columns: Set<keyof Expense>;
  sheetName?: string;
  warnings: string[];
}

export type DatePreset =
  | 'all'
  | 'thisMonth'
  | 'lastMonth'
  | 'last30'
  | 'last90'
  | 'thisYear'
  | 'custom';

export interface Filters {
  search: string;
  preset: DatePreset;
  from: string; // ISO, used when preset === 'custom'
  to: string;
  categories: string[];
  subcategories: string[];
  sources: string[];
  modes: string[];
  statuses: string[];
}

export type MultiFilterKey = 'categories' | 'subcategories' | 'sources' | 'modes' | 'statuses';
