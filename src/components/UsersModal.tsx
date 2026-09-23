import React, { useState } from 'react';
import { X, UserPlus, Shield, KeyRound, Check, Smartphone, Building, DollarSign } from 'lucide-react';
import { User, UserRole } from '../types';
import { formatVND, getRoleLabel } from '../utils/formatters';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
}

export const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('site_engineer');
  const [roleTitle, setRoleTitle] = useState('');
  const [siteName, setSiteName] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState(50000000);
  const [pin, setPin] = useState('1234');

  if (!isOpen) return null;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let defaultTitle = roleTitle;
    if (!defaultTitle) {
      if (role === 'site_engineer') defaultTitle = 'Kỹ Thuật Viên Hiện Trường';
      if (role === 'supervisor') defaultTitle = 'Chỉ Huy Trưởng / Giám Sát Site';
      if (role === 'accountant') defaultTitle = 'Kế Toán Dự Án & Site';
      if (role === 'director') defaultTitle = 'Ban Giám Đốc';
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@phucnguyenme.com.vn`,
      role,
      roleTitle: defaultTitle,
      siteName: siteName.trim() || 'Tòa nhà phức hợp Phúc Nguyên Landmark',
      monthlyLimit,
      pin: pin || '1234',
      phone: phone || '0900.000.000',
      avatarColor: ['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-amber-600', 'bg-cyan-600'][
        Math.floor(Math.random() * 5)
      ],
    };

    onAddUser(newUser);
    setShowAddForm(false);
    // Reset form
    setName('');
    setEmail('');
    setRoleTitle('');
    setSiteName('');
    setPhone('');
    setMonthlyLimit(50000000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>Phân Quyền & Quản Lý Đăng Nhập Nhân Viên</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tạo tài khoản đăng nhập riêng biệt cho từng kỹ thuật site, giám sát, kế toán và ban giám đốc.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Action to show add form */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Danh Sách Nhân Viên ({users.length} tài khoản)
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Đóng Form' : '+ Thêm Nhân Viên Mới'}</span>
            </button>
          </div>

          {/* New User Form */}
          {showAddForm && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 border border-sky-200 p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-sky-900 border-b border-sky-200 pb-2 flex items-center justify-between">
                <span>TẠO QUYỀN ĐĂNG NHẬP NHÂN VIÊN MỚI</span>
                <span className="text-[11px] font-normal text-slate-500">Mã PIN mặc định: 1234</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và Tên Nhân Viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Lê Hoàng Nam"
                    required
                    className="w-full py-1.5 px-3 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân Quyền / Vai Trò <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full py-1.5 px-3 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="site_engineer">Kỹ Thuật Viên Thi Công Site (Lập chi tiêu, xem duyệt)</option>
                    <option value="supervisor">Chỉ Huy Trưởng / Giám Sát Site (Quản lý site & lập phiếu)</option>
                    <option value="accountant">Kế Toán Dự Án (Kiểm tra, duyệt chi, xuất Excel)</option>
                    <option value="director">Ban Giám Đốc / Admin (Toàn quyền)</option>
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
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="VD: Kỹ sư M&E Hiện Trường"
                    className="w-full py-1.5 px-3 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Công Trường / Site Phụ Trách
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="VD: Nhà xưởng Cơ điện VSIP II"
                    className="w-full py-1.5 px-3 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx.xxx.xxx"
                    className="w-full py-1.5 px-3 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hạn Mức Chi Tiêu / Tháng (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                    className="w-full py-1.5 px-3 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã PIN Đăng Nhập
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full py-1.5 px-3 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded shadow-sm"
                >
                  Xác Nhận Tạo Tài Khoản
                </button>
              </div>
            </form>
          )}

          {/* User List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${user.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-sm`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {user.name}
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-sky-800 font-semibold">{user.roleTitle}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSwitchUser(user)}
                      className={`text-xs px-2.5 py-1 rounded font-bold transition-colors ${
                        isCurrent
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-sky-600 hover:text-white'
                      }`}
                    >
                      {isCurrent ? 'Đang dùng' : 'Đăng nhập'}
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Site phụ trách:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">{user.siteName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hạn mức chi tiêu:</span>
                      <span className="font-mono font-semibold text-slate-900">{formatVND(user.monthlyLimit)}/tháng</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mã PIN:</span>
                      <span className="font-mono text-slate-700">•••• ({user.pin})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
