import { CircleCheck, FileUp, Link2, LoaderCircle, Sparkles, TriangleAlert, UploadCloud } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import type { SourceConfig } from '../types';
import { Sheet } from './Sheet';

type Tab = 'link' | 'file' | 'sample';

interface Props {
  open: boolean;
  config: SourceConfig;
  onClose: () => void;
  onConnectUrl: (url: string) => Promise<void>;
  onConnectFile: (file: File) => Promise<void>;
  onSample: () => void;
}

export function ConnectDialog({ open, config, onClose, onConnectUrl, onConnectFile, onSample }: Props) {
  const [tab, setTab] = useState<Tab>(config.kind === 'file' ? 'file' : 'link');
  const [url, setUrl] = useState(config.kind === 'url' ? config.url : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const submitUrl = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) void run(() => onConnectUrl(url.trim()));
  };

  const pickFile = (file?: File | null) => {
    if (file) void run(() => onConnectFile(file));
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'link', label: 'Google Sheet', icon: <Link2 size={16} /> },
    { id: 'file', label: 'Upload Excel', icon: <FileUp size={16} /> },
    { id: 'sample', label: 'Sample', icon: <Sparkles size={16} /> },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      variant="dialog"
      title="Connect your expense sheet"
      description="The dashboard reads your sheet directly — nothing is uploaded to a server."
    >
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'is-on' : ''}`}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'link' && (
        <form className="connect-pane" onSubmit={submitUrl}>
          <label className="field">
            <span className="field-label">Sheet link</span>
            <input
              type="url"
              inputMode="url"
              required
              placeholder="https://docs.google.com/spreadsheets/d/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </label>
          <ol className="steps">
            <li>
              In Google Sheets, click <b>Share</b> → General access → <b>Anyone with the link</b> (Viewer).
            </li>
            <li>
              Open the tab that holds your table and copy the URL from the address bar (it includes <code>#gid=</code>, so the right tab is read).
            </li>
            <li>Paste it above. The dashboard re-syncs whenever you come back to it, or tap the sync button.</li>
          </ol>
          <p className="hint">
            Also works with a “Publish to web” CSV link, or any direct <code>.xlsx</code>/<code>.csv</code> URL that allows
            cross-origin access.
          </p>
          <div className="connect-actions">
            <button type="submit" className="btn btn-primary" disabled={busy || !url.trim()}>
              {busy ? <LoaderCircle size={16} className="spin" /> : <Link2 size={16} />}
              {busy ? 'Connecting…' : 'Connect sheet'}
            </button>
          </div>
        </form>
      )}

      {tab === 'file' && (
        <div className="connect-pane">
          <button
            type="button"
            className={`dropzone ${drag ? 'is-drag' : ''}`}
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            disabled={busy}
          >
            {busy ? <LoaderCircle size={28} className="spin" /> : <UploadCloud size={28} />}
            <span className="dropzone-title">{busy ? 'Reading file…' : 'Drop your Excel file here'}</span>
            <span className="muted">or click to browse · .xlsx, .xls, .ods, .csv</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            hidden
            accept=".xlsx,.xls,.xlsm,.ods,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <p className="hint">
            The file is read in your browser and remembered on this device. Re-upload it after you add new expenses — or
            use a Google Sheet link for automatic sync.
          </p>
          {config.kind === 'file' && (
            <p className="current">
              <CircleCheck size={15} /> Currently showing <b>{config.name}</b>
            </p>
          )}
        </div>
      )}

      {tab === 'sample' && (
        <div className="connect-pane">
          <p>Explore the dashboard with sample entries that mirror the reference sheet layout.</p>
          <div className="connect-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onSample();
                onClose();
              }}
            >
              <Sparkles size={16} />
              Use sample data
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert" role="alert">
          <TriangleAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <details className="columns-help">
        <summary>Which columns are read?</summary>
        <p>
          A header row with <b>Date</b> and <b>Gross Amount</b> (or Amount) is required. Optional:{' '}
          Category, Subcategory, Details, Vendor, Unit, Quantity, Rate, Paid Amount, Due Amount, Payment Status, Payment
          Mode, Source of Funds. Column order doesn’t matter and common alternative names (Qty, Description, Status…) are
          recognised.
        </p>
      </details>
    </Sheet>
  );
}
