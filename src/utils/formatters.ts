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
