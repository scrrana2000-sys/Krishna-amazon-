/**
 * Domain types for Amazon Order Payment Reconciliation & Analysis
 */

export type PaymentStatus =
  | 'FULLY RECEIVED'
  | 'PARTIALLY RECEIVED'
  | 'PENDING'
  | 'OVERPAID'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'UNMATCHED'
  | 'REVIEW REQUIRED';

export type ChannelType = 'AMAZON' | 'NON-AMAZON' | 'UNKNOWN';

export type FileClassification =
  | 'ORDER FILE'
  | 'PAYMENT FILE'
  | 'TRANSACTION FILE'
  | 'SETTLEMENT FILE'
  | 'UNKNOWN FILE';

export type TransactionType =
  | 'Order'
  | 'Refund'
  | 'Adjustment'
  | 'Service Fee'
  | 'FBA Inventory Fee'
  | 'Transfer'
  | 'Guarantee Claim'
  | 'Chargeback'
  | 'Reversal'
  | 'Other';

export interface RawFileSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface UploadedFileMetadata {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  sheets: RawFileSheet[];
  detectedType: FileClassification;
  selectedSheet: string;
}

export interface ColumnMapping {
  orderIdCol: string;
  orderDateCol?: string;
  orderAmountCol?: string;
  paymentAmountCol?: string;
  refundAmountCol?: string;
  feeAmountCol?: string;
  taxAmountCol?: string;
  transactionIdCol?: string;
  settlementIdCol?: string;
  transactionTypeCol?: string;
  statusCol?: string;
  channelCol?: string;
  skuCol?: string;
  quantityCol?: string;
}

export interface NormalizedTransaction {
  id: string;
  transactionId: string;
  orderId: string;
  normalizedOrderId: string;
  settlementId: string;
  date: string;
  rawDate: any;
  type: TransactionType;
  rawType: string;
  amount: number;
  fees: number;
  tax: number;
  netAmount: number;
  status: string;
  sourceFile: string;
  sourceSheet: string;
  matchingExplanation: string;
  isDuplicate: boolean;
  duplicateGroupId?: string;
  isExcluded: boolean;
  exclusionReason?: string;
  channel: ChannelType;
  rawRow: Record<string, any>;
}

export interface NormalizedOrder {
  id: string;
  originalOrderId: string;
  normalizedOrderId: string;
  orderDate: string;
  rawDate: any;
  orderAmount: number;
  itemSubtotal: number;
  taxAmount: number;
  shippingAmount: number;
  sku?: string;
  quantity?: number;
  orderStatus: string;
  channel: ChannelType;
  exclusionReason?: string;
  sourceFile: string;
  sourceSheet: string;
  rawRow: Record<string, any>;

  // Calculated Reconciliation Fields
  receivedAmount: number;
  pendingAmount: number;
  refundAmount: number;
  feeAmount: number;
  netSettlementAmount: number;
  status: PaymentStatus;
  matchingExplanation: string;
  transactions: NormalizedTransaction[];
  hasManualOverride?: boolean;
  manualNotes?: string;
}

export interface DuplicateRecord {
  id: string;
  key: string;
  type: 'ORDER_ID' | 'TRANSACTION_ID' | 'IDENTICAL_ROW' | 'MULTI_FILE_PAYMENT';
  occurrences: number;
  sourceFiles: string[];
  recommendedTreatment: string;
  currentTreatment: 'COUNT_ONCE' | 'FLAG_ONLY' | 'EXCLUDE_DUPLICATES';
  records: Array<{
    sourceFile: string;
    sourceSheet: string;
    rowNumber?: number;
    amount?: number;
    date?: string;
    details: Record<string, any>;
  }>;
}

export interface DataQualityIssue {
  id: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  category:
    | 'MISSING_ORDER_ID'
    | 'INVALID_AMOUNT'
    | 'NEGATIVE_AMOUNT'
    | 'INVALID_DATE'
    | 'DUPLICATE_ORDER'
    | 'DUPLICATE_TXN'
    | 'REFUND_EXCEEDS_PAYMENT'
    | 'RECEIVED_EXCEEDS_ORDER'
    | 'NON_AMAZON_ORDER'
    | 'CONFLICTING_STATUS'
    | 'INSUFFICIENT_DATA';
  orderId?: string;
  transactionId?: string;
  sourceFile: string;
  message: string;
  recommendation: string;
  rowReference?: number;
}

export interface MonthlyReconciliation {
  month: string; // e.g. "2026-05" or "May 2026"
  orderCount: number;
  totalOrderValue: number;
  receivedAmount: number;
  pendingAmount: number;
  refundAmount: number;
  feeAmount: number;
  netSettlement: number;
  fullyPaidCount: number;
  partialCount: number;
  pendingCount: number;
  cancelledCount: number;
  refundedCount: number;
  receivedPercentage: number;
  pendingPercentage: number;
  orderGrowthMoM?: number;
  valueGrowthMoM?: number;
}

export interface ReconciliationSummary {
  totalOrders: number;
  totalOrderValue: number;
  totalReceived: number;
  totalPending: number;
  totalRefunded: number;
  totalFees: number;
  totalTaxes: number;
  totalNetSettlement: number;
  totalUnmatchedPaymentAmount: number;

  fullyReceivedCount: number;
  partiallyReceivedCount: number;
  pendingCount: number;
  overpaidCount: number;
  cancelledCount: number;
  refundedCount: number;
  unmatchedCount: number;
  reviewRequiredCount: number;

  amazonOrdersCount: number;
  nonAmazonOrdersCount: number;

  receivedPercent: number;
  pendingPercent: number;
  refundPercent: number;
  settlementPercent: number;
  unmatchedPercent: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  orderId?: string;
  transactionId?: string;
  oldValue: string;
  newValue: string;
  reason: string;
  user: string;
}

export interface ReconciliationSettings {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  currencySymbol: string;
  reconciliationTolerance: number; // e.g. 0.01
  amazonIdPattern: string; // e.g. ^\d{3}-\d{7}-\d{7}$
  treatNegativeAdjustmentAsFee: boolean;
  autoExcludeCancelledOrders: boolean;
  countDuplicateTxnOnce: boolean;
  treatRefundAsNetDeduction: boolean;
}

export interface ReconciliationResult {
  orders: NormalizedOrder[];
  transactions: NormalizedTransaction[];
  duplicates: DuplicateRecord[];
  summary: ReconciliationSummary;
  monthlyAnalysis: MonthlyReconciliation[];
  unmatchedTransactions: NormalizedTransaction[];
}
