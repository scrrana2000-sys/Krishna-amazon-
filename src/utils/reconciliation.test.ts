import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatCurrency,
  parseCurrency,
  roundCurrency,
  safeAdd,
  safeSubtract,
} from './currency';
import {
  isDateInPresetRange,
  parseExcelOrAnyDate,
} from './date';
import {
  autoDetectColumnMapping,
  normalizeOrderId,
} from './excelParser';
import {
  isAmazonOrderId,
  runReconciliation,
} from './reconciliationEngine';
import { runDataQualityValidation } from './dataValidator';
import { ColumnMapping, UploadedFileMetadata } from '../types/reconciliation';

describe('Order Payment Reconciliation Suite', () => {
  it('normalizes Order IDs accurately', () => {
    assert.strictEqual(normalizeOrderId(' 408-1928374-9182736 '), '408-1928374-9182736');
    assert.strictEqual(normalizeOrderId('"408-1928374-9182736"'), '408-1928374-9182736');
    assert.strictEqual(normalizeOrderId(null), '');
  });

  it('detects Amazon 3-7-7 Order IDs vs Non-Amazon IDs', () => {
    assert.strictEqual(isAmazonOrderId('408-1928374-9182736'), true);
    assert.strictEqual(isAmazonOrderId('FK-OD987654321'), false);
    assert.strictEqual(isAmazonOrderId('#10294'), false);
  });

  it('handles Indian currency formatting & decimal-safe calculations', () => {
    assert.strictEqual(parseCurrency('₹1,250.00'), 1250);
    assert.strictEqual(parseCurrency('INR 1,25,000.50'), 125000.50);
    assert.strictEqual(parseCurrency('(₹ 450.00)'), -450);
    assert.strictEqual(parseCurrency(''), 0);

    // Floating point precision test: 0.1 + 0.2 should equal 0.3 without float jitter
    assert.strictEqual(safeAdd(0.1, 0.2), 0.3);
    assert.strictEqual(safeSubtract(100.55, 0.55), 100);

    // Indian comma grouping
    const formatted = formatCurrency(125000);
    assert.strictEqual(formatted, '₹1,25,000.00');
  });

  it('parses dates and Excel serials correctly', () => {
    const iso = parseExcelOrAnyDate('2026-09-15');
    assert.strictEqual(iso.displayString, '15-09-2026');

    const ddmmyyyy = parseExcelOrAnyDate('15/09/2026');
    assert.strictEqual(ddmmyyyy.displayString, '15-09-2026');

    // Excel serial 46280 (approx year 2026)
    const excelSerial = parseExcelOrAnyDate(46280);
    assert.ok(excelSerial.date !== null);
  });

  it('auto-detects standard Amazon column headers', () => {
    const headers = [
      'amazon-order-id',
      'purchase-date',
      'item-price',
      'item-tax',
      'order-status',
      'sales-channel',
    ];
    const mapping = autoDetectColumnMapping(headers);
    assert.strictEqual(mapping.orderIdCol, 'amazon-order-id');
    assert.strictEqual(mapping.orderDateCol, 'purchase-date');
    assert.strictEqual(mapping.orderAmountCol, 'item-price');
    assert.strictEqual(mapping.statusCol, 'order-status');
  });

  it('reconciles FULLY RECEIVED orders within tolerance', () => {
    const orderFile: UploadedFileMetadata = {
      id: 'f_ord',
      name: 'orders.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Orders',
          headers: ['order-id', 'order-date', 'item-price', 'order-status'],
          rows: [{ 'order-id': '408-1111111-2222222', 'order-date': '2026-09-01', 'item-price': 1500, 'order-status': 'Shipped' }],
          totalRows: 1,
        },
      ],
      detectedType: 'ORDER FILE',
      selectedSheet: 'Orders',
    };

    const settlementFile: UploadedFileMetadata = {
      id: 'f_settl',
      name: 'settlement.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Settlements',
          headers: ['order-id', 'posted-date', 'total-amount', 'selling-fees', 'net-payment', 'transaction-type'],
          rows: [
            {
              'order-id': '408-1111111-2222222',
              'posted-date': '2026-09-05',
              'total-amount': 1500,
              'selling-fees': 200,
              'net-payment': 1300,
              'transaction-type': 'Order',
            },
          ],
          totalRows: 1,
        },
      ],
      detectedType: 'SETTLEMENT FILE',
      selectedSheet: 'Settlements',
    };

    const mappings: Record<string, ColumnMapping> = {
      f_ord: { orderIdCol: 'order-id', orderDateCol: 'order-date', orderAmountCol: 'item-price', statusCol: 'order-status' },
      f_settl: {
        orderIdCol: 'order-id',
        orderDateCol: 'posted-date',
        paymentAmountCol: 'total-amount',
        feeAmountCol: 'selling-fees',
        transactionTypeCol: 'transaction-type',
      },
    };

    const result = runReconciliation([orderFile, settlementFile], mappings);
    assert.strictEqual(result.orders.length, 1);
    const ord = result.orders[0];
    assert.strictEqual(ord.status, 'FULLY RECEIVED');
    assert.strictEqual(ord.orderAmount, 1500);
    assert.strictEqual(ord.receivedAmount, 1500);
    assert.strictEqual(ord.pendingAmount, 0);
  });

  it('reconciles PARTIALLY RECEIVED orders accurately', () => {
    const orderFile: UploadedFileMetadata = {
      id: 'f_ord',
      name: 'orders.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Orders',
          headers: ['order-id', 'item-price'],
          rows: [{ 'order-id': '408-3333333-4444444', 'item-price': 2000 }],
          totalRows: 1,
        },
      ],
      detectedType: 'ORDER FILE',
      selectedSheet: 'Orders',
    };

    const settlementFile: UploadedFileMetadata = {
      id: 'f_settl',
      name: 'settlement.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Settlements',
          headers: ['order-id', 'total-amount', 'transaction-type'],
          rows: [
            {
              'order-id': '408-3333333-4444444',
              'total-amount': 800,
              'transaction-type': 'Order',
            },
          ],
          totalRows: 1,
        },
      ],
      detectedType: 'SETTLEMENT FILE',
      selectedSheet: 'Settlements',
    };

    const mappings: Record<string, ColumnMapping> = {
      f_ord: { orderIdCol: 'order-id', orderAmountCol: 'item-price' },
      f_settl: { orderIdCol: 'order-id', paymentAmountCol: 'total-amount', transactionTypeCol: 'transaction-type' },
    };

    const result = runReconciliation([orderFile, settlementFile], mappings);
    const ord = result.orders[0];
    assert.strictEqual(ord.status, 'PARTIALLY RECEIVED');
    assert.strictEqual(ord.orderAmount, 2000);
    assert.strictEqual(ord.receivedAmount, 800);
    assert.strictEqual(ord.pendingAmount, 1200);
  });

  it('reconciles REFUNDED orders and deducts from net settlement', () => {
    const orderFile: UploadedFileMetadata = {
      id: 'f_ord',
      name: 'orders.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Orders',
          headers: ['order-id', 'item-price'],
          rows: [{ 'order-id': '408-5555555-6666666', 'item-price': 1000 }],
          totalRows: 1,
        },
      ],
      detectedType: 'ORDER FILE',
      selectedSheet: 'Orders',
    };

    const settlementFile: UploadedFileMetadata = {
      id: 'f_settl',
      name: 'settlement.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Settlements',
          headers: ['order-id', 'total-amount', 'transaction-type'],
          rows: [
            {
              'order-id': '408-5555555-6666666',
              'total-amount': 1000,
              'transaction-type': 'Order',
            },
            {
              'order-id': '408-5555555-6666666',
              'total-amount': -1000,
              'transaction-type': 'Refund',
            },
          ],
          totalRows: 2,
        },
      ],
      detectedType: 'SETTLEMENT FILE',
      selectedSheet: 'Settlements',
    };

    const mappings: Record<string, ColumnMapping> = {
      f_ord: { orderIdCol: 'order-id', orderAmountCol: 'item-price' },
      f_settl: { orderIdCol: 'order-id', paymentAmountCol: 'total-amount', transactionTypeCol: 'transaction-type' },
    };

    const result = runReconciliation([orderFile, settlementFile], mappings);
    const ord = result.orders[0];
    assert.strictEqual(ord.status, 'REFUNDED');
    assert.strictEqual(ord.refundAmount, 1000);
  });

  it('detects CANCELLED orders and sets pending to zero', () => {
    const orderFile: UploadedFileMetadata = {
      id: 'f_ord',
      name: 'orders.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Orders',
          headers: ['order-id', 'item-price', 'order-status'],
          rows: [{ 'order-id': '408-7777777-8888888', 'item-price': 2500, 'order-status': 'Cancelled' }],
          totalRows: 1,
        },
      ],
      detectedType: 'ORDER FILE',
      selectedSheet: 'Orders',
    };

    const mappings: Record<string, ColumnMapping> = {
      f_ord: { orderIdCol: 'order-id', orderAmountCol: 'item-price', statusCol: 'order-status' },
    };

    const result = runReconciliation([orderFile], mappings);
    const ord = result.orders[0];
    assert.strictEqual(ord.status, 'CANCELLED');
    assert.strictEqual(ord.pendingAmount, 0);
  });

  it('detects duplicate transactions across sheets without counting twice', () => {
    const settlementFile: UploadedFileMetadata = {
      id: 'f_settl',
      name: 'settlement.xlsx',
      size: 1000,
      lastModified: Date.now(),
      sheets: [
        {
          sheetName: 'Batch1',
          headers: ['order-id', 'total-amount', 'transaction-id', 'transaction-type'],
          rows: [
            { 'order-id': '408-9999999-0000000', 'total-amount': 500, 'transaction-id': 'TXN-001', 'transaction-type': 'Order' },
            { 'order-id': '408-9999999-0000000', 'total-amount': 500, 'transaction-id': 'TXN-001', 'transaction-type': 'Order' },
          ],
          totalRows: 2,
        },
      ],
      detectedType: 'SETTLEMENT FILE',
      selectedSheet: 'Batch1',
    };

    const mappings: Record<string, ColumnMapping> = {
      f_settl: {
        orderIdCol: 'order-id',
        paymentAmountCol: 'total-amount',
        transactionIdCol: 'transaction-id',
        transactionTypeCol: 'transaction-type',
      },
    };

    const result = runReconciliation([settlementFile], mappings);
    assert.strictEqual(result.duplicates.length, 1);
    assert.strictEqual(result.duplicates[0].type, 'TRANSACTION_ID');
  });

  it('validates data quality and produces audit issues', () => {
    const orders = [
      {
        id: '1',
        originalOrderId: '',
        normalizedOrderId: '',
        orderDate: '2026-09-01',
        rawDate: new Date('2026-09-01'),
        orderAmount: -100,
        itemSubtotal: -100,
        taxAmount: 0,
        shippingAmount: 0,
        orderStatus: 'Shipped',
        channel: 'AMAZON' as const,
        sourceFile: 'orders.xlsx',
        sourceSheet: 'Sheet1',
        rawRow: {},
        receivedAmount: 0,
        pendingAmount: 0,
        refundAmount: 0,
        feeAmount: 0,
        netSettlementAmount: 0,
        status: 'PENDING' as const,
        matchingExplanation: '',
        transactions: [],
      },
    ];

    const issues = runDataQualityValidation(orders, []);
    assert.ok(issues.some((i) => i.category === 'MISSING_ORDER_ID'));
    assert.ok(issues.some((i) => i.category === 'NEGATIVE_AMOUNT'));
  });
});
