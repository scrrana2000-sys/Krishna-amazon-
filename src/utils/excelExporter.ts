import * as XLSX from 'xlsx';
import {
  DataQualityIssue,
  DuplicateRecord,
  MonthlyReconciliation,
  NormalizedOrder,
  NormalizedTransaction,
  ReconciliationSummary,
} from '../types/reconciliation';

export function exportFullReconciliationWorkbook(data: {
  summary: ReconciliationSummary;
  orders: NormalizedOrder[];
  transactions: NormalizedTransaction[];
  duplicates: DuplicateRecord[];
  dataQuality: DataQualityIssue[];
  monthlyAnalysis: MonthlyReconciliation[];
  filename?: string;
}) {
  const wb = XLSX.utils.book_new();

  // Helper to convert objects to sheet with formatted column widths
  const addSheet = (sheetName: string, rows: any[]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel 31 char sheet limit
  };

  // 1. SUMMARY
  const summaryRows = [
    { Metric: 'Report Generation Timestamp', Value: new Date().toISOString() },
    { Metric: 'Total Orders Processed', Value: data.summary.totalOrders },
    { Metric: 'Total Order Value (₹)', Value: data.summary.totalOrderValue },
    { Metric: 'Total Amount Received (₹)', Value: data.summary.totalReceived },
    { Metric: 'Total Pending Amount (₹)', Value: data.summary.totalPending },
    { Metric: 'Total Refunded Amount (₹)', Value: data.summary.totalRefunded },
    { Metric: 'Total Selling Fees & Charges (₹)', Value: data.summary.totalFees },
    { Metric: 'Total Taxes (TCS/TDS/GST) (₹)', Value: data.summary.totalTaxes },
    { Metric: 'Total Net Settlement Disbursed (₹)', Value: data.summary.totalNetSettlement },
    { Metric: 'Unmatched Payment Amount (₹)', Value: data.summary.totalUnmatchedPaymentAmount },
    { Metric: '---', Value: '---' },
    { Metric: 'Payment Realization Rate (%)', Value: `${data.summary.receivedPercent}%` },
    { Metric: 'Pending Receivables Rate (%)', Value: `${data.summary.pendingPercent}%` },
    { Metric: 'Refund Rate (%)', Value: `${data.summary.refundPercent}%` },
    { Metric: '---', Value: '---' },
    { Metric: 'Fully Received Orders Count', Value: data.summary.fullyReceivedCount },
    { Metric: 'Partially Received Orders Count', Value: data.summary.partiallyReceivedCount },
    { Metric: 'Pending Orders Count', Value: data.summary.pendingCount },
    { Metric: 'Overpaid Orders Count', Value: data.summary.overpaidCount },
    { Metric: 'Cancelled Orders Count', Value: data.summary.cancelledCount },
    { Metric: 'Refunded Orders Count', Value: data.summary.refundedCount },
    { Metric: 'Unmatched Orders Count', Value: data.summary.unmatchedCount },
    { Metric: 'Review Required Count', Value: data.summary.reviewRequiredCount },
    { Metric: 'Amazon Platform Orders', Value: data.summary.amazonOrdersCount },
    { Metric: 'Non-Amazon / Excluded Orders', Value: data.summary.nonAmazonOrdersCount },
  ];
  addSheet('SUMMARY', summaryRows);

  // Helper mapper for order rows
  const formatOrderRows = (ords: NormalizedOrder[]) =>
    ords.map((o) => ({
      'Order ID': o.originalOrderId,
      'Normalized Order ID': o.normalizedOrderId,
      'Order Date': o.orderDate,
      'Channel': o.channel,
      'Order Amount (₹)': o.orderAmount,
      'Received Amount (₹)': o.receivedAmount,
      'Pending Amount (₹)': o.pendingAmount,
      'Refund Amount (₹)': o.refundAmount,
      'Fee Amount (₹)': o.feeAmount,
      'Net Settlement (₹)': o.netSettlementAmount,
      'Reconciliation Status': o.status,
      'Order Status': o.orderStatus,
      'Matching Audit Explanation': o.matchingExplanation,
      'Source File': o.sourceFile,
    }));

  // 2. ORDER RECONCILIATION (All orders)
  addSheet('ORDER RECONCILIATION', formatOrderRows(data.orders));

  // 3. RECEIVED ORDERS
  const receivedOrders = data.orders.filter((o) => o.status === 'FULLY RECEIVED');
  addSheet('RECEIVED ORDERS', formatOrderRows(receivedOrders));

  // 4. PENDING ORDERS
  const pendingOrders = data.orders.filter((o) => o.status === 'PENDING');
  addSheet('PENDING ORDERS', formatOrderRows(pendingOrders));

  // 5. PARTIAL PAYMENTS
  const partialOrders = data.orders.filter((o) => o.status === 'PARTIALLY RECEIVED');
  addSheet('PARTIAL PAYMENTS', formatOrderRows(partialOrders));

  // 6. CANCELLED ORDERS
  const cancelledOrders = data.orders.filter((o) => o.status === 'CANCELLED');
  addSheet('CANCELLED ORDERS', formatOrderRows(cancelledOrders));

  // 7. REFUNDED ORDERS
  const refundedOrders = data.orders.filter((o) => o.status === 'REFUNDED');
  addSheet('REFUNDED ORDERS', formatOrderRows(refundedOrders));

  // 8. UNMATCHED ORDERS
  const unmatchedOrders = data.orders.filter((o) => o.status === 'UNMATCHED');
  addSheet('UNMATCHED ORDERS', formatOrderRows(unmatchedOrders));

  // 9. REVIEW REQUIRED
  const reviewOrders = data.orders.filter(
    (o) => o.status === 'REVIEW REQUIRED' || o.status === 'OVERPAID'
  );
  addSheet('REVIEW REQUIRED', formatOrderRows(reviewOrders));

  // 10. TRANSACTIONS
  const txnRows = data.transactions.map((t) => ({
    'Transaction ID': t.transactionId,
    'Order ID': t.orderId,
    'Settlement ID': t.settlementId,
    'Date': t.date,
    'Type': t.type,
    'Gross Amount (₹)': t.amount,
    'Fees (₹)': t.fees,
    'Tax (₹)': t.tax,
    'Net Payout (₹)': t.netAmount,
    'Status': t.status,
    'Is Duplicate': t.isDuplicate ? 'YES' : 'NO',
    'Source File': t.sourceFile,
    'Audit Note': t.matchingExplanation,
  }));
  addSheet('TRANSACTIONS', txnRows);

  // 11. DUPLICATES
  const duplicateRows = data.duplicates.map((d) => ({
    'Duplicate Key / ID': d.key,
    'Duplicate Type': d.type,
    'Occurrences Count': d.occurrences,
    'Source Files': d.sourceFiles.join(', '),
    'Recommended Action': d.recommendedTreatment,
    'Engine Action Applied': d.currentTreatment,
  }));
  addSheet('DUPLICATES', duplicateRows);

  // 12. DATA QUALITY
  const dqRows = data.dataQuality.map((dq) => ({
    'Severity': dq.severity,
    'Issue Category': dq.category,
    'Order ID Reference': dq.orderId || 'N/A',
    'Transaction Reference': dq.transactionId || 'N/A',
    'Description': dq.message,
    'Recommended Resolution': dq.recommendation,
    'Source File': dq.sourceFile,
  }));
  addSheet('DATA QUALITY', dqRows);

  // 13. MONTHLY SUMMARY
  const monthlyRows = data.monthlyAnalysis.map((m) => ({
    'Month': m.month,
    'Orders Count': m.orderCount,
    'Total Order Value (₹)': m.totalOrderValue,
    'Received (₹)': m.receivedAmount,
    'Pending (₹)': m.pendingAmount,
    'Refunds (₹)': m.refundAmount,
    'Fees (₹)': m.feeAmount,
    'Net Settlement (₹)': m.netSettlement,
    'Fully Paid Count': m.fullyPaidCount,
    'Partial Count': m.partialCount,
    'Pending Count': m.pendingCount,
    'Cancelled Count': m.cancelledCount,
    'Received %': `${m.receivedPercentage}%`,
    'Pending %': `${m.pendingPercentage}%`,
  }));
  addSheet('MONTHLY SUMMARY', monthlyRows);

  // Write and trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  const outName = data.filename || `Amazon_Reconciliation_Report_${dateStr}.xlsx`;
  XLSX.writeFile(wb, outName);
}

export function exportFilteredOrdersToCsv(orders: NormalizedOrder[], filename: string) {
  const rows = orders.map((o) => ({
    'Order ID': o.originalOrderId,
    'Order Date': o.orderDate,
    'Order Amount (₹)': o.orderAmount,
    'Received (₹)': o.receivedAmount,
    'Pending (₹)': o.pendingAmount,
    'Refund (₹)': o.refundAmount,
    'Fees (₹)': o.feeAmount,
    'Net Settlement (₹)': o.netSettlementAmount,
    'Status': o.status,
    'Source': o.sourceFile,
    'Channel': o.channel,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
