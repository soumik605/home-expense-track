import { useLanguage } from '../hooks/useLanguage';
import type { MaterialRow } from '../lib/analytics';
import { money, moneyCompact, number } from '../lib/format';

export function MaterialsTable({ rows, onPick }: { rows: MaterialRow[]; onPick: (sub: string) => void }) {
  const { item, itemLang } = useLanguage();
  if (!rows.length) return <div className="chart-empty">No quantity-based entries (rows with a Unit and Quantity) in this view.</div>;
  const max = Math.max(...rows.map((r) => r.gross));
  return (
    <div className="table-scroll">
      <table className="table table-compact">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="num">Quantity</th>
            <th scope="col" className="num">Avg rate</th>
            <th scope="col" className="num hide-sm">Rate range</th>
            <th scope="col" className="num">Spent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.subcategory}-${r.unit}`}>
              <td>
                <button type="button" className="cell-link" onClick={() => onPick(r.subcategory)} title={`Filter to ${item(r.subcategory)}`} lang={itemLang(r.subcategory)}>
                  {item(r.subcategory)}
                </button>
                <span className="cell-sub">{r.count} {r.count === 1 ? 'purchase' : 'purchases'}</span>
              </td>
              <td className="num">
                {number(r.quantity)} <span className="unit">{r.unit}</span>
              </td>
              <td className="num">
                {money(Math.round(r.avgRate * 100) / 100)}
                <span className="unit">/{r.unit.toLowerCase()}</span>
              </td>
              <td className="num hide-sm muted">
                {r.minRate === r.maxRate ? '—' : `${number(r.minRate)} – ${number(r.maxRate)}`}
              </td>
              <td className="num">
                <div className="inline-bar">
                  <span className="inline-bar-track">
                    <span style={{ width: `${(r.gross / max) * 100}%` }} />
                  </span>
                  <span title={money(r.gross)}>{moneyCompact(r.gross)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
