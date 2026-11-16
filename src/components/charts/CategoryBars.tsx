import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import type { Group } from '../../lib/analytics';
import { money, moneyCompact } from '../../lib/format';

interface Props {
  groups: Group[];
  selected: string[];
  color: string;
  onToggle: (key: string) => void;
}

const LIMIT = 8;

/** Ranked horizontal bars. Click a bar to filter by it; unselected bars dim while a selection exists. */
export function CategoryBars({ groups, selected, color, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { item, itemLang } = useLanguage();
  const max = Math.max(...groups.map((g) => g.gross), 1);
  const total = groups.reduce((s, g) => s + g.gross, 0);
  const shown = expanded ? groups : groups.slice(0, LIMIT);

  if (!groups.length) return <div className="chart-empty">No entries match these filters.</div>;

  return (
    <div className="hbars">
      <ul>
        {shown.map((g) => {
          const on = selected.includes(g.key);
          const dim = selected.length > 0 && !on;
          const pct = total ? (g.gross / total) * 100 : 0;
          return (
            <li key={g.key}>
              <button
                type="button"
                className={`hbar ${on ? 'is-on' : ''} ${dim ? 'is-dim' : ''}`}
                onClick={() => onToggle(g.key)}
                aria-pressed={on}
                title={`${item(g.key)}: ${money(g.gross)} · ${g.count} ${g.count === 1 ? 'entry' : 'entries'} · ${pct.toFixed(1)}%`}
              >
                <span className="hbar-label" lang={itemLang(g.key)}>
                  {item(g.key)}
                </span>
                <span className="hbar-track">
                  <span className="hbar-fill" style={{ width: `${(g.gross / max) * 100}%`, background: color }} />
                </span>
                <span className="hbar-value">
                  {moneyCompact(g.gross)}
                  <span className="hbar-pct">{pct < 1 ? '<1' : pct.toFixed(0)}%</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {groups.length > LIMIT && (
        <button type="button" className="link hbars-more" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show top 8' : `Show all ${groups.length}`}
        </button>
      )}
    </div>
  );
}
