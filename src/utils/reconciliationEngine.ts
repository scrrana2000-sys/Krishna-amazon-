import {
  AuditLogEntry,
  ChannelType,
  ColumnMapping,
  DuplicateRecord,
  MonthlyReconciliation,
  NormalizedOrder,
  NormalizedTransaction,
  PaymentStatus,
  ReconciliationSettings,
  ReconciliationSummary,
  TransactionType,
  UploadedFileMetadata,
} from '../types/reconciliation';
import {
  calculatePercentage,
  parseCurrency,
  roundCurrency,
  safeAdd,
  safeSubtract,
} from './currency';
import { getMonthYearKey, parseExcelOrAnyDate } from './date';
import { normalizeOrderId } from './excelParser';

export const DEFAULT_SETTINGS: ReconciliationSettings = {
  currency: 'INR',
  currencySymbol: '₹',
  reconciliationTolerance: 0.01,
  amazonIdPattern: '^\\d{3}-\\d{7}-\\d{7}$',
  treatNegativeAdjustmentAsFee: true,
  autoExcludeCancelledOrders: true,
  countDuplicateTxnOnce: true,
  treatRefundAsNetDeduction: true,
};

/**
 * Checks if an Order ID follows the standard Amazon order ID pattern (3-7-7 digits).
 */
export function isAmazonOrderId(id: string, patternStr: string = '^\\d{3}-\\d{7}-\\d{7}$'): boolean {
  if (!id) return false;
  try {
    const re = new RegExp(patternStr);
    return re.test(id);
  } catch {
    return /^\d{3}-\d{7}-\d{7}$/.test(id);
  }
}

/**
 * Normalizes raw transaction type to standard enum
 */
export function categorizeTransactionType(raw: any): TransactionType {
  if (!raw) return 'Order';
  const str = String(raw).toLowerCase().trim();

  if (str.includes('refund') || str.includes('reversal') || str.includes('return')) {
    return 'Refund';
  }
  if (str.includes('service fee') || str.includes('subscription')) {
    return 'Service Fee';
  }
  if (str.includes('fba') && (str.includes('fee') || str.includes('inventory') || str.includes('storage') || str.includes('removal'))) {
    return 'FBA Inventory Fee';
  }
  if (str.includes('adjustment') || str.includes('balance adjustment')) {
    return 'Adjustment';
  }
  if (str.includes('transfer') || str.includes('disbursement') || str.includes('payout')) {
    return 'Transfer';
  }
  if (str.includes('guarantee') || str.includes('a-to-z')) {
    return 'Guarantee Claim';
  }
  if (str.includes('chargeback')) {
    return 'Chargeback';
  }
  if (str.includes('order') || str.includes('shipment') || str.includes('payment') || str.includes('sale')) {
    return 'Order';
  }
  return 'Other';
}

export interface ReconciliationResult {
  orders: NormalizedOrder[];
  transactions: NormalizedTransaction[];
  duplicates: DuplicateRecord[];
  summary: ReconciliationSummary;
  monthlyAnalysis: MonthlyReconciliation[];
  unmatchedTransactions: NormalizedTransaction[];
}

/**
 * Core Reconciliation Engine
 */
