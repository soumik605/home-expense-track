import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Theme } from '../../hooks/useTheme';
import { CHART_INK } from '../../lib/colors';
import { axisMoney, formatDate, money, moneyCompact, MONTH_NAMES } from '../../lib/format';

interface Point {
  date: string;
  ts: number;
  amount: number;
  total: number;
}

export function CumulativeChart({ data, theme, color }: { data: Point[]; theme: Theme; color: string }) {
  const ink = CHART_INK[theme];
  const last = data[data.length - 1];

  if (data.length < 2) {
    return <div className="chart-empty">Need at least two dates to draw a trend.</div>;
  }

  return (
    <div className="chart-box" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 22, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid vertical={false} stroke={ink.grid} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ts: number) => {
              const d = new Date(ts);
              return `${MONTH_NAMES[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`;
            }}
            tick={{ fill: ink.muted, fontSize: 12 }}
            axisLine={{ stroke: ink.axis }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={axisMoney(last?.total ?? 0)}
            tick={{ fill: ink.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ stroke: ink.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point;
              return (
                <div className="tip">
                  <div className="tip-title">{formatDate(p.date)}</div>
                  <div className="tip-row">
                    <span>Spent that day</span>
                    <b>{money(p.amount)}</b>
                  </div>
                  <div className="tip-row tip-total">
                    <span>Running total</span>
                    <b>{money(p.total)}</b>
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="linear"
            dataKey="total"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={color}
            fillOpacity={0.1}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: ink.surface, strokeWidth: 2 }}
            label={(p: { x?: number | string; y?: number | string; index?: number }) =>
              p.index === data.length - 1 ? (
                <text x={Number(p.x)} y={Number(p.y) - 10} textAnchor="end" className="end-label" fill={ink.text}>
                  {moneyCompact(last.total)}
                </text>
              ) : (
                <g />
              )
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
