import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  MonthlyReconciliation,
  PaymentStatus,
  ReconciliationSummary,
} from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';

interface ReconciliationChartsProps {
  summary: ReconciliationSummary;
  monthlyData: MonthlyReconciliation[];
  onSelectStatus?: (status: PaymentStatus) => void;
  onSelectMonth?: (month: string) => void;
}

export const ReconciliationCharts: React.FC<ReconciliationChartsProps> = ({
  summary,
  monthlyData,
  onSelectStatus,
  onSelectMonth,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Status distribution items
  const statusItems = ([
    { status: 'FULLY RECEIVED' as PaymentStatus, label: 'Fully Received', count: summary.fullyReceivedCount, color: '#10B981' },
    { status: 'PARTIALLY RECEIVED' as PaymentStatus, label: 'Partially Received', count: summary.partiallyReceivedCount, color: '#F59E0B' },
    { status: 'PENDING' as PaymentStatus, label: 'Pending', count: summary.pendingCount, color: '#F43F5E' },
    { status: 'CANCELLED' as PaymentStatus, label: 'Cancelled', count: summary.cancelledCount, color: '#94A3B8' },
    { status: 'REFUNDED' as PaymentStatus, label: 'Refunded', count: summary.refundedCount, color: '#A855F7' },
    { status: 'UNMATCHED' as PaymentStatus, label: 'Unmatched', count: summary.unmatchedCount, color: '#6366F1' },
    { status: 'REVIEW REQUIRED' as PaymentStatus, label: 'Review Required', count: summary.reviewRequiredCount, color: '#D97706' },
  ] as Array<{ status: PaymentStatus; label: string; count: number; color: string }>).filter((s) => s.count > 0);

  const totalStatusCount = statusItems.reduce((acc, s) => acc + s.count, 0) || 1;

  // Max value calculation for Monthly Trend
  const maxMonthlyVal = Math.max(
    ...monthlyData.map((m) => Math.max(m.totalOrderValue, m.receivedAmount, m.pendingAmount)),
    1000
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Chart 1: Order Value vs Received vs Pending Comparison */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Order Value vs. Received vs. Pending
            </h3>
            <p className="text-xs text-slate-500">Realized reconciliation balance overview</p>
          </div>
          <BarChart3 className="h-4 w-4 text-slate-400" />
        </div>

        <div className="mt-6 space-y-4">
          {/* Order Value Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">Total Order Value (100%)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary.totalOrderValue)}
              </span>
            </div>
            <div className="h-4 w-full rounded-md bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div className="h-full bg-slate-700 dark:bg-slate-500 w-full" />
            </div>
          </div>

          {/* Received Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Amount Received ({summary.receivedPercent}%)
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(summary.totalReceived)}
              </span>
            </div>
            <div className="h-4 w-full rounded-md bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, summary.receivedPercent))}%` }}
              />
            </div>
          </div>

          {/* Pending Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-rose-700 dark:text-rose-400">
                Pending Receivables ({summary.pendingPercent}%)
              </span>
              <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                {formatCurrency(summary.totalPending)}
              </span>
            </div>
            <div className="h-4 w-full rounded-md bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, summary.pendingPercent))}%` }}
              />
            </div>
          </div>

          {/* Net Settlement Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-indigo-700 dark:text-indigo-400">
                Net Disbursed ({summary.settlementPercent}%)
              </span>
              <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                {formatCurrency(summary.totalNetSettlement)}
              </span>
            </div>
            <div className="h-4 w-full rounded-md bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, summary.settlementPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart 2: Status Distribution */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Payment Status Distribution
            </h3>
            <p className="text-xs text-slate-500">Order breakdown by clearance condition</p>
          </div>
          <PieChart className="h-4 w-4 text-slate-400" />
        </div>

        {/* Stacked bar representation */}
        <div className="mt-5">
          <div className="flex h-5 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
            {statusItems.map((item) => {
              const widthPct = (item.count / totalStatusCount) * 100;
              return (
                <div
                  key={item.status}
                  style={{ width: `${widthPct}%`, backgroundColor: item.color }}
                  className="h-full cursor-pointer transition hover:opacity-85"
                  title={`${item.label}: ${item.count} orders (${widthPct.toFixed(1)}%)`}
                  onClick={() => onSelectStatus && onSelectStatus(item.status)}
                />
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
            {statusItems.map((item) => {
              const pct = ((item.count / totalStatusCount) * 100).toFixed(1);
              return (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => onSelectStatus && onSelectStatus(item.status)}
                  className="flex items-center justify-between rounded p-2 text-left hover:bg-slate-50 transition dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-slate-600 dark:text-slate-400">{item.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums dark:text-white ml-2">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 3: Monthly Payment & Pending Trends */}
      {monthlyData.length > 0 && (
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Monthly Payment & Pending Trajectory
              </h3>
              <p className="text-xs text-slate-500">Gross orders vs. realized settlement by month</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="h-2 w-2 rounded-xs bg-slate-400" /> Order Value
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="h-2 w-2 rounded-xs bg-emerald-500" /> Received
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="h-2 w-2 rounded-xs bg-rose-500" /> Pending
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {monthlyData.map((m) => {
              const orderH = Math.max(8, (m.totalOrderValue / maxMonthlyVal) * 100);
              const recH = Math.max(4, (m.receivedAmount / maxMonthlyVal) * 100);
              const pendH = Math.max(4, (m.pendingAmount / maxMonthlyVal) * 100);

              return (
                <div
                  key={m.month}
                  onClick={() => onSelectMonth && onSelectMonth(m.month)}
                  className="group flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 hover:border-indigo-300 cursor-pointer transition dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{m.month}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{m.orderCount} ords</span>
                  </div>

                  {/* Micro comparative bar group */}
                  <div className="my-4 flex items-end justify-center gap-2 h-20">
                    <div
                      className="w-3 rounded-t-xs bg-slate-400/80 group-hover:bg-slate-500 transition"
                      style={{ height: `${orderH}%` }}
                      title={`Order Value: ${formatCurrency(m.totalOrderValue)}`}
                    />
                    <div
                      className="w-3 rounded-t-xs bg-emerald-500/80 group-hover:bg-emerald-600 transition"
                      style={{ height: `${recH}%` }}
                      title={`Received: ${formatCurrency(m.receivedAmount)}`}
                    />
                    <div
                      className="w-3 rounded-t-xs bg-rose-500/80 group-hover:bg-rose-600 transition"
                      style={{ height: `${pendH}%` }}
                      title={`Pending: ${formatCurrency(m.pendingAmount)}`}
                    />
                  </div>

                  <div className="text-[11px] space-y-0.5 border-t border-slate-200 pt-2 dark:border-slate-700">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500">Val:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrency(m.totalOrderValue, '₹', true)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-emerald-600">Rec:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {m.receivedPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