export function runReconciliation(
  files: UploadedFileMetadata[],
  fileMappings: Record<string, ColumnMapping>,
  settings: ReconciliationSettings = DEFAULT_SETTINGS,
  auditLogs: AuditLogEntry[] = []
): ReconciliationResult {
  const rawOrdersList: NormalizedOrder[] = [];
  const rawTxnsList: NormalizedTransaction[] = [];

  // 1. Ingest rows from each file based on its mapped columns
  for (const file of files) {
    const mapping = fileMappings[file.id];
    if (!mapping || !mapping.orderIdCol) continue;

    // Use selected sheet or all sheets if available
    const sheetsToProcess = file.sheets.filter(
      (s) => !file.selectedSheet || s.sheetName === file.selectedSheet || file.sheets.length === 1
    );

    for (const sheet of sheetsToProcess) {
      for (let i = 0; i < sheet.rows.length; i++) {
        const row = sheet.rows[i];
        const rawId = row[mapping.orderIdCol];
        const normId = normalizeOrderId(rawId);

        // Classify channel
        let channel: ChannelType = 'UNKNOWN';
        let exclusionReason: string | undefined;

        const rawChannel = mapping.channelCol ? String(row[mapping.channelCol] || '').toLowerCase() : '';
        if (rawChannel.includes('amazon') || isAmazonOrderId(normId, settings.amazonIdPattern)) {
          channel = 'AMAZON';
        } else if (rawChannel.includes('flipkart') || rawChannel.includes('shopify') || rawChannel.includes('meesho') || rawChannel.includes('myntra')) {
          channel = 'NON-AMAZON';
          exclusionReason = `Non-Amazon channel indicated: ${rawChannel}`;
        } else if (normId && !isAmazonOrderId(normId, settings.amazonIdPattern)) {
          channel = 'NON-AMAZON';
          exclusionReason = 'Order ID does not match standard Amazon 3-7-7 pattern (e.g. 408-1234567-8901234)';
        } else if (!normId) {
          channel = 'UNKNOWN';
          exclusionReason = 'Missing Order ID in source record';
        }

        const dateObj = parseExcelOrAnyDate(mapping.orderDateCol ? row[mapping.orderDateCol] : null);

        // Check if this row is primarily an Order Record or a Payment/Settlement Transaction
        const isTxnFile =
          file.detectedType === 'PAYMENT FILE' ||
          file.detectedType === 'SETTLEMENT FILE' ||
          file.detectedType === 'TRANSACTION FILE';

        const hasTxnFields =
          mapping.transactionIdCol ||
          mapping.settlementIdCol ||
          mapping.transactionTypeCol ||
          mapping.feeAmountCol ||
          (mapping.paymentAmountCol && mapping.orderAmountCol && mapping.paymentAmountCol !== mapping.orderAmountCol);

        if (isTxnFile || hasTxnFields) {
          // Process as Transaction
          const txnId = mapping.transactionIdCol ? String(row[mapping.transactionIdCol] || '').trim() : `TXN-${file.id}-${i + 1}`;
          const settlementId = mapping.settlementIdCol ? String(row[mapping.settlementIdCol] || '').trim() : '';
          const rawType = mapping.transactionTypeCol ? String(row[mapping.transactionTypeCol] || '') : 'Order';
          const type = categorizeTransactionType(rawType);

          const amountRaw = mapping.paymentAmountCol
            ? row[mapping.paymentAmountCol]
            : mapping.orderAmountCol
            ? row[mapping.orderAmountCol]
            : 0;
          const grossAmount = parseCurrency(amountRaw);
          const feeAmount = parseCurrency(mapping.feeAmountCol ? row[mapping.feeAmountCol] : 0);
          const taxAmount = parseCurrency(mapping.taxAmountCol ? row[mapping.taxAmountCol] : 0);
          const refundAmount = parseCurrency(mapping.refundAmountCol ? row[mapping.refundAmountCol] : 0);

          // If type is Refund and grossAmount is positive, make it negative for net calculation
          let effectiveAmount = grossAmount;
          if (type === 'Refund' && effectiveAmount > 0) {
            effectiveAmount = -effectiveAmount;
          } else if (refundAmount > 0) {
            effectiveAmount = safeSubtract(effectiveAmount, refundAmount);
          }

          // Net calculation = amount - fees - tax
          const netAmount = safeSubtract(effectiveAmount, safeAdd(Math.abs(feeAmount), Math.abs(taxAmount)));

          const txn: NormalizedTransaction = {
            id: `txn_${file.id}_${sheet.sheetName}_${i + 1}`,
            transactionId: txnId,
            orderId: String(rawId || '').trim(),
            normalizedOrderId: normId,
            settlementId,
            date: dateObj.displayString,
            rawDate: dateObj.date,
            type,
            rawType,
            amount: grossAmount,
            fees: Math.abs(feeAmount),
            tax: Math.abs(taxAmount),
            netAmount,
            status: mapping.statusCol ? String(row[mapping.statusCol] || '').trim() : 'Posted',
            sourceFile: file.name,
            sourceSheet: sheet.sheetName,
            matchingExplanation: '',
            isDuplicate: false,
            isExcluded: false,
            channel,
            exclusionReason,
            rawRow: row,
          };

          rawTxnsList.push(txn);

          // If this file is a combined Transaction file and also has order info, create an order record if not present
          if (normId && mapping.orderAmountCol) {
            const rawOrderAmt = parseCurrency(row[mapping.orderAmountCol]);
            if (rawOrderAmt > 0) {
              rawOrdersList.push({
                id: `ord_${file.id}_${sheet.sheetName}_${i + 1}`,
                originalOrderId: String(rawId || '').trim(),
                normalizedOrderId: normId,
                orderDate: dateObj.displayString,
                rawDate: dateObj.date,
                orderAmount: rawOrderAmt,
                itemSubtotal: rawOrderAmt,
                taxAmount: parseCurrency(mapping.taxAmountCol ? row[mapping.taxAmountCol] : 0),
                shippingAmount: 0,
                sku: mapping.skuCol ? String(row[mapping.skuCol] || '') : undefined,
                quantity: mapping.quantityCol ? Number(row[mapping.quantityCol]) || 1 : 1,
                orderStatus: mapping.statusCol ? String(row[mapping.statusCol] || 'Shipped').trim() : 'Shipped',
                channel,
                exclusionReason,
                sourceFile: file.name,
                sourceSheet: sheet.sheetName,
                rawRow: row,
                receivedAmount: 0,
                pendingAmount: rawOrderAmt,
                refundAmount: 0,
                feeAmount: 0,
                netSettlementAmount: 0,
                status: 'PENDING',
                matchingExplanation: '',
                transactions: [],
              });
            }
          }
        } else {
          // Process as Order Record
          const orderAmtRaw = mapping.orderAmountCol
            ? row[mapping.orderAmountCol]
            : mapping.paymentAmountCol
            ? row[mapping.paymentAmountCol]
            : 0;
          const orderAmt = parseCurrency(orderAmtRaw);
          const status = mapping.statusCol ? String(row[mapping.statusCol] || 'Shipped').trim() : 'Shipped';

          rawOrdersList.push({
            id: `ord_${file.id}_${sheet.sheetName}_${i + 1}`,
            originalOrderId: String(rawId || '').trim(),
            normalizedOrderId: normId,
            orderDate: dateObj.displayString,
            rawDate: dateObj.date,
            orderAmount: orderAmt,
            itemSubtotal: orderAmt,
            taxAmount: parseCurrency(mapping.taxAmountCol ? row[mapping.taxAmountCol] : 0),
            shippingAmount: 0,
            sku: mapping.skuCol ? String(row[mapping.skuCol] || '') : undefined,
            quantity: mapping.quantityCol ? Number(row[mapping.quantityCol]) || 1 : 1,
            orderStatus: status,
            channel,
            exclusionReason,
            sourceFile: file.name,
            sourceSheet: sheet.sheetName,
            rawRow: row,
            receivedAmount: 0,
            pendingAmount: orderAmt,
            refundAmount: 0,
            feeAmount: 0,
            netSettlementAmount: 0,
            status: 'PENDING',
            matchingExplanation: '',
            transactions: [],
          });
        }
      }
    }
  }

  // 2. DUPLICATE DETECTION
  const duplicates: DuplicateRecord[] = [];

  // Check duplicate Order IDs among orders
  const ordersById = new Map<string, NormalizedOrder[]>();
  for (const ord of rawOrdersList) {
    if (!ord.normalizedOrderId) continue;
    const group = ordersById.get(ord.normalizedOrderId) || [];
    group.push(ord);
    ordersById.set(ord.normalizedOrderId, group);
  }

  ordersById.forEach((group, id) => {
    if (group.length > 1) {
      duplicates.push({
        id: `dup_ord_${id}`,
        key: id,
        type: 'ORDER_ID',
        occurrences: group.length,
        sourceFiles: Array.from(new Set(group.map((g) => g.sourceFile))),
        recommendedTreatment: 'Consolidate multiple line items or aggregate total order value.',
        currentTreatment: 'COUNT_ONCE',
        records: group.map((g) => ({
          sourceFile: g.sourceFile,
          sourceSheet: g.sourceSheet,
          amount: g.orderAmount,
          date: g.orderDate,
          details: g.rawRow,
        })),
      });
    }
  });

  // Check duplicate Transactions (same transactionId or identical orderId + amount + date + settlementId)
  const txnsByKey = new Map<string, NormalizedTransaction[]>();
  for (const txn of rawTxnsList) {
    const key = txn.transactionId && !txn.transactionId.startsWith('TXN-')
      ? `id_${txn.transactionId}`
      : `val_${txn.normalizedOrderId}_${txn.amount}_${txn.date}_${txn.settlementId}`;

    const group = txnsByKey.get(key) || [];
    group.push(txn);
    txnsByKey.set(key, group);
  }

  txnsByKey.forEach((group, key) => {
    if (group.length > 1) {
      group.slice(1).forEach((t) => {
        t.isDuplicate = true;
        t.duplicateGroupId = key;
      });

      duplicates.push({
        id: `dup_txn_${key}`,
        key: group[0].transactionId || group[0].orderId,
        type: 'TRANSACTION_ID',
        occurrences: group.length,
        sourceFiles: Array.from(new Set(group.map((g) => g.sourceFile))),
        recommendedTreatment: 'Duplicate payment record detected across files or settlement batches. Count once to avoid artificial receipt inflation.',
        currentTreatment: settings.countDuplicateTxnOnce ? 'COUNT_ONCE' : 'FLAG_ONLY',
        records: group.map((g) => ({
          sourceFile: g.sourceFile,
          sourceSheet: g.sourceSheet,
          amount: g.amount,
          date: g.date,
          details: g.rawRow,
        })),
      });
    }
  });

  // 3. CONSOLIDATE ORDERS
  // When an Order has multiple line items in the order sheet, aggregate total order value safely
  const consolidatedOrdersMap = new Map<string, NormalizedOrder>();

  for (const ord of rawOrdersList) {
    if (!ord.normalizedOrderId) continue;

    if (!consolidatedOrdersMap.has(ord.normalizedOrderId)) {
      consolidatedOrdersMap.set(ord.normalizedOrderId, { ...ord });
    } else {
      const existing = consolidatedOrdersMap.get(ord.normalizedOrderId)!;
      // Aggregate order value for multi-item orders
      existing.orderAmount = safeAdd(existing.orderAmount, ord.orderAmount);
      existing.itemSubtotal = safeAdd(existing.itemSubtotal, ord.itemSubtotal);
      existing.taxAmount = safeAdd(existing.taxAmount, ord.taxAmount);
      existing.quantity = (existing.quantity || 1) + (ord.quantity || 1);
    }
  }

  // 4. MAP TRANSACTIONS TO ORDERS
  const matchedTxnIds = new Set<string>();
  const txnsByOrderId = new Map<string, NormalizedTransaction[]>();

  for (const txn of rawTxnsList) {
    if (!txn.normalizedOrderId) continue;
    const group = txnsByOrderId.get(txn.normalizedOrderId) || [];
    group.push(txn);
    txnsByOrderId.set(txn.normalizedOrderId, group);
  }

  // If we have transactions for orders that were not in the order file, create stub order records
  // so every transaction is audited and visible
  txnsByOrderId.forEach((txns, normId) => {
    if (!consolidatedOrdersMap.has(normId)) {
      const firstTxn = txns[0];
      const sumAmt = txns.reduce((sum, t) => safeAdd(sum, t.amount), 0);

      consolidatedOrdersMap.set(normId, {
        id: `gen_ord_${normId}`,
        originalOrderId: firstTxn.orderId,
        normalizedOrderId: normId,
        orderDate: firstTxn.date,
        rawDate: firstTxn.rawDate,
        orderAmount: sumAmt > 0 ? sumAmt : 0,
        itemSubtotal: sumAmt > 0 ? sumAmt : 0,
        taxAmount: 0,
        shippingAmount: 0,
        orderStatus: 'Unknown (Inferred from Payment Record)',
        channel: firstTxn.channel,
        exclusionReason: firstTxn.exclusionReason,
        sourceFile: firstTxn.sourceFile,
        sourceSheet: firstTxn.sourceSheet,
        rawRow: firstTxn.rawRow,
        receivedAmount: 0,
        pendingAmount: 0,
        refundAmount: 0,
        feeAmount: 0,
        netSettlementAmount: 0,
        status: 'UNMATCHED',
        matchingExplanation: 'Payment record exists in settlement file, but original order record was not found in uploaded order reports.',
        transactions: [],
      });
    }
  });

  const finalOrders: NormalizedOrder[] = [];

  // 5. CALCULATE RECONCILIATION FOR EVERY ORDER
  consolidatedOrdersMap.forEach((order) => {
    const matchedTxns = txnsByOrderId.get(order.normalizedOrderId) || [];
    order.transactions = matchedTxns;

    let validReceived = 0;
    let totalRefunds = 0;
    let totalFees = 0;
    let netSettlement = 0;
    const explanations: string[] = [];

    // Check if order is explicitly cancelled
    const statusLower = order.orderStatus.toLowerCase();
    const isCancelled =
      statusLower.includes('cancel') ||
      statusLower.includes('buyer_cancelled') ||
      statusLower.includes('returned before dispatch');

    for (const txn of matchedTxns) {
      matchedTxnIds.add(txn.id);

      // Check if duplicate should be skipped
      if (txn.isDuplicate && settings.countDuplicateTxnOnce) {
        txn.matchingExplanation = 'Duplicate transaction detected; skipped from received total to prevent inflation.';
        explanations.push(`Skipped duplicate txn ${txn.transactionId}`);
        continue;
      }

      // Check transaction type
      if (txn.type === 'Refund' || txn.amount < 0) {
        const refVal = Math.abs(txn.amount);
        totalRefunds = safeAdd(totalRefunds, refVal);
        txn.matchingExplanation = 'Refund transaction; excluded from positive receipts and recorded as refund deduction.';
        explanations.push(`Refund of ${settings.currencySymbol}${refVal.toFixed(2)} applied`);
        if (settings.treatRefundAsNetDeduction) {
          netSettlement = safeSubtract(netSettlement, refVal);
        }
      } else if (txn.type === 'Order' || txn.type === 'Adjustment') {
        validReceived = safeAdd(validReceived, txn.amount);
        totalFees = safeAdd(totalFees, txn.fees);
        netSettlement = safeAdd(netSettlement, txn.netAmount);
        txn.matchingExplanation = `Valid payment transaction matched via Order ID (${order.normalizedOrderId}). Gross: ${settings.currencySymbol}${txn.amount.toFixed(2)}, Fees: ${settings.currencySymbol}${txn.fees.toFixed(2)}.`;
        explanations.push(`Received ${settings.currencySymbol}${txn.amount.toFixed(2)} from settlement`);
      } else {
        // Fee or other non-order adjustment
        totalFees = safeAdd(totalFees, txn.fees || Math.abs(txn.amount));
        txn.matchingExplanation = `Transaction classified as ${txn.type}; treated as fee/adjustment.`;
      }
    }

    order.receivedAmount = validReceived;
    order.refundAmount = totalRefunds;
    order.feeAmount = totalFees;
    order.netSettlementAmount = netSettlement;

    // Calculate pending amount: Order Amount - Valid Received
    // Note: Cancelled orders have pending = 0
    let pending = safeSubtract(order.orderAmount, validReceived);
    if (pending < 0) pending = 0; // If overpaid, pending is 0
    if (isCancelled && settings.autoExcludeCancelledOrders) {
      pending = 0;
    }
    order.pendingAmount = pending;

    // Determine Payment Status
    const tol = settings.reconciliationTolerance;
    const diff = Math.abs(safeSubtract(order.orderAmount, validReceived));

    if (isCancelled) {
      order.status = 'CANCELLED';
      order.matchingExplanation = explanations.length > 0
        ? `Order cancelled. Payment records: ${explanations.join('; ')}`
        : 'Order was explicitly cancelled by buyer/system; excluded from pending receivables.';
    } else if (order.channel === 'NON-AMAZON') {
      order.status = 'REVIEW REQUIRED';
      order.matchingExplanation = `Non-Amazon channel or unrecognized Order ID pattern. ${order.exclusionReason || ''}`;
    } else if (matchedTxns.length === 0) {
      order.status = 'UNMATCHED';
      order.matchingExplanation = 'Order exists in order reports, but no payment or settlement transaction has been matched.';
    } else if (totalRefunds > 0 && validReceived > 0 && totalRefunds >= validReceived) {
      order.status = 'REFUNDED';
      order.matchingExplanation = `Order was fully refunded. Initial received: ${settings.currencySymbol}${validReceived.toFixed(2)}, Total refunded: ${settings.currencySymbol}${totalRefunds.toFixed(2)}.`;
    } else if (diff <= tol && validReceived > 0) {
      order.status = 'FULLY RECEIVED';
      order.matchingExplanation = `Payment fully received (${settings.currencySymbol}${validReceived.toFixed(2)} vs Order Value ${settings.currencySymbol}${order.orderAmount.toFixed(2)} within tolerance).`;
    } else if (validReceived > safeAdd(order.orderAmount, tol)) {
      order.status = 'OVERPAID';
      order.matchingExplanation = `Received amount (${settings.currencySymbol}${validReceived.toFixed(2)}) exceeds order value (${settings.currencySymbol}${order.orderAmount.toFixed(2)}). Review for accidental double settlement or adjustments.`;
    } else if (validReceived > 0 && validReceived < safeSubtract(order.orderAmount, tol)) {
      order.status = 'PARTIALLY RECEIVED';
      order.matchingExplanation = `Partially received ${settings.currencySymbol}${validReceived.toFixed(2)} of ${settings.currencySymbol}${order.orderAmount.toFixed(2)}. Outstanding balance: ${settings.currencySymbol}${order.pendingAmount.toFixed(2)}.`;
    } else if (validReceived === 0 && matchedTxns.length > 0) {
      order.status = totalRefunds > 0 ? 'REFUNDED' : 'REVIEW REQUIRED';
      order.matchingExplanation = totalRefunds > 0
        ? `Refund of ${settings.currencySymbol}${totalRefunds.toFixed(2)} recorded with zero initial received balance.`
        : 'Transactions matched but zero positive received amount calculated. Review transaction types.';
    } else {
      order.status = 'PENDING';
      order.matchingExplanation = 'Order is active with no settled payment transactions to date.';
    }

    // Apply any audit manual override
    const manualEntry = auditLogs.find((l) => l.orderId === order.normalizedOrderId && l.action === 'OVERRIDE_STATUS');
    if (manualEntry) {
      order.hasManualOverride = true;
      order.status = manualEntry.newValue as PaymentStatus;
      order.manualNotes = `Manual override: ${manualEntry.reason}`;
      order.matchingExplanation = `[Manual Override] ${manualEntry.reason}. (Original: ${order.matchingExplanation})`;
    }

    finalOrders.push(order);
  });

  // Sort orders by date descending if possible, or ID
  finalOrders.sort((a, b) => {
    if (a.rawDate && b.rawDate) {
      return (b.rawDate as Date).getTime() - (a.rawDate as Date).getTime();
    }
    return a.normalizedOrderId.localeCompare(b.normalizedOrderId);
  });

  // Unmatched transactions (transactions that have no order ID or could not match any order)
  const unmatchedTransactions = rawTxnsList.filter(
    (t) => !t.normalizedOrderId || !matchedTxnIds.has(t.id)
  );

  // 6. CALCULATE COMPREHENSIVE SUMMARY METRICS
  let totalOrderVal = 0;
  let totalRec = 0;
  let totalPend = 0;
  let totalRef = 0;
  let totalFeesAll = 0;
  let totalTaxAll = 0;
  let totalNetSettlementAll = 0;

  let fullyCount = 0;
  let partialCount = 0;
  let pendCount = 0;
  let overpaidCount = 0;
  let cancCount = 0;
  let refCount = 0;
  let unmatchCount = 0;
  let reviewCount = 0;
  let amzCount = 0;
  let nonAmzCount = 0;

  for (const ord of finalOrders) {
    if (ord.channel === 'AMAZON') amzCount++;
    else nonAmzCount++;

    totalOrderVal = safeAdd(totalOrderVal, ord.orderAmount);
    totalRec = safeAdd(totalRec, ord.receivedAmount);
    totalPend = safeAdd(totalPend, ord.pendingAmount);
    totalRef = safeAdd(totalRef, ord.refundAmount);
    totalFeesAll = safeAdd(totalFeesAll, ord.feeAmount);
    totalTaxAll = safeAdd(totalTaxAll, ord.taxAmount);
    totalNetSettlementAll = safeAdd(totalNetSettlementAll, ord.netSettlementAmount);

    switch (ord.status) {
      case 'FULLY RECEIVED':
        fullyCount++;
        break;
      case 'PARTIALLY RECEIVED':
        partialCount++;
        break;
      case 'PENDING':
        pendCount++;
        break;
      case 'OVERPAID':
        overpaidCount++;
        break;
      case 'CANCELLED':
        cancCount++;
        break;
      case 'REFUNDED':
        refCount++;
        break;
      case 'UNMATCHED':
        unmatchCount++;
        break;
      case 'REVIEW REQUIRED':
        reviewCount++;
        break;
    }
  }

  const unmatchedPaymentAmt = unmatchedTransactions.reduce(
    (acc, t) => safeAdd(acc, t.amount),
    0
  );

  const summary: ReconciliationSummary = {
    totalOrders: finalOrders.length,
    totalOrderValue: roundCurrency(totalOrderVal),
    totalReceived: roundCurrency(totalRec),
    totalPending: roundCurrency(totalPend),
    totalRefunded: roundCurrency(totalRef),
    totalFees: roundCurrency(totalFeesAll),
    totalTaxes: roundCurrency(totalTaxAll),
    totalNetSettlement: roundCurrency(totalNetSettlementAll),
    totalUnmatchedPaymentAmount: roundCurrency(unmatchedPaymentAmt),

    fullyReceivedCount: fullyCount,
    partiallyReceivedCount: partialCount,
    pendingCount: pendCount,
    overpaidCount: overpaidCount,
    cancelledCount: cancCount,
    refundedCount: refCount,
    unmatchedCount: unmatchCount,
    reviewRequiredCount: reviewCount,

    amazonOrdersCount: amzCount,
    nonAmazonOrdersCount: nonAmzCount,

    receivedPercent: calculatePercentage(totalRec, totalOrderVal),
    pendingPercent: calculatePercentage(totalPend, totalOrderVal),
    refundPercent: calculatePercentage(totalRef, totalOrderVal),
    settlementPercent: calculatePercentage(totalNetSettlementAll, totalOrderVal),
    unmatchedPercent: calculatePercentage(unmatchCount, finalOrders.length),
  };

  // 7. MONTHLY ANALYSIS AGGREGATION
  const monthMap = new Map<string, MonthlyReconciliation>();

  for (const ord of finalOrders) {
    const monthKey = getMonthYearKey(ord.rawDate);
    const m = monthMap.get(monthKey) || {
      month: monthKey,
      orderCount: 0,
      totalOrderValue: 0,
      receivedAmount: 0,
      pendingAmount: 0,
      refundAmount: 0,
      feeAmount: 0,
      netSettlement: 0,
      fullyPaidCount: 0,
      partialCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      refundedCount: 0,
      receivedPercentage: 0,
      pendingPercentage: 0,
    };

    m.orderCount++;
    m.totalOrderValue = safeAdd(m.totalOrderValue, ord.orderAmount);
    m.receivedAmount = safeAdd(m.receivedAmount, ord.receivedAmount);
    m.pendingAmount = safeAdd(m.pendingAmount, ord.pendingAmount);
    m.refundAmount = safeAdd(m.refundAmount, ord.refundAmount);
    m.feeAmount = safeAdd(m.feeAmount, ord.feeAmount);
    m.netSettlement = safeAdd(m.netSettlement, ord.netSettlementAmount);

    if (ord.status === 'FULLY RECEIVED') m.fullyPaidCount++;
    else if (ord.status === 'PARTIALLY RECEIVED') m.partialCount++;
    else if (ord.status === 'PENDING') m.pendingCount++;
    else if (ord.status === 'CANCELLED') m.cancelledCount++;
    else if (ord.status === 'REFUNDED') m.refundedCount++;

    monthMap.set(monthKey, m);
  }

  const monthlyAnalysis = Array.from(monthMap.values()).map((m) => {
    m.receivedPercentage = calculatePercentage(m.receivedAmount, m.totalOrderValue);
    m.pendingPercentage = calculatePercentage(m.pendingAmount, m.totalOrderValue);
    return m;
  });

  return {
    orders: finalOrders,
    transactions: rawTxnsList,
    duplicates,
    summary,
    monthlyAnalysis,
    unmatchedTransactions,
  };
}
