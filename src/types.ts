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

export interface Customer {
  id: string;
  code: string; // KH-001, KH-002...
  name: string; // Tên công ty / chủ đầu tư
  shortName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  notes?: string;
}

export interface BankAccount {
  id: string;
  bankName: string; // Tên ngân hàng: Vietcombank, Techcombank, MB, ACB, BIDV...
  accountNumber: string; // Số tài khoản: 0071001234567
  accountHolder: string; // Tên chủ tài khoản: CÔNG TY TNHH PHÚC NGUYÊN M&E
  branch?: string; // Chi nhánh ngân hàng
  accountType: 'company' | 'project' | 'personal' | 'cash'; // Loại: Công ty, Dự án, Cá nhân/Thủ quỹ
  initialBalance?: number; // Số dư ban đầu
  currentBalance?: number; // Số dư hiện tại
  isDefault?: boolean; // Tài khoản chính mặc định
  status?: 'active' | 'inactive'; // Hoạt động / Tạm khóa
  notes?: string; // Ghi chú
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectAddendum {
  id: string;
  code: string; // PLHĐ-01/PNC-DA01
  title: string; // Nội dung bổ sung / điều chỉnh phát sinh
  signingDate: string; // YYYY-MM-DD
  amount: number; // Giá trị phát sinh trước thuế (VNĐ)
  vatRate: number; // % VAT (0, 8, 10)
  totalAmount: number; // Giá trị phát sinh sau thuế (VNĐ)
  scope?: string; // Phạm vi / Diễn giải kỹ thuật phát sinh
  status: 'draft' | 'pending' | 'signed' | 'approved';
  notes?: string;
}

export interface Project {
  id: string;
  code: string; // PNC-DA01, PNC-DA02...
  name: string;
  clientId?: string;
  clientCode?: string; // KH-001, KH-002...
  client: string; // Tên Khách hàng / Chủ đầu tư
  clientAddress?: string;
  packageType?: string; // Gói thầu M&E (VD: Tổng thầu Cơ Điện M&E toàn bộ)
  year?: number; // Năm thực hiện: 2026, 2025...
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  contractNumber?: string; // Số hợp đồng kinh tế
  contractDate?: string; // Ngày ký hợp đồng
  contractFileUrl?: string; // Link file tài liệu hợp đồng CĐT (Google Drive, Scan PDF...)
  vatRate?: number; // % VAT (0, 8, 10)
  originalContractValue?: number; // Giá trị HĐ gốc trước VAT
  vatAmount?: number; // Tiền thuế VAT của hợp đồng gốc
  totalContractValueWithVat?: number; // Tổng giá trị HĐ gốc sau VAT
  totalBudget: number; // Ngân sách dự toán
  totalRevenue: number; // Tổng quyết toán sau PLHĐ
  currentAdvance: number; // Đã thu CĐT
  status: 'active' | 'completed' | 'paused' | 'accepted';
  progressPercentage?: number; // Tiến độ thi công (% 0 - 100)
  location: string;
  manager: string; // CHT: Chỉ huy trưởng
  addendums?: ProjectAddendum[]; // Danh sách phụ lục hợp đồng
  laborBudget?: number; // Ngân sách nhân công dự toán
  materialBudget?: number; // Ngân sách vật tư dự toán
  notes?: string;
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
  hasVat?: boolean; // Có tính thuế VAT hay không
  vatRate?: number; // Thuế suất VAT (0, 8, 10%)
  vatAmount?: number; // Tiền thuế VAT
  subtotalAmount?: number; // Tiền trước thuế VAT
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
  contractFileUrl?: string; // Link file tài liệu hợp đồng (Google Drive, OneDrive, Scan PDF...)
  contractAdvanceAmount?: number; // Giá trị thanh toán tạm ứng (VNĐ)
  contractAdvancePercentage?: number; // % Tạm ứng hợp đồng (VD: 30%)
  contractPaymentStages?: ContractPaymentStage[]; // Danh sách các lần thanh toán tiếp theo
  contractNotes?: string; // Ghi chú điều khoản hợp đồng & bảo hành

  // Đồng bộ phiếu chi với đơn hàng PO & Phiếu thu
  linkedPoId?: string; // ID đơn hàng PO liên kết
  linkedPoCode?: string; // Mã đơn hàng PO liên kết (PO-2026-...)
  receiverOrPayer?: string; // Người nộp tiền (phiếu thu) hoặc người nhận tiền (phiếu chi)
  bankAccount?: string; // Số tài khoản ngân hàng nhận/chuyển tiền
  paidAmount?: number; // Số tiền đã thanh toán tích lũy cho đơn hàng (VNĐ)
  paymentStageTitle?: string; // Tên đợt thanh toán (VD: "Đợt 1 - Tạm ứng 30%", "Đợt 2 - Giao hàng 50%")
  paymentStageIndex?: number; // Đợt 1, 2, 3...
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
