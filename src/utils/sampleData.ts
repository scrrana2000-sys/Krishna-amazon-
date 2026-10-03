import * as XLSX from 'xlsx';
import { ColumnMapping, UploadedFileMetadata } from '../types/reconciliation';
import { autoDetectColumnMapping, classifyFile } from './excelParser';

export function createAmazonSampleFiles(): {
  files: UploadedFileMetadata[];
  mappings: Record<string, ColumnMapping>;
} {
  // 1. Amazon Order Report Data
  const orderRows = [
    {
      'amazon-order-id': '408-1928374-9182736',
      'purchase-date': '2026-09-02',
      'order-status': 'Shipped',
      'sku': 'NOISE-CANC-HP-BLK',
      'quantity': 1,
      'item-price': 2499.00,
      'item-tax': 449.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '402-8374619-2819304',
      'purchase-date': '2026-09-05',
      'order-status': 'Delivered',
      'sku': 'SMART-WATCH-PRO-SLV',
      'quantity': 1,
      'item-price': 3999.00,
      'item-tax': 719.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '405-7192834-8291038',
      'purchase-date': '2026-09-10',
      'order-status': 'Delivered',
      'sku': 'USB-C-BRAIDED-CABLE',
      'quantity': 2,
      'item-price': 598.00,
      'item-tax': 107.64,
      'shipping-price': 40.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '403-9182736-4567891',
      'purchase-date': '2026-09-12',
      'order-status': 'Cancelled',
      'sku': 'RGB-GAMING-MOUSE',
      'quantity': 1,
      'item-price': 1299.00,
      'item-tax': 233.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '407-3829104-5678902',
      'purchase-date': '2026-09-15',
      'order-status': 'Delivered',
      'sku': 'MECH-KEYBOARD-RGB',
      'quantity': 1,
      'item-price': 4499.00,
      'item-tax': 809.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '404-1029384-7584930',
      'purchase-date': '2026-09-18',
      'order-status': 'Delivered',
      'sku': 'PHONE-STAND-ALU',
      'quantity': 1,
      'item-price': 799.00,
      'item-tax': 143.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '406-9928371-1209384',
      'purchase-date': '2026-09-22',
      'order-status': 'Shipped',
      'sku': 'AIR-PURIFIER-HEPA',
      'quantity': 1,
      'item-price': 6999.00,
      'item-tax': 1259.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '401-5544332-9988776',
      'purchase-date': '2026-09-25',
      'order-status': 'Delivered',
      'sku': 'BLUETOOTH-SPEAKER-PORTABLE',
      'quantity': 1,
      'item-price': 1899.00,
      'item-tax': 341.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': '409-1122334-4455667',
      'purchase-date': '2026-09-28',
      'order-status': 'Shipped',
      'sku': 'POWERBANK-20000MAH',
      'quantity': 1,
      'item-price': 1499.00,
      'item-tax': 269.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    },
    {
      'amazon-order-id': 'FK-OD987654321', // Non-Amazon Flipkart order for testing
      'purchase-date': '2026-09-29',
      'order-status': 'Delivered',
      'sku': 'EXTERNAL-SSD-1TB',
      'quantity': 1,
      'item-price': 7499.00,
      'item-tax': 1349.82,
      'shipping-price': 0.00,
      'sales-channel': 'Flipkart',
    },
    {
      'amazon-order-id': '408-6677889-9900112',
      'purchase-date': '2026-10-01',
      'order-status': 'Shipped',
      'sku': 'WEBCAM-1080P-HD',
      'quantity': 1,
      'item-price': 1999.00,
      'item-tax': 359.82,
      'shipping-price': 0.00,
      'sales-channel': 'Amazon.in',
    }
  ];

  // 2. Amazon Payment / Settlement Data
  const settlementRows = [
    {
      'settlement-id': '19482019481',
      'transaction-type': 'Order',
      'order-id': '408-1928374-9182736',
      'posted-date': '2026-09-08',
      'total-amount': 2499.00,
      'selling-fees': 374.85,
      'other-fees': 65.00,
      'tax': 44.98,
      'net-payment': 2014.17,
      'status': 'Disbursed',
    },
    {
      'settlement-id': '19482019481',
      'transaction-type': 'Order',
      'order-id': '402-8374619-2819304',
      'posted-date': '2026-09-12',
      'total-amount': 3999.00,
      'selling-fees': 599.85,
      'other-fees': 85.00,
      'tax': 71.98,
      'net-payment': 3242.17,
      'status': 'Disbursed',
    },
    {
      'settlement-id': '19482019481',
      'transaction-type': 'Order',
      'order-id': '405-7192834-8291038',
      'posted-date': '2026-09-16',
      'total-amount': 300.00, // Partial payout 1
      'selling-fees': 45.00,
      'other-fees': 20.00,
      'tax': 5.40,
      'net-payment': 229.60,
      'status': 'Disbursed',
    },
    {
      'settlement-id': '19495810293',
      'transaction-type': 'Order',
      'order-id': '407-3829104-5678902',
      'posted-date': '2026-09-20',
      'total-amount': 4499.00,
      'selling-fees': 674.85,
      'other-fees': 95.00,
      'tax': 80.98,
      'net-payment': 3648.17,
      'status': 'Disbursed',
    },
    {
      'settlement-id': '19495810293',
      'transaction-type': 'Refund',
      'order-id': '407-3829104-5678902', // Customer returned keyboard
      'posted-date': '2026-09-24',
      'total-amount': -4499.00,
      'selling-fees': -674.85,
      'other-fees': 0.00,
      'tax': -80.98,
      'net-payment': -3743.17,
      'status': 'Disbursed',
    },
    {
      'settlement-id': '19495810293',
      'transaction-type': 'Order',
      'order-id': '404-1029384-7584930',
      'posted-date': '2026-09-25',
      'total-amount': 799.00,
      'selling-fees': 119.85,
      'other-fees': 35.00,
      'tax': 14.38,
      'net-payment': 629.77,
      'status': 'Disbursed',
    },
    // Duplicate transaction entry for testing duplicate detection
    {
      'settlement-id': '19495810293',
      'transaction-type': 'Order',
      'order-id': '404-1029384-7584930',
      'posted-date': '2026-09-25',
      'total-amount': 799.00,
      'selling-fees': 119.85,
      'other-fees': 35.00,
      'tax': 14.38,
      'net-payment': 629.77,
      'status': 'Disbursed',
    },
    {
      'settlement-id': '19503920194',
      'transaction-type': 'Order',
      'order-id': '401-5544332-9988776',
      'posted-date': '2026-09-30',
      'total-amount': 1899.00,
      'selling-fees': 284.85,
      'other-fees': 45.00,
      'tax': 34.18,
      'net-payment': 1534.97,
      'status': 'Disbursed',
    },
    {
      // Orphan payment record with no order row (unmatched test)
      'settlement-id': '19503920194',
      'transaction-type': 'Order',
      'order-id': '409-9988776-6543210',
      'posted-date': '2026-10-02',
      'total-amount': 850.00,
      'selling-fees': 127.50,
      'other-fees': 30.00,
      'tax': 15.30,
      'net-payment': 677.20,
      'status': 'Disbursed',
    }
  ];

  const orderHeaders = Object.keys(orderRows[0]);
  const settlementHeaders = Object.keys(settlementRows[0]);

  const orderFile: UploadedFileMetadata = {
    id: 'sample_orders_file',
    name: 'Amazon_Merchant_Orders_Sep2026.xlsx',
    size: 24500,
    lastModified: Date.now(),
    sheets: [
      {
        sheetName: 'Orders',
        headers: orderHeaders,
        rows: orderRows,
        totalRows: orderRows.length,
      },
    ],
    detectedType: 'ORDER FILE',
    selectedSheet: 'Orders',
  };

  const settlementFile: UploadedFileMetadata = {
    id: 'sample_settlements_file',
    name: 'Amazon_Settlement_Disbursements_Sep2026.xlsx',
    size: 28400,
    lastModified: Date.now(),
    sheets: [
      {
        sheetName: 'Settlements',
        headers: settlementHeaders,
        rows: settlementRows,
        totalRows: settlementRows.length,
      },
    ],
    detectedType: 'SETTLEMENT FILE',
    selectedSheet: 'Settlements',
  };

  const mappings: Record<string, ColumnMapping> = {
    [orderFile.id]: autoDetectColumnMapping(orderHeaders),
    [settlementFile.id]: autoDetectColumnMapping(settlementHeaders),
  };

  return {
    files: [orderFile, settlementFile],
    mappings,
  };
}

/**
 * Downloads sample files directly so user can save and examine them
 */
export function downloadSampleExcelWorkbook(type: 'orders' | 'settlement' | 'both') {
  const { files } = createAmazonSampleFiles();

  if (type === 'both' || type === 'orders') {
    const orderFile = files.find((f) => f.detectedType === 'ORDER FILE');
    if (orderFile) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(orderFile.sheets[0].rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, 'Sample_Amazon_Orders_Report.xlsx');
    }
  }

  if (type === 'both' || type === 'settlement') {
    const settlFile = files.find((f) => f.detectedType === 'SETTLEMENT FILE');
    if (settlFile) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(settlFile.sheets[0].rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Settlements');
      XLSX.writeFile(wb, 'Sample_Amazon_Settlement_Disbursements.xlsx');
    }
  }
}
