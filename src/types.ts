export type ExpenseCategory = 'material' | 'transport' | 'overtime_meal' | 'labor_sub' | 'other';

export type ExpenseType = 'expense' | 'po' | 'advance' | 'revenue';

export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export type PriorityLevel = 'normal' | 'high' | 'urgent';

export type UserRole = 'director' | 'accountant' | 'supervisor' | 'site_engineer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  siteName: string;
  monthlyLimit: number;
  pin: string;
  phone: string;
  avatarColor: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  totalBudget: number;
  totalRevenue: number;
  currentAdvance: number;
  status: 'active' | 'completed' | 'paused';
  location: string;
  manager: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: 'material' | 'transport' | 'food' | 'other';
  phone: string;
  contactPerson: string;
  address: string;
  unpaidBalance: number;
}

export interface ExpenseItem {
  id: string;
  code: string; // PO-2026-0224, EXP-2026-0105
  type: ExpenseType;
  category: ExpenseCategory;
  title: string;
  subDescription?: string;
  projectId: string;
  projectName: string;
  supplier: string;
  createdById: string;
  createdByName: string;
  createdByRole: string;
  date: string; // YYYY-MM-DD
  amount: number; // Tiền hàng / chi phí trước VAT
  vatRate: number; // % VAT (0, 8, 10)
  vatAmount: number; // Số tiền VAT
  totalAmount: number; // Tổng thanh toán
  priority: PriorityLevel;
  status: ExpenseStatus;
  paymentMethod: 'cash' | 'transfer' | 'advance_fund';
  receiptImage?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface FilterState {
  search: string;
  projectId: string;
  category: string;
  status: string;
  priority: string;
  month: string; // 'all' or '2026-09', etc.
  onlyPending: boolean;
}
