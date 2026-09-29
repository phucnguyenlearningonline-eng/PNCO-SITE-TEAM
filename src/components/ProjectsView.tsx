import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Building2,
  DollarSign, 
  PlusCircle, 
  TrendingUp, 
  MapPin, 
  User, 
  Calendar, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3, 
  Trash2, 
  X,
  Search,
  Filter,
  FileText,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Users,
  Wallet,
  ArrowUpDown,
  Sparkles,
  Info,
  Link2,
  ExternalLink
} from 'lucide-react';
import { ExpenseItem, Project, Customer, ProjectAddendum } from '../types';
import { formatVND, formatDateVN, formatTy } from '../utils/formatters';
import { ProjectAddendumsModal } from './projects/ProjectAddendumsModal';
import { ProjectFinancialModal } from './projects/ProjectFinancialModal';

interface ProjectsViewProps {
  projects: Project[];
  expenses: ExpenseItem[];
  customers?: Customer[];
  onAddProject: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onSelectProjectFilter: (projectId: string) => void;
  onAddCustomer?: (customer: Customer) => void;
  onAddExpense?: (expense: ExpenseItem) => void;
  onNavigateToExpense?: (projectId?: string, category?: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  expenses,
  customers = [],
  onAddProject,
  onEditProject,
  onDeleteProject,
  onSelectProjectFilter,
  onAddCustomer,
  onAddExpense,
  onNavigateToExpense,
}) => {
  // Chế độ xem: Bảng (table) | Lưới (grid)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Bộ lọc
  const [selectedYear, setSelectedYear] = useState<string>('2026'); // 'all' | '2026' | '2025'
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' | '01' ... '12'
  const [selectedClient, setSelectedClient] = useState<string>('all'); // 'all' | customer name
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [selectedAddendumFilter, setSelectedAddendumFilter] = useState<'all' | 'has_addendum' | 'no_addendum'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue_desc' | 'revenue_asc' | 'progress_desc' | 'latest'>('revenue_desc');

  // Modal quản lý Phụ Lục Hợp Đồng
  const [activeAddendumProject, setActiveAddendumProject] = useState<Project | null>(null);

  // Modal báo cáo tài chính Thu - Chi & Nhân Công
  const [activeFinancialProject, setActiveFinancialProject] = useState<Project | null>(null);

  // Modal Thêm / Sửa Dự Án
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states cho Dự Án
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formClientCode, setFormClientCode] = useState('');
  const [formClientAddress, setFormClientAddress] = useState('');
  const [formPackageType, setFormPackageType] = useState('Tổng thầu Cơ Điện M&E toàn bộ');
  const [formYear, setFormYear] = useState(2026);
  const [formStartDate, setFormStartDate] = useState('2026-03-01');
  const [formEndDate, setFormEndDate] = useState('2026-12-30');
  const [formContractNumber, setFormContractNumber] = useState('');
  const [formContractDate, setFormContractDate] = useState('2026-03-01');
  const [formContractFileUrl, setFormContractFileUrl] = useState('');
  const [formVatRate, setFormVatRate] = useState(0);
  const [formOriginalContractValue, setFormOriginalContractValue] = useState(23577927234);
  const [formTotalBudget, setFormTotalBudget] = useState(19500000000);
  const [formCurrentAdvance, setFormCurrentAdvance] = useState(7073378170);
  const [formStatus, setFormStatus] = useState<Project['status']>('active');
  const [formProgressPercentage, setFormProgressPercentage] = useState(74);
  const [formLocation, setFormLocation] = useState('KCN VSIP 3, Tân Uyên, Bình Dương');
  const [formManager, setFormManager] = useState('Trần Anh Minh');
  const [formLaborBudget, setFormLaborBudget] = useState(4200000000);
  const [formMaterialBudget, setFormMaterialBudget] = useState(13500000000);

  // Tự động tính tiền VAT và Tổng giá trị HĐ sau VAT
  const formVatAmount = useMemo(() => {
    if (!formOriginalContractValue || formOriginalContractValue <= 0 || !formVatRate) return 0;
    return Math.round(formOriginalContractValue * (formVatRate / 100));
  }, [formOriginalContractValue, formVatRate]);

  const formTotalContractValueWithVat = useMemo(() => {
    return (formOriginalContractValue || 0) + formVatAmount;
  }, [formOriginalContractValue, formVatAmount]);

  // Cho phép nhập trực tiếp Tổng giá trị sau VAT để tự quy ngược ra Giá trị trước VAT
  const handleTotalWithVatChange = (totalWithVat: number) => {
    if (formVatRate > 0) {
      const base = Math.round(totalWithVat / (1 + formVatRate / 100));
      setFormOriginalContractValue(base);
    } else {
      setFormOriginalContractValue(totalWithVat);
    }
  };

  // Form thêm nhanh Khách hàng mới bên trong modal
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Danh sách khách hàng hợp nhất (từ customers prop + các client có trong projects)
  const unifiedCustomers = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string; address?: string; count: number }>();

    customers.forEach((c) => {
      map.set(c.name.trim(), {
        id: c.id,
        code: c.code,
        name: c.name.trim(),
        address: c.address,
        count: 0,
      });
    });

    projects.forEach((p, index) => {
      const cName = (p.client || '').trim();
      if (!cName) return;
      if (!map.has(cName)) {
        map.set(cName, {
          id: p.clientId || `kh-${index + 1}`,
          code: p.clientCode || `KH-${String(map.size + 1).padStart(3, '0')}`,
          name: cName,
          address: p.clientAddress || p.location,
          count: 0,
        });
      }
      const item = map.get(cName)!;
      item.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  }, [customers, projects]);

  // Danh sách gói thầu độc nhất
  const availablePackages = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.packageType) set.add(p.packageType);
    });
    set.add('Tổng thầu Cơ Điện M&E toàn bộ');
    set.add('Hệ thống PCCC');
    set.add('Hệ thống Điện & Trạm biến áp');
    set.add('Cấp thoát nước & HVAC');
    return Array.from(set);
  }, [projects]);

  // Helper tính toán tài chính chi tiết của từng dự án
  const getProjectFinances = (p: Project) => {
    const prjExpenses = expenses.filter((e) => e.projectId === p.id);

    const labor = prjExpenses
      .filter((e) => e.category === 'labor_sub' || (e.title && /nhân công|lương|thợ/i.test(e.title)))
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const material = prjExpenses
      .filter((e) => e.category === 'material')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const transport = prjExpenses
      .filter((e) => e.category === 'transport')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const mealAndOther = prjExpenses
      .filter((e) => e.category === 'overtime_meal' || (e.category === 'other' && !/nhân công|lương|thợ/i.test(e.title)))
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalSpent = labor + material + transport + mealAndOther;

    const addendums = p.addendums || [];
    const addendumTotal = addendums.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const originalValue = p.originalContractValue || p.totalRevenue || 0;
    const vatRate = p.vatRate || 0;
    const vatAmount = p.vatAmount !== undefined ? p.vatAmount : Math.round(originalValue * (vatRate / 100));
    const contractValueWithVat = p.totalContractValueWithVat || (originalValue + vatAmount);
    const totalAfterPLHD = contractValueWithVat + addendumTotal;

    const collected = p.currentAdvance || 0;
    const remainingToCollect = Math.max(0, totalAfterPLHD - collected);
    const collectedPercentage = totalAfterPLHD > 0 ? (collected / totalAfterPLHD) * 100 : 0;

    const grossProfit = totalAfterPLHD - totalSpent;
    const profitMargin = totalAfterPLHD > 0 ? (grossProfit / totalAfterPLHD) * 100 : 0;

    return {
      totalSpent,
      labor,
      material,
      transport,
      mealAndOther,
      originalValue,
      vatRate,
      vatAmount,
      contractValueWithVat,
      addendumTotal,
      addendumsCount: addendums.length,
      totalAfterPLHD,
      collected,
      remainingToCollect,
      collectedPercentage,
      grossProfit,
      profitMargin,
    };
  };

  // Lọc danh sách dự án
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Lọc Năm
      if (selectedYear !== 'all') {
        const prjYear = String(p.year || (p.startDate ? p.startDate.split('-')[0] : '2026'));
        if (prjYear !== selectedYear) return false;
      }

      // Lọc Tháng
      if (selectedMonth !== 'all') {
        const checkDate = p.startDate || p.contractDate || '';
        const m = checkDate.split('-')[1];
        if (m !== selectedMonth) return false;
      }

      // Lọc Khách hàng
      if (selectedClient !== 'all') {
        if (p.client.trim().toLowerCase() !== selectedClient.trim().toLowerCase()) return false;
      }

      // Lọc Trạng thái
      if (selectedStatus !== 'all') {
        if (p.status !== selectedStatus) return false;
      }

      // Lọc Gói thầu
      if (selectedPackage !== 'all') {
        if (p.packageType !== selectedPackage) return false;
      }

      // Lọc Phụ lục HĐ
      if (selectedAddendumFilter !== 'all') {
        const count = p.addendums?.length || 0;
        if (selectedAddendumFilter === 'has_addendum' && count === 0) return false;
        if (selectedAddendumFilter === 'no_addendum' && count > 0) return false;
      }

      // Tìm kiếm
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        const matchClient = p.client.toLowerCase().includes(q);
        const matchLocation = p.location.toLowerCase().includes(q);
        const matchContract = p.contractNumber ? p.contractNumber.toLowerCase().includes(q) : false;
        if (!matchCode && !matchName && !matchClient && !matchLocation && !matchContract) return false;
      }

      return true;
    }).sort((a, b) => {
      const finA = getProjectFinances(a);
      const finB = getProjectFinances(b);

      if (sortBy === 'revenue_desc') return finB.totalAfterPLHD - finA.totalAfterPLHD;
      if (sortBy === 'revenue_asc') return finA.totalAfterPLHD - finB.totalAfterPLHD;
      if (sortBy === 'progress_desc') return (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0);
      return 0;
    });
  }, [projects, selectedYear, selectedMonth, selectedClient, selectedStatus, selectedPackage, selectedAddendumFilter, searchTerm, sortBy]);

  // Thống kê tổng quan KPI Cards
  const stats = useMemo(() => {
    let activeCount = 0;
    let acceptedCount = 0;
    let completedCount = 0;
    let totalContractValue = 0;
    let totalOriginalValue = 0;
    let totalAddendums = 0;
    let totalCollected = 0;
    let totalRemaining = 0;
    let totalLaborCost = 0;
    let totalSpent = 0;
    let progressSum = 0;

    filteredProjects.forEach((p) => {
      if (p.status === 'completed') completedCount += 1;
      else if (p.status === 'accepted') acceptedCount += 1;
      else activeCount += 1;

      const fin = getProjectFinances(p);
      totalContractValue += fin.totalAfterPLHD;
      totalOriginalValue += fin.originalValue;
      totalAddendums += fin.addendumsCount;
      totalCollected += fin.collected;
      totalRemaining += fin.remainingToCollect;
      totalLaborCost += fin.labor;
      totalSpent += fin.totalSpent;
      progressSum += (p.progressPercentage ?? 40);
    });

    const avgProgress = filteredProjects.length > 0 ? Math.round(progressSum / filteredProjects.length) : 0;
    const collectionRate = totalContractValue > 0 ? (totalCollected / totalContractValue) * 100 : 0;

    return {
      count: filteredProjects.length,
      activeCount,
      acceptedCount,
      completedCount,
      totalContractValue,
      totalOriginalValue,
      totalAddendums,
      totalCollected,
      totalRemaining,
      collectionRate,
      totalLaborCost,
      totalSpent,
      avgProgress,
    };
  }, [filteredProjects, expenses]);

  // Mở modal thêm dự án
  const handleOpenAddProject = () => {
    setEditingProject(null);
    const nextCode = `PNC-DA0${projects.length + 1}`;
    setFormCode(nextCode);
    setFormName('');
    // Khách hàng đầu tiên mặc định
    const defaultCust = unifiedCustomers[0] || { id: 'kh-002', code: 'KH-002', name: 'Công Ty TNHH Tialoc Việt Nam', address: 'TP. Hồ Chí Minh' };
    setFormClientId(defaultCust.id);
    setFormClientCode(defaultCust.code);
    setFormClient(defaultCust.name);
    setFormClientAddress(defaultCust.address || 'TP. Hồ Chí Minh');
    setFormPackageType('Tổng thầu Cơ Điện M&E toàn bộ');
    setFormYear(2026);
    setFormStartDate('2026-03-01');
    setFormEndDate('2026-12-30');
    setFormContractNumber(`HĐ-PNC-2026/${nextCode}`);
    setFormContractDate('2026-03-01');
    setFormContractFileUrl('');
    setFormVatRate(0);
    setFormOriginalContractValue(15000000000);
    setFormTotalBudget(12000000000);
    setFormCurrentAdvance(4500000000);
    setFormStatus('active');
    setFormProgressPercentage(50);
    setFormLocation('TP. Hồ Chí Minh');
    setFormManager('Trần Anh Minh');
    setFormLaborBudget(3000000000);
    setFormMaterialBudget(8500000000);
    setShowAddModal(true);
  };

  // Mở modal sửa dự án
  const handleOpenEditProject = (p: Project) => {
    setEditingProject(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormClientId(p.clientId || '');
    setFormClientCode(p.clientCode || 'KH-001');
    setFormClient(p.client);
    setFormClientAddress(p.clientAddress || p.location);
    setFormPackageType(p.packageType || 'Tổng thầu Cơ Điện M&E toàn bộ');
    setFormYear(p.year || 2026);
    setFormStartDate(p.startDate || '2026-03-01');
    setFormEndDate(p.endDate || '2026-12-30');
    setFormContractNumber(p.contractNumber || '');
    setFormContractDate(p.contractDate || '2026-03-01');
    setFormContractFileUrl(p.contractFileUrl || '');
    setFormVatRate(p.vatRate ?? 0);
    setFormOriginalContractValue(p.originalContractValue || p.totalRevenue || 0);
    setFormTotalBudget(p.totalBudget);
    setFormCurrentAdvance(p.currentAdvance);
    setFormStatus(p.status);
    setFormProgressPercentage(p.progressPercentage ?? 50);
    setFormLocation(p.location);
    setFormManager(p.manager);
    setFormLaborBudget(p.laborBudget || 0);
    setFormMaterialBudget(p.materialBudget || 0);
    setShowAddModal(true);
  };

  // Khi chọn Khách hàng từ dropdown trong form
  const handleSelectCustomerInForm = (custName: string) => {
    const cust = unifiedCustomers.find((c) => c.name.toLowerCase() === custName.toLowerCase());
    if (cust) {
      setFormClient(cust.name);
      setFormClientCode(cust.code);
      setFormClientId(cust.id);
      if (cust.address) setFormClientAddress(cust.address);
    } else {
      setFormClient(custName);
    }
  };

  // Thêm nhanh khách hàng mới ngay trong modal
  const handleSaveQuickClient = () => {
    if (!newClientName.trim()) return;
    const newCust: Customer = {
      id: `kh-${Date.now()}`,
      code: `KH-${String(unifiedCustomers.length + 1).padStart(3, '0')}`,
      name: newClientName.trim(),
      address: newClientAddress.trim(),
      phone: newClientPhone.trim(),
    };
    if (onAddCustomer) {
      onAddCustomer(newCust);
    }
    setFormClient(newCust.name);
    setFormClientCode(newCust.code);
    setFormClientId(newCust.id);
    if (newCust.address) setFormClientAddress(newCust.address);
    setShowQuickAddClient(false);
    setNewClientName('');
    setNewClientAddress('');
    setNewClientPhone('');
  };

  // Lưu dự án
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formClient.trim()) return;

    // Tính toán lại tổng quyết toán sau phụ lục (HĐ gốc sau VAT + các phụ lục phát sinh)
    const existingAddendums = editingProject?.addendums || [];
    const addendumTotal = existingAddendums.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const finalContractWithVat = formOriginalContractValue + formVatAmount;
    const finalTotalRevenue = finalContractWithVat + addendumTotal;

    if (editingProject && onEditProject) {
      const updated: Project = {
        ...editingProject,
        code: formCode.trim() || editingProject.code,
        name: formName.trim(),
        clientId: formClientId || editingProject.clientId,
        clientCode: formClientCode || editingProject.clientCode,
        client: formClient.trim(),
        clientAddress: formClientAddress.trim(),
        packageType: formPackageType,
        year: formYear,
        startDate: formStartDate,
        endDate: formEndDate,
        contractNumber: formContractNumber.trim(),
        contractDate: formContractDate,
        contractFileUrl: formContractFileUrl.trim() || undefined,
        vatRate: formVatRate,
        originalContractValue: formOriginalContractValue,
        vatAmount: formVatAmount,
        totalContractValueWithVat: finalContractWithVat,
        totalRevenue: finalTotalRevenue,
        totalBudget: formTotalBudget,
        currentAdvance: formCurrentAdvance,
        status: formStatus,
        progressPercentage: formProgressPercentage,
        location: formLocation.trim(),
        manager: formManager.trim(),
        laborBudget: formLaborBudget,
        materialBudget: formMaterialBudget,
        addendums: existingAddendums,
      };
      onEditProject(updated);
    } else {
      const newProj: Project = {
        id: `prj-${Date.now()}`,
        code: formCode.trim() || `PNC-DA0${projects.length + 1}`,
        name: formName.trim(),
        clientId: formClientId,
        clientCode: formClientCode || `KH-${String(unifiedCustomers.length + 1).padStart(3, '0')}`,
        client: formClient.trim(),
        clientAddress: formClientAddress.trim(),
        packageType: formPackageType,
        year: formYear,
        startDate: formStartDate,
        endDate: formEndDate,
        contractNumber: formContractNumber.trim(),
        contractDate: formContractDate,
        contractFileUrl: formContractFileUrl.trim() || undefined,
        vatRate: formVatRate,
        originalContractValue: formOriginalContractValue,
        vatAmount: formVatAmount,
        totalContractValueWithVat: finalContractWithVat,
        totalRevenue: finalTotalRevenue,
        totalBudget: formTotalBudget,
        currentAdvance: formCurrentAdvance,
        status: formStatus,
        progressPercentage: formProgressPercentage,
        location: formLocation.trim(),
        manager: formManager.trim(),
        laborBudget: formLaborBudget,
        materialBudget: formMaterialBudget,
        addendums: [],
      };
      onAddProject(newProj);
    }

    setShowAddModal(false);
    setEditingProject(null);
  };

  // Cập nhật phụ lục cho dự án
  const handleUpdateProjectAddendums = (updatedProject: Project) => {
    if (onEditProject) {
      onEditProject(updatedProject);
    }
    setActiveAddendumProject(updatedProject);
  };

  // Xóa dự án
  const handleDelete = (p: Project) => {
    if (!onDeleteProject) return;
    if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ dự án "${p.name}" (${p.code})?`)) {
      onDeleteProject(p.id);
    }
  };

  // Xuất Excel danh sách dự án
  const handleExportExcel = () => {
    const rows = filteredProjects.map((p, idx) => {
      const fin = getProjectFinances(p);
      return {
        STT: idx + 1,
        'Mã Dự Án': p.code,
        'Tên Công Trình': p.name,
        'Mã CĐT': p.clientCode || '',
        'Khách Hàng / Chủ Đầu Tư': p.client,
        'Gói Thầu M&E': p.packageType || '',
        'Năm Thực Hiện': p.year || 2026,
        'Địa Điểm': p.location,
        'Chỉ Huy Trưởng': p.manager,
        'HĐ Gốc (VNĐ)': fin.originalValue,
        'VAT (%)': p.vatRate ?? 0,
        'Số Lượng PLHĐ': fin.addendumsCount,
        'Tổng Tiền Sau PLHĐ (VNĐ)': fin.totalAfterPLHD,
        'Đã Thu CĐT (VNĐ)': fin.collected,
        'Tỷ Lệ Đã Thu (%)': fin.collectedPercentage.toFixed(1) + '%',
        'Còn Phải Thu CĐT (VNĐ)': fin.remainingToCollect,
        'Chi Phí Nhân Công (VNĐ)': fin.labor,
        'Chi Phí Vật Tư (VNĐ)': fin.material,
        'Tổng Chi Phí (VNĐ)': fin.totalSpent,
        'Lợi Nhuận Gộp (VNĐ)': fin.grossProfit,
        'Tiến Độ Thi Công (%)': `${p.progressPercentage || 0}%`,
        'Trạng Thái': p.status === 'completed' ? 'Hoàn thành' : p.status === 'accepted' ? 'Đã nghiệm thu' : 'Đang thi công',
      };
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Du_An_Phuc_Nguyen_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ============================================================== */}
      {/* 1. HEADER SECTION (TIÊU ĐỀ & CÁC NÚT NĂM, XUẤT EXCEL, THÊM DA) */}
      {/* ============================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-800 border border-sky-200">
              <Building className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              QUẢN LÝ DỰ ÁN &amp; HỢP ĐỒNG THI CÔNG
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
              Năm {selectedYear === 'all' ? 'Toàn Bộ' : selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống quản lý tiến độ công trình xây dựng, hợp đồng kinh tế và phụ lục phát sinh (PLHĐ) Công ty Phúc Nguyên
          </p>
        </div>

        {/* Nút lọc Năm nhanh + Xuất Excel + Thêm DA */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Year Filters */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedYear === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setSelectedYear('2026')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedYear === '2026' ? 'bg-[#102742] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Năm 2026
            </button>
            <button
              type="button"
              onClick={() => setSelectedYear('2025')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedYear === '2025' ? 'bg-[#102742] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Năm 2025
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            title="Xuất bảng Excel dữ liệu dự án và phụ lục"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddProject}
            className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Dự Án Mới</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BỐN THẺ KPI METRICS (Y HỆT HÌNH ẢNH USER GỬI)               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Thẻ 1: Dự án thực hiện */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>DỰ ÁN THỰC HIỆN</span>
            <span className="p-1 rounded bg-sky-50 text-sky-600"><Building className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-slate-900">{stats.count}</span>
            <span className="text-xs font-semibold text-slate-600">công trình</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-sky-700 font-bold">{stats.activeCount} đang thi công</span>
            <span>•</span>
            <span>{stats.acceptedCount} nghiệm thu</span>
            <span>•</span>
            <span>{stats.completedCount} hoàn thành</span>
          </div>
        </div>

        {/* Thẻ 2: Doanh thu ký kết */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>DOANH THU KÝ KẾT {selectedYear === 'all' ? 'TOÀN BỘ' : `NĂM ${selectedYear}`}</span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-600"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-slate-900">{formatTy(stats.totalContractValue)}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span>HĐ gốc: <strong className="font-mono text-slate-700">{formatTy(stats.totalOriginalValue)}</strong></span>
            <span>•</span>
            <span className="text-sky-700 font-bold">PLHĐ: +{formatTy(stats.totalContractValue - stats.totalOriginalValue)}</span>
          </div>
        </div>

        {/* Thẻ 3: Doanh thu đã thu thực tế */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>DOANH THU ĐÃ THU THỰC TẾ</span>
            <span className="p-1 rounded bg-blue-50 text-blue-600"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-emerald-800">{formatTy(stats.totalCollected)}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Thu hồi: <strong className="text-sky-700">{stats.collectionRate.toFixed(1)}%</strong></span>
            <span>Còn thu: <strong className="text-amber-700 font-mono">{formatTy(stats.totalRemaining)}</strong></span>
          </div>
        </div>

        {/* Thẻ 4: Tiến độ & Chi phí nhân công */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>TIẾN ĐỘ TRUNG BÌNH</span>
            <span className="p-1 rounded bg-amber-50 text-amber-600"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-slate-900">{stats.avgProgress}%</span>
            <span className="text-xs font-bold text-purple-700 font-mono">
              Chi NC: {formatTy(stats.totalLaborCost)}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, stats.avgProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TABS PHỤ: TẤT CẢ DỰ ÁN & HỒ SƠ PHỤ LỤC + NÚT TABLE / GRID     */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Tab Tất cả dự án */}
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-[#102742] text-white shadow-2xs"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>TẤT CẢ DỰ ÁN ({filteredProjects.length})</span>
          </button>

          {/* Quick tab xem hồ sơ phụ lục dự án đầu tiên hoặc đang chọn */}
          {filteredProjects[0] && (
            <button
              type="button"
              onClick={() => setActiveAddendumProject(filteredProjects[0])}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>HỒ SƠ &amp; PHỤ LỤC: {filteredProjects[0].code} ({filteredProjects[0].addendums?.length || 0} PLHĐ)</span>
            </button>
          )}
        </div>

        {/* Nút chuyển đổi giao diện Bảng (Table) / Lưới (Grid) */}
        <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-end">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-[#102742] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Hiển thị dạng Bảng chi tiết (Table)"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#102742] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Hiển thị dạng Thẻ khối (Grid Cards)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. THANH BỘ LỌC ĐẦY ĐỦ (KHÁCH HÀNG, THÁNG, NĂM, TRẠNG THÁI...) */}
      {/* ============================================================== */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Ô Tìm Kiếm */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên công trình, mã DA, chủ đầu tư, địa điểm, số HĐ..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc Theo Khách Hàng (Theo yêu cầu: "dự án bắt đầu từ danh sách khách hàng, có thể lọc theo khách hàng") */}
          <div className="lg:col-span-3">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className={`w-full py-2 px-2.5 text-xs border rounded-xl font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer truncate ${
                selectedClient !== 'all' ? 'bg-sky-50 text-sky-900 border-sky-400 font-bold' : 'bg-white border-slate-300 text-slate-800'
              }`}
              title="Lọc dự án theo Khách Hàng / Chủ Đầu Tư"
            >
              <option value="all">🏢 Tất cả khách hàng ({unifiedCustomers.length})</option>
              {unifiedCustomers.map((c) => (
                <option key={c.name} value={c.name}>
                  [{c.code}] {c.name} ({c.count} DA)
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Theo Tháng (Theo yêu cầu: "lọc theo tháng, năm") */}
          <div className="lg:col-span-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`w-full py-2 px-2.5 text-xs border rounded-xl font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer ${
                selectedMonth !== 'all' ? 'bg-sky-50 text-sky-900 border-sky-400 font-bold' : 'bg-white border-slate-300 text-slate-800'
              }`}
              title="Lọc theo tháng khởi công / ký hợp đồng"
            >
              <option value="all">📅 Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>

          {/* Lọc Theo Trạng Thái */}
          <div className="lg:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">⚡ Tất cả trạng thái</option>
              <option value="active">Đang thi công</option>
              <option value="accepted">Đã nghiệm thu</option>
              <option value="completed">Đã hoàn thành bàn giao</option>
              <option value="paused">Tạm dừng</option>
            </select>
          </div>
        </div>

        {/* Hàng lọc thứ 2: Gói thầu, Phụ lục HĐ, Sắp xếp */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Lọc Gói Thầu M&E */}
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500 max-w-xs"
            >
              <option value="all">Tất cả gói thầu M&E</option>
              {availablePackages.map((pkg) => (
                <option key={pkg} value={pkg}>{pkg}</option>
              ))}
            </select>

            {/* Lọc Phụ Lục HĐ (Theo yêu cầu: "dự án có thể có phụ lục hợp đồng") */}
            <select
              value={selectedAddendumFilter}
              onChange={(e) => setSelectedAddendumFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tất cả phụ lục HĐ</option>
              <option value="has_addendum">Có phụ lục HĐ</option>
              <option value="no_addendum">Chưa có phụ lục HĐ</option>
            </select>

            {/* Sắp Xếp */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="revenue_desc">Giá trị HĐ (Cao → Thấp)</option>
              <option value="revenue_asc">Giá trị HĐ (Thấp → Cao)</option>
              <option value="progress_desc">Tiến độ thi công (Cao → Thấp)</option>
            </select>

            {/* Nút xóa lọc nhanh */}
            {(selectedClient !== 'all' || selectedMonth !== 'all' || selectedStatus !== 'all' || selectedPackage !== 'all' || selectedAddendumFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClient('all');
                  setSelectedMonth('all');
                  setSelectedStatus('all');
                  setSelectedPackage('all');
                  setSelectedAddendumFilter('all');
                  setSearchTerm('');
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          <div className="text-slate-500 font-medium">
            Đang hiển thị <strong>{filteredProjects.length}</strong> / <strong>{projects.length}</strong> dự án
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. GIAO DIỆN CHÍNH: DẠNG BẢNG (TABLE VIEW) GIỐNG HÌNH ẢNH USER */}
      {/* ============================================================== */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#102742] text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-2.5 w-12 text-center">STT</th>
                  <th className="py-3 px-3 w-56">Công Trình &amp; Gói Thầu M&amp;E</th>
                  <th className="py-3 px-3 w-60">Chủ Đầu Tư &amp; Địa Điểm</th>
                  <th className="py-3 px-3 w-40">HĐ Sau Thuế &amp; Phụ Lục (PLHĐ)</th>
                  <th className="py-3 px-3 text-right w-36">Tổng Quyết Toán Sau PLHĐ</th>
                  <th className="py-3 px-3 text-right w-32">Đã Thu CĐT</th>
                  <th className="py-3 px-3 text-right w-36">Chi Phí &amp; Nhân Công</th>
                  <th className="py-3 px-3 text-center w-36">Tiến Độ Thi Công</th>
                  <th className="py-3 px-3 text-center w-28">Trạng Thái</th>
                  <th className="py-3 px-3 text-center w-24">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Building className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">Không tìm thấy dự án nào phù hợp với bộ lọc</p>
                      <p className="text-xs text-slate-400 mt-1">Thử xóa bộ lọc hoặc bấm "+ Thêm Dự Án Mới" để tạo hồ sơ công trình.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p, index) => {
                    const fin = getProjectFinances(p);
                    const progress = p.progressPercentage ?? 50;

                    return (
                      <tr key={p.id} className={`hover:bg-sky-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        {/* 1. STT */}
                        <td className="py-3 px-2.5 text-center font-bold text-slate-500 font-mono">
                          {index + 1}
                        </td>

                        {/* 2. CÔNG TRÌNH & GÓI THẦU M&E */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono font-bold text-[10.5px] px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                              {p.code}
                            </span>
                            {p.contractFileUrl && (
                              <a
                                href={p.contractFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300 hover:bg-emerald-100"
                                title={`Mở file hợp đồng CĐT: ${p.contractFileUrl}`}
                              >
                                <Link2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>File HĐ</span>
                                <ExternalLink className="w-2 h-2 opacity-60" />
                              </a>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 line-clamp-2 text-xs leading-snug" title={p.name}>
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span>{p.packageType || 'Tổng thầu Cơ Điện M&E toàn bộ'}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">Năm {p.year || 2026}</span>
                          </div>
                        </td>

                        {/* 3. CHỦ ĐẦU TƯ & ĐỊA ĐIỂM (Một khách hàng có nhiều dự án, bắt đầu từ KH) */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <button
                              type="button"
                              onClick={() => setSelectedClient(p.client)}
                              className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 hover:bg-sky-100 hover:text-sky-900 cursor-pointer"
                              title="Bấm để lọc toàn bộ dự án của khách hàng này"
                            >
                              {p.clientCode || 'KH-001'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedClient(p.client)}
                              className="font-bold text-slate-900 text-left hover:text-sky-700 hover:underline cursor-pointer line-clamp-1"
                              title={`Lọc tất cả dự án của ${p.client}`}
                            >
                              {p.client}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1" title={p.clientAddress || p.location}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{p.clientAddress || p.location}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            CHT: <strong className="text-slate-800">{p.manager}</strong>
                          </div>
                        </td>

                        {/* 4. HĐ SAU THUẾ & PHỤ LỤC (PLHĐ) */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-slate-900 text-xs">
                                {formatTy(fin.contractValueWithVat)}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                fin.vatRate > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                VAT {fin.vatRate}%
                              </span>
                            </div>
                            {fin.vatRate > 0 && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Chưa VAT: {formatTy(fin.originalValue)} (+{formatTy(fin.vatAmount)} VAT)
                              </div>
                            )}
                          </div>
                          <div className="mt-1">
                            {fin.addendumsCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => setActiveAddendumProject(p)}
                                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300 cursor-pointer transition-colors"
                                title="Xem và quản lý các phụ lục hợp đồng"
                              >
                                <FileText className="w-3 h-3 text-sky-600" />
                                <span>{fin.addendumsCount} PLHĐ (+{formatTy(fin.addendumTotal)})</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveAddendumProject(p)}
                                className="text-[10.5px] text-slate-400 hover:text-sky-600 hover:underline cursor-pointer italic"
                                title="Bấm để thêm phụ lục hợp đồng phát sinh"
                              >
                                Chưa có PLHĐ (+)
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 5. TỔNG QUYẾT TOÁN SAU PLHĐ */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            {formatTy(fin.totalAfterPLHD)}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {formatVND(fin.totalAfterPLHD)}
                          </div>
                        </td>

                        {/* 6. ĐÃ THU CĐT */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-bold text-emerald-800 text-xs">
                            {formatTy(fin.collected)}
                          </div>
                          <div className="text-[10.5px] font-semibold text-emerald-700">
                            Đạt {fin.collectedPercentage.toFixed(0)}% HĐ
                          </div>
                        </td>

                        {/* 7. CHI PHÍ & NHÂN CÔNG (THEO YÊU CẦU: "và chi phí thu chi , nhân công theo dự án đó") */}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveFinancialProject(p)}
                            className="text-right hover:opacity-80 transition-opacity cursor-pointer group"
                            title="Bấm để xem sổ chi tiết thu - chi và chi phí nhân công"
                          >
                            <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 group-hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                              <Users className="w-3 h-3 text-purple-600" />
                              <span>NC: {formatTy(fin.labor)}</span>
                            </div>
                            <div className="text-[10.5px] text-slate-500 mt-0.5 font-mono">
                              Tổng chi: <strong className="text-rose-700">{formatTy(fin.totalSpent)}</strong>
                            </div>
                          </button>
                        </td>

                        {/* 8. TIẾN ĐỘ THI CÔNG */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-slate-700">
                            <span>{progress}%</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Đến {p.endDate ? formatDateVN(p.endDate) : '30/12/2026'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </td>

                        {/* 9. TRẠNG THÁI */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : p.status === 'accepted'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : p.status === 'paused'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {p.status === 'completed' ? 'Hoàn thành' : p.status === 'accepted' ? 'Nghiệm thu' : p.status === 'paused' ? 'Tạm dừng' : 'Đang thi công'}
                            </span>
                          </span>
                        </td>

                        {/* 10. THAO TÁC */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Nút Hồ sơ phụ lục */}
                            <button
                              type="button"
                              onClick={() => setActiveAddendumProject(p)}
                              className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer"
                              title="Hồ sơ & Phụ lục hợp đồng (PLHĐ)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Báo cáo thu chi & nhân công */}
                            <button
                              type="button"
                              onClick={() => setActiveFinancialProject(p)}
                              className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                              title="Xem chi tiết thu chi & nhân công"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Sửa */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditProject(p)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin dự án"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Xóa */}
                            {onDeleteProject && (
                              <button
                                type="button"
                                onClick={() => handleDelete(p)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Xóa dự án này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 6. GIAO DIỆN PHỤ: DẠNG THẺ KHỐI (GRID CARDS)                   */
        /* ============================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const fin = getProjectFinances(p);
            const progress = p.progressPercentage ?? 50;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-300">
                      {p.code}
                    </span>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      p.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'accepted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{p.status === 'completed' ? 'Hoàn thành' : p.status === 'accepted' ? 'Nghiệm thu' : 'Đang thi công'}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-2 line-clamp-2" title={p.name}>
                    {p.name}
                  </h3>

                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-bold">
                      {p.clientCode || 'KH-001'}
                    </span>
                    <strong className="text-slate-800 truncate">{p.client}</strong>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>

                  {/* Financial Grid */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500">Giá trị HĐ sau VAT:</span>
                      <span className="font-bold text-slate-800 font-mono text-right">
                        {formatVND(fin.contractValueWithVat)}
                        {fin.vatRate > 0 && <span className="text-[10px] text-blue-600 font-semibold ml-1">(VAT {fin.vatRate}%)</span>}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Tổng quyết toán sau PLHĐ:</span>
                      <span className="font-black text-slate-900 font-mono">{formatVND(fin.totalAfterPLHD)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Đã thu từ CĐT:</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {formatVND(fin.collected)} ({fin.collectedPercentage.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="flex justify-between text-purple-800 font-semibold bg-purple-50 px-2 py-1 rounded">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Chi phí Nhân công:</span>
                      </span>
                      <span className="font-bold font-mono">{formatVND(fin.labor)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Tổng chi tại site:</span>
                      <span className="font-bold text-rose-700 font-mono">{formatVND(fin.totalSpent)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Tiến độ thi công</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveAddendumProject(p)}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold border border-sky-200 cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{fin.addendumsCount} PLHĐ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveFinancialProject(p)}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 font-bold border border-purple-200 cursor-pointer flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3" />
                      <span>Thu - Chi</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProject(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                      title="Sửa dự án"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteProject && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Xóa dự án"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL THÊM / CHỈNH SỬA DỰ ÁN (BẮT ĐẦU TỪ KHÁCH HÀNG)        */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-400" />
                <span>{editingProject ? 'Chỉnh Sửa Hồ Sơ Dự Án Thi Công' : 'Thêm Dự Án Thi Công Mới (Khởi Tạo Từ Khách Hàng)'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* KHỐI 1: CHỦ ĐẦU TƯ / KHÁCH HÀNG (YÊU CẦU: DỰ ÁN BẮT ĐẦU TỪ DANH SÁCH KHÁCH HÀNG) */}
              <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-black text-sky-950 uppercase flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>1. Khách Hàng / Chủ Đầu Tư (Bắt Buộc) <span className="text-rose-500">*</span></span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowQuickAddClient(!showQuickAddClient)}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Thêm khách hàng mới</span>
                  </button>
                </div>

                {/* Dropdown chọn khách hàng */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <select
                      value={formClient}
                      onChange={(e) => handleSelectCustomerInForm(e.target.value)}
                      required
                      className="w-full py-2 px-3 border border-sky-300 rounded-lg bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- Chọn khách hàng / chủ đầu tư --</option>
                      {unifiedCustomers.map((c) => (
                        <option key={c.name} value={c.name}>
                          [{c.code}] {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={formClientCode}
                      onChange={(e) => setFormClientCode(e.target.value)}
                      placeholder="Mã KH (KH-002)"
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white font-mono font-bold uppercase text-xs"
                    />
                  </div>
                </div>

                {/* Form con thêm nhanh khách hàng mới */}
                {showQuickAddClient && (
                  <div className="p-3 bg-white rounded-lg border border-sky-300 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 text-[11px]">Tạo nhanh Chủ đầu tư / Khách hàng mới:</span>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Tên đầy đủ công ty / chủ đầu tư"
                      className="w-full py-1.5 px-2.5 border rounded"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newClientAddress}
                        onChange={(e) => setNewClientAddress(e.target.value)}
                        placeholder="Địa chỉ trụ sở"
                        className="py-1.5 px-2.5 border rounded"
                      />
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="Số điện thoại / Hotline"
                        className="py-1.5 px-2.5 border rounded"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowQuickAddClient(false)}
                        className="px-2.5 py-1 text-slate-500 hover:text-slate-800"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveQuickClient}
                        className="px-3 py-1 bg-sky-600 text-white rounded font-bold"
                      >
                        Lưu Khách Hàng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 2: THÔNG TIN DỰ ÁN */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mã Dự Án</label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      required
                      placeholder="PNC-DA01"
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">Tên Dự Án / Công Trình Thi Công <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      placeholder="VD: Thi Công Hệ Thống PCCC - Coherent Vsip 3"
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gói Thầu M&amp;E</label>
                    <select
                      value={formPackageType}
                      onChange={(e) => setFormPackageType(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Tổng thầu Cơ Điện M&E toàn bộ">Tổng thầu Cơ Điện M&E toàn bộ</option>
                      <option value="Hệ thống PCCC">Hệ thống PCCC</option>
                      <option value="Hệ thống Điện & Trạm biến áp">Hệ thống Điện & Trạm biến áp</option>
                      <option value="Cấp thoát nước & HVAC">Cấp thoát nước & HVAC</option>
                      <option value="Thực hiện hồ sơ cấp phép xây dựng">Thực hiện hồ sơ cấp phép xây dựng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Năm Thực Hiện</label>
                    <input
                      type="number"
                      value={formYear}
                      onChange={(e) => setFormYear(Number(e.target.value))}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Chỉ Huy Trưởng Site</label>
                    <input
                      type="text"
                      value={formManager}
                      onChange={(e) => setFormManager(e.target.value)}
                      placeholder="Trần Anh Minh"
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Địa Điểm Công Trường</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="KCN VSIP 3, Tân Uyên, Bình Dương"
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày Khởi Công</label>
                      <input
                        type="date"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full py-2 px-2.5 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày Bàn Giao</label>
                      <input
                        type="date"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full py-2 px-2.5 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: HỢP ĐỒNG, DỰ TOÁN & NHÂN CÔNG */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 uppercase text-[11px] block">
                    3. Hợp Đồng, Ngân Sách Dự Toán &amp; Chi Phí Nhân Công
                  </span>
                  <span className="text-[10px] text-sky-800 font-bold bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300">
                    Tự động tính thuế &amp; tổng giá trị sau VAT
                  </span>
                </div>

                {/* Hàng 1: HĐ Gốc, Thuế suất VAT, Tiền thuế VAT, Tổng giá trị HĐ sau VAT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Giá Trị HĐ Gốc (Chưa VAT) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formOriginalContractValue || ''}
                      onChange={(e) => setFormOriginalContractValue(Number(e.target.value))}
                      required
                      placeholder="Nhập giá trị trước VAT..."
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold bg-white focus:ring-2 focus:ring-sky-500"
                    />
                    <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                      = {formatVND(formOriginalContractValue)}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thuế Suất VAT</label>
                    <select
                      value={formVatRate}
                      onChange={(e) => setFormVatRate(Number(e.target.value))}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white font-bold focus:ring-2 focus:ring-sky-500"
                    >
                      <option value={0}>VAT 0% (Không thuế)</option>
                      <option value={8}>VAT 8% (Nghị định 72)</option>
                      <option value={10}>VAT 10% (Chuẩn)</option>
                    </select>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {formVatRate > 0 ? `Áp dụng thuế suất ${formVatRate}%` : 'Không tính thuế VAT'}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tiền Thuế VAT (VNĐ)</label>
                    <div className="w-full py-2 px-3 border border-rose-200 bg-rose-50/70 rounded-lg font-mono font-bold text-rose-700 text-xs flex items-center justify-between">
                      <span>{formatVND(formVatAmount)}</span>
                      {formVatRate > 0 && <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-rose-200 font-bold">{formVatRate}%</span>}
                    </div>
                    <div className="text-[10px] text-rose-600 mt-1">
                      {formVatRate > 0 ? `Tiền thuế VAT tương ứng` : '0 đ (Miễn thuế)'}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-800 mb-1 flex items-center justify-between">
                      <span>Tổng Giá Trị HĐ Sau VAT</span>
                      <span className="text-[9.5px] text-emerald-600 font-normal">Có VAT</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formTotalContractValueWithVat || ''}
                      onChange={(e) => handleTotalWithVatChange(Number(e.target.value))}
                      placeholder="Tổng tiền đã gồm VAT..."
                      className="w-full py-2 px-3 border-2 border-emerald-400 bg-emerald-50 rounded-lg font-mono font-black text-emerald-900 text-xs focus:ring-2 focus:ring-emerald-600"
                    />
                    <div className="text-[10px] font-mono text-emerald-800 font-bold mt-1 truncate">
                      = {formatVND(formTotalContractValueWithVat)}
                    </div>
                  </div>
                </div>

                {/* Banner phân rã chi tiết Hợp đồng trước VAT, Thuế VAT, và Tổng thanh toán sau VAT */}
                <div className="p-3 bg-gradient-to-r from-sky-50 via-emerald-50 to-teal-50 rounded-xl border border-sky-300 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shadow-2xs">
                  <div>
                    <span className="text-slate-500 block text-[10.5px]">1. Giá trị HĐ gốc (Chưa VAT):</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{formatVND(formOriginalContractValue)}</span>
                  </div>
                  <div>
                    <span className="text-rose-600 block text-[10.5px]">2. Tiền thuế VAT ({formVatRate}%):</span>
                    <span className="font-mono font-bold text-rose-600 text-sm">+{formatVND(formVatAmount)}</span>
                  </div>
                  <div className="sm:border-l sm:border-slate-300 sm:pl-3">
                    <span className="text-emerald-800 block text-[10.5px] font-black uppercase tracking-wider">3. TỔNG GIÁ TRỊ HỢP ĐỒNG SAU VAT:</span>
                    <span className="font-mono font-black text-emerald-800 text-base">{formatVND(formTotalContractValueWithVat)}</span>
                  </div>
                </div>

                {/* Ô LINK HỢP ĐỒNG KINH TẾ CĐT (GOOGLE DRIVE / SCAN PDF) */}
                <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-sky-950 text-xs flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-sky-600" />
                      <span>Link Hợp Đồng CĐT (Google Drive / OneDrive / Scan PDF):</span>
                    </label>
                    {formContractFileUrl.trim() && (
                      <a
                        href={formContractFileUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Mở xem thử link</span>
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formContractFileUrl}
                    onChange={(e) => setFormContractFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... hoặc link lưu trữ cloud hợp đồng gốc"
                    className="w-full py-2 px-3 border border-sky-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    💡 Dán đường dẫn Google Drive hoặc link file PDF scan hợp đồng ký với Chủ Đầu Tư để toàn công ty có thể tra cứu nhanh.
                  </p>
                </div>

                {/* Hàng 2: Đã thu CĐT, Dự toán nhân công, Dự toán vật tư, Tổng ngân sách */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Đã Thu CĐT (Tạm Ứng)</label>
                    <input
                      type="number"
                      step="any"
                      value={formCurrentAdvance || ''}
                      onChange={(e) => setFormCurrentAdvance(Number(e.target.value))}
                      className="w-full py-2 px-3 border border-emerald-300 bg-emerald-50 rounded-lg font-mono font-bold text-emerald-800"
                    />
                    <div className="text-[10px] font-mono text-emerald-700 mt-1 truncate">
                      = {formatVND(formCurrentAdvance)}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dự Toán Nhân Công (VNĐ)</label>
                    <input
                      type="number"
                      step="any"
                      value={formLaborBudget || ''}
                      onChange={(e) => setFormLaborBudget(Number(e.target.value))}
                      placeholder="VD: 4.200.000.000"
                      className="w-full py-2 px-3 border border-purple-300 bg-purple-50 rounded-lg font-mono font-bold text-purple-900"
                    />
                    <div className="text-[10px] font-mono text-purple-700 mt-1 truncate">
                      = {formatVND(formLaborBudget)}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dự Toán Vật Tư (VNĐ)</label>
                    <input
                      type="number"
                      step="any"
                      value={formMaterialBudget || ''}
                      onChange={(e) => setFormMaterialBudget(Number(e.target.value))}
                      placeholder="VD: 13.500.000.000"
                      className="w-full py-2 px-3 border border-blue-300 bg-blue-50 rounded-lg font-mono font-bold text-blue-900"
                    />
                    <div className="text-[10px] font-mono text-blue-700 mt-1 truncate">
                      = {formatVND(formMaterialBudget)}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tổng Ngân Sách Dự Toán</label>
                    <input
                      type="number"
                      step="any"
                      value={formTotalBudget || ''}
                      onChange={(e) => setFormTotalBudget(Number(e.target.value))}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                    />
                    <div className="text-[10px] font-mono text-slate-600 mt-1 truncate">
                      = {formatVND(formTotalBudget)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trạng Thái Thi Công</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white font-bold"
                    >
                      <option value="active">Đang thi công</option>
                      <option value="accepted">Đã nghiệm thu</option>
                      <option value="completed">Đã hoàn thành bàn giao</option>
                      <option value="paused">Tạm dừng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tiến Độ Thi Công (%: {formProgressPercentage}%)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formProgressPercentage}
                      onChange={(e) => setFormProgressPercentage(Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-sky-700 hover:bg-sky-600 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingProject ? 'Lưu Thay Đổi' : 'Tạo Dự Án Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL HỒ SƠ & PHỤ LỤC HỢP ĐỒNG (PLHĐ)                       */}
      {/* ============================================================== */}
      {activeAddendumProject && (
        <ProjectAddendumsModal
          project={activeAddendumProject}
          isOpen={Boolean(activeAddendumProject)}
          onClose={() => setActiveAddendumProject(null)}
          onUpdateProject={handleUpdateProjectAddendums}
        />
      )}

      {/* ============================================================== */}
      {/* 9. MODAL BÁO CÁO THU - CHI & CHI PHÍ NHÂN CÔNG DỰ ÁN           */}
      {/* ============================================================== */}
      {activeFinancialProject && (
        <ProjectFinancialModal
          project={activeFinancialProject}
          expenses={expenses}
          isOpen={Boolean(activeFinancialProject)}
          onClose={() => setActiveFinancialProject(null)}
          onAddExpense={onAddExpense}
        />
      )}
    </div>
  );
};
