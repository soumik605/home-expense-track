import { CircleCheck, CircleAlert, Wallet, CalendarRange, IndianRupee, HandCoins } from 'lucide-react';
import type { Totals } from '../lib/analytics';
import { formatMonth, money, moneyCompact, percent } from '../lib/format';

interface Props {
  totals: Totals;
  monthlyTotals: { month: string; total: number }[];
  /** Total in the full, unfiltered sheet — to show "x% of all spend" when filtered. */
  grandTotal: number;
  filtered: boolean;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 36;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 8) + 4, h - 4 - (v / max) * (h - 8)] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <path d={`${d} L${lx},${h} L4,${h} Z`} className="spark-area" />
      <path d={d} className="spark-line" />
      <circle cx={lx} cy={ly} r={3.5} className="spark-dot" />
    </svg>
  );
}

export function KpiCards({ totals, monthlyTotals, grandTotal, filtered }: Props) {
  const paidPct = totals.gross ? (totals.paid / totals.gross) * 100 : 0;
  const activeMonths = monthlyTotals.filter((m) => m.total > 0).length;
  const span = monthlyTotals.length;
  const perMonth = span ? totals.gross / span : 0;
  const peak = monthlyTotals.reduce<{ month: string; total: number } | null>((a, m) => (!a || m.total > a.total ? m : a), null);
  const share = grandTotal ? (totals.gross / grandTotal) * 100 : 0;

  return (
    <section className="kpis" aria-label="Summary">
      <article className="kpi kpi-hero">
        <div className="kpi-head">
          <span className="kpi-icon kpi-icon-accent" aria-hidden>
            <IndianRupee size={16} />
          </span>
          <span className="kpi-label">Total spent</span>
        </div>
        <div className="kpi-row">
          <div>
            <div className="kpi-value kpi-value-hero" title={money(totals.gross)}>
              {money(totals.gross)}
            </div>
            <div className="kpi-sub">
              {totals.count} {totals.count === 1 ? 'entry' : 'entries'}
              {filtered && grandTotal > 0 && <> · {percent(share)} of all spend</>}
            </div>
          </div>
          <Sparkline values={monthlyTotals.map((m) => m.total)} />
        </div>
      </article>

      <article className="kpi hide-mobile">
        <div className="kpi-head">
          <span className="kpi-icon" aria-hidden>
            <Wallet size={16} />
          </span>
          <span className="kpi-label">Paid</span>
        </div>
        <div className="kpi-value" title={money(totals.paid)}>
          {moneyCompact(totals.paid)}
        </div>
        <div className="meter" role="meter" aria-valuenow={Math.round(paidPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Share paid">
          <span style={{ width: `${Math.min(100, paidPct)}%` }} />
        </div>
        <div className="kpi-sub">{percent(paidPct)} of gross settled</div>
      </article>

      <article className="kpi hide-mobile">
        <div className="kpi-head">
          <span className="kpi-icon" aria-hidden>
            <HandCoins size={16} />
          </span>
          <span className="kpi-label">Outstanding</span>
        </div>
        <div className="kpi-value" title={money(totals.due)}>
          {moneyCompact(totals.due)}
        </div>
        {totals.due > 0.5 ? (
          <div className="kpi-status tone-critical">
            <CircleAlert size={14} aria-hidden /> Due to vendors
          </div>
        ) : (
          <div className="kpi-status tone-good">
            <CircleCheck size={14} aria-hidden /> All settled
          </div>
        )}
      </article>

      <article className="kpi hide-mobile">
        <div className="kpi-head">
          <span className="kpi-icon" aria-hidden>
            <CalendarRange size={16} />
          </span>
          <span className="kpi-label">Avg per month</span>
        </div>
        <div className="kpi-value" title={money(perMonth)}>
          {moneyCompact(perMonth)}
        </div>
        <div className="kpi-sub">
          {span ? (
            <>
              {activeMonths} active of {span} {span === 1 ? 'month' : 'months'}
              {peak && span > 1 && <> · peak {formatMonth(peak.month, true)}</>}
            </>
          ) : (
            '—'
          )}
        </div>
      </article>
    </section>
  );
}
