import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { DataQualityIssue } from '../../types/reconciliation';

interface DataQualityViewProps {
  issues: DataQualityIssue[];
  onSelectOrder?: (orderId: string) => void;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  issues,
  onSelectOrder,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'ERROR' | 'WARNING' | 'INFO'>('ALL');

  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warnings = issues.filter((i) => i.severity === 'WARNING');
  const infos = issues.filter((i) => i.severity === 'INFO');

  const filtered = issues.filter((i) => {
    if (filterSeverity === 'ALL') return true;
    return i.severity === filterSeverity;
  });

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Data Quality & Integrity Audit Report</span>
          </h2>
          <p className="text-xs text-slate-500">
            Automated anomaly detection, conflicting statuses, and source file discrepancies
          </p>
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setFilterSeverity('ALL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              filterSeverity === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            All ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('ERROR')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              filterSeverity === 'ERROR'
                ? 'bg-rose-50 text-rose-800 shadow-xs dark:bg-rose-950/60 dark:text-rose-200'
                : 'text-slate-600 hover:text-rose-700 dark:text-slate-400'
            }`}
          >
            Errors ({errors.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('WARNING')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              filterSeverity === 'WARNING'
                ? 'bg-amber-50 text-amber-800 shadow-xs dark:bg-amber-950/60 dark:text-amber-200'
                : 'text-slate-600 hover:text-amber-700 dark:text-slate-400'
            }`}
          >
            Warnings ({warnings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('INFO')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              filterSeverity === 'INFO'
                ? 'bg-slate-200 text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Info ({infos.length})
          </button>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-slate-900 dark:text-white">
            100% Clean Financial Ledger
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            All records adhere to exact numerical formats, valid Order IDs, and balanced settlement flows.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isErr = item.severity === 'ERROR';
            const isWarn = item.severity === 'WARNING';

            const borderStyle = isErr
              ? 'border-rose-200 bg-rose-50/30 dark:border-rose-950/60 dark:bg-rose-950/20'
              : isWarn
              ? 'border-amber-200 bg-amber-50/30 dark:border-amber-950/60 dark:bg-amber-950/20'
              : 'border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/20';

            const iconColor = isErr
              ? 'text-rose-600'
              : isWarn
              ? 'text-amber-600'
              : 'text-slate-400';

            return (
              <div key={item.id} className={`rounded-lg border p-4 transition ${borderStyle}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                    {isErr ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : isWarn ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase rounded px-1.5 py-0.5 ${
                        isErr
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : isWarn
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {item.severity} · {item.category}
                      </span>

                      {item.orderId && (
                        <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          Order: {item.orderId}
                        </span>
                      )}

                      {item.transactionId && (
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          Txn: {item.transactionId}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-mono">
                        Source: {item.sourceFile} {item.rowReference ? `(Row ${item.rowReference})` : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200">
                      {item.message}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      <b className="font-medium text-slate-700 dark:text-slate-300">Resolution:</b> {item.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
