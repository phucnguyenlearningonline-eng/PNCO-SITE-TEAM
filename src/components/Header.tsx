import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Radio, 
  Send, 
  PlusCircle, 
  Database, 
  FileSpreadsheet, 
  UserCircle, 
  ChevronDown, 
  LogOut, 
  KeyRound,
  Users,
  ShieldCheck
} from 'lucide-react';
import { User } from '../types';
import { getRoleLabel } from '../utils/formatters';

interface HeaderProps {
  currentUser: User;
  onOpenCreateModal: () => void;
  onExportExcel: () => void;
  onOpenBackupModal: () => void;
  onOpenUserModal: () => void;
  onOpenSupabaseModal?: () => void;
  isSupabaseConnected?: boolean;
  onSwitchUser: (user: User) => void;
  onLogout?: () => void;
  allUsers: User[];
  projectsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenCreateModal,
  onExportExcel,
  onOpenBackupModal,
  onOpenUserModal,
  onOpenSupabaseModal,
  isSupabaseConnected = false,
  onSwitchUser,
  onLogout,
  allUsers,
  projectsCount,
}) => {
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [zaloNotificationSent, setZaloNotificationSent] = useState(false);

  const handleSendZalo = () => {
    setZaloNotificationSent(true);
    setTimeout(() => setZaloNotificationSent(false), 3000);
  };

  return (
    <header className="bg-[#0b1b2d] text-white border-b border-[#1b3452] sticky top-0 z-30 shadow-md">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#142b45] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
            <Building2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/50 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                M&E EPC CONTRACTOR
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>📋 Quản lý Chi Tiêu & Đơn Hàng Site: Năm 2026</span>
              <span className="text-slate-600">•</span>
              <span className="hidden sm:inline">Hệ thống: Doanh thu & Chi phí Real-time</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-amber-400 font-medium">{projectsCount} Công trình thi công</span>
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time Toggle */}
          <button
            onClick={() => setRealtimeOn(!realtimeOn)}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              realtimeOn 
                ? 'bg-slate-800/90 text-slate-200 border-slate-700' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Trạng thái đồng bộ tự động"
          >
            <Radio className={`w-3.5 h-3.5 ${realtimeOn ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Real-time: {realtimeOn ? 'Bật' : 'Tắt'}</span>
          </button>

          {/* Gửi Zalo OA / Thông báo Kế toán */}
          <button
            onClick={handleSendZalo}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white transition-all shadow-sm ${
              zaloNotificationSent 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-[#1877f2] hover:bg-blue-600'
            }`}
            title="Gửi bảng kê chi tiêu & chứng từ đến nhóm Zalo Ban Giám Đốc / Kế toán"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{zaloNotificationSent ? '✓ Đã gửi Zalo OA' : '⚡ Gửi Zalo OA'}</span>
          </button>

          {/* Tạo Đơn / Chi tiêu mới */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm hover:shadow"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Tạo Chi Tiêu / PO</span>
          </button>

          {/* Sao lưu dữ liệu */}
          <button
            onClick={onOpenBackupModal}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#d97706] hover:bg-[#b45309] text-white transition-all shadow-sm"
            title="Sao lưu toàn bộ dữ liệu ra tệp JSON hoặc tải lại"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sao Lưu</span>
          </button>

          {/* Supabase Cloud Status & Config */}
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white transition-all shadow-sm border ${
                isSupabaseConnected
                  ? 'bg-emerald-950/70 border-emerald-500/50 hover:bg-emerald-900 text-emerald-300'
                  : 'bg-indigo-950/70 border-indigo-500/50 hover:bg-indigo-900 text-indigo-300'
              }`}
              title="Cấu hình kết nối Supabase PostgreSQL & Deploy Vercel"
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <span className="hidden sm:inline">Supabase:</span>
              <span className="font-bold">{isSupabaseConnected ? 'Cloud ✓' : 'Kết nối'}</span>
            </button>
          )}

          {/* Xuất Excel */}
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white transition-all shadow-sm"
            title="Xuất bảng kê chi tiêu và báo cáo theo định dạng Excel kế toán (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          {/* Phân Quyền Thành Viên Button */}
          <button
            onClick={onOpenUserModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-gradient-to-r from-sky-700 to-cyan-700 hover:from-sky-600 hover:to-cyan-600 text-white transition-all shadow-sm border border-sky-400/30"
            title="Quản lý và phân quyền tài khoản thành viên"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Phân Quyền Thành Viên</span>
            <span className="sm:hidden">Phân Quyền</span>
          </button>

          {/* Current User Switcher & Info */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#132840] hover:bg-[#1a3758] border border-[#214169] text-left transition-colors"
            >
              <div className={`w-7 h-7 rounded-full ${currentUser.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-sm`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-xs leading-tight">
                <div className="font-semibold text-white flex items-center gap-1">
                  {currentUser.name}
                  {currentUser.username === 'Pncons' ? (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      Pncons
                    </span>
                  ) : (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-normal">
                      {currentUser.role === 'director' ? 'Giám Đốc' : currentUser.role === 'accountant' ? 'Kế Toán' : 'Site'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[130px]">{currentUser.roleTitle}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown switch user */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang đăng nhập</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    {currentUser.username && (
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-mono font-bold px-1.5 py-0.2 rounded">
                        @{currentUser.username}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-sky-700 font-semibold">{currentUser.roleTitle}</div>
                  <div className="text-[11px] text-slate-500 mt-1">📍 {currentUser.siteName}</div>
                </div>

                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Chuyển Tài Khoản</span>
                  <span className="text-[10px] font-normal text-slate-400">Chỉ nick đã phân quyền</span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {allUsers.map((user) => {
                    const isMinh = user.username === 'Pncons' || user.name.toLowerCase().includes('trần anh minh');
                    return (
                      <button
                        key={user.id}
                        disabled={!user.isAuthorized && !isMinh}
                        onClick={() => {
                          if (user.isAuthorized || isMinh) {
                            onSwitchUser(user);
                            setShowUserDropdown(false);
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                          user.id === currentUser.id 
                            ? 'bg-sky-50/80 font-semibold' 
                            : user.isAuthorized || isMinh
                            ? 'hover:bg-sky-50 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${user.avatarColor} text-white font-bold flex items-center justify-center text-[11px] shrink-0`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <span>{user.name}</span>
                              {user.username && (
                                <span className="text-[10px] text-sky-600 font-mono">({user.username})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{user.roleTitle}</div>
                          </div>
                        </div>

                        <div>
                          {user.id === currentUser.id ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              Hiện tại
                            </span>
                          ) : user.isAuthorized || isMinh ? (
                            <span className="text-[10px] text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded font-medium">
                              Đã cấp
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded italic">
                              Chưa cấp
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100 px-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenUserModal();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-sky-700 hover:bg-sky-50 rounded-lg flex items-center gap-2 font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Cấu hình &amp; Phân quyền thành viên</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất khỏi hệ thống</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
