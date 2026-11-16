import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Theme } from '../../hooks/useTheme';
import { CHART_INK } from '../../lib/colors';
import { axisMoney, formatMonth, money } from '../../lib/format';
import { Legend } from './Legend';

interface Props {
  data: Record<string, number | string>[];
  stacks: string[];
  colors: Map<string, string>;
  theme: Theme;
  stackLabel?: string;
  onMonthClick?: (month: string) => void;
}

const R = 4;
const GAP = 2;

/** Column segment: 4px rounded data-end only on the top-most segment, a 2px surface gap between stacked parts. */
function segmentPath(x: number, y: number, w: number, h: number, top: boolean) {
  if (h <= 0 || w <= 0) return '';
  if (!top) {
    const hh = Math.max(0, h - GAP);
    return `M${x},${y + GAP} h${w} v${hh} h${-w} Z`;
  }
  const r = Math.min(R, h, w / 2);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export function MonthlyChart({ data, stacks, colors, theme, stackLabel, onMonthClick }: Props) {
  const ink = CHART_INK[theme];
  const topKey = (row: Record<string, number | string>) => {
    for (let i = stacks.length - 1; i >= 0; i--) if (Number(row[stacks[i]]) > 0) return stacks[i];
    return null;
  };
  const yFmt = axisMoney(Math.max(0, ...data.map((d) => Number(d.total))));

  return (
    <>
      {stacks.length > 1 && <Legend items={stacks.map((s) => ({ label: s, color: colors.get(s)! }))} title={stackLabel} />}
      <div className="chart-box" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
            barCategoryGap="28%"
            onClick={(s) => {
              const label = s?.activeLabel;
              if (label && onMonthClick) onMonthClick(String(label));
            }}
            style={{ cursor: onMonthClick ? 'pointer' : undefined }}
          >
            <CartesianGrid vertical={false} stroke={ink.grid} />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => formatMonth(m, true)}
              tick={{ fill: ink.muted, fontSize: 12 }}
              axisLine={{ stroke: ink.axis }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              tickFormatter={yFmt}
              tick={{ fill: ink.muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ fill: theme === 'light' ? 'rgba(11,11,11,0.04)' : 'rgba(255,255,255,0.05)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as Record<string, number | string>;
                return (
                  <div className="tip">
                    <div className="tip-title">{formatMonth(String(label))}</div>
                    {stacks.length > 1 &&
                      [...stacks].reverse().map((s) =>
                        Number(row[s]) > 0 ? (
                          <div className="tip-row" key={s}>
                            <span className="swatch" style={{ background: colors.get(s) }} />
                            <span>{s}</span>
                            <b>{money(Number(row[s]))}</b>
                          </div>
                        ) : null,
                      )}
                    <div className={`tip-row ${stacks.length > 1 ? 'tip-total' : ''}`}>
                      <span>Total</span>
                      <b>{money(Number(row.total))}</b>
                    </div>
                    {onMonthClick && <div className="tip-hint">Click to filter to this month</div>}
                  </div>
                );
              }}
            />
            {stacks.map((s) => (
              <Bar
                key={s}
                dataKey={s}
                stackId="a"
                fill={colors.get(s)}
                maxBarSize={24}
                isAnimationActive={false}
                shape={(p: unknown) => {
                  const { x, y, width, height, payload } = p as { x: number; y: number; width: number; height: number; payload: Record<string, number | string> };
                  return <path d={segmentPath(x, y, width, height, topKey(payload) === s)} fill={colors.get(s)} />;
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
