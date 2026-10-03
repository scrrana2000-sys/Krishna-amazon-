import * as XLSX from 'xlsx';
import {
  ColumnMapping,
  FileClassification,
  RawFileSheet,
  UploadedFileMetadata,
} from '../types/reconciliation';

/**
 * Normalizes an Order ID:
 * - Trims accidental leading/trailing spaces & NBSP
 * - Prevents scientific notation
 * - Preserves hyphens
 * - Uppercases if appropriate
 */
export function normalizeOrderId(id: any): string {
  if (id === null || id === undefined) return '';

  let str = String(id).trim();

  // Strip non-breaking spaces and zero-width spaces
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();

  // If accidentally scientific notation e.g. "4.05E+11"
  if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num) && isFinite(num)) {
        str = BigInt(Math.round(num)).toString();
      }
    } catch {
      // keep original
    }
  }

  // Remove surrounding quotes
  str = str.replace(/^["']|["']$/g, '').trim();

  return str;
}

/**
 * Detects the probable header row within the first 15 rows of a sheet.
 * A header row has multiple non-empty string values and keyword matches like 'order', 'date', 'amount', 'id'.
 */
function findHeaderRowIndex(rows: any[][]): number {
  if (!rows || rows.length === 0) return 0;

  let bestIndex = 0;
  let bestScore = -1;

  const headerKeywords = [
    'order',
    'date',
    'amount',
    'id',
    'sku',
    'status',
    'type',
    'total',
    'price',
    'settlement',
    'fee',
    'tax',
    'refund',
    'payment',
    'channel',
    'marketplace',
  ];

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    let score = 0;
    const nonEmptyCells = row.filter(
      (cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''
    );

    // If row has very few cells, it's likely a title/metadata row
    if (nonEmptyCells.length < 2) continue;

    for (const cell of nonEmptyCells) {
      const text = String(cell).toLowerCase().trim();
      for (const kw of headerKeywords) {
        if (text.includes(kw)) {
          score += 2;
        }
      }
      // String length check - headers are usually concise
      if (text.length > 1 && text.length < 40) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Automatically inspects column names and maps them to standard fields.
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    orderIdCol: '',
  };

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const orderIdKeywords = ['amazonorderid', 'orderid', 'ordernumber', 'orderno', 'order'];
  const dateKeywords = ['orderdate', 'purchasedate', 'posteddate', 'transactiondate', 'date', 'time'];
  const orderAmountKeywords = ['orderamount', 'itemprice', 'principal', 'itemsubtotal', 'productcharges', 'ordertotal', 'grossamount'];
  const paymentKeywords = ['settlementamount', 'totalamount', 'paymentamount', 'deposited', 'netpayment', 'amount', 'credit'];
  const refundKeywords = ['refund', 'refundamount', 'refunded', 'reversal'];
  const feeKeywords = ['sellingfees', 'fbafees', 'fees', 'commission', 'otherfees', 'closingfee', 'shippingchargeback'];
  const taxKeywords = ['tax', 'totaltax', 'cgst', 'sgst', 'igst', 'tcs', 'tds', 'gst'];
  const txnIdKeywords = ['transactionid', 'txnid', 'paymentid', 'referenceid'];
  const settlementKeywords = ['settlementid', 'disbursementid', 'batchid', 'payoutid'];
  const typeKeywords = ['transactiontype', 'type', 'eventtype', 'recordtype'];
  const statusKeywords = ['orderstatus', 'paymentstatus', 'status', 'deliverystatus'];
  const channelKeywords = ['marketplace', 'channel', 'saleschannel', 'store', 'fulfillment'];
  const skuKeywords = ['sku', 'itemcode', 'asin', 'productid'];
  const qtyKeywords = ['quantity', 'qty', 'itemcount'];

  const findBestMatch = (keywords: string[]): string => {
    // Exact or close match first
    for (const kw of keywords) {
      for (const h of headers) {
        const c = clean(h);
        if (c === kw) return h;
      }
    }
    // Substring match
    for (const kw of keywords) {
      for (const h of headers) {
        const c = clean(h);
        if (c.includes(kw)) return h;
      }
    }
    return '';
  };

  mapping.orderIdCol = findBestMatch(orderIdKeywords);
  mapping.orderDateCol = findBestMatch(dateKeywords);
  mapping.orderAmountCol = findBestMatch(orderAmountKeywords);
  mapping.paymentAmountCol = findBestMatch(paymentKeywords);
  mapping.refundAmountCol = findBestMatch(refundKeywords);
  mapping.feeAmountCol = findBestMatch(feeKeywords);
  mapping.taxAmountCol = findBestMatch(taxKeywords);
  mapping.transactionIdCol = findBestMatch(txnIdKeywords);
  mapping.settlementIdCol = findBestMatch(settlementKeywords);
  mapping.transactionTypeCol = findBestMatch(typeKeywords);
  mapping.statusCol = findBestMatch(statusKeywords);
  mapping.channelCol = findBestMatch(channelKeywords);
  mapping.skuCol = findBestMatch(skuKeywords);
  mapping.quantityCol = findBestMatch(qtyKeywords);

  // If orderAmountCol is empty but paymentAmountCol exists, or vice versa, adapt
  if (!mapping.orderAmountCol && mapping.paymentAmountCol) {
    mapping.orderAmountCol = mapping.paymentAmountCol;
  }

  return mapping;
}

/**
 * Classifies file type based on sheet names and detected columns
 */
export function classifyFile(
  fileName: string,
  sheets: RawFileSheet[],
  mapping: ColumnMapping
): FileClassification {
  const lowerName = fileName.toLowerCase();
  const allHeadersStr = sheets.flatMap((s) => s.headers).join(' ').toLowerCase();

  if (
    lowerName.includes('settlement') ||
    allHeadersStr.includes('settlement-id') ||
    allHeadersStr.includes('disbursement') ||
    mapping.settlementIdCol
  ) {
    return 'SETTLEMENT FILE';
  }

  if (
    lowerName.includes('payment') ||
    lowerName.includes('date-range') ||
    allHeadersStr.includes('transaction-type') ||
    allHeadersStr.includes('posted-date') ||
    allHeadersStr.includes('selling-fees')
  ) {
    return 'PAYMENT FILE';
  }

  if (
    lowerName.includes('order') ||
    allHeadersStr.includes('order-status') ||
    allHeadersStr.includes('item-price') ||
    allHeadersStr.includes('purchase-date')
  ) {
    return 'ORDER FILE';
  }

  if (mapping.orderIdCol && (mapping.paymentAmountCol || mapping.orderAmountCol)) {
    return 'TRANSACTION FILE';
  }

  return 'UNKNOWN FILE';
}

/**
 * Reads an uploaded File (XLSX, XLS, CSV) into structured memory
 */
export async function parseUploadedFile(file: File): Promise<UploadedFileMetadata> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const sheets: RawFileSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet || !worksheet['!ref']) continue;

    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    if (rawRows.length === 0) continue;

    const headerIndex = findHeaderRowIndex(rawRows);
    const headerRow = rawRows[headerIndex] || [];
    const headers = headerRow.map((h: any, colIdx: number) => {
      const val = h !== null && h !== undefined ? String(h).trim() : '';
      return val || `Column_${colIdx + 1}`;
    });

    const dataRows = rawRows.slice(headerIndex + 1);
    const rows: Record<string, any>[] = [];

    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const rowArr = dataRows[rIdx];
      if (!Array.isArray(rowArr)) continue;

      // Check if row is completely blank
      const isBlank = rowArr.every(
        (cell) => cell === null || cell === undefined || String(cell).trim() === ''
      );
      if (isBlank) continue;

      const rowObj: Record<string, any> = {
        _sourceSheet: sheetName,
        _rowIndex: headerIndex + 1 + rIdx + 1,
      };

      for (let cIdx = 0; cIdx < headers.length; cIdx++) {
        const colName = headers[cIdx];
        rowObj[colName] = rowArr[cIdx] !== undefined ? rowArr[cIdx] : null;
      }

      rows.push(rowObj);
    }

    sheets.push({
      sheetName,
      headers,
      rows,
      totalRows: rows.length,
    });
  }

  const primarySheet = sheets[0] || { sheetName: '', headers: [], rows: [], totalRows: 0 };
  const autoMapping = autoDetectColumnMapping(primarySheet.headers);
  const detectedType = classifyFile(file.name, sheets, autoMapping);

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    sheets,
    detectedType,
    selectedSheet: primarySheet.sheetName,
  };
}
