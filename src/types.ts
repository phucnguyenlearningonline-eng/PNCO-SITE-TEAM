export type ExpenseCategory = 'material' | 'transport' | 'overtime_meal' | 'labor_sub' | 'other';

export type ExpenseType = 'expense' | 'po' | 'advance' | 'revenue';

export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export type PriorityLevel = 'normal' | 'high' | 'urgent';

export type UserRole = 'director' | 'accountant' | 'supervisor' | 'site_engineer';

export interface UserPermissions {
  canApproveExpense?: boolean;
  canCreateExpense?: boolean;
  canManageMaterials?: boolean;
  canManageSuppliers?: boolean;
  canManageProjects?: boolean;
  canManageUsers?: boolean; // Quyền phân quyền cho người khác
  canExportReports?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string; // Tên đăng nhập (VD: Pncons)
  password?: string; // Mật khẩu đăng nhập (VD: Minhatea1987@)
  role: UserRole;
  roleTitle: string;
  siteName: string;
  monthlyLimit: number;
  pin: string;
  phone: string;
  avatarColor: string;
  isAuthorized: boolean; // Trạng thái phân quyền (chỉ Trần Anh Minh mặc định được phân quyền)
  permissions?: UserPermissions;
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

export interface MaterialItem {
  id: string;
  code: string; // "VT0001", "VT0002", "VT0003"...
  name: string; // Tên vật tư
  stockQuantity: number; // Số lượng tồn kho
  unit: string; // Đơn vị tính: Mét, Cuộn, Cái, Bộ, Cây, Thùng...
  category?: 'electrical' | 'fire_protection' | 'water' | 'hvac' | 'cable_tray' | 'other';
  subCategory?: string; // Hạng mục chi tiết: Sol Khí, Hệ Thống Thoát Hiểm, Hút Khói, Sprinkler, Vách Tường...
  imageUrl?: string; // Hình ảnh có thể chụp từ Snap Tool hoặc tải lên
  catalogueUrl?: string; // Link Catalogue tài liệu kỹ thuật
  supplier?: string; // Nhà Cung Cấp (chọn từ danh sách NCC hoặc tự nhập)
  unitPrice?: number; // Giá Tiền chưa VAT (không bắt buộc)
  vatRate?: number; // Thuế suất VAT: 0, 8, 10 (%)
  brand?: string; // CADIVI, Schneider, Hòa Phát, Viking...
  specifications?: string; // Quy cách kỹ thuật
  warehouseLocation: string; // Tên kho đang tồn: "Kho Tổng Dĩ An", "Kho Site VSIP II"...
  minStock?: number; // Mức tồn an toàn tối thiểu
  shelfLocation?: string; // Vị trí kệ/khu vực lưu trữ
}

export interface ExpenseItem {
  id: string;
  code: string; // PO-2026-0224, EXP-2026-0105
  type: ExpenseType;
  category: ExpenseCategory;
  materialCode?: string; // VT 0001, VT 0002...
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
