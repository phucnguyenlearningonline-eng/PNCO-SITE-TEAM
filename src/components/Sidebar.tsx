import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Building, 
  ArrowLeftRight, 
  Building2, 
  Users, 
  TrendingUp, 
  PlusCircle, 
  ChevronLeft, 
  ShieldCheck, 
  Database,
  Shield,
  Layers,
  Sparkles,
  FileSignature
} from 'lucide-react';
import { User } from '../types';

export type ActiveTab = 'orders' | 'materials' | 'projects' | 'contracts' | 'transactions' | 'clients' | 'suppliers' | 'reports' | 'users';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenCreateModal: () => void;
  onOpenBackupModal: () => void;
  pendingCount: number;
  ordersCount: number;
  projectsCount: number;
  suppliersCount: number;
  clientsCount: number;
  materialsCount: number;
  contractsCount?: number;
  currentUser: User;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenCreateModal,
  onOpenBackupModal,
  pendingCount,
  ordersCount,
  projectsCount,
  suppliersCount,
  clientsCount,
  materialsCount,
  contractsCount = 0,
  currentUser,
  isCollapsed,
  onToggleCollapse,
}) => {
  const menuItems = [
    {
      id: 'orders' as ActiveTab,
      label: 'Đơn Hàng (PO) & Chi Tiêu',
      sublabel: 'Quản lý & duyệt chi tiêu site...',
      icon: ShoppingCart,
      badge: pendingCount > 0 ? `${pendingCount} chờ duyệt` : null,
      badgeColor: 'bg-red-600 text-white',
    },
    {
      id: 'contracts' as ActiveTab,
      label: 'Quản Lý Hợp Đồng',
      sublabel: 'Hợp đồng kinh tế, tạm ứng & các đợt TT',
      icon: FileSignature,
      count: contractsCount,
      badge: contractsCount > 0 ? `${contractsCount} HĐ` : null,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'materials' as ActiveTab,
      label: 'Sản Phẩm & Vật Tư',
      sublabel: 'Vật tư & bảng giá thiết bị M&E...',
      icon: Package,
      count: materialsCount,
    },
    {
      id: 'projects' as ActiveTab,
      label: 'Dự Án',
      sublabel: 'Công trình thi công & dự toán',
      icon: Building,
      count: projectsCount,
    },
    {
      id: 'transactions' as ActiveTab,
      label: 'Giao Dịch (Thu - Chi)',
      sublabel: 'Chi phí site: vật tư, xe, cơm ca...',
      icon: ArrowLeftRight,
      count: ordersCount,
    },
    {
      id: 'clients' as ActiveTab,
      label: 'Tên Khách Hàng',
      sublabel: 'Chủ đầu tư các dự án thi công',
      icon: Building2,
      count: clientsCount,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: 'Tên Nhà Cung Cấp',
      sublabel: 'Đối tác cung ứng & nhà xe site',
      icon: Users,
      count: suppliersCount,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Báo Cáo & Biểu Đồ',
      sublabel: 'Doanh thu & chi phí thời gian thực',
      icon: TrendingUp,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500 text-white font-bold',
    },
    {
      id: 'users' as ActiveTab,
      label: 'Phân Quyền Nhân Viên',
      sublabel: 'Đăng nhập riêng từng kỹ sư & kế toán',
      icon: ShieldCheck,
      badge: currentUser.role === 'director' || currentUser.role === 'accountant' ? 'Admin' : null,
      badgeColor: 'bg-indigo-600 text-white',
    },
  ];

  return (
    <aside 
      className={`bg-[#0a1829] text-slate-300 border-r border-[#162a42] flex flex-col transition-all duration-300 flex-shrink-0 z-20 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Top Header of Sidebar */}
      <div className="p-3.5 border-b border-[#162a42] flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#132c48] border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wider uppercase">MENU ĐIỀU HƯỚNG</div>
              <div className="text-[11px] text-slate-400">Quản lý Mua hàng & Site M&E</div>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#162d47] transition-colors ml-auto"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Action Button: Tạo đơn mua hàng */}
      <div className="p-3">
        <button
          onClick={onOpenCreateModal}
          className={`w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-900/30 transition-all ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Tạo đơn mua hàng / Phiếu chi mới"
        >
          <PlusCircle className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>+ TẠO ĐƠN MUA HÀNG</span>}
        </button>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {!isCollapsed && (
          <div className="px-2 pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            DANH MỤC CÁC TAB
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left rounded-lg transition-all flex items-center gap-3 ${
                isCollapsed ? 'p-2.5 justify-center' : 'p-2.5'
              } ${
                isActive
                  ? 'bg-[#153457] text-white font-medium border-l-4 border-cyan-400 shadow-inner'
                  : 'text-slate-300 hover:bg-[#112438] hover:text-white'
              }`}
              title={item.label}
            >
              <div className={`p-1.5 rounded ${isActive ? 'text-cyan-300' : 'text-slate-400'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs truncate font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && (
                      <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.sublabel}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom widgets */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#162a42] space-y-2.5">
          {/* Backup button widget like in image */}
          <button
            onClick={onOpenBackupModal}
            className="w-full p-2 rounded-lg bg-[#241d13] border border-amber-600/40 text-amber-300 hover:bg-[#342714] text-xs flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="font-semibold text-white">Sao Lưu Dữ Liệu</div>
                <div className="text-[10px] text-amber-200/70">Đã bảo vệ an toàn</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              JSON
            </span>
          </button>

          {/* Footer note */}
          <div className="p-2.5 rounded-lg bg-[#0e2137] border border-[#1a385c] text-[11px] text-slate-300 leading-tight">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-400 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Hệ Thống M&E Phúc Nguyên</span>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Dữ liệu kết nối trực tiếp dự án, cập nhật tồn kho & ngân sách tức thì.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
