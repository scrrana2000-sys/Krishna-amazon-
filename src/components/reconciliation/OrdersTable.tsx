import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ChannelType,
  NormalizedOrder,
  PaymentStatus,
} from '../../types/reconciliation';
import { formatCurrency } from '../../utils/currency';
import { DateFilterType, isDateInPresetRange } from '../../utils/date';
import { exportFilteredOrdersToCsv } from '../../utils/excelExporter';
import { StatusBadge } from '../common/StatusBadge';

interface OrdersTableProps {
  orders: NormalizedOrder[];
  onSelectOrder: (order: NormalizedOrder) => void;
  initialStatusFilter?: PaymentStatus | 'ALL';
}

type SortField =
  | 'normalizedOrderId'
  | 'orderDate'
  | 'orderAmount'
  | 'receivedAmount'
  | 'pendingAmount'
  | 'refundAmount'
  | 'feeAmount'
  | 'netSettlementAmount'
  | 'status';

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onSelectOrder,
  initialStatusFilter = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>(initialStatusFilter);
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortAsc, setSortAsc] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Column Visibility
  const [visibleCols, setVisibleCols] = useState({
    orderId: true,
    date: true,
    orderAmount: true,
    received: true,
    pending: true,
    refund: true,
    fees: true,
    netSettlement: true,
    status: true,
    source: true,
    channel: true,
  });

  const [showColMenu, setShowColMenu] = useState(false);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId =
          o.normalizedOrderId.toLowerCase().includes(q) ||
          o.originalOrderId.toLowerCase().includes(q);
        const matchSku = o.sku ? o.sku.toLowerCase().includes(q) : false;
        const matchTxn = o.transactions.some((t) =>
          t.transactionId.toLowerCase().includes(q) || t.settlementId.toLowerCase().includes(q)
        );
        if (!matchId && !matchSku && !matchTxn) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

      // Channel
      if (channelFilter !== 'ALL' && o.channel !== channelFilter) return false;

      // Date
      if (dateFilter !== 'ALL') {
        const inDate = isDateInPresetRange(o.rawDate, dateFilter, customStart, customEnd);
        if (!inDate) return false;
      }

      // Amount range
      if (minAmount && o.orderAmount < parseFloat(minAmount)) return false;
      if (maxAmount && o.orderAmount > parseFloat(maxAmount)) return false;

      return true;
    });
  }, [orders, searchQuery, statusFilter, channelFilter, dateFilter, customStart, customEnd, minAmount, maxAmount]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'orderDate') {
        valA = a.rawDate ? (a.rawDate as Date).getTime() : 0;
        valB = b.rawDate ? (b.rawDate as Date).getTime() : 0;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [filteredOrders, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedOrders.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportFiltered = () => {
    const filename = `Amazon_Reconciliation_${statusFilter}_${new Date().toISOString().split('T')[0]}`;
    exportFilteredOrdersToCsv(filteredOrders, filename);
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order ID, Transaction ID, SKU, or Settlement ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="FULLY RECEIVED">Fully Received</option>
            <option value="PARTIALLY RECEIVED">Partially Received</option>
            <option value="PENDING">Pending Orders</option>
            <option value="OVERPAID">Overpaid</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
            <option value="UNMATCHED">Unmatched</option>
            <option value="REVIEW REQUIRED">Review Required</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value as any);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Channels</option>
            <option value="AMAZON">Amazon Only</option>
            <option value="NON-AMAZON">Non-Amazon / Excluded</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as any);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_YEAR">This Year</option>
            <option value="CUSTOM">Custom Date Range</option>
          </select>

          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColMenu(!showColMenu)}
              className="inline-flex items-center gap-1 h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Columns</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 top-10 z-20 w-48 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Toggle Columns</span>
                <div className="mt-2 space-y-1 text-xs">
                  {Object.keys(visibleCols).map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={(visibleCols as any)[key]}
                        onChange={() =>
                          setVisibleCols((prev) => ({
                            ...prev,
                            [key]: !(prev as any)[key],
                          }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                      <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Filtered CSV */}
          <button
            type="button"
            onClick={handleExportFiltered}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Export currently filtered view to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker if chosen */}
      {dateFilter === 'CUSTOM' && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
          <span className="text-slate-500">From:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="text-slate-500">To:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      )}

      {/* Main Reconciliation Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300">
            <tr>
              {visibleCols.orderId && (
                <th
                  onClick={() => toggleSort('normalizedOrderId')}
                  className="cursor-pointer py-2.5 px-3 whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Order ID</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.date && (
                <th
                  onClick={() => toggleSort('orderDate')}
                  className="cursor-pointer py-2.5 px-3 whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Order Date</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.channel && <th className="py-2.5 px-3 whitespace-nowrap">Channel</th>}

              {visibleCols.orderAmount && (
                <th
                  onClick={() => toggleSort('orderAmount')}
                  className="cursor-pointer py-2.5 px-3 text-right whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Order Amt (₹)</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.received && (
                <th
                  onClick={() => toggleSort('receivedAmount')}
                  className="cursor-pointer py-2.5 px-3 text-right whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1 text-emerald-700 dark:text-emerald-400">
                    <span>Received (₹)</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.pending && (
                <th
                  onClick={() => toggleSort('pendingAmount')}
                  className="cursor-pointer py-2.5 px-3 text-right whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1 text-rose-700 dark:text-rose-400">
                    <span>Pending (₹)</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.refund && (
                <th
                  onClick={() => toggleSort('refundAmount')}
                  className="cursor-pointer py-2.5 px-3 text-right whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1 text-purple-700 dark:text-purple-400">
                    <span>Refund (₹)</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.fees && (
                <th
                  onClick={() => toggleSort('feeAmount')}
                  className="cursor-pointer py-2.5 px-3 text-right whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Fees (₹)</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.netSettlement && (
                <th
                  onClick={() => toggleSort('netSettlementAmount')}
                  className="cursor-pointer py-2.5 px-3 text-right whitespace-nowrap hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1 text-indigo-700 dark:text-indigo-400">
                    <span>Net Settled (₹)</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              )}

              {visibleCols.status && <th className="py-2.5 px-3 whitespace-nowrap">Status</th>}

              {visibleCols.source && <th className="py-2.5 px-3 whitespace-nowrap">Source</th>}

              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-slate-500">
                  No orders match the current filter or search parameters.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => onSelectOrder(ord)}
                  className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                >
                  {visibleCols.orderId && (
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {ord.normalizedOrderId}
                      {ord.hasManualOverride && (
                        <span className="ml-1 text-[10px] text-amber-600" title="Manually Adjusted">
                          *
                        </span>
                      )}
                    </td>
                  )}

                  {visibleCols.date && (
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                      {ord.orderDate}
                    </td>
                  )}

                  {visibleCols.channel && (
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        ord.channel === 'AMAZON'
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {ord.channel}
                      </span>
                    </td>
                  )}

                  {visibleCols.orderAmount && (
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums dark:text-white whitespace-nowrap">
                      {formatCurrency(ord.orderAmount)}
                    </td>
                  )}

                  {visibleCols.received && (
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(ord.receivedAmount)}
                    </td>
                  )}

                  {visibleCols.pending && (
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 tabular-nums dark:text-rose-400 whitespace-nowrap">
                      {formatCurrency(ord.pendingAmount)}
                    </td>
                  )}

                  {visibleCols.refund && (
                    <td className="py-2.5 px-3 text-right font-mono text-purple-700 tabular-nums dark:text-purple-400 whitespace-nowrap">
                      {ord.refundAmount > 0 ? formatCurrency(ord.refundAmount) : '—'}
                    </td>
                  )}

                  {visibleCols.fees && (
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums dark:text-slate-400 whitespace-nowrap">
                      {ord.feeAmount > 0 ? formatCurrency(ord.feeAmount) : '—'}
                    </td>
                  )}

                  {visibleCols.netSettlement && (
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums dark:text-indigo-400 whitespace-nowrap">
                      {formatCurrency(ord.netSettlementAmount)}
                    </td>
                  )}

                  {visibleCols.status && (
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={ord.status} size="sm" />
                    </td>
                  )}

                  {visibleCols.source && (
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap max-w-[120px] truncate">
                      {ord.sourceFile}
                    </td>
                  )}

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(ord);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {sortedOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {Math.min(currentPage * pageSize, sortedOrders.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {sortedOrders.length.toLocaleString()}
          </span>{' '}
          orders
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <span className="font-mono text-xs">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
