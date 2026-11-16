import type { Group } from '../../lib/analytics';
import { money, moneyCompact, percent } from '../../lib/format';

interface Props {
  title: string;
  groups: Group[];
  colorOf: (key: string) => string;
  /** Text color inside a segment (white, or near-black on light fills like yellow). */
  inkOf?: (key: string) => string;
  selected: string[];
  onToggle: (key: string) => void;
}

/** One whole split into parts — tall segmented bar with shares printed inside when they fit. */
export function SegmentBar({ title, groups, colorOf, inkOf, selected, onToggle }: Props) {
  const total = groups.reduce((s, g) => s + g.gross, 0);
  const parts = groups.filter((g) => g.gross > 0);
  const label = parts.map((g) => `${g.key} ${money(g.gross)} (${percent((g.gross / total) * 100)})`).join(', ');

  return (
    <div className="segment">
      <div className="segment-head">
        <span className="segment-title">{title}</span>
        <span className="segment-count">{parts.length} {parts.length === 1 ? 'type' : 'types'}</span>
      </div>
      {total > 0 ? (
        <div className="segbar" role="img" aria-label={`${title}: ${label}`}>
          {parts.map((g) => {
            const pct = (g.gross / total) * 100;
            const dim = selected.length > 0 && !selected.includes(g.key);
            return (
              <button
                type="button"
                key={g.key}
                className={`seg ${dim ? 'is-dim' : ''}`}
                style={{ flexGrow: g.gross, background: colorOf(g.key), color: inkOf?.(g.key) ?? '#fff' }}
                onClick={() => onToggle(g.key)}
                title={`${g.key}: ${money(g.gross)} · ${percent(pct)} · ${g.count} ${g.count === 1 ? 'entry' : 'entries'}`}
                aria-label={`${g.key}, ${money(g.gross)}, ${percent(pct)}. Click to filter.`}
              >
                {pct >= 18 && <span>{percent(pct)}</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="segbar segbar-empty" />
      )}
      <ul className="segment-legend">
        {parts.map((g) => (
          <li key={g.key}>
            <button
              type="button"
              className={`seg-key ${selected.includes(g.key) ? 'is-on' : ''}`}
              onClick={() => onToggle(g.key)}
              aria-pressed={selected.includes(g.key)}
            >
              <span className="swatch" style={{ background: colorOf(g.key) }} aria-hidden />
              <span className="seg-key-label">{g.key}</span>
              <span className="seg-key-value">{moneyCompact(g.gross)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
