import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Check, 
  Smartphone, 
  Building, 
  DollarSign,
  Lock,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { User, UserRole, UserPermissions } from '../types';
import { formatVND, getRoleLabel } from '../utils/formatters';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
}

export const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  // Mode: list, add, edit
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states for editing or adding
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    roleTitle: string;
    siteName: string;
    phone: string;
    monthlyLimit: number;
    pin: string;
    isAuthorized: boolean;
    permissions: UserPermissions;
  }>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'site_engineer',
    roleTitle: '',
    siteName: '',
    phone: '',
    monthlyLimit: 50000000,
    pin: '1234',
    isAuthorized: false,
    permissions: {
      canApproveExpense: false,
      canCreateExpense: true,
      canManageMaterials: false,
      canManageSuppliers: false,
      canManageProjects: false,
      canManageUsers: false,
      canExportReports: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Start editing a user
  const handleStartEdit = (user: User) => {
    setIsAddingNew(false);
    setEditingUserId(user.id);
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username || (user.name.toLowerCase().includes('trần anh minh') ? 'Pncons' : ''),
      password: user.password || (user.name.toLowerCase().includes('trần anh minh') ? 'Minhatea1987@' : ''),
      role: user.role,
      roleTitle: user.roleTitle,
      siteName: user.siteName,
      phone: user.phone,
      monthlyLimit: user.monthlyLimit,
      pin: user.pin,
      isAuthorized: !!user.isAuthorized,
      permissions: user.permissions || {
        canApproveExpense: user.role === 'director' || user.role === 'accountant',
        canCreateExpense: true,
        canManageMaterials: user.role !== 'accountant',
        canManageSuppliers: user.role === 'director',
        canManageProjects: user.role === 'director' || user.role === 'supervisor',
        canManageUsers: user.role === 'director' || user.name.toLowerCase().includes('trần anh minh'),
        canExportReports: true,
      },
    });
  };

  // Start adding a new user
  const handleStartAdd = () => {
    setEditingUserId(null);
    setIsAddingNew(true);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'site_engineer',
      roleTitle: 'Kỹ Thuật Viên Thi Công M&E',
      siteName: 'Tòa nhà phức hợp Phúc Nguyên Landmark',
      phone: '0900.000.000',
      monthlyLimit: 50000000,
      pin: '1234',
      isAuthorized: true, // Default to authorized when admin explicitly adds them
      permissions: {
        canApproveExpense: false,
        canCreateExpense: true,
        canManageMaterials: true,
        canManageSuppliers: false,
        canManageProjects: false,
        canManageUsers: false,
        canExportReports: false,
      },
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập Họ và Tên nhân viên!');
      return;
    }

    if (formData.isAuthorized && !formData.username.trim()) {
      alert('Vui lòng thiết lập Tên đăng nhập (Username) cho nhân viên khi cấp quyền đăng nhập!');
      return;
    }

    if (formData.isAuthorized && !formData.password.trim()) {
      alert('Vui lòng thiết lập Mật khẩu cho nhân viên khi cấp quyền đăng nhập!');
      return;
    }

    if (isAddingNew) {
      // Create new user
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.username || 'user'}.${Date.now()}@phucnguyenme.com.vn`,
        username: formData.username.trim(),
        password: formData.password.trim(),
        role: formData.role,
        roleTitle: formData.roleTitle.trim() || getRoleLabel(formData.role),
        siteName: formData.siteName.trim() || 'Tòa nhà phức hợp Phúc Nguyên Landmark',
        monthlyLimit: formData.monthlyLimit,
        pin: formData.pin || '1234',
        phone: formData.phone.trim() || '0900.000.000',
        avatarColor: ['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-amber-600', 'bg-cyan-600'][
          Math.floor(Math.random() * 5)
        ],
        isAuthorized: formData.isAuthorized,
        permissions: formData.permissions,
      };

      onAddUser(newUser);
      showNotification(`Đã tạo và phân quyền thành công cho nhân viên: ${newUser.name}`);
    } else if (editingUserId) {
      // Update existing user
      const existing = users.find((u) => u.id === editingUserId);
      if (!existing) return;

      const updated: User = {
        ...existing,
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        role: formData.role,
        roleTitle: formData.roleTitle.trim(),
        siteName: formData.siteName.trim(),
        phone: formData.phone.trim(),
        monthlyLimit: formData.monthlyLimit,
        pin: formData.pin,
        isAuthorized: formData.isAuthorized,
        permissions: formData.permissions,
      };

      onUpdateUser(updated);
      showNotification(`Đã cập nhật phân quyền cho nhân viên: ${updated.name}`);
    }

    // Reset view
    setEditingUserId(null);
    setIsAddingNew(false);
  };

  const handleToggleAuthorize = (user: User) => {
    // If it's Trần Anh Minh, do not allow unauthorizing himself
    if (user.username === 'Pncons' || user.name.toLowerCase().includes('trần anh minh')) {
      alert('Không thể thu hồi quyền của Quản trị viên Trần Anh Minh (Pncons)!');
      return;
    }

    const updated: User = {
      ...user,
      isAuthorized: !user.isAuthorized,
    };
    onUpdateUser(updated);
    showNotification(
      updated.isAuthorized 
        ? `Đã kích hoạt cấp quyền đăng nhập cho ${user.name}` 
        : `Đã thu hồi quyền đăng nhập của ${user.name}`
    );
  };

  const handleDelete = (user: User) => {
    if (user.username === 'Pncons' || user.name.toLowerCase().includes('trần anh minh')) {
      alert('Không thể xóa Quản trị viên Trần Anh Minh!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${user.name}" khỏi hệ thống?`)) {
      if (onDeleteUser) {
        onDeleteUser(user.id);
      }
      showNotification(`Đã xóa nhân viên ${user.name}`);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: res + '@' }));
  };

  const authorizedCount = users.filter((u) => u.isAuthorized).length;
  const pendingCount = users.length - authorizedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c1e33] to-[#142e4d] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>PHÂN QUYỀN &amp; QUẢN TRỊ TÀI KHOẢN NHÂN VIÊN</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Quản trị viên <strong className="text-cyan-300">Trần Anh Minh (user: Pncons)</strong> cấp tài khoản &amp; phân quyền cho các thành viên.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{toastNotice}</span>
            </div>
            <button onClick={() => setToastNotice(null)} className="text-emerald-200 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Top Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Người Phân Quyền:</div>
                <div className="text-xs font-bold text-slate-900">Trần Anh Minh</div>
                <div className="text-[10px] text-sky-700 font-mono font-bold">User: Pncons</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-emerald-800 font-medium">Đã Được Phân Quyền:</div>
                <div className="text-sm font-black text-emerald-700">{authorizedCount} tài khoản</div>
                <div className="text-[10px] text-emerald-600">Được phép đăng nhập</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-amber-800 font-medium">Chưa Được Phân Quyền:</div>
                <div className="text-sm font-black text-amber-700">{pendingCount} tài khoản</div>
                <div className="text-[10px] text-amber-600">Đang chờ Minh cấp quyền</div>
              </div>
            </div>
          </div>

          {/* If Editing or Adding */}
          {(editingUserId || isAddingNew) ? (
            <div className="bg-slate-50 border-2 border-sky-300 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-sky-200 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-sky-600" />
                  <h4 className="text-sm font-bold text-sky-950 uppercase tracking-wide">
                    {isAddingNew ? 'THÊM MỚI & PHÂN QUYỀN NHÂN VIÊN' : `CẤU HÌNH PHÂN QUYỀN: ${formData.name}`}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUserId(null);
                    setIsAddingNew(false);
                  }}
                  className="text-xs px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Đóng Form
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Authorization Status Switch */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Cấp Quyền Đăng Nhập Hệ Thống</span>
                      {formData.isAuthorized ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">ĐANG BẬT</span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">ĐANG TẮT</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Khi bật, nhân viên có thể sử dụng Username và Mật khẩu bên dưới để đăng nhập vào ứng dụng.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAuthorized}
                      onChange={(e) => setFormData({ ...formData, isAuthorized: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Login Credentials Section */}
                <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-100 space-y-3">
                  <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-600" />
                    <span>THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tên Đăng Nhập (Username) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="VD: huy.tnh hoặc HoangHuy"
                        required={formData.isAuthorized}
                        className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Mật Khẩu Đăng Nhập <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="text-[10px] text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Tạo tự động</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Nhập mật khẩu riêng..."
                          required={formData.isAuthorized}
                          className="w-full py-2 pl-3 pr-9 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal & Role Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ và Tên Nhân Viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Trần Ngọc Hoàng Huy"
                      required
                      className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vai Trò Cấp Bậc <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="site_engineer">Kỹ Thuật Viên Thi Công M&amp;E (Hiện trường)</option>
                      <option value="supervisor">Chỉ Huy Trưởng / Giám Sát Site</option>
                      <option value="accountant">Kế Toán Dự Án &amp; Kế Toán Tổng</option>
                      <option value="director">Ban Giám Đốc / Điều Hành</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chức Danh Hiển Thị
                    </label>
                    <input
                      type="text"
                      value={formData.roleTitle}
                      onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                      placeholder="VD: Kỹ Thuật Viên Thi Công M&E"
                      className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Công Trường / Điểm Phụ Trách
                    </label>
                    <input
                      type="text"
                      value={formData.siteName}
                      onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                      placeholder="VD: Nhà xưởng Cơ điện VSIP II"
                      className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số Điện Thoại
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="09xx.xxx.xxx"
                      className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hạn Mức Chi Tiêu / Tháng (VNĐ)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={formData.monthlyLimit}
                      onChange={(e) => setFormData({ ...formData, monthlyLimit: Number(e.target.value) })}
                      className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Specific Granular Permissions */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center justify-between">
                    <span>Phân Chia Quyền Hạn Chi Tiết</span>
                    <span className="text-[11px] font-normal text-slate-500">Tích chọn các chức năng được phép dùng</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canCreateExpense ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, canCreateExpense: e.target.checked },
                          })
                        }
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Lập Phiếu Chi &amp; Đặt Hàng PO</div>
                        <div className="text-[10px] text-slate-500">Tạo phiếu đề xuất mua sắm, chi phí site</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canApproveExpense ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, canApproveExpense: e.target.checked },
                          })
                        }
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Duyệt &amp; Thanh Toán Chi Phí</div>
                        <div className="text-[10px] text-slate-500">Ký duyệt chi tiêu hoặc đánh dấu đã thanh toán</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageMaterials ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, canManageMaterials: e.target.checked },
                          })
                        }
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Quản Lý Sản Phẩm &amp; Vật Tư (VT0001+)</div>
                        <div className="text-[10px] text-slate-500">Thêm, sửa thông tin, giá, tồn kho, Catalogue</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageSuppliers ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, canManageSuppliers: e.target.checked },
                          })
                        }
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Quản Lý Nhà Cung Cấp &amp; Dự Án</div>
                        <div className="text-[10px] text-slate-500">Cập nhật danh sách đại lý, công nợ, công trình</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canExportReports ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, canExportReports: e.target.checked },
                          })
                        }
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Xuất Báo Cáo &amp; Dữ Liệu Excel</div>
                        <div className="text-[10px] text-slate-500">Tải file báo cáo thu chi, tổng hợp tồn kho</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageUsers ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, canManageUsers: e.target.checked },
                          })
                        }
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-800 text-sky-700">Quyền Phân Quyền Thành Viên</div>
                        <div className="text-[10px] text-slate-500">Cấp tài khoản &amp; phân quyền cho người khác</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUserId(null);
                      setIsAddingNew(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md transition-all"
                  >
                    {isAddingNew ? 'Lưu & Cấp Quyền Thành Viên' : 'Cập Nhật Phân Quyền'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Member List Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Danh Sách Thành Viên ({users.length} tài khoản)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bấm <strong>"Phân Quyền"</strong> để cấp tài khoản hoặc bật/tắt quyền đăng nhập của từng nhân viên.
                  </div>
                </div>

                <button
                  onClick={handleStartAdd}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Thêm Nhân Viên Mới</span>
                </button>
              </div>

              {/* Members Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {users.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isMinh = user.username === 'Pncons' || user.name.toLowerCase().includes('trần anh minh');

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-sky-500 bg-sky-50/20 ring-1 ring-sky-500 shadow-xs'
                          : user.isAuthorized
                          ? 'border-emerald-200 bg-emerald-50/15'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      {/* Top User Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl ${user.avatarColor} text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                              <span>{user.name}</span>
                              {isMinh && (
                                <span className="text-[10px] bg-sky-700 text-white px-2 py-0.5 rounded-full font-bold">
                                  Quản Trị Viên
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                                  Đang Đăng Nhập
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 font-medium">{user.roleTitle}</div>
                          </div>
                        </div>

                        {/* Authorization Status Badge */}
                        <div className="flex flex-col items-end gap-1">
                          {user.isAuthorized ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Đã Phân Quyền
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Chưa Cấp Quyền
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Credentials & Permissions Details */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-500">Tên đăng nhập (User):</span>
                          <span className="font-mono font-bold text-sky-800">
                            {user.username ? user.username : <span className="text-slate-400 font-sans italic">Chưa cấp</span>}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-500">Mật khẩu:</span>
                          <span className="font-mono text-slate-700">
                            {user.password ? '••••••••' : <span className="text-slate-400 font-sans italic">Chưa cấp</span>}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-500">Hạn mức chi tiêu:</span>
                          <span className="font-mono font-semibold text-slate-900">{formatVND(user.monthlyLimit)}/tháng</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-500">Site phụ trách:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[190px]">{user.siteName}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(user)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Phân Quyền &amp; Mật Khẩu</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {!isMinh && (
                            <button
                              type="button"
                              onClick={() => handleToggleAuthorize(user)}
                              title={user.isAuthorized ? 'Thu hồi quyền đăng nhập' : 'Kích hoạt quyền đăng nhập'}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                                user.isAuthorized
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {user.isAuthorized ? 'Khóa Quyền' : 'Cấp Quyền'}
                            </button>
                          )}

                          {!isCurrent && user.isAuthorized && (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchUser(user);
                                showNotification(`Đã chuyển sang tài khoản ${user.name}`);
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              Chuyển User
                            </button>
                          )}

                          {!isMinh && onDeleteUser && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              title="Xóa nhân viên"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Quản trị viên: <strong className="text-slate-800">Trần Anh Minh</strong> (user: <span className="font-mono text-sky-700 font-bold">Pncons</span>)
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
