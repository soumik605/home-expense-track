# Home Build — Expense Tracker

A responsive React dashboard for home-construction expenses that reads straight from your spreadsheet.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Connect your sheet

Click the data-source pill in the header (it says **Sample data** at first).

| Option | How | Sync |
|---|---|---|
| **Google Sheet** (recommended) | Share → General access → *Anyone with the link* (Viewer). Open the tab with your table, copy the URL (keep `#gid=…`), paste it. | Re-syncs when you come back to the tab, plus a manual sync button |
| **Upload Excel** | Drag in `.xlsx` / `.xls` / `.ods` / `.csv` | Re-upload after you add expenses |
| **Default sheet (env)** | Set `VITE_DEFAULT_SHEET` in `.env.local`: a Google Sheet link, or a file in `public/` like `expenses.xlsx` | Opens by default. Changing the value takes effect on next load. The dialog has a **Use default** button |

Everything is parsed in the browser. Nothing goes to a server. The last good data is cached so the page opens instantly.

### Default sheet via env

```bash
# .env.local  (restart `npm run dev` after editing)
VITE_DEFAULT_SHEET=https://docs.google.com/spreadsheets/d/XXXX/edit#gid=0
# or put your workbook at public/expenses.xlsx and use:
VITE_DEFAULT_SHEET=expenses.xlsx
```

Vite builds env values into the JavaScript bundle, so anyone who can open the deployed app can see this link.

### Columns

The app needs a header row with **Date** and **Gross Amount** (or *Amount*/*Total*). Everything else is optional and can be in any order:
Category, Subcategory, Details, Vendor, Unit, Quantity, Rate, Paid Amount, Due Amount, Payment Status, Payment Mode, Source of Funds.
It also recognises common alternative names (Qty, Description, Status, Balance…).

- Dates: real Excel dates, `21-Apr-2026`, `2026-04-21` or `21/04/2026` (day first).
- Amounts like `₹18,000.00` are fine.
- Missing *Paid Amount* falls back to *Due Amount* or *Payment Status*. Missing *Status* is worked out from Paid vs Gross.
- Blank rows and "Total" rows are skipped. If the workbook has several sheets, the app picks the one that looks like the expense table.

## Features

- **KPIs**: total spent, paid (with meter), outstanding, average per month.
- **Charts**: monthly spend stacked by source of funds (click a month to filter to it), cumulative spend, spend by item (click to filter), and breakdowns by funds, payment mode and status.
- **Materials**: total quantity, average rate and rate range for each item and unit.
- **Transactions**: sortable and paginated, with a totals row. Shows as cards on phones. Exports the current view to CSV.
- **Filters**: search, date presets plus a custom range, and multi-selects for category, item, funds, mode and status. Each option shows how many rows it would match. Active filters appear as removable chips. On mobile, filters open in a bottom sheet. Filters are saved in the URL, so you can bookmark or share a view.
- **Theme**: light by default, with a dark toggle. Your choice is remembered.

## Code map

```
src/
  lib/parse.ts        header detection, date/amount parsing → Expense[]
  lib/sources.ts      Google Sheet / URL / file loading
  lib/analytics.ts    filtering, grouping, monthly & cumulative series, CSV
  lib/colors.ts       chart palette (stable colour per value, light & dark)
  hooks/              useExpenseData (source + cache), useFilters (URL-synced), useTheme
  components/         Header, FilterBar, KpiCards, charts/, tables, ConnectDialog
```
