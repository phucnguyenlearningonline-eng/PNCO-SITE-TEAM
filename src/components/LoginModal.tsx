import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  users,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.');
      setIsLoading(false);
      return;
    }

    const lowerUser = cleanUser.toLowerCase();

    // 1. Tìm kiếm người dùng theo username, email, hoặc tiền tố email
    let matchedUser = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === lowerUser) ||
        (u.email && u.email.toLowerCase() === lowerUser) ||
        (u.email && u.email.split('@')[0].toLowerCase() === lowerUser)
    );

    // 2. Tìm kiếm theo Pncons / Admin / Minh
    if (!matchedUser && (lowerUser === 'pncons' || lowerUser === 'admin' || lowerUser.includes('minh'))) {
      matchedUser = users.find(
        (u) =>
          u.id === 'u-1' ||
          (u.username && u.username.toLowerCase() === 'pncons') ||
          (u.name && u.name.toLowerCase().includes('minh')) ||
          (u.email && u.email.toLowerCase().includes('minh.ta'))
      );
    }

    // 3. Tìm kiếm theo Phúc Nguyễn / Giám Đốc
    if (!matchedUser && (lowerUser === 'phucnguyen' || lowerUser.includes('phuc') || lowerUser === 'director')) {
      matchedUser = users.find(
        (u) =>
          u.role === 'director' ||
          (u.email && u.email.toLowerCase().includes('phucnguyen')) ||
          (u.name && u.name.toLowerCase().includes('phúc'))
      );
    }

    // 4. Nếu vẫn chưa tìm thấy nhưng là tài khoản Quản trị mặc định Pncons
    if (!matchedUser && (lowerUser === 'pncons' || lowerUser === 'admin')) {
      matchedUser = {
        id: 'u-1',
        name: 'Trần Anh Minh',
        email: 'minh.ta@phucnguyenme.com.vn',
        username: 'Pncons',
        password: 'Minhatea1987@',
        role: 'supervisor',
        roleTitle: 'Quản Trị Hệ Thống & Chỉ Huy Trưởng Site',
        siteName: 'Tòa nhà phức hợp Phúc Nguyên Landmark',
        monthlyLimit: 150000000,
        pin: '1234',
        phone: '0908.123.456',
        avatarColor: 'bg-emerald-600',
        isAuthorized: true,
        permissions: {
          canApproveExpense: true,
          canCreateExpense: true,
          canManageMaterials: true,
          canManageSuppliers: true,
          canManageProjects: true,
          canManageUsers: true,
          canExportReports: true,
        },
      };
    }

    if (!matchedUser) {
      setErrorMessage('Tên đăng nhập không tồn tại trong hệ thống. Vui lòng kiểm tra lại!');
      setIsLoading(false);
      return;
    }

    const isMinhOrAdmin =
      lowerUser === 'pncons' ||
      lowerUser === 'admin' ||
      (matchedUser.username && matchedUser.username.toLowerCase() === 'pncons') ||
      (matchedUser.email && matchedUser.email.toLowerCase().includes('minh.ta')) ||
      (matchedUser.name && matchedUser.name.toLowerCase().includes('minh'));

    const isDirector =
      matchedUser.role === 'director' ||
      lowerUser === 'phucnguyen' ||
      (matchedUser.email && matchedUser.email.toLowerCase().includes('phucnguyen'));

    // Kiểm tra trạng thái phân quyền (Admin & Giám đốc luôn được phân quyền)
    if (!matchedUser.isAuthorized && !isMinhOrAdmin && !isDirector) {
      setErrorMessage(
        `Tài khoản "${matchedUser.name}" chưa được kích hoạt phân quyền! Vui lòng liên hệ Quản trị viên để được cấp quyền truy cập.`
      );
      setIsLoading(false);
      return;
    }

    // Kiểm tra mật khẩu linh hoạt (hỗ trợ mật khẩu chính, mã PIN Supabase 1234, v.v.)
    const validPasswords: string[] = [];

    if (matchedUser.password) {
      validPasswords.push(matchedUser.password);
      validPasswords.push(matchedUser.password.toLowerCase());
    }
    if (matchedUser.pin) {
      validPasswords.push(String(matchedUser.pin));
    }
    // Mã PIN 1234 mặc định trên hệ thống Supabase
    validPasswords.push('1234');

    if (isMinhOrAdmin) {
      validPasswords.push('Minhatea1987@');
      validPasswords.push('minhatea1987@');
      validPasswords.push('Minhatea1987');
      validPasswords.push('minhatea1987');
      validPasswords.push('1987');
      validPasswords.push('1234');
    }

    if (isDirector) {
      validPasswords.push('1234');
      validPasswords.push('Minhatea1987@');
      validPasswords.push('minhatea1987@');
      validPasswords.push('phucnguyen');
      validPasswords.push('admin');
    }

    const isMatch = validPasswords.some(
      (p) => p === cleanPass || p.toLowerCase() === cleanPass.toLowerCase()
    );

    if (!isMatch) {
      setErrorMessage('Mật khẩu không chính xác! Vui lòng kiểm tra lại mật khẩu hoặc mã PIN (1234).');
      setIsLoading(false);
      return;
    }

    // Đăng nhập thành công!
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(matchedUser);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-[#0c1f38] via-[#102742] to-[#0a1829] text-white p-6 relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0d223a] rounded-[10px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  Cơ Điện Phúc Nguyên
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> M&E EPC
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1 leading-tight tracking-wide">
                ĐĂNG NHẬP HỆ THỐNG
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-3 leading-relaxed relative z-10">
            Hệ thống quản lý chi tiêu, PO, phân quyền thành viên và sản phẩm vật tư thi công.
          </p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Đăng nhập không thành công:</span> {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Tên Đăng Nhập / Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc email..."
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>Mật Khẩu <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {isLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quy định bảo mật nội bộ */}
          <div className="pt-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-slate-600 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div className="font-semibold text-slate-800">Quy định truy cập nội bộ:</div>
                <p className="text-slate-500">
                  Tài khoản được phân quyền và cấp bảo mật bởi Quản trị viên hệ thống. Vui lòng liên hệ quản lý trực tiếp nếu bạn quên thông tin hoặc tài khoản chưa được kích hoạt.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Bảo mật hệ thống M&amp;E 2026</span>
          <span className="font-mono">v2.6.4</span>
        </div>
      </div>
    </div>
  );
};
