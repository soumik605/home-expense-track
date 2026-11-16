export function Legend({ items, title }: { items: { label: string; color: string; value?: string }[]; title?: string }) {
  return (
    <ul className="legend" aria-label={title ? `${title} legend` : 'Legend'}>
      {items.map((i) => (
        <li key={i.label}>
          <span className="swatch" style={{ background: i.color }} aria-hidden />
          <span>{i.label}</span>
          {i.value && <span className="legend-value">{i.value}</span>}
        </li>
      ))}
    </ul>
  );
}
