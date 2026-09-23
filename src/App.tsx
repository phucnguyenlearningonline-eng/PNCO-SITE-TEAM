import React, { useState, useEffect, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  Sidebar, 
  ActiveTab 
} from './components/Sidebar';
import { 
  KpiCards 
} from './components/KpiCards';
import { 
  FilterBar 
} from './components/FilterBar';
import { 
  ExpenseTable 
} from './components/ExpenseTable';
import { 
  ExpenseModal 
} from './components/ExpenseModal';
import { 
  ReceiptViewModal 
} from './components/ReceiptViewModal';
import { 
  UsersModal 
} from './components/UsersModal';
import { 
  ProjectsView 
} from './components/ProjectsView';
import { 
  SuppliersView 
} from './components/SuppliersView';
import { 
  ChartsView 
} from './components/ChartsView';
import { 
  BackupModal 
} from './components/BackupModal';
import { 
  SupabaseModal 
} from './components/SupabaseModal';
import { 
  isSupabaseConfigured 
} from './lib/supabase';
import { 
  fetchExpensesFromSupabase, 
  upsertExpenseToSupabase, 
  deleteExpenseFromSupabase,
  fetchProjectsFromSupabase,
  fetchSuppliersFromSupabase,
  fetchUsersFromSupabase
} from './services/supabaseService';
import { 
  INITIAL_EXPENSES, 
  INITIAL_PROJECTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_USERS 
} from './data/mockData';
import { 
  ExpenseItem, 
  FilterState, 
  Project, 
  Supplier, 
  User 
} from './types';
import { exportExpensesToExcel } from './utils/excelExport';
import { 
  ShoppingCart, 
  Package, 
  Building, 
  ArrowLeftRight, 
  Building2, 
  Users, 
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Bell
} from 'lucide-react';

const STORAGE_KEYS = {
  EXPENSES: 'phuc_nguyen_me_expenses_v1',
  USERS: 'phuc_nguyen_me_users_v1',
  PROJECTS: 'phuc_nguyen_me_projects_v1',
  SUPPLIERS: 'phuc_nguyen_me_suppliers_v1',
  CURRENT_USER_ID: 'phuc_nguyen_me_current_user_v1',
};

