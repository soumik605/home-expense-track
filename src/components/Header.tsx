import { FileSpreadsheet, House, Languages, Moon, RefreshCw, Sheet as SheetIcon, Sun, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LoadStatus } from '../hooks/useExpenseData';
import { useLanguage } from '../hooks/useLanguage';
import type { Theme } from '../hooks/useTheme';
import { relativeTime } from '../lib/format';
import { isGoogleSheet } from '../lib/sources';
import type { SourceConfig } from '../types';

interface Props {
  config: SourceConfig;
  sheetName?: string;
  syncedAt: number;
  status: LoadStatus;
  theme: Theme;
  onToggleTheme: () => void;
  onRefresh: () => void;
  onConnect: () => void;
}

function sourceLabel(c: SourceConfig) {
  if (c.kind === 'sample') return 'Sample data';
  if (c.kind === 'file') return c.name;
  if (isGoogleSheet(c.url)) return 'Google Sheet';
  try {
    return new URL(c.url, window.location.href).pathname.split('/').pop() || 'Linked sheet';
  } catch {
    return 'Linked sheet';
  }
}

export function Header({ config, sheetName, syncedAt, status, theme, onToggleTheme, onRefresh, onConnect }: Props) {
  // Re-render every 30s so "synced 2 min ago" stays truthful.
  const { lang, toggle: toggleLang } = useLanguage();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const Icon = config.kind === 'url' ? SheetIcon : FileSpreadsheet;
  const syncing = status === 'loading';
  const meta =
    status === 'error'
      ? 'Sync failed — showing last data'
      : syncing
        ? 'Syncing…'
        : config.kind === 'sample'
          ? 'Connect your sheet'
          : `${sheetName ? `${sheetName} · ` : ''}${config.kind === 'url' ? 'synced' : 'loaded'} ${relativeTime(syncedAt)}`;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <House size={18} strokeWidth={2.25} />
          </span>
          <div className="brand-text">
            <span className="brand-title">Home Build</span>
            <span className="brand-sub">Expense tracker</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className={`source-pill ${status === 'error' ? 'is-error' : ''} ${config.kind === 'sample' ? 'is-sample' : ''}`}
            onClick={onConnect}
            title="Change data source"
          >
            <span className="source-icon" aria-hidden>
              {status === 'error' ? <TriangleAlert size={16} /> : <Icon size={16} />}
            </span>
            <span className="source-text">
              <span className="source-name">{sourceLabel(config)}</span>
              <span className="source-meta">{meta}</span>
            </span>
          </button>

          {config.kind === 'url' && (
            <button
              type="button"
              className="icon-btn"
              onClick={onRefresh}
              disabled={syncing}
              aria-label="Sync now"
              title="Sync now"
            >
              <RefreshCw size={18} className={syncing ? 'spin' : ''} />
            </button>
          )}

          <button
            type="button"
            className="icon-btn lang-toggle"
            onClick={toggleLang}
            aria-label={lang === 'bn' ? 'Show item names in English' : 'Show item names in Bengali'}
            title={lang === 'bn' ? 'Item names: বাংলা — switch to English' : 'Item names: English — switch to বাংলা'}
          >
            <Languages size={18} aria-hidden />
            <span className="lang-badge" lang={lang}>
              {lang === 'bn' ? 'বাং' : 'EN'}
            </span>
          </button>

          <button
            type="button"
            className="icon-btn theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            title={theme === 'light' ? 'Dark theme' : 'Light theme'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
