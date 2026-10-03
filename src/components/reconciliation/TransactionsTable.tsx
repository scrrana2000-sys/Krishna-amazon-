import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Layers,
  Search,
} from 'lucide-react';
import {
  NormalizedTransaction,
  TransactionType,
} from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';

interface TransactionsTableProps {
  transactions: NormalizedTransaction[];
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [duplicateFilter, setDuplicateFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchId = t.transactionId.toLowerCase().includes(q);
        const matchOrd = t.orderId.toLowerCase().includes(q) || t.normalizedOrderId.toLowerCase().includes(q);
        const matchSettlement = t.settlementId.toLowerCase().includes(q);
        if (!matchId && !matchOrd && !matchSettlement) return false;
      }

      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      if (duplicateFilter === 'YES' && !t.isDuplicate) return false;
      if (duplicateFilter === 'NO' && t.isDuplicate) return false;

      return true;
    });
  }, [transactions, search, typeFilter, duplicateFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Raw Settlement & Transaction Ledger ({transactions.length.toLocaleString()})</span>
          </h2>
          <p className="text-xs text-slate-500">
            Every transaction imported from Amazon settlement reports and payment feeds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search txn, order, settlement..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 w-56 rounded-md border border-slate-300 bg-white pl-8 pr-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Types</option>
            <option value="Order">Order Payments</option>
            <option value="Refund">Refunds</option>
            <option value="Service Fee">Service Fees</option>
            <option value="Adjustment">Adjustments</option>
            <option value="Transfer">Transfers / Payouts</option>
          </select>

          <select
            value={duplicateFilter}
            onChange={(e) => {
              setDuplicateFilter(e.target.value as any);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Txns</option>
            <option value="NO">Unique Only</option>
            <option value="YES">Flagged Duplicates</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Txn ID / Ref</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Order ID</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Settlement ID</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Event Type</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Gross (₹)</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Fees (₹)</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Net Payout (₹)</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Duplicate?</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Audit Note</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Source File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-slate-500">
                  No transactions match the query.
                </td>
              </tr>
            ) : (
              paginated.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {t.transactionId}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                    {t.normalizedOrderId || '— (No Order Linked)'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {t.settlementId || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      t.type === 'Refund'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums dark:text-white whitespace-nowrap">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums dark:text-slate-400 whitespace-nowrap">
                    {formatCurrency(t.fees)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums dark:text-indigo-400 whitespace-nowrap">
                    {formatCurrency(t.netAmount)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {t.isDuplicate ? (
                      <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] text-rose-700 font-medium">
                        Duplicate Flagged
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">Unique</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                    {t.matchingExplanation || 'Direct order match'}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-[120px] truncate">
                    {t.sourceFile}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div>
          Showing {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length.toLocaleString()} transactions
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-mono">{currentPage} / {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
