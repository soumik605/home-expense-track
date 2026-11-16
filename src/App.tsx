import { Download, FileSpreadsheet, Link2, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CategoryBars } from './components/charts/CategoryBars';
import { CumulativeChart } from './components/charts/CumulativeChart';
import { MonthlyChart } from './components/charts/MonthlyChart';
import { SegmentBar } from './components/charts/SegmentBar';
import { ConnectDialog } from './components/ConnectDialog';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { ItemCards } from './components/ItemCards';
import { KpiCards } from './components/KpiCards';
import { MaterialsTable } from './components/MaterialsTable';
import { TabbedCard, type Panel } from './components/TabbedCard';
import { TransactionsTable } from './components/TransactionsTable';
import { useExpenseData } from './hooks/useExpenseData';
import { activeFilterCount, useFilters } from './hooks/useFilters';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useTheme } from './hooks/useTheme';
import { applyFilters, cumulative, distinct, groupBy, materials, monthly, rangeSummary, toCsv, totals } from './lib/analytics';
import { colorMap, OTHER_COLOR, seriesColor, STATUS_COLOR, statusTone } from './lib/colors';
import { toISO } from './lib/format';
import type { Expense, Filters, MultiFilterKey } from './types';

const EMPTY_ROWS: Expense[] = [];

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const source = useExpenseData();
  const { filters, setFilters, toggle, reset } = useFilters();
  const [connectOpen, setConnectOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const rows = source.data?.rows ?? EMPTY_ROWS;
  const columns = useMemo(() => source.data?.columns ?? new Set<keyof Expense>(), [source.data]);
  const hasSource = columns.has('source');
  const hasMode = columns.has('mode');

  const patch = useCallback((p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p })), [setFilters]);

  // Colors are assigned from the *unfiltered* sheet so they never shift as filters change.
  const sourceColors = useMemo(() => colorMap(distinct(rows, (r) => r.source), theme), [rows, theme]);
  // Modes start at slot 3 so e.g. "UPI" never shares a color with "Loan" on the same screen.
  const modeColors = useMemo(() => colorMap(distinct(rows, (r) => r.mode), theme, 2), [rows, theme]);
  // Single-series "total spend" visuals get their own hue, distinct from any funds/mode color.
  const totalColor = seriesColor(6, theme);
  const statusColor = useCallback((s: string) => STATUS_COLOR[statusTone(s)], []);
  const filterColors = useMemo<Partial<Record<MultiFilterKey, Map<string, string>>>>(
    () => ({
      sources: sourceColors,
      modes: modeColors,
      statuses: new Map(distinct(rows, (r) => r.status).map((s) => [s, statusColor(s)])),
    }),
    [sourceColors, modeColors, rows, statusColor],
  );

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const t = useMemo(() => totals(filtered), [filtered]);
  const grand = useMemo(() => totals(rows).gross, [rows]);

  const stacks = useMemo(
    () => (hasSource ? distinct(rows, (r) => r.source) : ['Spend']),
    [rows, hasSource],
  );
  const monthData = useMemo(
    () => monthly(filtered, (r) => (hasSource ? r.source : 'Spend'), stacks),
    [filtered, hasSource, stacks],
  );
  const singleStackColors = useMemo(() => new Map([['Spend', totalColor]]), [totalColor]);
  const cumData = useMemo(() => cumulative(filtered), [filtered]);
  const materialRows = useMemo(() => materials(filtered), [filtered]);

  // Cross-filter views: each chart ignores its own filter so you can see (and change) the selection in context.
  const byItem = useMemo(() => groupBy(applyFilters(rows, filters, 'subcategories'), (r) => r.subcategory), [rows, filters]);
  const bySource = useMemo(() => groupBy(applyFilters(rows, filters, 'sources'), (r) => r.source), [rows, filters]);
  const byMode = useMemo(() => groupBy(applyFilters(rows, filters, 'modes'), (r) => r.mode), [rows, filters]);
  const byStatus = useMemo(() => groupBy(applyFilters(rows, filters, 'statuses'), (r) => r.status), [rows, filters]);

  const pickMonth = useCallback(
    (month: string) => {
      const [y, m] = month.split('-').map(Number);
      patch({ preset: 'custom', from: `${month}-01`, to: toISO(new Date(y, m, 0)) });
    },
    [patch],
  );

  const exportCsv = () => {
    const blob = new Blob(['﻿', toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `home-build-expenses-${toISO(new Date())}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const filteredActive = activeFilterCount(filters) > 0;

  // Phones show these three as tabs in one card; wider screens lay them out side by side.
  const isMobile = useMediaQuery('(max-width: 640px)');
  const insightPanels: Panel[] = [
    {
      id: 'monthly',
      label: 'Monthly',
      title: 'Monthly spend',
      sub: hasSource ? 'Gross amount by month, split by source of funds' : 'Gross amount by month',
      content: (
        <MonthlyChart
          data={monthData}
          stacks={stacks}
          colors={hasSource ? sourceColors : singleStackColors}
          theme={theme}
          stackLabel="Source of funds"
          onMonthClick={pickMonth}
        />
      ),
    },
    {
      id: 'funding',
      label: 'Funding',
      title: 'Where the money comes from',
      sub: 'Click a segment to filter',
      content: (
        <div className="segments">
          {hasSource && (
            <SegmentBar
              title="Source of funds"
              groups={bySource}
              colorOf={(k) => sourceColors.get(k) ?? OTHER_COLOR[theme]}
              inkOf={(k) => (sourceColors.get(k) === '#eda100' ? '#0b0b0b' : '#fff')}
              selected={filters.sources}
              onToggle={(k) => toggle('sources', k)}
            />
          )}
          {hasMode && (
            <SegmentBar
              title="Payment mode"
              groups={byMode}
              colorOf={(k) => modeColors.get(k) ?? OTHER_COLOR[theme]}
              inkOf={(k) => (modeColors.get(k) === '#eda100' ? '#0b0b0b' : '#fff')}
              selected={filters.modes}
              onToggle={(k) => toggle('modes', k)}
            />
          )}
          <SegmentBar
            title="Payment status"
            groups={byStatus}
            colorOf={statusColor}
            inkOf={(k) => (statusTone(k) === 'warning' ? '#0b0b0b' : '#fff')}
            selected={filters.statuses}
            onToggle={(k) => toggle('statuses', k)}
          />
        </div>
      ),
    },
    {
      id: 'cumulative',
      label: 'Cumulative',
      title: 'Cumulative spend',
      sub: 'Running total of gross amount',
      content: <CumulativeChart data={cumData} theme={theme} color={totalColor} />,
    },
  ];
  // All-time item order: gives each item card a colour that stays put when filtering.
  const itemOrder = useMemo(() => distinct(rows, (r) => r.subcategory), [rows]);
  const itemCard = (
    <Card title="Spend by item" sub="Click an item to filter · share of the current view">
      <CategoryBars groups={byItem} selected={filters.subcategories} color={totalColor} onToggle={(k) => toggle('subcategories', k)} />
    </Card>
  );

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to dashboard
      </a>
      <Header
        config={source.config}
        sheetName={source.data?.sheetName}
        syncedAt={source.syncedAt}
        status={source.status}
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={source.refresh}
        onConnect={() => setConnectOpen(true)}
      />

      <main id="main" className="container">
        {source.status === 'error' && source.error && source.data && (
          <div className="banner banner-error" role="alert">
            <TriangleAlert size={18} />
            <span>{source.error}</span>
            <button type="button" className="btn btn-sm" onClick={source.refresh}>
              <RefreshCw size={14} /> Retry
            </button>
            <button type="button" className="icon-btn icon-btn-sm" onClick={source.dismissError} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {source.config.kind === 'sample' && !bannerDismissed && (
          <div className="banner banner-info">
            <FileSpreadsheet size={18} />
            <span>
              You’re viewing <b>sample data</b>. Connect your Google Sheet or upload your Excel file to see your own expenses.
            </span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setConnectOpen(true)}>
              <Link2 size={14} /> Connect sheet
            </button>
            <button type="button" className="icon-btn icon-btn-sm" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {!source.data ? (
          source.status === 'error' ? (
            <div className="empty-state">
              <TriangleAlert size={32} />
              <h2>Couldn’t load your sheet</h2>
              <p>{source.error}</p>
              <div className="empty-actions">
                <button type="button" className="btn" onClick={source.refresh}>
                  <RefreshCw size={16} /> Try again
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setConnectOpen(true)}>
                  Change source
                </button>
              </div>
            </div>
          ) : (
            <LoadingSkeleton />
          )
        ) : (
          <>
            <div className="page-head">
              <div>
                <h1>Overview</h1>
                <p className="muted">
                  {rangeSummary(filters)} · {filtered.length} of {rows.length} entries
                </p>
              </div>
              <button type="button" className="btn" onClick={exportCsv} disabled={!filtered.length}>
                <Download size={16} />
                <span className="hide-xs">Export CSV</span>
              </button>
            </div>

            <FilterBar
              rows={rows}
              columns={columns}
              filters={filters}
              resultCount={filtered.length}
              colors={filterColors}
              onPatch={patch}
              onToggle={toggle}
              onReset={reset}
            />

            {source.data.warnings.length > 0 && (
              <p className="note">
                <TriangleAlert size={14} /> {source.data.warnings.join(' ')}
              </p>
            )}

            <KpiCards
              totals={t}
              monthlyTotals={monthData.map((m) => ({ month: String(m.month), total: Number(m.total) }))}
              grandTotal={grand}
              filtered={filteredActive}
            />

            {filtered.length === 0 ? (
              <div className="empty-state">
                <h2>No entries match</h2>
                <p>Try widening the date range or removing a filter.</p>
                <button type="button" className="btn btn-primary" onClick={reset}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {isMobile ? (
                  <>
                    <section className="item-section" aria-labelledby="items-heading">
                      <div className="item-section-head">
                        <h2 id="items-heading" className="card-title">
                          Spend by item
                        </h2>
                        <span className="card-sub">Tap a card to filter</span>
                      </div>
                      <ItemCards
                        groups={byItem}
                        order={itemOrder}
                        selected={filters.subcategories}
                        onToggle={(k) => toggle('subcategories', k)}
                      />
                    </section>
                    <TabbedCard panels={insightPanels} label="Spending charts" collapsible />
                  </>
                ) : (
                  <>
                    <div className="grid grid-wide">
                      <PanelCard panel={insightPanels[0]} />
                      <PanelCard panel={insightPanels[1]} />
                    </div>
                    <div className="grid grid-half">
                      {itemCard}
                      <PanelCard panel={insightPanels[2]} />
                    </div>
                  </>
                )}

                <Card title="Materials" sub="Quantities bought and average rate, for entries with a unit">
                  <MaterialsTable rows={materialRows} onPick={(s) => patch({ subcategories: [s] })} />
                </Card>

                <Card
                  title="Transactions"
                  sub={`${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}`}
                  action={
                    <button type="button" className="btn btn-sm" onClick={exportCsv}>
                      <Download size={14} /> CSV
                    </button>
                  }
                >
                  <TransactionsTable rows={filtered} columns={columns} sourceColors={sourceColors} />
                </Card>
              </>
            )}
          </>
        )}

        <footer className="page-foot muted">
          Data stays in your browser. {source.config.kind === 'url' && 'Re-syncs when you return to this tab.'}
        </footer>
      </main>

      <ConnectDialog
        key={connectOpen ? 'open' : 'closed'}
        open={connectOpen}
        config={source.config}
        onClose={() => setConnectOpen(false)}
        onConnectUrl={async (url) => {
          await source.connectUrl(url);
          reset();
        }}
        onConnectFile={async (file) => {
          await source.connectFile(file);
          reset();
        }}
        onSample={() => {
          source.loadSample();
          reset();
        }}
        defaultSheet={source.defaultSheet}
        isDefault={source.isDefault}
        onDefault={async () => {
          await source.loadDefault();
          reset();
        }}
      />
    </>
  );
}

function Card({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h2 className="card-title">{title}</h2>
          {sub && <p className="card-sub">{sub}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function PanelCard({ panel }: { panel: Panel }) {
  return (
    <Card title={panel.title} sub={panel.sub}>
      {panel.content}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label="Loading your sheet">
      <div className="skel skel-title" />
      <div className="skel skel-bar" />
      <div className="kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`skel skel-kpi ${i > 0 ? 'hide-mobile' : ''}`} />
        ))}
      </div>
      <div className="grid grid-wide">
        <div className="skel skel-card" />
        <div className="skel skel-card" />
      </div>
    </div>
  );
}
