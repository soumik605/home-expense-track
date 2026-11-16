import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface Panel {
  id: string;
  /** Short tab label. */
  label: string;
  title: string;
  sub?: string;
  content: ReactNode;
}

const KEY = 'hbt:insightTab';
const OPEN_KEY = 'hbt:insightOpen';

/**
 * Several cards folded into one, switched with a segmented tab bar.
 * Only the active panel is mounted, so charts measure their real width.
 * With `collapsible`, a header toggles the whole section (closed by default).
 * The last tab viewed and the open/closed state are remembered on this device.
 */
export function TabbedCard({ panels, label, collapsible = false }: { panels: Panel[]; label: string; collapsible?: boolean }) {
  const baseId = useId();
  // Collapsible sections start closed; the open/closed choice is remembered.
  const [open, setOpen] = useState(() => {
    if (!collapsible) return true;
    try {
      return localStorage.getItem(OPEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleOpen = () =>
    setOpen((o) => {
      try {
        localStorage.setItem(OPEN_KEY, o ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !o;
    });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return panels.some((p) => p.id === saved) ? saved! : panels[0].id;
    } catch {
      return panels[0].id;
    }
  });
  const current = panels.find((p) => p.id === active) ?? panels[0];

  const select = (id: string) => {
    setActive(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  };

  // Arrow keys / Home / End move between tabs (WAI-ARIA tabs pattern).
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const last = panels.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    select(panels[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className={`card tabbed-card ${collapsible ? 'is-collapsible' : ''} ${open ? 'is-open' : ''}`}>
      {collapsible && (
        <h2 className="collapse-heading">
          <button
            type="button"
            className="collapse-head"
            aria-expanded={open}
            aria-controls={`${baseId}-body`}
            onClick={toggleOpen}
          >
            <span className="collapse-text">
              <span className="card-title">{label}</span>
              <span className="card-sub">{panels.map((p) => p.label).join(' · ')}</span>
            </span>
            <ChevronDown size={20} className={`chev ${open ? 'is-open' : ''}`} aria-hidden />
          </button>
        </h2>
      )}

      {open && (
        <div id={`${baseId}-body`} className="tabbed-card-body">
          <div className="tabs tabbed-card-tabs" role="tablist" aria-label={label}>
            {panels.map((p, i) => {
              const on = p.id === current.id;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${p.id}`}
                  aria-selected={on}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={on ? 0 : -1}
                  className={`tab ${on ? 'is-on' : ''}`}
                  onClick={() => select(p.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${current.id}`} key={current.id} className="tabbed-card-panel">
            <header className="card-head">
              <div>
                <h2 className="card-title">{current.title}</h2>
                {current.sub && <p className="card-sub">{current.sub}</p>}
              </div>
            </header>
            {current.content}
          </div>
        </div>
      )}
    </section>
  );
}
