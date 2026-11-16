import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface Props {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
  width?: number;
}

/** Lightweight popover: closes on outside click, Escape (focus returns to trigger). */
export function Popover({ trigger, children, align = 'start', width = 280 }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="popover-root" ref={root}>
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && (
        <div className={`popover popover-${align}`} id={id} role="dialog" style={{ width }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
