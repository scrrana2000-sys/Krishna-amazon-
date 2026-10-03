import React from 'react';
import { AlertCircle, CheckCircle, Copy, FileText, Info } from 'lucide-react';
import { DuplicateRecord } from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';

interface DuplicatesViewProps {
  duplicates: DuplicateRecord[];
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({ duplicates }) => {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Copy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>Duplicate Detection & Ledger De-duplication ({duplicates.length})</span>
        </h2>
        <p className="text-xs text-slate-500">
          Suspicious duplicate rows, repeated payment events across monthly settlement sheets, and multi-file redundancies
        </p>
      </div>

      {duplicates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-slate-900 dark:text-white">
            No Duplicate Records Detected
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            All Order IDs and settlement disbursement rows across your uploaded files are unique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {duplicates.map((dup) => (
            <div
              key={dup.id}
              className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 transition dark:border-amber-900/50 dark:bg-amber-950/20"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {dup.key}
                    </span>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      {dup.type}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Found {dup.occurrences} times
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    <b className="font-medium text-slate-700 dark:text-slate-200">Recommended:</b>{' '}
                    {dup.recommendedTreatment}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Action: {dup.currentTreatment}
                  </span>
                </div>
              </div>

              {/* Source files trace */}
              <div className="mt-3 border-t border-amber-100 pt-2 text-[11px] text-slate-500 dark:border-amber-900/40">
                <span className="font-medium">Found in files:</span> {dup.sourceFiles.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
