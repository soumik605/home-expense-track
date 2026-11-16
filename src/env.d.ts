/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default sheet: a Google Sheet link, an .xlsx/.csv URL, or a file in /public (e.g. "expenses.xlsx"). */
  readonly VITE_DEFAULT_SHEET?: string;
  /** @deprecated older name for VITE_DEFAULT_SHEET — still honoured. */
  readonly VITE_SHEET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
