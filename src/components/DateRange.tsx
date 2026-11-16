import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import { PRESET_LABELS, rangeSummary } from '../lib/analytics';
import type { DatePreset, Filters } from '../types';
import { Popover } from './Popover';

const PRESETS: DatePreset[] = ['all', 'thisMonth', 'lastMonth', 'last30', 'last90', 'thisYear'];

interface Props {
  filters: Filters;
  minDate?: string;
  maxDate?: string;
  onChange: (patch: Partial<Filters>) => void;
}

/** Preset rows + a custom range — shared by the popover and the mobile sheet. */
export function DateRangePanel({ filters, minDate, maxDate, onChange, onDone }: Props & { onDone?: () => void }) {
  return (
    <div className="daterange">
      <ul className="presets" role="listbox" aria-label="Date range">
        {PRESETS.map((p) => (
          <li key={p}>
            <button
              type="button"
              role="option"
              aria-selected={filters.preset === p}
              className={`preset ${filters.preset === p ? 'is-on' : ''}`}
              onClick={() => {
                onChange({ preset: p });
                onDone?.();
              }}
            >
              <span>{PRESET_LABELS[p]}</span>
              {filters.preset === p && <Check size={16} strokeWidth={2.75} aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
      <div className="custom-range">
        <div className="custom-range-title">Custom range</div>
        <div className="custom-range-fields">
          <label>
            <span>From</span>
            <input
              type="date"
              value={filters.preset === 'custom' ? filters.from : ''}
              min={minDate}
              max={filters.to || maxDate}
              onChange={(e) => onChange({ preset: 'custom', from: e.target.value })}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              value={filters.preset === 'custom' ? filters.to : ''}
              min={filters.from || minDate}
              max={maxDate}
              onChange={(e) => onChange({ preset: 'custom', to: e.target.value })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export function DateRange(props: Props) {
  const active = props.filters.preset !== 'all';
  return (
    <Popover
      width={300}
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          className={`fbtn ${active ? 'is-active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={toggle}
        >
          <CalendarDays size={16} aria-hidden />
          <span className="fbtn-label">{active ? rangeSummary(props.filters) : 'All time'}</span>
          <ChevronDown size={15} className={`chev ${open ? 'is-open' : ''}`} aria-hidden />
        </button>
      )}
    >
      {(close) => <DateRangePanel {...props} onDone={close} />}
    </Popover>
  );
}
