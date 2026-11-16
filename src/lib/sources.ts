import type { LoadedData } from '../types';
import { parseWorkbook } from './parse';

/**
 * Builds the download URLs to try for a link the user pastes.
 * - Google Sheets "share" link (anyone with the link can view) → CSV export of that tab
 * - Google Sheets "Publish to web" link → CSV output
 * - Anything else (a .xlsx / .csv URL, or a file in /public) → fetched as-is
 */
export function candidateUrls(input: string): string[] {
  const url = input.trim();
  const published = url.match(/docs\.google\.com\/spreadsheets\/d\/e\/([\w-]+)/);
  if (published) {
    const u = new URL(url);
    u.pathname = u.pathname.replace(/\/pubhtml$|\/pub$|\/edit$/, '').replace(/\/?$/, '/pub');
    u.searchParams.set('output', 'csv');
    u.hash = '';
    return [u.toString()];
  }
  const sheet = url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  if (sheet) {
    const id = sheet[1];
    const gid = url.match(/[#&?]gid=(\d+)/)?.[1];
    const g = gid ? `&gid=${gid}` : '';
    return [
      `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${g}`,
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${g}`,
    ];
  }
  return [url];
}

export const isGoogleSheet = (url: string) => /docs\.google\.com\/spreadsheets/.test(url);

async function fetchOne(url: string): Promise<LoadedData> {
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (type.includes('text/html')) throw new Error('Got a web page instead of data — is the sheet shared publicly?');
  const isCsv = type.includes('csv') || type.includes('text/plain') || /\.csv(\?|$)|output=csv|format=csv|out:csv/.test(url);
  if (isCsv) return parseWorkbook(await res.text(), true);
  return parseWorkbook(await res.arrayBuffer(), false);
}

export async function loadFromUrl(input: string): Promise<LoadedData> {
  const urls = candidateUrls(input);
  let lastError: unknown;
  for (const u of urls) {
    try {
      return await fetchOne(u);
    } catch (e) {
      lastError = e;
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  if (isGoogleSheet(input)) {
    throw new Error(
      `Couldn’t read the Google Sheet (${msg}). In Google Sheets choose Share → General access → “Anyone with the link” (Viewer), then try again.`,
    );
  }
  throw new Error(`Couldn’t load that link (${msg}). The server must allow cross-origin downloads (CORS).`);
}

export async function loadFromFile(file: File): Promise<LoadedData> {
  const isCsv = /\.(csv|tsv|txt)$/i.test(file.name) || file.type.includes('csv');
  if (isCsv) return parseWorkbook(await file.text(), true);
  return parseWorkbook(await file.arrayBuffer(), false);
}
