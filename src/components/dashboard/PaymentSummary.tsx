import React from 'react';
import {
  Banknote,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Percent,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { ReconciliationSummary } from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';

interface PaymentSummaryProps {
  summary: ReconciliationSummary;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ summary }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Amazon Payment & Settlement Reconciliation Summary</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formulas verified against actual imported ledger lines without approximation
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Tolerance: ±₹0.01</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Financial Balances */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Gross to Net Breakdown
          </h3>

          <div className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 dark:text-slate-400">Total Order Value (Buyer Gross)</span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums dark:text-white">
                {formatCurrency(summary.totalOrderValue)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Valid Received Principal Amount</span>
              <span className="font-bold text-emerald-700 font-mono tabular-nums dark:text-emerald-400">
                {formatCurrency(summary.totalReceived)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-rose-700 dark:text-rose-400 font-medium">Outstanding / Pending Amount</span>
              <span className="font-bold text-rose-700 font-mono tabular-nums dark:text-rose-400">
                {formatCurrency(summary.totalPending)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-purple-700 dark:text-purple-400">Total Customer Refunds & Reversals</span>
              <span className="font-medium text-purple-700 font-mono tabular-nums dark:text-purple-400">
                {formatCurrency(summary.totalRefunded)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 dark:text-slate-400">Amazon Marketplace Fees (Commission & Logistics)</span>
              <span className="font-medium text-slate-700 font-mono tabular-nums dark:text-slate-300">
                -{formatCurrency(summary.totalFees)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 dark:text-slate-400">Government Taxes Withheld (TCS / TDS / GST)</span>
              <span className="font-medium text-slate-700 font-mono tabular-nums dark:text-slate-300">
                -{formatCurrency(summary.totalTaxes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 bg-slate-50 px-2 rounded dark:bg-slate-800/60">
              <span className="font-semibold text-slate-900 dark:text-white">Actual Seller Net Settlement Disbursed</span>
              <span className="text-sm font-bold text-indigo-700 font-mono tabular-nums dark:text-indigo-400">
                {formatCurrency(summary.totalNetSettlement)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                Unmatched Settlement Deposits
              </span>
              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                {formatCurrency(summary.totalUnmatchedPaymentAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Reconciliation Realization Rates & Progress */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Realization & Clearance Rates
          </h3>

          <div className="space-y-4">
            {/* Received % */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Received Rate</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {summary.receivedPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, summary.receivedPercent))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proportion of gross order billings matched and credited
              </p>
            </div>

            {/* Pending % */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Pending Unsettled Rate</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                  {summary.pendingPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, summary.pendingPercent))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Eligible orders awaiting Amazon disbursement cycle
              </p>
            </div>

            {/* Net Settlement % */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Net Settlement Yield</span>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                  {summary.settlementPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, summary.settlementPercent))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Net bank payout after Amazon commission, FBA fees, and GST
              </p>
            </div>

            {/* Refund % */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Refund Ratio</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                  {summary.refundPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, summary.refundPercent))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Customer returns and order cancellation refunds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
