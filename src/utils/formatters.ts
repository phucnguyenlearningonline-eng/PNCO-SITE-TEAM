import { ExpenseCategory, ExpenseStatus, PriorityLevel, UserRole } from '../types';

export function formatVND(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

export function formatNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

export function getCategoryLabel(category: ExpenseCategory): string {
  switch (category) {
    case 'material':
      return 'Vật tư thi công M&E';
    case 'transport':
      return 'Vận chuyển & Cẩu kéo';
    case 'overtime_meal':
      return 'Đồ ăn & Nước tăng ca';
    case 'labor_sub':
      return 'Nhân công phụ & Dịch vụ';
    case 'other':
      return 'Chi phí khác';
    default:
      return category;
  }
}

export function getCategoryBadgeClass(category: ExpenseCategory): string {
  switch (category) {
    case 'material':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'transport':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'overtime_meal':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'labor_sub':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'other':
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStatusLabel(status: ExpenseStatus): string {
  switch (status) {
    case 'pending':
      return 'Chờ phê duyệt';
    case 'approved':
      return 'Đã phê duyệt';
    case 'paid':
      return 'Đã chi / Hoàn tất';
    case 'rejected':
      return 'Từ chối duyệt';
  }
}

export function getStatusBadgeClass(status: ExpenseStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    case 'approved':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
  }
}

export function getPriorityLabel(priority: PriorityLevel): string {
  switch (priority) {
    case 'urgent':
      return 'Khẩn cấp';
    case 'high':
      return 'Ưu tiên';
    case 'normal':
      return 'Thường';
  }
}

export function getPriorityBadgeClass(priority: PriorityLevel): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500 text-white font-medium shadow-sm';
    case 'high':
      return 'bg-amber-500 text-white font-medium shadow-sm';
    case 'normal':
      return 'bg-slate-100 text-slate-600 border border-slate-300';
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'director':
      return 'Giám Đốc / Ban Điều Hành';
    case 'accountant':
      return 'Kế Toán Dự Án';
    case 'supervisor':
      return 'Chỉ Huy Trưởng / Giám Sát Site';
    case 'site_engineer':
      return 'Kỹ Thuật Viên Công Trường';
  }
}

const VIETNAMESE_DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readGroupOfThree(threeDigits: string, showZeroHundred: boolean): string {
  const [c1, c2, c3] = threeDigits.split('').map(Number);
  let res = '';

  if (c1 !== undefined) {
    if (showZeroHundred || c1 > 0) {
      res += `${VIETNAMESE_DIGITS[c1]} trăm `;
    }
  }

  if (c2 !== undefined) {
    if (c2 === 0) {
      if (c3 !== 0 && (showZeroHundred || c1 > 0)) {
        res += 'lẻ ';
      }
    } else if (c2 === 1) {
      res += 'mười ';
    } else {
      res += `${VIETNAMESE_DIGITS[c2]} mươi `;
    }
  }

  if (c3 !== undefined && c3 !== 0) {
    if (c3 === 1 && c2 !== undefined && c2 > 1) {
      res += 'mốt ';
    } else if (c3 === 5 && c2 !== undefined && c2 > 0) {
      res += 'lăm ';
    } else {
      res += `${VIETNAMESE_DIGITS[c3]} `;
    }
  }

  return res.trim();
}

export function numberToWordsVN(total: number): string {
  if (!total || isNaN(total) || total === 0) return 'Không đồng';
  const num = Math.abs(Math.round(total));
  const numStr = num.toString();
  const groups: string[] = [];

  for (let i = numStr.length; i > 0; i -= 3) {
    groups.unshift(numStr.substring(Math.max(0, i - 3), i));
  }

  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  let result = '';

  groups.forEach((group, index) => {
    const scaleIndex = groups.length - 1 - index;
    const groupVal = parseInt(group, 10);
    if (groupVal > 0) {
      const showZero = index > 0;
      const groupText = readGroupOfThree(group.padStart(3, '0'), showZero);
      const scaleText = scales[scaleIndex] || '';
      result += `${groupText} ${scaleText} `;
    }
  });

  result = result.trim().replace(/\s+/g, ' ');
  if (!result) return 'Không đồng';
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1);
  return `${capitalized} đồng chẵn.`;
}

