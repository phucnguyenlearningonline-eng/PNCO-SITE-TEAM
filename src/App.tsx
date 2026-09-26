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
  ExpenseModal,
  getNextOrderCode 
} from './components/ExpenseModal';
import { 
  ReceiptViewModal 
} from './components/ReceiptViewModal';
import { 
  UsersModal 
} from './components/UsersModal';
import { 
  LoginModal 
} from './components/LoginModal';
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
  upsertProjectToSupabase,
  deleteProjectFromSupabase,
  fetchSuppliersFromSupabase,
  upsertSupplierToSupabase,
  deleteSupplierFromSupabase,
  fetchUsersFromSupabase,
  fetchMaterialsFromSupabase,
  upsertMaterialToSupabase,
  deleteMaterialFromSupabase,
  subscribeToExpensesRealtime
} from './services/supabaseService';
import { ClientsView } from './components/ClientsView';
import { MaterialsView } from './components/MaterialsView';
import { 
  INITIAL_EXPENSES, 
  INITIAL_PROJECTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_USERS 
} from './data/mockData';
import { INITIAL_MATERIALS } from './data/materialsData';
import { 
  ExpenseItem, 
  FilterState, 
  Project, 
  Supplier, 
  User,
  MaterialItem 
} from './types';
import { exportExpensesToExcel } from './utils/excelExport';
import { formatVND } from './utils/formatters';
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
  MATERIALS: 'phuc_nguyen_me_materials_v1',
  CURRENT_USER_ID: 'phuc_nguyen_me_current_user_v1',
  IS_LOGGED_IN: 'phuc_nguyen_me_is_logged_in_v1',
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Chuẩn hóa và đồng bộ: Trần Anh Minh luôn có user: Pncons, pass: Minhatea1987@ và isAuthorized: true
          return parsed.map((u: any) => {
            const isMinh = u.id === 'u-1' || (u.name && u.name.toLowerCase().includes('trần anh minh')) || u.username === 'Pncons';
            if (isMinh) {
              return {
                ...u,
                name: 'Trần Anh Minh',
                username: 'Pncons',
                password: u.password || 'Minhatea1987@',
                roleTitle: 'Quản Trị Hệ Thống & Chỉ Huy Trưởng Site',
                isAuthorized: true,
                permissions: u.permissions || {
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
            return {
              ...u,
              username: u.username || '',
              password: u.password || '',
              isAuthorized: u.isAuthorized !== undefined ? Boolean(u.isAuthorized) : false,
              permissions: u.permissions || {
                canApproveExpense: false,
                canCreateExpense: false,
                canManageMaterials: false,
                canManageSuppliers: false,
                canManageProjects: false,
                canManageUsers: false,
                canExportReports: false,
              },
            };
          });
        }
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

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => {
            const cleanCode = (item.code || '').replace(/\s+/g, '');
            const fallback = INITIAL_MATERIALS.find((m) => m.code.replace(/\s+/g, '') === cleanCode) || INITIAL_MATERIALS[idx % INITIAL_MATERIALS.length];
            return {
              ...item,
              code: cleanCode || `VT${String(idx + 1).padStart(4, '0')}`,
              catalogueUrl: item.catalogueUrl || fallback?.catalogueUrl || '',
              supplier: item.supplier || fallback?.supplier || '',
              subCategory: item.subCategory || fallback?.subCategory || '',
              vatRate: typeof item.vatRate === 'number' ? item.vatRate : (fallback?.vatRate ?? 10),
              unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : fallback?.unitPrice,
              warehouseLocation: item.warehouseLocation || fallback?.warehouseLocation || 'Kho Tổng Dĩ An (Bình Dương)',
              stockQuantity: typeof item.stockQuantity === 'number' ? item.stockQuantity : (fallback?.stockQuantity ?? 50),
              minStock: typeof item.minStock === 'number' ? item.minStock : (fallback?.minStock ?? 10),
              shelfLocation: item.shelfLocation || fallback?.shelfLocation || '',
            };
          });
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_MATERIALS;
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
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  // Auth / Login state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  });

  const handleLoginSuccess = (user: User) => {
    setCurrentUserId(user.id);
    setIsLoggedIn(true);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    showToast(`Đăng nhập thành công! Xin chào ${user.name}`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
    showToast('Đã đăng xuất khỏi hệ thống.');
  };

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
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
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
      const [remoteExpenses, remoteProjects, remoteSuppliers, remoteUsers, remoteMaterials] = await Promise.all([
        fetchExpensesFromSupabase(),
        fetchProjectsFromSupabase(),
        fetchSuppliersFromSupabase(),
        fetchUsersFromSupabase(),
        fetchMaterialsFromSupabase(),
      ]);

      // If remote expenses exist (even empty array after deletions), sync it
      if (remoteExpenses !== null) {
        setExpenses(remoteExpenses);
      }
      if (remoteProjects && remoteProjects.length > 0) setProjects(remoteProjects);
      if (remoteSuppliers && remoteSuppliers.length > 0) setSuppliers(remoteSuppliers);
      if (remoteMaterials && remoteMaterials.length > 0) setMaterials(remoteMaterials);
      if (remoteUsers && remoteUsers.length > 0) {
        const normalized = remoteUsers.map((u) => {
          const isMinh = u.id === 'u-1' || (u.name && u.name.toLowerCase().includes('minh')) || (u.email && u.email.toLowerCase().includes('minh.ta')) || u.username === 'Pncons';
          const isDirector = u.role === 'director' || (u.email && u.email.toLowerCase().includes('phucnguyen'));
          if (isMinh) {
            return {
              ...u,
              name: u.name || 'Trần Anh Minh',
              username: 'Pncons',
              password: u.password || 'Minhatea1987@',
              pin: u.pin || '1234',
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
          if (isDirector) {
            return {
              ...u,
              username: u.username || 'phucnguyen',
              password: u.password || '1234',
              pin: u.pin || '1234',
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
          return {
            ...u,
            username: u.username || (u.email ? u.email.split('@')[0] : ''),
            password: u.password || u.pin || '1234',
            pin: u.pin || '1234',
            isAuthorized: u.isAuthorized !== undefined ? Boolean(u.isAuthorized) : true,
          };
        });
        setUsers(normalized);
      }
      showToast('Đã nạp dữ liệu đồng bộ thời gian thực từ Supabase');
    } catch (e) {
      console.warn('Could not sync with Supabase on startup:', e);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();

    // Lắng nghe thay đổi Realtime: khi bất kỳ máy tính nào thêm/sửa/xóa, máy tính khác cập nhật tức thời
    const unsubscribe = subscribeToExpensesRealtime(
      (newExpense) => {
        setExpenses((prev) => {
          if (prev.some((e) => e.id === newExpense.id)) {
            return prev.map((e) => (e.id === newExpense.id ? newExpense : e));
          }
          return [newExpense, ...prev];
        });
        showToast(`Đồng bộ tức thời: Nhận khoản chi mới (${newExpense.code})`);
      },
      (updatedExpense) => {
        setExpenses((prev) =>
          prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e))
        );
      },
      (deletedId) => {
        setExpenses((prev) => prev.filter((e) => e.id !== deletedId));
        showToast('Đồng bộ tức thời: 1 khoản chi vừa được xóa trên thiết bị khác');
      }
    );

    return () => {
      unsubscribe();
    };
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
  const handleSaveExpense = async (item: ExpenseItem) => {
    if (editingExpense) {
      setExpenses((prev) => prev.map((e) => (e.id === item.id ? item : e)));
      showToast(`Đã cập nhật khoản chi ${item.code} thành công`);
    } else {
      setExpenses((prev) => [item, ...prev]);
      showToast(`Đã tạo khoản chi / PO mới: ${item.code}`);
    }
    if (isSupabaseConfigured()) {
      const ok = await upsertExpenseToSupabase(item);
      if (!ok) {
        showToast(`Lỗi: Không lưu được lên Supabase (vui lòng kiểm tra quyền RLS)`);
      }
    }
    setEditingExpense(null);
  };

  const handleApprove = async (item: ExpenseItem) => {
    const updated: ExpenseItem = {
      ...item,
      status: 'approved',
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
    };
    setExpenses((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
    if (isSupabaseConfigured()) {
      await upsertExpenseToSupabase(updated);
    }
    showToast(`Đã phê duyệt khoản chi: ${item.code}`);
  };

  const handleReject = async (item: ExpenseItem) => {
    const updated: ExpenseItem = { ...item, status: 'rejected' };
    setExpenses((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
    if (isSupabaseConfigured()) {
      await upsertExpenseToSupabase(updated);
    }
    showToast(`Đã từ chối khoản chi: ${item.code}`);
  };

  const handlePay = async (item: ExpenseItem) => {
    const updated: ExpenseItem = { ...item, status: 'paid' };
    setExpenses((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
    if (isSupabaseConfigured()) {
      await upsertExpenseToSupabase(updated);
    }
    showToast(`Đã ghi nhận thanh toán hoàn tất cho: ${item.code}`);
  };

  const handleDelete = async (item: ExpenseItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${item.code} (${item.title})?`)) {
      setExpenses((prev) => prev.filter((e) => e.id !== item.id));
      if (isSupabaseConfigured()) {
        const ok = await deleteExpenseFromSupabase(item.id);
        if (!ok) {
          showToast(`Lỗi: Không xóa được trên Supabase (hãy kiểm tra quyền RLS)`);
          return;
        }
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
  const handleAddProject = async (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    if (isSupabaseConfigured()) {
      await upsertProjectToSupabase(newProject);
    }
    showToast(`Đã thêm công trình: ${newProject.name}`);
  };

  // Edit Project handler
  const handleEditProject = async (updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    if (isSupabaseConfigured()) {
      await upsertProjectToSupabase(updatedProject);
    }
    showToast(`Đã cập nhật công trình: ${updatedProject.name}`);
  };

  // Delete Project handler
  const handleDeleteProject = async (projectId: string) => {
    const prj = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (isSupabaseConfigured()) {
      await deleteProjectFromSupabase(projectId);
    }
    showToast(`Đã xóa dự án: ${prj?.name || projectId}`);
  };

  // Add Supplier handler
  const handleAddSupplier = async (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
    if (isSupabaseConfigured()) {
      await upsertSupplierToSupabase(newSupplier);
    }
    showToast(`Đã thêm đối tác: ${newSupplier.name}`);
  };

  // Edit Supplier handler
  const handleEditSupplier = async (updatedSupplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s)));
    if (isSupabaseConfigured()) {
      await upsertSupplierToSupabase(updatedSupplier);
    }
    showToast(`Đã cập nhật đối tác: ${updatedSupplier.name}`);
  };

  // Delete Supplier handler
  const handleDeleteSupplier = async (supplierId: string) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    if (isSupabaseConfigured()) {
      await deleteSupplierFromSupabase(supplierId);
    }
    showToast(`Đã xóa đối tác: ${sup?.name || supplierId}`);
  };

  // Update Client handler
  const handleUpdateClient = async (oldClientName: string, newClientName: string, newRevenue?: number) => {
    const affectedProjects = projects.filter((p) => p.client === oldClientName);
    const updatedProjects = projects.map((p) => {
      if (p.client === oldClientName) {
        return {
          ...p,
          client: newClientName,
          totalRevenue: newRevenue !== undefined ? newRevenue : p.totalRevenue,
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    if (isSupabaseConfigured()) {
      for (const prj of affectedProjects) {
        await upsertProjectToSupabase({
          ...prj,
          client: newClientName,
          totalRevenue: newRevenue !== undefined ? newRevenue : prj.totalRevenue,
        });
      }
    }
    showToast(`Đã cập nhật khách hàng/chủ đầu tư: ${newClientName}`);
  };

  // Add User handler
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    showToast(`Đã cấp quyền đăng nhập cho: ${newUser.name}`);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('Đã xóa tài khoản nhân viên');
  };

  // Material Handlers (Mã VT 0001+ & Snap Tool)
  const handleAddMaterial = async (newMat: MaterialItem) => {
    setMaterials((prev) => [newMat, ...prev]);
    if (isSupabaseConfigured()) {
      await upsertMaterialToSupabase(newMat);
    }
    showToast(`Đã thêm vật tư mới [${newMat.code}]: ${newMat.name}`);
  };

  const handleEditMaterial = async (updatedMat: MaterialItem) => {
    setMaterials((prev) => prev.map((m) => (m.id === updatedMat.id ? updatedMat : m)));
    if (isSupabaseConfigured()) {
      await upsertMaterialToSupabase(updatedMat);
    }
    showToast(`Đã cập nhật vật tư [${updatedMat.code}]`);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const target = materials.find((m) => m.id === materialId);
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    if (isSupabaseConfigured()) {
      await deleteMaterialFromSupabase(materialId);
    }
    showToast(`Đã xóa vật tư [${target?.code || materialId}]`);
  };

  const handleUpdateMaterialImage = async (materialCode: string, imageUrl: string) => {
    let targetUpdated: MaterialItem | undefined;
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.code.toLowerCase().trim() === materialCode.toLowerCase().trim()) {
          targetUpdated = { ...m, imageUrl };
          return targetUpdated;
        }
        return m;
      })
    );
    if (targetUpdated && isSupabaseConfigured()) {
      await upsertMaterialToSupabase(targetUpdated);
    }
    showToast(`Đã cập nhật ảnh nhận dạng cho [${materialCode}] từ Snap Tool!`);
  };

  // Restore database
  const handleRestoreData = (data: {
    expenses: ExpenseItem[];
    projects: Project[];
    suppliers: Supplier[];
    users: User[];
    materials?: MaterialItem[];
  }) => {
    setExpenses(data.expenses);
    setProjects(data.projects);
    setSuppliers(data.suppliers);
    setUsers(data.users);
    if (data.materials && Array.isArray(data.materials)) {
      setMaterials(data.materials);
    }
    showToast('Đã phục hồi dữ liệu từ bản sao lưu thành công');
  };

  // Reset to original mock data
  const handleResetDefaults = () => {
    setExpenses(INITIAL_EXPENSES);
    setProjects(INITIAL_PROJECTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setUsers(INITIAL_USERS);
    setMaterials(INITIAL_MATERIALS);
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
      badge: `${materials.length}`,
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

  // Tính toán số lượng khách hàng thực tế (từ các công trình/giao dịch thực tế)
  const actualClientsCount = useMemo(() => {
    return new Set(projects.map((p) => p.client.trim()).filter(Boolean)).size;
  }, [projects]);

  // Tính toán số lượng nhà cung cấp thực tế trong bản chi tiết giao dịch
  const actualSuppliersCount = useMemo(() => {
    const suppliersInExpenses = new Set(
      expenses.map((e) => e.supplier?.trim()).filter(Boolean)
    );
    return suppliersInExpenses.size > 0 ? suppliersInExpenses.size : suppliers.length;
  }, [expenses, suppliers]);

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
        onLogout={handleLogout}
        allUsers={users}
        projectsCount={projects.length}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          onOpenCreateModal={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          pendingCount={pendingCount}
          ordersCount={expenses.length}
          projectsCount={projects.length}
          suppliersCount={actualSuppliersCount}
          clientsCount={actualClientsCount}
          materialsCount={materials.length}
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
          {activeTab === 'materials' ? (
            <MaterialsView
              materials={materials}
              suppliers={suppliers}
              expenses={expenses}
              onAddMaterial={handleAddMaterial}
              onEditMaterial={handleEditMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onSelectMaterialForPO={(mat) => {
                const nextCode = getNextOrderCode(expenses);
                const vatRate = typeof mat.vatRate === 'number' ? mat.vatRate : 10;
                const unitPrice = mat.unitPrice || 0;
                const vatAmount = Math.round(unitPrice * (vatRate / 100));
                const totalAmount = unitPrice + vatAmount;
                setEditingExpense({
                  id: `po-${Date.now()}`,
                  code: nextCode,
                  type: 'po',
                  category: 'material',
                  materialCode: mat.code,
                  title: `${mat.name} (x1 ${mat.unit})`,
                  subDescription: `${mat.code}: ${mat.name} (x1 ${mat.unit})`,
                  items: [{
                    materialId: mat.id,
                    code: mat.code,
                    name: mat.name,
                    unit: mat.unit,
                    quantity: 1,
                    unitPrice: unitPrice,
                    total: unitPrice,
                  }],
                  projectId: projects[0]?.id || '',
                  projectName: projects[0]?.name || '',
                  supplier: mat.supplier || 'Nhà cung cấp vật tư Phúc Nguyên',
                  createdById: currentUser.id,
                  createdByName: currentUser.name,
                  createdByRole: currentUser.roleTitle,
                  date: new Date().toISOString().split('T')[0],
                  amount: unitPrice,
                  vatRate: vatRate,
                  vatAmount: vatAmount,
                  totalAmount: totalAmount,
                  priority: 'normal',
                  status: 'pending',
                  paymentMethod: 'transfer',
                  receiptImage: mat.imageUrl,
                });
                setIsExpenseModalOpen(true);
              }}
            />
          ) : activeTab === 'reports' ? (
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
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
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
              onEditSupplier={handleEditSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          ) : activeTab === 'clients' ? (
            <ClientsView
              projects={projects}
              expenses={expenses}
              onUpdateClient={handleUpdateClient}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
            />
          ) : activeTab === 'users' ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span>QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN ĐĂNG NHẬP RIÊNG BIỆT</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản trị viên <strong className="text-sky-700">Trần Anh Minh (user: Pncons)</strong> được phân quyền sẵn. Các thành viên còn lại do Minh tự cấu hình &amp; cấp mật khẩu.
                  </p>
                </div>
                <button
                  onClick={() => setIsUsersModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cấu hình &amp; Phân quyền thành viên</span>
                </button>
              </div>

              {/* Status summary banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="text-slate-500 font-medium">Quản trị viên phân quyền:</div>
                  <div className="font-bold text-slate-900 text-sm">Trần Anh Minh</div>
                  <div className="font-mono text-sky-700 font-bold text-[11px]">User: Pncons | Mật khẩu: Minhatea1987@</div>
                </div>
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="text-emerald-700 font-medium">Tài khoản đã phân quyền:</div>
                  <div className="font-black text-emerald-800 text-base">
                    {users.filter(u => u.isAuthorized).length} / {users.length} tài khoản
                  </div>
                  <div className="text-[10px] text-emerald-600">Được phép đăng nhập hệ thống</div>
                </div>
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="text-amber-700 font-medium">Tài khoản chờ cấp quyền:</div>
                  <div className="font-black text-amber-800 text-base">
                    {users.filter(u => !u.isAuthorized).length} tài khoản
                  </div>
                  <div className="text-[10px] text-amber-600">Đang chờ Minh tạo user &amp; mật khẩu</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => {
                  const isMinh = u.username === 'Pncons' || u.name.toLowerCase().includes('trần anh minh');
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-xs'
                          : u.isAuthorized
                          ? 'border-sky-200 bg-sky-50/10'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl ${u.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                              <span>{u.name}</span>
                              {isMinh && (
                                <span className="text-[10px] bg-sky-700 text-white px-1.5 py-0.2 rounded font-bold">
                                  Admin
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                                  Hiện tại
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">{u.roleTitle}</div>
                          </div>
                        </div>

                        {u.isAuthorized || isMinh ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300 shrink-0">
                            Đã Cấp Quyền
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300 shrink-0">
                            Chưa Cấp
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tên đăng nhập:</span>
                          <span className="font-mono font-bold text-sky-800">
                            {u.username ? u.username : <span className="text-slate-400 font-sans italic font-normal">Chưa cấp</span>}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Site phụ trách:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[170px]">{u.siteName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Hạn mức chi:</span>
                          <span className="font-mono font-semibold text-slate-900">{formatVND(u.monthlyLimit)}/tháng</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setIsUsersModalOpen(true)}
                          className="text-xs px-2.5 py-1 rounded-lg font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
                        >
                          Phân Quyền
                        </button>

                        {(u.isAuthorized || isMinh) && (
                          <button
                            onClick={() => handleSwitchUser(u)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                              isCurrent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700'
                            }`}
                          >
                            {isCurrent ? 'Đang dùng' : 'Đăng nhập'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                onViewDetails={(item) => {
                  setViewingReceipt(item);
                  setAutoPrintReceipt(false);
                }}
                onPrint={(item) => {
                  setViewingReceipt(item);
                  setAutoPrintReceipt(true);
                }}
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
        materials={materials}
        expenses={expenses}
        onUpdateMaterialImage={handleUpdateMaterialImage}
        defaultType={activeTab === 'orders' ? 'po' : 'expense'}
      />

      <ReceiptViewModal
        item={viewingReceipt}
        onClose={() => {
          setViewingReceipt(null);
          setAutoPrintReceipt(false);
        }}
        currentUser={currentUser}
        materials={materials}
        suppliers={suppliers}
        autoPrint={autoPrintReceipt}
        onApprove={handleApprove}
        onEdit={(item) => setEditingExpense(item)}
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
        onDeleteUser={handleDeleteUser}
      />

      {/* Login Gate Modal */}
      <LoginModal
        isOpen={!isLoggedIn}
        users={users}
        onLoginSuccess={handleLoginSuccess}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        expenses={expenses}
        projects={projects}
        suppliers={suppliers}
        users={users}
        materials={materials}
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
        materials={materials}
        onRefreshDataFromSupabase={loadDataFromSupabase}
      />
    </div>
  );
}
