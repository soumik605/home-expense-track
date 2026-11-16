import { rowsToExpenses } from '../lib/parse';
import type { LoadedData } from '../types';

/** Sample rows mirroring the reference spreadsheet, shown until a real sheet is connected. */
const HEADER = ['Date', 'Subcategory', 'Details', 'Unit', 'Quantity', 'Rate', 'Gross Amount', 'Paid Amount', 'Payment Status', 'Payment Mode', 'Source of Funds'];

const R = (date: string, sub: string, details: string, unit: string, qty: number | null, rate: number | null, gross: number, mode: string, src: string) =>
  [date, sub, details, unit, qty, rate, gross, gross, 'Paid', mode, src];

const ROWS = [
  R('21-Apr-2026', 'Sand', '', 'Truck', 10, 1800, 18000, 'UPI', 'Personal'),
  R('21-Apr-2026', 'Brickwork', '', 'Piece', 1000, 10, 10000, 'UPI', 'Personal'),
  R('27-Apr-2026', 'Sand', '', 'Truck', 5, 1800, 9000, 'UPI', 'Personal'),
  R('06-Sep-2026', 'Brickwork', '', 'Piece', 2000, 13, 26000, 'UPI', 'Loan'),
  R('10-Sep-2026', 'Other', '', '', null, null, 4515, 'Bank Transfer', 'Loan'),
  R('10-Sep-2026', 'Other', '', '', null, null, 5160, 'Bank Transfer', 'Loan'),
  R('11-Sep-2026', 'Brickwork', '', 'Piece', 800, 14, 11200, 'UPI', 'Loan'),
  R('11-Sep-2026', 'Brickwork', '', 'Piece', 800, 14, 11200, 'UPI', 'Loan'),
  R('12-Sep-2026', 'Brickwork', '', 'Piece', 800, 14, 11200, 'UPI', 'Loan'),
  R('12-Sep-2026', 'Brickwork', '', 'Piece', 800, 14, 11200, 'UPI', 'Loan'),
  R('23-Sep-2026', 'Steel', '16mm', 'Kg', 389.2, 72.5, 28217, 'UPI', 'Loan'),
  R('23-Sep-2026', 'Steel', '12mm', 'Kg', 366.15, 72.5, 26545.88, 'UPI', 'Loan'),
  R('23-Sep-2026', 'Steel', '10mm', 'Kg', 287.5, 72.5, 20843.75, 'UPI', 'Loan'),
  R('23-Sep-2026', 'Steel', '8mm', 'Kg', 486, 73.5, 35721, 'UPI', 'Loan'),
  R('23-Sep-2026', 'Steel', '6mm', 'Kg', 120.1, 76.5, 9187.65, 'UPI', 'Loan'),
  R('24-Sep-2026', 'Labour', 'Sk Saifuddin', '', null, null, 2000, 'UPI', 'Loan'),
  R('24-Sep-2026', 'Tools', '', '', null, null, 4542, 'UPI', 'Loan'),
  R('27-Sep-2026', 'Sand', '', 'Septi', 300, 92, 27600, 'UPI', 'Loan'),
  R('27-Sep-2026', 'Stone', '', 'Septi', 150, 77, 11550, 'UPI', 'Loan'),
  R('27-Sep-2026', 'Transport', 'stone 6x300', '', null, null, 1800, 'UPI', 'Loan'),
  R('29-Sep-2026', 'JCB', '', '', null, null, 3500, 'UPI', 'Loan'),
  R('30-Sep-2026', 'Tools', '', '', null, null, 3500, 'UPI', 'Loan'),
  R('30-Sep-2026', 'Labour', 'Sk Saifuddin', '', null, null, 10000, 'UPI', 'Loan'),
  R('30-Sep-2026', 'Cement', '', 'Bag', 25, 350, 8750, 'UPI', 'Loan'),
  R('30-Sep-2026', 'Transport', 'Cement 25x15', '', null, null, 375, 'UPI', 'Loan'),
  R('01-Oct-2026', 'Other', 'dr. fixit', '', null, null, 2500, 'UPI', 'Loan'),
  R('02-Oct-2026', 'Cement', '', 'Bag', 25, 350, 8750, 'UPI', 'Loan'),
  R('02-Oct-2026', 'Transport', 'Cement 25x15', '', null, null, 375, 'UPI', 'Loan'),
  R('04-Oct-2026', 'Stone', '', 'Septi', 75, 77, 5775, 'UPI', 'Loan'),
  R('06-Oct-2026', 'Labour', 'Santanu Manna', '', null, null, 4000, 'UPI', 'Loan'),
  R('09-Oct-2026', 'Labour', 'Sk Saifuddin', '', null, null, 10000, 'UPI', 'Loan'),
  R('09-Oct-2026', 'JCB', '', '', null, null, 3200, 'UPI', 'Loan'),
  R('10-Oct-2026', 'Sand', '', 'Septi', 75, 90, 6750, 'UPI', 'Loan'),
];

export function sampleData(): LoadedData {
  const parsed = rowsToExpenses([HEADER, ...ROWS])!;
  return { ...parsed, sheetName: 'Sample data' };
}
