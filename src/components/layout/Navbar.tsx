import React from 'react';
import {
  Download,
  FileSpreadsheet,
  Moon,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { ReconciliationSummary } from '../../types/reconciliation';

interface NavbarProps {
  summary: ReconciliationSummary | null;
  hasData: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenUpload: () => void;
  onExport: () => void;
  onClearData: () => void;
  onLoadSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasData,
  isDarkMode,
  onToggleDarkMode,
  onOpenUpload,
  onExport,
  onClearData,
  onLoadSample,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors md:px-6 dark:border-slate-800 dark:bg-slate-900/95">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="#dashboard" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <FileSpreadsheet className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Order Payment Reconciliation</span>
          <span className="sm:hidden">Reconciliation</span>
        </a>
      </div>

      {/* Zone 2: Context navigation / status */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        {hasData ? (
          <div className="flex items-center gap-3 font-mono">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Reconciliation Active</span>
            <span aria-hidden="true">·</span>
            <span>Indian GST / TDS Tolerant</span>
            <span aria-hidden="true">·</span>
            <span>Zero Data Leakage (Local Browser Processing)</span>
          </div>
        ) : (
          <span>Upload Amazon Orders & Settlement reports or load authentic sample data</span>
        )}
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        {!hasData && (
          <button
            onClick={onLoadSample}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
          >
            Load Sample Data
          </button>
        )}

        <button
          onClick={onOpenUpload}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Excel/CSV</span>
        </button>

        {hasData && (
          <button
            onClick={onExport}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Export 13-Sheet Complete Audit Report in Excel format"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        )}

        {hasData && (
          <button
            onClick={onClearData}
            type="button"
            className="inline-flex items-center p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:hover:bg-rose-950/40"
            title="Clear Current Data (Local Reset)"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onToggleDarkMode}
          type="button"
          className="inline-flex items-center p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
};