export default function App() {
  // Load state from localStorage or mock data
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_EXPENSES;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_USERS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_PROJECTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_SUPPLIERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'u-1';
  });

  // Current active logged in user
  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filters state (Defaults to September 2026 as shown in screenshot)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    projectId: 'all',
    category: 'all',
    status: 'all',
    priority: 'all',
    month: '2026-09',
    onlyPending: false,
  });

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<ExpenseItem | null>(null);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load data from Supabase if credentials are provided
  const loadDataFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const [remoteExpenses, remoteProjects, remoteSuppliers, remoteUsers] = await Promise.all([
        fetchExpensesFromSupabase(),
        fetchProjectsFromSupabase(),
        fetchSuppliersFromSupabase(),
        fetchUsersFromSupabase(),
      ]);

      if (remoteExpenses && remoteExpenses.length > 0) setExpenses(remoteExpenses);
      if (remoteProjects && remoteProjects.length > 0) setProjects(remoteProjects);
      if (remoteSuppliers && remoteSuppliers.length > 0) setSuppliers(remoteSuppliers);
      if (remoteUsers && remoteUsers.length > 0) setUsers(remoteUsers);
      showToast('Đã nạp dữ liệu đồng bộ thời gian thực từ Supabase');
    } catch (e) {
      console.warn('Could not sync with Supabase on startup:', e);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  // Filtered expenses calculation
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Tab-specific filters
      if (activeTab === 'materials' && item.category !== 'material') {
        return false;
      }

      // Month filter
      if (filters.month !== 'all' && !item.date.startsWith(filters.month)) {
        return false;
      }

      // Project filter
      if (filters.projectId !== 'all' && item.projectId !== filters.projectId) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // Only pending filter
      if (filters.onlyPending && item.status !== 'pending') {
        return false;
      }

      // Search keyword filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(query);
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.subDescription?.toLowerCase().includes(query);
        const matchSupplier = item.supplier.toLowerCase().includes(query);
        const matchCreator = item.createdByName.toLowerCase().includes(query);
        const matchProject = item.projectName.toLowerCase().includes(query);
        if (!matchCode && !matchTitle && !matchDesc && !matchSupplier && !matchCreator && !matchProject) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, activeTab, filters]);

  // Pending count
  const pendingCount = useMemo(() => {
    return expenses.filter((e) => e.status === 'pending').length;
  }, [expenses]);

  // Handlers for expense CRUD
  const handleSaveExpense = (item: ExpenseItem) => {
    if (editingExpense) {
      setExpenses((prev) => prev.map((e) => (e.id === item.id ? item : e)));
      showToast(`Đã cập nhật khoản chi ${item.code} thành công`);
    } else {
      setExpenses((prev) => [item, ...prev]);
      showToast(`Đã tạo khoản chi / PO mới: ${item.code}`);
    }
    if (isSupabaseConfigured()) {
      upsertExpenseToSupabase(item);
    }
    setEditingExpense(null);
  };

  const handleApprove = (item: ExpenseItem) => {
    const updated: ExpenseItem = {
      ...item,
      status: 'approved',
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
    };
    setExpenses((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
    if (isSupabaseConfigured()) {
      upsertExpenseToSupabase(updated);
    }
    showToast(`Đã phê duyệt khoản chi: ${item.code}`);
  };

  const handleReject = (item: ExpenseItem) => {
    const updated: ExpenseItem = { ...item, status: 'rejected' };
    setExpenses((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
    if (isSupabaseConfigured()) {
      upsertExpenseToSupabase(updated);
    }
    showToast(`Đã từ chối khoản chi: ${item.code}`);
  };

  const handlePay = (item: ExpenseItem) => {
    const updated: ExpenseItem = { ...item, status: 'paid' };
    setExpenses((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
    if (isSupabaseConfigured()) {
      upsertExpenseToSupabase(updated);
    }
    showToast(`Đã ghi nhận thanh toán hoàn tất cho: ${item.code}`);
  };

  const handleDelete = (item: ExpenseItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${item.code} (${item.title})?`)) {
      setExpenses((prev) => prev.filter((e) => e.id !== item.id));
      if (isSupabaseConfigured()) {
        deleteExpenseFromSupabase(item.id);
      }
      showToast(`Đã xóa khoản chi ${item.code}`);
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    const selectedPrjName = filters.projectId === 'all' 
      ? 'Tất cả công trình' 
      : projects.find((p) => p.id === filters.projectId)?.name || 'Dự án Phúc Nguyên';

    const periodLabel = filters.month === 'all' 
      ? 'Toàn bộ các tháng 2026' 
      : `Tháng ${filters.month.split('-')[1]}/2026`;

    exportExpensesToExcel({
      items: filteredExpenses,
      reportTitle: 'BẢNG KÊ QUẢN LÝ CHI TIÊU & MUA HÀNG TẠI CÔNG TRƯỜNG',
      periodLabel,
      projectName: selectedPrjName,
      exportedBy: `${currentUser.name} (${currentUser.roleTitle})`,
    });

    showToast(`Đã xuất ${filteredExpenses.length} bản ghi ra tệp Excel (.xlsx)`);
  };

  // Switch User handler
  const handleSwitchUser = (user: User) => {
    setCurrentUserId(user.id);
    showToast(`Đã chuyển phiên làm việc: ${user.name} (${user.roleTitle})`);
  };

  // Add Project handler
  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    showToast(`Đã thêm công trình: ${newProject.name}`);
  };

  // Add Supplier handler
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
    showToast(`Đã thêm đối tác: ${newSupplier.name}`);
  };

  // Add User handler
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    showToast(`Đã cấp quyền đăng nhập cho: ${newUser.name}`);
  };

  // Restore database
  const handleRestoreData = (data: {
    expenses: ExpenseItem[];
    projects: Project[];
    suppliers: Supplier[];
    users: User[];
  }) => {
    setExpenses(data.expenses);
    setProjects(data.projects);
    setSuppliers(data.suppliers);
    setUsers(data.users);
    showToast('Đã phục hồi dữ liệu từ bản sao lưu thành công');
  };

  // Reset to original mock data
  const handleResetDefaults = () => {
    setExpenses(INITIAL_EXPENSES);
    setProjects(INITIAL_PROJECTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setUsers(INITIAL_USERS);
    setCurrentUserId('u-1');
    localStorage.clear();
    showToast('Đã khôi phục dữ liệu ban đầu của Phúc Nguyên M&E');
  };

  // Horizontal sub-tabs array matching screenshot
  const subTabs = [
    {
      id: 'orders' as ActiveTab,
      label: 'ĐƠN HÀNG (PO)',
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      icon: ShoppingCart,
    },
    {
      id: 'materials' as ActiveTab,
      label: 'SẢN PHẨM & VẬT TƯ',
      icon: Package,
    },
    {
      id: 'projects' as ActiveTab,
      label: 'DỰ ÁN THI CÔNG',
      icon: Building,
    },
    {
      id: 'transactions' as ActiveTab,
      label: 'GIAO DỊCH (THU - CHI)',
      icon: ArrowLeftRight,
    },
    {
      id: 'clients' as ActiveTab,
      label: 'TÊN KHÁCH HÀNG',
      icon: Building2,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: 'TÊN NHÀ CUNG CẤP & XE',
      icon: Users,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'BÁO CÁO DOANH THU & CHI PHÍ',
      icon: TrendingUp,
    },
    {
      id: 'users' as ActiveTab,
      label: 'PHÂN QUYỀN NHÂN VIÊN',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#102742] text-white px-4 py-3 rounded-lg shadow-2xl border border-cyan-500/50 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        currentUser={currentUser}
        onOpenCreateModal={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
        onExportExcel={handleExportExcel}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenUserModal={() => setIsUsersModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConfigured()}
        onSwitchUser={handleSwitchUser}
        allUsers={users}
        projectsCount={projects.length}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'materials') {
              setFilters((prev) => ({ ...prev, category: 'material' }));
            }
          }}
          onOpenCreateModal={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          pendingCount={pendingCount}
          ordersCount={expenses.length}
          projectsCount={projects.length}
          suppliersCount={suppliers.length}
          currentUser={currentUser}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-[1920px]">
          {/* Top 4 KPI Summary Cards (always dynamic and informative) */}
          <KpiCards
            expenses={filteredExpenses}
            allExpenses={expenses}
            projects={projects}
          />

          {/* Horizontal Sub-tabs Bar (Exactly matching the design in user's image) */}
          <div className="bg-white rounded-lg border border-slate-200 px-2 py-1 mb-4 shadow-2xs overflow-x-auto flex items-center gap-1">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'materials') {
                      setFilters((prev) => ({ ...prev, category: 'material' }));
                    } else if (tab.id === 'orders' || tab.id === 'transactions') {
                      setFilters((prev) => ({ ...prev, category: 'all' }));
                    }
                  }}
                  className={`px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-2 whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 border-b-2 border-sky-600 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Conditional View by Active Tab */}
          {activeTab === 'reports' ? (
            <ChartsView
              expenses={expenses}
              projects={projects}
              users={users}
            />
          ) : activeTab === 'projects' ? (
            <ProjectsView
              projects={projects}
              expenses={expenses}
              onAddProject={handleAddProject}
              onSelectProjectFilter={(prjId) => {
                setFilters((prev) => ({ ...prev, projectId: prjId }));
                setActiveTab('orders');
              }}
            />
          ) : activeTab === 'suppliers' ? (
            <SuppliersView
              suppliers={suppliers}
              expenses={expenses}
              onAddSupplier={handleAddSupplier}
            />
          ) : activeTab === 'clients' ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-600" />
                  <span>DANH SÁCH CHỦ ĐẦU TƯ & KHÁCH HÀNG DỰ ÁN M&E</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thông tin các chủ đầu tư, tiến độ giải ngân hợp đồng xây dựng cơ điện.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Chủ Đầu Tư
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-2">{p.client}</h4>
                    <div className="text-xs text-slate-600 mt-1">Dự án: <strong className="text-slate-800">{p.name}</strong></div>
                    <div className="text-xs text-slate-500 mt-0.5">Vị trí: {p.location}</div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex justify-between">
                      <span className="text-slate-500">Giá trị hợp đồng:</span>
                      <span className="font-mono font-bold text-sky-800">
                        {new Intl.NumberFormat('vi-VN').format(p.totalRevenue)} đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span>QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN ĐĂNG NHẬP RIÊNG BIỆT</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống tài khoản phân tách độc lập: Kỹ thuật site, Giám sát, Kế toán kiểm tra và Ban giám đốc duyệt.
                  </p>
                </div>
                <button
                  onClick={() => setIsUsersModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>Quản lý phân quyền chi tiết</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={`p-4 rounded-xl border transition-all ${
                      u.id === currentUser.id
                        ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full ${u.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                          <div className="text-[11px] text-sky-800 font-semibold">{u.roleTitle}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSwitchUser(u)}
                        className={`text-xs px-2.5 py-1 rounded font-bold ${
                          u.id === currentUser.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700'
                        }`}
                      >
                        {u.id === currentUser.id ? 'Đang dùng' : 'Đăng nhập'}
                      </button>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div>Site: <strong className="text-slate-800">{u.siteName}</strong></div>
                      <div>Hạn mức chi: <strong className="text-slate-800 font-mono">{new Intl.NumberFormat('vi-VN').format(u.monthlyLimit)} đ/tháng</strong></div>
                      <div>Mã PIN: <span className="font-mono text-slate-500">•••• (Mặc định: {u.pin})</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Default View: Filter Bar + Expense / PO Table (Orders, Materials, Transactions)
            <>
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                projects={projects}
                totalFilteredCount={filteredExpenses.length}
                onExportExcel={handleExportExcel}
                onOpenCreateModal={() => {
                  setEditingExpense(null);
                  setIsExpenseModalOpen(true);
                }}
              />

              <ExpenseTable
                expenses={filteredExpenses}
                currentUser={currentUser}
                onApprove={handleApprove}
                onReject={handleReject}
                onPay={handlePay}
                onEdit={(item) => {
                  setEditingExpense(item);
                  setIsExpenseModalOpen(true);
                }}
                onDelete={handleDelete}
                onViewDetails={(item) => setViewingReceipt(item)}
              />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        projects={projects}
        suppliers={suppliers}
        currentUser={currentUser}
      />

      <ReceiptViewModal
        item={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        currentUser={currentUser}
        onApprove={handleApprove}
      />

      <UsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onAddUser={handleAddUser}
        onUpdateUser={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        expenses={expenses}
        projects={projects}
        suppliers={suppliers}
        users={users}
        onRestoreData={handleRestoreData}
        onResetDefaults={handleResetDefaults}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        expenses={expenses}
        projects={projects}
        suppliers={suppliers}
        users={users}
        onRefreshDataFromSupabase={loadDataFromSupabase}
      />
    </div>
  );
}
