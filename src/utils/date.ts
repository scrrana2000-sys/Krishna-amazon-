/**
 * Date parsing, formatting, and filtering utilities for financial transactions.
 * Handles Excel serial timestamps, Indian/UK DD/MM/YYYY, US MM/DD/YYYY, and ISO strings.
 */

export function parseExcelOrAnyDate(val: any): { date: Date | null; isoString: string; displayString: string } {
  if (val === null || val === undefined || val === '') {
    return { date: null, isoString: '', displayString: 'N/A' };
  }

  // If already Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      return { date: null, isoString: '', displayString: 'Invalid Date' };
    }
    return {
      date: val,
      isoString: val.toISOString(),
      displayString: formatDate(val),
    };
  }

  // If Excel serial number (numeric value typically between 25000 and 60000)
  if (typeof val === 'number') {
    // Excel epoch: Dec 30 1899 due to 1900 leap year bug
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = Math.round(val * 86400 * 1000);
    const date = new Date(excelEpoch.getTime() + millis);
    if (!isNaN(date.getTime())) {
      return {
        date,
        isoString: date.toISOString(),
        displayString: formatDate(date),
      };
    }
  }

  const str = String(val).trim();
  if (!str) return { date: null, isoString: '', displayString: 'N/A' };

  // Try standard parse first (ISO / YYYY-MM-DD)
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!isNaN(date.getTime())) {
      return {
        date,
        isoString: date.toISOString(),
        displayString: formatDate(date),
      };
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY (Very common in India and Amazon.in reports)
  const ddmmyyyy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!isNaN(date.getTime())) {
      return {
        date,
        isoString: date.toISOString(),
        displayString: formatDate(date),
      };
    }
  }

  // General Date.parse fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return {
      date: parsed,
      isoString: parsed.toISOString(),
      displayString: formatDate(parsed),
    };
  }

  return { date: null, isoString: '', displayString: str };
}

export function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return 'N/A';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${d}-${m}-${y}`;
}

export function getMonthYearKey(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return 'Unknown Month';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export type DateFilterType =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export function isDateInPresetRange(
  date: Date | null,
  preset: DateFilterType,
  customStart?: string,
  customEnd?: string,
  refDate: Date = new Date()
): boolean {
  if (preset === 'ALL') return true;
  if (!date || isNaN(date.getTime())) return false;

  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const now = new Date(Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()));

  if (preset === 'TODAY') {
    return target.getTime() === now.getTime();
  }

  if (preset === 'YESTERDAY') {
    const yesterday = new Date(now.getTime() - 86400000);
    return target.getTime() === yesterday.getTime();
  }

  if (preset === 'THIS_WEEK') {
    const dayOfWeek = now.getUTCDay(); // 0 is Sunday
    const startOfWeek = new Date(now.getTime() - dayOfWeek * 86400000);
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 86400000);
    return target >= startOfWeek && target <= endOfWeek;
  }

  if (preset === 'THIS_MONTH') {
    return (
      target.getUTCFullYear() === now.getUTCFullYear() &&
      target.getUTCMonth() === now.getUTCMonth()
    );
  }

  if (preset === 'LAST_MONTH') {
    const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return (
      target.getUTCFullYear() === lastMonth.getUTCFullYear() &&
      target.getUTCMonth() === lastMonth.getUTCMonth()
    );
  }

  if (preset === 'THIS_QUARTER') {
    const currentQ = Math.floor(now.getUTCMonth() / 3);
    const targetQ = Math.floor(target.getUTCMonth() / 3);
    return (
      target.getUTCFullYear() === now.getUTCFullYear() &&
      targetQ === currentQ
    );
  }

  if (preset === 'THIS_YEAR') {
    return target.getUTCFullYear() === now.getUTCFullYear();
  }

  if (preset === 'CUSTOM') {
    if (customStart) {
      const s = new Date(customStart);
      if (!isNaN(s.getTime()) && target < s) return false;
    }
    if (customEnd) {
      const e = new Date(customEnd);
      if (!isNaN(e.getTime()) && target > e) return false;
    }
    return true;
  }

  return true;
}
