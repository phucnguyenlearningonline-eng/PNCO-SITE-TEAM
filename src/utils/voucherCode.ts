import { ExpenseItem } from '../types';

/**
 * Tạo mã số phiếu thu / chi tự động tăng theo cấu trúc chuẩn:
 * - Phiếu Chi: PNCO-PC-YYYY-0001 (hoặc PNCO-PC-2026-0001, 0002, 0003...)
 * - Phiếu Thu: PNCO-PT-YYYY-0001 (hoặc PNCO-PT-2026-0001, 0002, 0003...)
 * 
 * Tự động tìm số thứ tự lớn nhất trong năm hiện tại để tăng lên 1 (0001, 0002...).
 */
export function generateNextVoucherCode(
  type: 'payment' | 'receipt',
  existingItems: ExpenseItem[] = [],
  targetDate?: string
): string {
  const currentYear = targetDate ? new Date(targetDate).getFullYear() : new Date().getFullYear();
  const yearStr = isNaN(currentYear) ? String(new Date().getFullYear()) : String(currentYear);
  const typeTag = type === 'payment' ? 'PC' : 'PT';
  const prefix = `PNCO-${typeTag}-${yearStr}`;

  let maxNumber = 0;

  existingItems.forEach((item) => {
    if (!item || !item.code) return;
    const code = item.code.trim().toUpperCase();

    // Phân loại: Phiếu Chi vs Phiếu Thu
    const isPaymentMatch = type === 'payment' && (
      code.includes('PC') || 
      (item.type === 'expense' && !code.startsWith('PO-') && !code.startsWith('DH-'))
    );
    const isReceiptMatch = type === 'receipt' && (
      code.includes('PT') || 
      item.type === 'revenue'
    );

    if (isPaymentMatch || isReceiptMatch) {
      // Tìm số thứ tự cuối cùng của mã (ví dụ: PNCO-PC-2026-0005 -> 5, PC-2026-002 -> 2)
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num < 100000) {
          const itemYear = item.date ? item.date.slice(0, 4) : '';
          if (code.includes(yearStr) || itemYear === yearStr) {
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
    }
  });

  const nextSeq = String(maxNumber + 1).padStart(4, '0');
  return `${prefix}-${nextSeq}`;
}

export function isPaymentVoucher(item?: ExpenseItem | null): boolean {
  if (!item) return false;
  if (item.type === 'po' || (item.code && item.code.startsWith('PO-'))) return false;
  const c = (item.code || '').toUpperCase();
  if (c.startsWith('PC-') || c.startsWith('PNCO-PC-') || c.includes('PC')) return true;
  if (item.id && (item.id.startsWith('pay-') || item.id.startsWith('pc-'))) return true;
  return false;
}

export function isReceiptVoucher(item?: ExpenseItem | null): boolean {
  if (!item) return false;
  if (item.type === 'revenue') return true;
  const c = (item.code || '').toUpperCase();
  if (c.startsWith('PT-') || c.startsWith('PNCO-PT-') || c.includes('PT')) return true;
  if (item.id && (item.id.startsWith('rcp-') || item.id.startsWith('pt-'))) return true;
  return false;
}

