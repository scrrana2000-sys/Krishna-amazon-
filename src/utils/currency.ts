/**
 * Financial precision currency utilities.
 * Handles Indian Numbering system (Lakhs, Crores, ₹, INR),
 * accounting parenthesis negative formatting, Excel numeric values,
 * and decimal-safe calculations.
 */

const DEFAULT_SYMBOL = '₹';

/**
 * Parses any incoming raw value (string, number, excel formula result) into a clean float rounded to 2 decimal places.
 * Safely handles:
 * - ₹ 1,250.00
 * - INR 1,25,000.50 (Indian grouping)
 * - (₹ 450.00) => -450.00
 * - -1250
 * - blank, null, undefined => 0
 */
export function parseCurrency(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return 0;
    return roundCurrency(val);
  }

  const str = String(val).trim();
  if (!str) return 0;

  // Check accounting parenthesis for negative e.g. (1,250.00) or (₹ 150)
  const isAccountingNegative = /^\(.*\)$/.test(str);

  // Strip currency symbols, commas, non-breaking spaces, spaces, letters like "INR", "Rs.", "₹"
  // Keep minus sign and dot
  let cleaned = str
    .replace(/[₹$€£\s]/g, '')
    .replace(/^(INR|USD|EUR|GBP|Rs\.?)/i, '')
    .replace(/[()]/g, '')
    .trim();

  // Remove thousand/lakh separators (commas)
  cleaned = cleaned.replace(/,/g, '');

  let num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num)) return 0;

  if (isAccountingNegative && num > 0) {
    num = -num;
  }

  return roundCurrency(num);
}

/**
 * Rounds to 2 decimal places using exact integer scale to avoid floating-point jitter.
 */
export function roundCurrency(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Decimal-safe addition: a + b
 */
export function safeAdd(...numbers: number[]): number {
  const sumInCents = numbers.reduce((acc, n) => {
    const val = isNaN(n) || !isFinite(n) ? 0 : n;
    return acc + Math.round(val * 100);
  }, 0);
  return sumInCents / 100;
}

/**
 * Decimal-safe subtraction: a - b
 */
export function safeSubtract(a: number, b: number): number {
  const safeA = isNaN(a) || !isFinite(a) ? 0 : a;
  const safeB = isNaN(b) || !isFinite(b) ? 0 : b;
  const diffInCents = Math.round(safeA * 100) - Math.round(safeB * 100);
  return diffInCents / 100;
}

/**
 * Formats a number with Indian currency comma format (lakhs & crores)
 * e.g. ₹1,25,000.00 or -₹450.50
 */
export function formatCurrency(
  val: number,
  symbol: string = DEFAULT_SYMBOL,
  compact: boolean = false
): string {
  const safeVal = isNaN(val) || !isFinite(val) ? 0 : roundCurrency(val);
  const isNegative = safeVal < 0;
  const absVal = Math.abs(safeVal);

  if (compact) {
    if (absVal >= 10000000) {
      return `${isNegative ? '-' : ''}${symbol}${(absVal / 10000000).toFixed(2)} Cr`;
    }
    if (absVal >= 100000) {
      return `${isNegative ? '-' : ''}${symbol}${(absVal / 100000).toFixed(2)} L`;
    }
    if (absVal >= 1000) {
      return `${isNegative ? '-' : ''}${symbol}${(absVal / 1000).toFixed(1)}k`;
    }
  }

  // Format with standard Indian numbering (last 3 digits, then 2 digits groups)
  const parts = absVal.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}${symbol}${formattedInt}.${decimalPart}`;
}

/**
 * Percentage calculation with safe divisor check
 */
export function calculatePercentage(part: number, total: number): number {
  if (!total || total === 0 || isNaN(total)) return 0;
  const pct = (part / total) * 100;
  return Math.round((pct + Number.EPSILON) * 10) / 10;
}
