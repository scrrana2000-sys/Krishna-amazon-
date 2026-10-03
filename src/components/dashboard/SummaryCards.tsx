import React from 'react';
import {
  AlertCircle,
  AlertOctagon,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Coins,
  DollarSign,
  HelpCircle,
  Package,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { PaymentStatus, ReconciliationSummary } from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';

interface SummaryCardsProps {
  summary: ReconciliationSummary;
  onFilterStatus: (status: PaymentStatus | 'ALL') => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onFilterStatus }) => {
  return (
    <div className="space-y-4">
      {/* 4 Primary Anchor KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <div
          onClick={() => onFilterStatus('ALL')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Total Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.totalOrders.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">units</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.amazonOrdersCount} Amazon · {summary.nonAmazonOrdersCount} Non-Amazon
          </p>
        </div>

        {/* Total Order Value */}
        <div
          onClick={() => onFilterStatus('ALL')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Total Order Value
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums dark:text-white">
              {formatCurrency(summary.totalOrderValue)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Gross customer invoice value
          </p>
        </div>

        {/* Total Received */}
        <div
          onClick={() => onFilterStatus('FULLY RECEIVED')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs transition hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:border-emerald-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-emerald-800 uppercase dark:text-emerald-300">
              Amount Received
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-700 font-mono tabular-nums dark:text-emerald-300">
              {formatCurrency(summary.totalReceived)}
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-800/80 font-medium dark:text-emerald-400">
            {summary.receivedPercent}% realized from sales
          </p>
        </div>

        {/* Total Pending */}
        <div
          onClick={() => onFilterStatus('PENDING')}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-xs transition hover:border-rose-300 dark:border-rose-900/50 dark:bg-rose-950/20 dark:hover:border-rose-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-rose-800 uppercase dark:text-rose-300">
              Total Pending Amount
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-700 font-mono tabular-nums dark:text-rose-300">
              {formatCurrency(summary.totalPending)}
            </span>
          </div>
          <p className="mt-1 text-xs text-rose-800/80 font-medium dark:text-rose-400">
            {summary.pendingPercent}% awaiting settlement
          </p>
        </div>
      </div>

      {/* 8 Secondary Status Breakdown Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {/* Fully Received */}
        <button
          type="button"
          onClick={() => onFilterStatus('FULLY RECEIVED')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-semibold text-slate-400">SETTLED</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.fullyReceivedCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Fully Received</div>
          </div>
        </button>

        {/* Partially Received */}
        <button
          type="button"
          onClick={() => onFilterStatus('PARTIALLY RECEIVED')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-amber-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-semibold text-slate-400">PARTIAL</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.partiallyReceivedCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Partially Paid</div>
          </div>
        </button>

        {/* Pending Orders */}
        <button
          type="button"
          onClick={() => onFilterStatus('PENDING')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-rose-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <Clock className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span className="text-[10px] font-semibold text-slate-400">UNPAID</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.pendingCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Pending Orders</div>
          </div>
        </button>

        {/* Cancelled */}
        <button
          type="button"
          onClick={() => onFilterStatus('CANCELLED')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <XCircle className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] font-semibold text-slate-400">VOID</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.cancelledCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Cancelled</div>
          </div>
        </button>

        {/* Refunded */}
        <button
          type="button"
          onClick={() => onFilterStatus('REFUNDED')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-purple-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <RotateCcw className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-semibold text-slate-400">RETURN</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.refundedCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Refunded</div>
          </div>
        </button>

        {/* Unmatched */}
        <button
          type="button"
          onClick={() => onFilterStatus('UNMATCHED')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] font-semibold text-slate-400">NO TXN</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.unmatchedCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Unmatched</div>
          </div>
        </button>

        {/* Review Required */}
        <button
          type="button"
          onClick={() => onFilterStatus('REVIEW REQUIRED')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-amber-400 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <AlertOctagon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-semibold text-slate-400">AUDIT</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.reviewRequiredCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Review Required</div>
          </div>
        </button>

        {/* Overpaid */}
        <button
          type="button"
          onClick={() => onFilterStatus('OVERPAID')}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-sky-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <ArrowUpRight className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="text-[10px] font-semibold text-slate-400">OVER</span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {summary.overpaidCount}
            </div>
            <div className="text-[11px] text-slate-500 truncate">Overpaid</div>
          </div>
        </button>
      </div>
    </div>
  );
};
