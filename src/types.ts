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
  code: string; // Mã VT nội bộ: "VT0001", "VT0002", "VT0003"...
  deviceCode?: string; // Mã Thiết Bị / Model / Part Number của hãng (VD: WP7.2-12, TY3251...)
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

export interface OrderItemLine {
  materialId?: string;
  code: string;
  deviceCode?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ContractPaymentStage {
  id: string;
  stageNumber: number; // Đợt 1, Đợt 2, Đợt 3...
  title: string; // VD: "Tạm ứng hợp đồng (Đợt 1)", "Giao hàng đợt 1 (Đợt 2)", "Nghiệm thu quyết toán (Đợt 3)"
  percentage?: number; // % của hợp đồng (VD: 30%)
  amount: number; // Số tiền thanh toán (VNĐ)
  dueDate?: string; // Ngày dự kiến YYYY-MM-DD
  paidDate?: string; // Ngày đã thanh toán YYYY-MM-DD
  status: 'pending' | 'paid'; // 'pending' = Chưa thanh toán, 'paid' = Đã thanh toán
  paymentMethod?: 'transfer' | 'cash';
  notes?: string;
  proofDocument?: string;
}

export interface ExpenseItem {
  id: string;
  code: string; // DH 0001, PO-2026-0224, EXP-2026-0105
  type: ExpenseType;
  category: ExpenseCategory;
  materialCode?: string; // VT 0001, VT 0002...
  title: string;
  subDescription?: string;
  items?: OrderItemLine[]; // Danh sách sản phẩm mua hàng (cho đơn hàng PO)
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

  // Quản lý Hợp Đồng Kinh Tế (Dành cho đơn hàng lớn)
  hasContract?: boolean; // Đơn hàng này có hợp đồng kinh tế hay không
  contractNumber?: string; // Số hợp đồng (VD: "HĐ-011/PN-2026/VTTB")
  contractDate?: string; // Ngày ký hợp đồng
  contractAdvanceAmount?: number; // Giá trị thanh toán tạm ứng (VNĐ)
  contractAdvancePercentage?: number; // % Tạm ứng hợp đồng (VD: 30%)
  contractPaymentStages?: ContractPaymentStage[]; // Danh sách các lần thanh toán tiếp theo
  contractNotes?: string; // Ghi chú điều khoản hợp đồng & bảo hành
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
