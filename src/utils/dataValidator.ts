import {
  DataQualityIssue,
  NormalizedOrder,
  NormalizedTransaction,
} from '../types/reconciliation';

export function runDataQualityValidation(
  orders: NormalizedOrder[],
  transactions: NormalizedTransaction[]
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  // Check Orders
  for (let idx = 0; idx < orders.length; idx++) {
    const o = orders[idx];

    // Missing Order ID
    if (!o.originalOrderId || o.originalOrderId === 'UNKNOWN' || o.originalOrderId === '') {
      issues.push({
        id: `dq_ord_noid_${idx}`,
        severity: 'ERROR',
        category: 'MISSING_ORDER_ID',
        sourceFile: o.sourceFile,
        message: `Order record has a missing or empty Order ID.`,
        recommendation: 'Check source order report to verify why Order ID was left blank.',
        rowReference: idx + 1,
      });
    }

    // Invalid or missing order amount
    if (isNaN(o.orderAmount) || o.orderAmount <= 0) {
      issues.push({
        id: `dq_ord_amt_${idx}`,
        severity: o.orderAmount < 0 ? 'ERROR' : 'WARNING',
        category: o.orderAmount < 0 ? 'NEGATIVE_AMOUNT' : 'INVALID_AMOUNT',
        orderId: o.normalizedOrderId,
        sourceFile: o.sourceFile,
        message: `Order ${o.normalizedOrderId} has an unexpected order value of ${o.orderAmount}.`,
        recommendation: 'Verify if this was a promotional zero-cost replacement or promotional giveaway.',
        rowReference: idx + 1,
      });
    }

    // Invalid date
    if (!o.rawDate || isNaN((o.rawDate as Date).getTime())) {
      issues.push({
        id: `dq_ord_date_${idx}`,
        severity: 'WARNING',
        category: 'INVALID_DATE',
        orderId: o.normalizedOrderId,
        sourceFile: o.sourceFile,
        message: `Order date '${o.orderDate}' could not be parsed into a calendar date.`,
        recommendation: 'Review date format in source file.',
      });
    }

    // Received exceeds order value
    if (o.receivedAmount > o.orderAmount + 0.5) {
      issues.push({
        id: `dq_ord_over_${idx}`,
        severity: 'WARNING',
        category: 'RECEIVED_EXCEEDS_ORDER',
        orderId: o.normalizedOrderId,
        sourceFile: o.sourceFile,
        message: `Total payment received (₹${o.receivedAmount.toFixed(2)}) exceeds original order amount (₹${o.orderAmount.toFixed(2)}).`,
        recommendation: 'Verify if multiple disbursements were imported twice or shipping adjustments occurred.',
      });
    }

    // Refund exceeds received payment
    if (o.refundAmount > 0 && o.receivedAmount > 0 && o.refundAmount > o.receivedAmount + 0.05) {
      issues.push({
        id: `dq_ord_ref_${idx}`,
        severity: 'ERROR',
        category: 'REFUND_EXCEEDS_PAYMENT',
        orderId: o.normalizedOrderId,
        sourceFile: o.sourceFile,
        message: `Total refund (₹${o.refundAmount.toFixed(2)}) is greater than initial received amount (₹${o.receivedAmount.toFixed(2)}).`,
        recommendation: 'Check whether a goodwill refund or customer compensation was debited from seller account.',
      });
    }

    // Non-Amazon order
    if (o.channel === 'NON-AMAZON') {
      issues.push({
        id: `dq_ord_nonamz_${idx}`,
        severity: 'INFO',
        category: 'NON_AMAZON_ORDER',
        orderId: o.normalizedOrderId,
        sourceFile: o.sourceFile,
        message: `Order ID '${o.normalizedOrderId}' is flagged as Non-Amazon (${o.exclusionReason || 'Unrecognized ID structure'}).`,
        recommendation: 'Excluded from standard Amazon payout formulas; review in Non-Amazon / Excluded tab.',
      });
    }

    // Conflicting status: Cancelled but received payment > 0
    if (o.status === 'CANCELLED' && o.receivedAmount > 0) {
      issues.push({
        id: `dq_ord_conf_${idx}`,
        severity: 'WARNING',
        category: 'CONFLICTING_STATUS',
        orderId: o.normalizedOrderId,
        sourceFile: o.sourceFile,
        message: `Order is marked as CANCELLED, yet received settlement payments totaling ₹${o.receivedAmount.toFixed(2)}.`,
        recommendation: 'Verify if order was cancelled after shipment or if settlement reversal was delayed.',
      });
    }
  }

  // Check Transactions
  for (let idx = 0; idx < transactions.length; idx++) {
    const t = transactions[idx];

    // Unmatched transaction
    if (!t.normalizedOrderId) {
      issues.push({
        id: `dq_txn_noord_${idx}`,
        severity: 'WARNING',
        category: 'INSUFFICIENT_DATA',
        transactionId: t.transactionId,
        sourceFile: t.sourceFile,
        message: `Transaction ${t.transactionId} (${t.type}) has no Order ID attached in the settlement report.`,
        recommendation: 'Could be an account-level fee, subscription charge, or reserve transfer.',
      });
    }

    // Duplicate transaction
    if (t.isDuplicate) {
      issues.push({
        id: `dq_txn_dup_${idx}`,
        severity: 'INFO',
        category: 'DUPLICATE_TXN',
        transactionId: t.transactionId,
        orderId: t.normalizedOrderId,
        sourceFile: t.sourceFile,
        message: `Transaction ID ${t.transactionId} appears duplicated across sheets or uploaded files.`,
        recommendation: 'Counted once by reconciliation engine to prevent duplicate credit.',
      });
    }
  }

  return issues;
}
