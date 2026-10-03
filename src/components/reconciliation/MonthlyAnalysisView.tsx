import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { MonthlyReconciliation } from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';

interface MonthlyAnalysisViewProps {
  monthlyData: MonthlyReconciliation[];
  onSelectMonth: (month: string) => void;
}

export const MonthlyAnalysisView: React.FC<MonthlyAnalysisViewProps> = ({
  monthlyData,
  onSelectMonth,
}) => {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Monthly Payment & Reconciliation Analysis</span>
        </h2>
        <p className="text-xs text-slate-500">
          Cohort view of monthly order billings, disbursed bank payouts, and unsettled receivables
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Orders</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Order Value (₹)</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                Received (₹)
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap text-rose-700 dark:text-rose-400">
                Pending (₹)
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap text-purple-700 dark:text-purple-400">
                Refunds (₹)
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Fees (₹)</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap text-indigo-700 dark:text-indigo-400">
                Net Settled (₹)
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Realized %</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Fully / Part / Pend</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {monthlyData.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-slate-500">
                  No monthly transaction data available yet.
                </td>
              </tr>
            ) : (
              monthlyData.map((m, idx) => {
                const prev = monthlyData[idx - 1];
                const valChangePct =
                  prev && prev.totalOrderValue > 0
                    ? ((m.totalOrderValue - prev.totalOrderValue) / prev.totalOrderValue) * 100
                    : null;

                return (
                  <tr
                    key={m.month}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onSelectMonth(m.month)}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {m.month}
                      {valChangePct !== null && (
                        <span
                          className={`ml-2 inline-flex items-center text-[10px] font-mono ${
                            valChangePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {valChangePct >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 inline" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 inline" />
                          )}
                          {Math.abs(valChangePct).toFixed(0)}% MoM
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {m.orderCount}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums dark:text-white">
                      {formatCurrency(m.totalOrderValue)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                      {formatCurrency(m.receivedAmount)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 tabular-nums dark:text-rose-400">
                      {formatCurrency(m.pendingAmount)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-purple-700 tabular-nums dark:text-purple-400">
                      {formatCurrency(m.refundAmount)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums dark:text-slate-400">
                      {formatCurrency(m.feeAmount)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums dark:text-indigo-400">
                      {formatCurrency(m.netSettlement)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
                        {m.receivedPercentage}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <span className="text-emerald-600 font-semibold">{m.fullyPaidCount}</span> /{' '}
                      <span className="text-amber-600 font-semibold">{m.partialCount}</span> /{' '}
                      <span className="text-rose-600 font-semibold">{m.pendingCount}</span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMonth(m.month);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      >
                        <span>View Orders</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
