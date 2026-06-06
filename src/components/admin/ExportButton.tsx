'use client';

import { useState } from 'react';

interface ExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function ExportButton({ session }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExportCSV = async () => {
    setLoading('csv');
    setOpen(false);
    try {
      const res = await fetch(`/api/tools/export/csv?sessionId=${session._id}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.sessionCode}_results.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV');
    } finally {
      setLoading(null);
    }
  };

  const handleExportFiles = async () => {
    setLoading('zip');
    setOpen(false);
    try {
      const res = await fetch(`/api/tools/export/files?sessionId=${session._id}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.sessionCode}_files.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export files');
    } finally {
      setLoading(null);
    }
  };

  const handleSaveImage = async (fullView: boolean) => {
    setLoading('image');
    setOpen(false);
    try {
      const element = document.getElementById('results-capture-area');
      if (!element) throw new Error('Results area not found');

      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: fullView ? '#ffffff' : undefined,
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fullView
        ? `${session.sessionCode}_board_full.png`
        : `${session.sessionCode}_results.png`;
      a.click();
    } catch {
      alert('Failed to save image. Make sure the results area is visible.');
    } finally {
      setLoading(null);
    }
  };

  const toolType = session.type || '';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={!!loading}
        className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        <i aria-hidden="true" className="fi fi-sr-download text-sm" />
        Export {loading && `(${loading})`}
        <i className={`fi fi-sr-angle-small-down text-sm transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl bg-white/80 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl overflow-hidden">
            <button
              onClick={handleExportCSV}
              disabled={!!loading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
            >
              <i aria-hidden="true" className="fi fi-sr-file-csv text-emerald-500 w-4" />
              Export as CSV
            </button>

            {toolType === 'assignment' && (
              <button
                onClick={handleExportFiles}
                disabled={!!loading}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
              >
                <i aria-hidden="true" className="fi fi-sr-file-archive text-indigo-500 w-4" />
                Download Files (ZIP)
              </button>
            )}

            <div className="border-t border-zinc-200/60 dark:border-slate-700/50" />

            <button
              onClick={() => handleSaveImage(false)}
              disabled={!!loading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
            >
              <i aria-hidden="true" className="fi fi-sr-image text-blue-500 w-4" />
              Save as Image — Results Only
            </button>

            <button
              onClick={() => handleSaveImage(true)}
              disabled={!!loading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
            >
              <i aria-hidden="true" className="fi fi-sr-picture text-purple-500 w-4" />
              Save as Image — Full View
            </button>
          </div>
        </>
      )}
    </div>
  );
}