import { Check, ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Popover } from './Popover';

export interface Option {
  value: string;
  count: number;
  color?: string;
}

interface ListProps {
  options: Option[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
  onOnly?: (v: string) => void;
  /** Display text for a value (the value itself stays the filter key). */
  format?: (v: string) => string;
  formatLang?: (v: string) => string;
}

/** The checkbox list — shared by the desktop popover and the mobile filter sheet. */
export function OptionList({ options, selected, onToggle, onClear, onOnly, format = (v) => v, formatLang }: ListProps) {
  const [q, setQ] = useState('');
  const shown = useMemo(
    () =>
      q
        ? options.filter((o) => `${o.value} ${format(o.value)}`.toLowerCase().includes(q.toLowerCase()))
        : options,
    [options, q, format],
  );

  return (
    <div className="optlist">
      {options.length > 7 && (
        <label className="optlist-search">
          <Search size={15} aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search options" />
        </label>
      )}
      <ul role="listbox" aria-multiselectable="true">
        {shown.map((o) => {
          const on = selected.includes(o.value);
          return (
            <li key={o.value} className="optrow">
              <button
                type="button"
                role="option"
                aria-selected={on}
                className={`opt ${on ? 'is-on' : ''} ${o.count === 0 && !on ? 'is-empty' : ''}`}
                onClick={() => onToggle(o.value)}
              >
                <span className="checkbox" aria-hidden>
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                {o.color && <span className="swatch" style={{ background: o.color }} aria-hidden />}
                <span className="opt-label" lang={formatLang?.(o.value)}>
                  {format(o.value)}
                </span>
                <span className="opt-count">{o.count}</span>
              </button>
              {onOnly && (
                <button type="button" className="opt-only" onClick={() => onOnly(o.value)} aria-label={`Only ${format(o.value)}`}>
                  Only
                </button>
              )}
            </li>
          );
        })}
        {!shown.length && <li className="opt-none">No matches</li>}
      </ul>
      {selected.length > 0 && (
        <div className="optlist-foot">
          <span>{selected.length} selected</span>
          <button type="button" className="link" onClick={onClear}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

interface Props extends ListProps {
  label: string;
  icon?: React.ReactNode;
}

export function MultiSelect({ label, icon, ...list }: Props) {
  const { selected, format = (v: string) => v } = list;
  const summary =
    selected.length === 0 ? null : selected.length === 1 ? format(selected[0]) : `${selected.length} selected`;

  return (
    <Popover
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          className={`fbtn ${selected.length ? 'is-active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={toggle}
        >
          {icon}
          <span className="fbtn-label">{label}</span>
          {summary && <span className="fbtn-value">{summary}</span>}
          <ChevronDown size={15} className={`chev ${open ? 'is-open' : ''}`} aria-hidden />
        </button>
      )}
    >
      {() => <OptionList {...list} />}
    </Popover>
  );
}
