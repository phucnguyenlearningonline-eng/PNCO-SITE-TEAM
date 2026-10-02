/**
 * Utility chuẩn hóa sắp xếp bảng biểu (Tables) theo số thứ tự, mã đơn hàng, ngày tháng và số tiền
 */

export type SortDirection = 'asc' | 'desc';

export function extractCodeNumber(code?: string): number {
  if (!code) return 0;
  const matches = code.match(/(\d+)/g);
  if (!matches || matches.length === 0) return 0;

  // Nếu có cả năm và số thứ tự, VD "PO-2026-0005" -> 2026 * 100000 + 5
  if (matches.length >= 2) {
    const pYear = parseInt(matches[matches.length - 2], 10);
    const pSeq = parseInt(matches[matches.length - 1], 10);
    if (!isNaN(pYear) && !isNaN(pSeq) && pYear >= 2000 && pYear <= 2100) {
      return pYear * 100000 + pSeq;
    }
  }

  const lastSeq = parseInt(matches[matches.length - 1], 10);
  return isNaN(lastSeq) ? 0 : lastSeq;
}

export function naturalCompareCode(aCode?: string, bCode?: string): number {
  const numA = extractCodeNumber(aCode);
  const numB = extractCodeNumber(bCode);
  if (numA !== 0 && numB !== 0 && numA !== numB) {
    return numA - numB;
  }
  return (aCode || '').localeCompare(bCode || '', undefined, { numeric: true, sensitivity: 'base' });
}

export function parseDateTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? 0 : t;
}
