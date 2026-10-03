import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';
import {
  NormalizedOrder,
  PaymentStatus,
} from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';
import { StatusBadge } from '../common/StatusBadge';

interface OrderDetailModalProps {
  order: NormalizedOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOverrideStatus?: (orderId: string, newStatus: PaymentStatus, reason: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOverrideStatus,
}) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>('FULLY RECEIVED');
  const [overrideReason, setOverrideReason] = useState('');

  if (!isOpen || !order) return null;

  const handleSaveOverride = () => {
    if (onOverrideStatus && overrideReason.trim()) {
      onOverrideStatus(order.normalizedOrderId, selectedStatus, overrideReason.trim());
      setIsEditingStatus(false);
      setOverrideReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono tracking-tight dark:text-white">
                  {order.normalizedOrderId}
                </h3>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Original ID in File: {order.originalOrderId} · Source: {order.sourceFile}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingStatus && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus(order.status);
                  setIsEditingStatus(true);
                }}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Manual Override
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {/* Manual override input form if opened */}
          {isEditingStatus && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-700/60 dark:bg-amber-950/40">
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Manual Status Override (Recorded in Audit Trail)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    New Reconciliation Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as PaymentStatus)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="FULLY RECEIVED">FULLY RECEIVED</option>
                    <option value="PARTIALLY RECEIVED">PARTIALLY RECEIVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="OVERPAID">OVERPAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="UNMATCHED">UNMATCHED</option>
                    <option value="REVIEW REQUIRED">REVIEW REQUIRED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Audit Justification / Note *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank credit verified manually via UTR statement"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingStatus(false)}
                  className="rounded px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!overrideReason.trim()}
                  onClick={handleSaveOverride}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  Apply & Log
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Order Information & Payment Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Information */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-slate-400" />
                Order Information
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{order.normalizedOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Date:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{order.orderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Status:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{order.orderStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Marketplace / Channel:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{order.channel}</span>
                </div>
                {order.sku && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">SKU:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{order.sku} (Qty: {order.quantity || 1})</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">Total Order Amount:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(order.orderAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Payment & Settlement Balances
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Valid Received Amount:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(order.receivedAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700 dark:text-rose-400 font-medium">Pending Outstanding:</span>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                    {formatCurrency(order.pendingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 dark:text-purple-400">Refunds Debited:</span>
                  <span className="font-mono text-purple-700 dark:text-purple-400">
                    {formatCurrency(order.refundAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fees Deducted:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    -{formatCurrency(order.feeAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-700">
                  <span className="text-indigo-700 dark:text-indigo-400">Net Seller Settlement:</span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-400">
                    {formatCurrency(order.netSettlementAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Transparent Step-by-Step Reconciliation Calculation */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950/60 dark:bg-indigo-950/20">
            <h4 className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Reconciliation Calculation Formula & Audit Trail
            </h4>
            <div className="rounded-lg bg-white p-3 font-mono text-xs dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
              <div className="flex justify-between">
                <span>Gross Order Value:</span>
                <span className="font-semibold">{formatCurrency(order.orderAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>− Valid Received Payout:</span>
                <span>{formatCurrency(order.receivedAmount)}</span>
              </div>
              {order.refundAmount > 0 && (
                <div className="flex justify-between text-purple-700 dark:text-purple-400">
                  <span>− Applied Customer Refund:</span>
                  <span>{formatCurrency(order.refundAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-rose-700 font-bold dark:border-slate-700 dark:text-rose-400">
                <span>= Outstanding / Pending Balance:</span>
                <span>{formatCurrency(order.pendingAmount)}</span>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              <b className="font-semibold">Matching Explanation:</b> {order.matchingExplanation}
            </p>
          </div>

          {/* Section 3: Matched Transaction History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Underlying Settlement Transactions ({order.transactions.length})
              </h4>
            </div>

            {order.transactions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                No payment or settlement transactions were found in the uploaded payment files for this Order ID.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Txn ID / Ref</th>
                      <th className="py-2 px-3">Settlement ID</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Gross (₹)</th>
                      <th className="py-2 px-3 text-right">Fees (₹)</th>
                      <th className="py-2 px-3 text-right">Net Payout (₹)</th>
                      <th className="py-2 px-3">Audit Treatment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {order.transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{txn.date}</td>
                        <td className="py-2 px-3 font-mono text-slate-800 dark:text-slate-200 font-medium">
                          {txn.transactionId}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{txn.settlementId || '—'}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            txn.type === 'Refund'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums dark:text-white">
                          {formatCurrency(txn.amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 tabular-nums dark:text-slate-400">
                          {formatCurrency(txn.fees)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums dark:text-indigo-400">
                          {formatCurrency(txn.netAmount)}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-500 max-w-xs">
                          {txn.matchingExplanation || 'Direct match via Amazon Order ID.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 dark:border-slate-800 text-xs">
          <div className="text-slate-500 font-mono">
            Status: <span className="font-semibold text-slate-900 dark:text-white">{order.status}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
