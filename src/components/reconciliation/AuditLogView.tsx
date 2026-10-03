import React from 'react';
import { History, ShieldCheck } from 'lucide-react';
import { AuditLogEntry } from '../../types/reconciliation';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Manual Correction & System Audit Log ({logs.length})</span>
        </h2>
        <p className="text-xs text-slate-500">
          Immutable tracking of manual status overrides, notes, duplicate resolutions, and session actions
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-slate-500">
          <ShieldCheck className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p>No manual overrides or modifications made yet. All balances reflect verbatim imported Excel data.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">Timestamp</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Action</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Order / Txn ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Old Value</th>
                <th className="py-2.5 px-3 whitespace-nowrap">New Value</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Justification / Reason</th>
                <th className="py-2.5 px-3 whitespace-nowrap">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white whitespace-nowrap">
                    {log.orderId || log.transactionId || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {log.oldValue || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {log.newValue || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-sm">
                    {log.reason}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
