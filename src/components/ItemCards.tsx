import type { CSSProperties } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import type { Group } from '../lib/analytics';
import { moneyRupees, percent } from '../lib/format';
import { CARD_COLORS } from '../lib/itemVisuals';

interface Props {
  groups: Group[];
  /** Item → stable colour slot (all-time order), so colours don't shift with filters. */
  order: string[];
  selected: string[];
  onToggle: (key: string) => void;
}

/** Phone view of "Spend by item": one small tinted card per item. Tap a card to filter by it. */
export function ItemCards({ groups, order, selected, onToggle }: Props) {
  const { item, itemLang } = useLanguage();
  const total = groups.reduce((s, g) => s + g.gross, 0);

  if (!groups.length) return <div className="chart-empty">No entries match these filters.</div>;

  return (
    <ul className="item-cards">
      {groups.map((g) => {
        const slot = order.indexOf(g.key);
        const color = CARD_COLORS[(slot < 0 ? 0 : slot) % CARD_COLORS.length];
        const on = selected.includes(g.key);
        const dim = selected.length > 0 && !on;
        const pct = total ? (g.gross / total) * 100 : 0;
        return (
          <li key={g.key}>
            <button
              type="button"
              className={`item-card ${on ? 'is-on' : ''} ${dim ? 'is-dim' : ''}`}
              style={{ '--c': color } as CSSProperties}
              onClick={() => onToggle(g.key)}
              aria-pressed={on}
              aria-label={`${item(g.key)}: ${moneyRupees(g.gross)}, ${percent(pct)} of spend. Tap to filter.`}
            >
              <span className="item-card-text">
                <span className="item-card-amount">
                  {moneyRupees(g.gross)}
                </span>
                <span className="item-card-name" lang={itemLang(g.key)}>
                  {item(g.key)}
                </span>
                <span className="item-card-meta">
                  {percent(pct)} · {g.count} {g.count === 1 ? 'entry' : 'entries'}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
