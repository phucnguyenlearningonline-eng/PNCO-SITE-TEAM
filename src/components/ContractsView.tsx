import React, { useState, useMemo } from 'react';
import { 
  FileSignature, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Printer, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  TrendingUp, 
  Percent, 
  Trash2, 
  Check, 
  X,
  CreditCard,
  Building2,
  Package,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { ExpenseItem, Project, User, ContractPaymentStage } from '../types';
import { formatVND, formatDateVN } from '../utils/formatters';

interface ContractsViewProps {
  expenses: ExpenseItem[];
  projects: Project[];
  currentUser: User;
  onUpdateExpense: (updated: ExpenseItem) => void;
  onViewOrder: (item: ExpenseItem) => void;
  onEditOrder: (item: ExpenseItem) => void;
  onOpenCreateOrder: () => void;
}

// Các loại mốc thanh toán chuẩn trong xây dựng - cơ điện
type MilestoneType = 'advance' | 'stage_1' | 'stage_2' | 'stage_3' | 'final' | 'custom';

export const ContractsView: React.FC<ContractsViewProps> = ({
  expenses,
  projects,
  currentUser,
  onUpdateExpense,
  onViewOrder,
  onEditOrder,
  onOpenCreateOrder,
}) => {
  // Chỉ lọc các đơn hàng có hợp đồng kinh tế
  const contractExpenses = useMemo(() => {
    return expenses.filter((e) => Boolean(e.hasContract || e.contractNumber));
  }, [expenses]);

  // Bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending_advance' | 'in_progress' | 'completed'>('all');

  // Modal thêm / sửa mốc thanh toán
  const [activeContractForStage, setActiveContractForStage] = useState<ExpenseItem | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  
  const [stageType, setStageType] = useState<MilestoneType>('advance');
  const [stageTitle, setStageTitle] = useState('');
  const [stageAmount, setStageAmount] = useState<number>(0);
  const [stagePercentage, setStagePercentage] = useState<number>(30);
  const [stageDueDate, setStageDueDate] = useState('');
  const [stageStatus, setStageStatus] = useState<'pending' | 'paid'>('pending');
  const [stagePaymentMethod, setStagePaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [stageNotes, setStageNotes] = useState('');

  // Expand / collapse details for contracts
  const [expandedContractIds, setExpandedContractIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedContractIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper tính toán số tiền đã thanh toán của từng hợp đồng
  const getContractPaidInfo = (item: ExpenseItem) => {
    const totalContractValue = item.totalAmount;
    const stages = item.contractPaymentStages || [];

    let paidAmount = 0;
    if (stages.length > 0) {
      paidAmount = stages
        .filter((s) => s.status === 'paid')
        .reduce((sum, s) => sum + s.amount, 0);
    } else {
      paidAmount = item.contractAdvanceAmount || 0;
    }

    const remainingAmount = Math.max(0, totalContractValue - paidAmount);
    const paidPercentage = totalContractValue > 0 ? Math.round((paidAmount / totalContractValue) * 100) : 0;

    // Tổng số tiền đã phân bổ vào các mốc
    const allocatedAmount = stages.reduce((sum, s) => sum + s.amount, 0);
    const unallocatedAmount = Math.max(0, totalContractValue - allocatedAmount);

    let status: 'completed' | 'in_progress' | 'pending_advance' = 'pending_advance';
    if (paidAmount >= totalContractValue && totalContractValue > 0) {
      status = 'completed';
    } else if (paidAmount > 0) {
      status = 'in_progress';
    }

    return {
      totalContractValue,
      paidAmount,
      remainingAmount,
      paidPercentage,
      allocatedAmount,
      unallocatedAmount,
      status,
    };
  };

  // Lọc hợp đồng theo điều kiện tìm kiếm
  const filteredContracts = useMemo(() => {
    return contractExpenses.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.contractNumber && item.contractNumber.toLowerCase().includes(q)) ||
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q);

      const matchProject = selectedProjectId === 'all' || item.projectId === selectedProjectId;

      const { status } = getContractPaidInfo(item);
      const matchStatus =
        paymentStatusFilter === 'all' ||
        (paymentStatusFilter === 'completed' && status === 'completed') ||
        (paymentStatusFilter === 'in_progress' && status === 'in_progress') ||
        (paymentStatusFilter === 'pending_advance' && status === 'pending_advance');

      return matchSearch && matchProject && matchStatus;
    });
  }, [contractExpenses, searchTerm, selectedProjectId, paymentStatusFilter]);

  // Tổng hợp KPI toàn bộ hợp đồng
  const totalContractsCount = contractExpenses.length;
  const totalContractsValue = useMemo(() => {
    return contractExpenses.reduce((sum, c) => sum + c.totalAmount, 0);
  }, [contractExpenses]);

  const totalContractsPaid = useMemo(() => {
    return contractExpenses.reduce((sum, c) => {
      const { paidAmount } = getContractPaidInfo(c);
      return sum + paidAmount;
    }, 0);
  }, [contractExpenses]);

  const totalContractsRemaining = Math.max(0, totalContractsValue - totalContractsPaid);
  const overallPaymentRate = totalContractsValue > 0 ? Math.round((totalContractsPaid / totalContractsValue) * 100) : 0;

  // Chọn loại mốc (Tạm ứng, Lần 1, Lần 2, Lần 3, Tất toán)
  const handleSelectMilestonePreset = (type: MilestoneType, contract: ExpenseItem) => {
    setStageType(type);
    const { totalContractValue, allocatedAmount, unallocatedAmount } = getContractPaidInfo(contract);
    
    // Nếu là sửa mốc, lấy số còn lại cộng lại mốc hiện tại
    const existingStages = contract.contractPaymentStages || [];
    const currentEditingStage = editingStageId ? existingStages.find((s) => s.id === editingStageId) : null;
    const currentUnallocated = unallocatedAmount + (currentEditingStage ? currentEditingStage.amount : 0);

    let defaultTitle = '';
    let defaultPct = 30;
    let defaultAmt = 0;
    let defaultNotes = '';

    switch (type) {
      case 'advance':
        defaultTitle = 'Tạm ứng hợp đồng';
        defaultPct = 30;
        defaultAmt = Math.round(totalContractValue * 0.3);
        defaultNotes = 'Tạm ứng ban đầu sau khi ký kết hợp đồng kinh tế';
        break;
      case 'stage_1':
        defaultTitle = 'Thanh toán Lần 1 (Giao hàng đợt 1)';
        defaultPct = 40;
        defaultAmt = Math.round(totalContractValue * 0.4);
        defaultNotes = 'Thanh toán sau khi giao đợt 1 và ký biên bản giao nhận vật tư';
        break;
      case 'stage_2':
        defaultTitle = 'Thanh toán Lần 2 (Giao hàng đợt 2)';
        defaultPct = 20;
        defaultAmt = Math.round(totalContractValue * 0.2);
        defaultNotes = 'Thanh toán sau khi giao đủ 100% hàng hóa và kiểm tra đạt chuẩn';
        break;
      case 'stage_3':
        defaultTitle = 'Thanh toán Lần 3 (Tiến độ lắp đặt)';
        defaultPct = 10;
        defaultAmt = Math.round(totalContractValue * 0.1);
        defaultNotes = 'Thanh toán theo tiến độ thi công nghiệm thu tại công trình';
        break;
      case 'final':
        defaultTitle = 'Tất toán hợp đồng (Quyết toán)';
        // Tự động lấy toàn bộ số tiền còn lại chưa phân bổ
        defaultAmt = currentUnallocated > 0 ? currentUnallocated : Math.round(totalContractValue * 0.1);
        defaultPct = totalContractValue > 0 ? Math.round((defaultAmt / totalContractValue) * 100) : 10;
        defaultNotes = 'Tất toán toàn bộ hợp đồng sau khi nghiệm thu, bàn giao CO/CQ và hóa đơn VAT';
        break;
      default:
        defaultTitle = `Thanh toán đợt ${existingStages.length + 1}`;
        defaultPct = 20;
        defaultAmt = Math.round(totalContractValue * 0.2);
        defaultNotes = '';
    }

    setStageTitle(defaultTitle);
    setStagePercentage(defaultPct);
    setStageAmount(defaultAmt);
    setStageNotes(defaultNotes);
  };

  // Mở modal thêm mốc mới
  const handleOpenAddStage = (contract: ExpenseItem, presetType: MilestoneType = 'advance') => {
    setActiveContractForStage(contract);
    setEditingStageId(null);
    const existingStages = contract.contractPaymentStages || [];
    
    // Tự động nhận diện mốc tiếp theo nếu chưa chọn
    let targetType = presetType;
    if (existingStages.length === 0) {
      targetType = 'advance';
    } else if (existingStages.length === 1) {
      targetType = 'stage_1';
    } else if (existingStages.length === 2) {
      targetType = 'stage_2';
    } else {
      targetType = 'final';
    }

    handleSelectMilestonePreset(targetType, contract);
    setStageDueDate(new Date().toISOString().split('T')[0]);
    setStageStatus('pending');
    setStagePaymentMethod('transfer');
    setIsStageModalOpen(true);
  };

  // Mở modal sửa mốc
  const handleOpenEditStage = (contract: ExpenseItem, stage: ContractPaymentStage) => {
    setActiveContractForStage(contract);
    setEditingStageId(stage.id);
    setStageTitle(stage.title);
    setStageAmount(stage.amount);
    setStagePercentage(stage.percentage || (contract.totalAmount > 0 ? Math.round((stage.amount / contract.totalAmount) * 100) : 0));
    setStageDueDate(stage.dueDate || stage.paidDate || new Date().toISOString().split('T')[0]);
    setStageStatus(stage.status);
    setStagePaymentMethod(stage.paymentMethod || 'transfer');
    setStageNotes(stage.notes || '');

    // Nhận diện stageType
    const titleLower = stage.title.toLowerCase();
    if (titleLower.includes('tạm ứng')) setStageType('advance');
    else if (titleLower.includes('lần 1') || titleLower.includes('đợt 1')) setStageType('stage_1');
    else if (titleLower.includes('lần 2') || titleLower.includes('đợt 2')) setStageType('stage_2');
    else if (titleLower.includes('lần 3') || titleLower.includes('đợt 3')) setStageType('stage_3');
    else if (titleLower.includes('tất toán') || titleLower.includes('quyết toán')) setStageType('final');
    else setStageType('custom');

    setIsStageModalOpen(true);
  };

  // Tạo bộ 4 mốc chuẩn tự động: Tạm ứng (30%) → Lần 1 (40%) → Lần 2 (20%) → Tất toán (10%)
  const handleCreateStandardMilestones = (contract: ExpenseItem) => {
    const total = contract.totalAmount;
    const today = new Date().toISOString().split('T')[0];

    const advanceAmt = Math.round(total * 0.3);
    const stage1Amt = Math.round(total * 0.4);
    const stage2Amt = Math.round(total * 0.2);
    const finalAmt = Math.max(0, total - advanceAmt - stage1Amt - stage2Amt);

    const standardStages: ContractPaymentStage[] = [
      {
        id: `stg-${Date.now()}-1`,
        stageNumber: 1,
        title: 'Tạm ứng hợp đồng (30%)',
        percentage: 30,
        amount: advanceAmt,
        dueDate: today,
        paidDate: today,
        status: 'paid', // Tạm ứng thường được chi trước
        paymentMethod: 'transfer',
        notes: 'Tạm ứng ban đầu sau khi ký hợp đồng kinh tế',
      },
      {
        id: `stg-${Date.now()}-2`,
        stageNumber: 2,
        title: 'Thanh toán Lần 1 (Giao hàng đợt 1 - 40%)',
        percentage: 40,
        amount: stage1Amt,
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Thanh toán sau khi giao hàng đợt 1 và kiểm đếm',
      },
      {
        id: `stg-${Date.now()}-3`,
        stageNumber: 3,
        title: 'Thanh toán Lần 2 (Giao đủ 100% hàng - 20%)',
        percentage: 20,
        amount: stage2Amt,
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Thanh toán sau khi giao đủ toàn bộ hàng hóa công trình',
      },
      {
        id: `stg-${Date.now()}-4`,
        stageNumber: 4,
        title: 'Tất toán hợp đồng & Quyết toán (10%)',
        percentage: 10,
        amount: finalAmt,
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Tất toán hợp đồng sau khi nghiệm thu, bàn giao hóa đơn VAT và CO/CQ',
      },
    ];

    const updatedContract: ExpenseItem = {
      ...contract,
      contractPaymentStages: standardStages,
    };

    onUpdateExpense(updatedContract);
  };

  // Lưu mốc thanh toán (Thêm mới hoặc Sửa)
  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContractForStage || stageAmount <= 0) return;

    const existingStages: ContractPaymentStage[] = activeContractForStage.contractPaymentStages || [];
    let updatedStages: ContractPaymentStage[] = [];

    if (editingStageId) {
      // Đang sửa
      updatedStages = existingStages.map((s) => {
        if (s.id === editingStageId) {
          return {
            ...s,
            title: stageTitle.trim(),
            percentage: stagePercentage,
            amount: stageAmount,
            dueDate: stageDueDate,
            paidDate: stageStatus === 'paid' ? (s.paidDate || stageDueDate || new Date().toISOString().split('T')[0]) : undefined,
            status: stageStatus,
            paymentMethod: stagePaymentMethod,
            notes: stageNotes.trim() || undefined,
          };
        }
        return s;
      });
    } else {
      // Thêm mới
      const newStage: ContractPaymentStage = {
        id: `stage-${Date.now()}`,
        stageNumber: existingStages.length + 1,
        title: stageTitle.trim() || `Thanh toán đợt ${existingStages.length + 1}`,
        percentage: stagePercentage,
        amount: stageAmount,
        dueDate: stageDueDate || new Date().toISOString().split('T')[0],
        paidDate: stageStatus === 'paid' ? (stageDueDate || new Date().toISOString().split('T')[0]) : undefined,
        status: stageStatus,
        paymentMethod: stagePaymentMethod,
        notes: stageNotes.trim() || undefined,
      };
      updatedStages = [...existingStages, newStage];
    }

    const updatedContract: ExpenseItem = {
      ...activeContractForStage,
      contractPaymentStages: updatedStages,
    };

    onUpdateExpense(updatedContract);
    setIsStageModalOpen(false);
    setActiveContractForStage(null);
    setEditingStageId(null);
  };

  // Toggle trạng thái Đã thanh toán / Chờ thanh toán của 1 mốc
  const handleToggleStageStatus = (contract: ExpenseItem, stageId: string) => {
    const existingStages = contract.contractPaymentStages || [];
    const updatedStages = existingStages.map((s) => {
      if (s.id === stageId) {
        const nextStatus = s.status === 'paid' ? 'pending' : 'paid';
        return {
          ...s,
          status: nextStatus as 'pending' | 'paid',
          paidDate: nextStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return s;
    });

    const updatedContract: ExpenseItem = {
      ...contract,
      contractPaymentStages: updatedStages,
    };

    onUpdateExpense(updatedContract);
  };

  // Xóa một mốc thanh toán
  const handleDeleteStage = (contract: ExpenseItem, stageId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mốc thanh toán này khỏi hợp đồng?')) return;
    const existingStages = contract.contractPaymentStages || [];
    const updatedStages = existingStages.filter((s) => s.id !== stageId);

    const updatedContract: ExpenseItem = {
      ...contract,
      contractPaymentStages: updatedStages,
    };

    onUpdateExpense(updatedContract);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ============================================================== */}
      {/* TOP KPI CARDS: TỔNG QUAN HỢP ĐỒNG KINH TẾ                       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số HĐ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Hợp Đồng Kinh Tế</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalContractsCount} <span className="text-xs font-semibold text-slate-500">Hợp đồng</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Đơn hàng lớn quản lý theo tiến độ mốc
          </p>
        </div>

        {/* Card 2: Tổng giá trị HĐ (Số tiền tổng lớn rõ nét) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Tổng Giá Trị Hợp Đồng</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-900 truncate">
            {formatVND(totalContractsValue)}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Số tiền tổng toàn bộ hợp đồng (Đã gồm VAT)
          </p>
        </div>

        {/* Card 3: Đã giải ngân (Tạm ứng & các đợt đã chi) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Đã Thanh Toán (Các Mốc)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 truncate">
            {formatVND(totalContractsPaid)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="font-bold text-blue-800">{overallPaymentRate}%</span>
            <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, overallPaymentRate)}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Dư nợ còn lại cần chi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Dư Nợ Còn Cần Chi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 truncate">
            {formatVND(totalContractsRemaining)}
          </div>
          <p className="text-[11px] text-slate-500">
            Chờ nghiệm thu và tất toán hợp đồng
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FILTER & ACTIONS BAR                                            */}
      {/* ============================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo số HĐ, mã đơn hàng, nhà cung cấp, dự án..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Project */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">🏢 Tất cả dự án thi công</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Filter by Payment status */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">⚡ Tất cả trạng thái thanh toán</option>
              <option value="pending_advance">Chờ tạm ứng ban đầu</option>
              <option value="in_progress">Đang thanh toán các mốc</option>
              <option value="completed">Đã tất toán 100% hợp đồng</option>
            </select>

            <button
              onClick={onOpenCreateOrder}
              className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đơn Hàng Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DANH SÁCH HỢP ĐỒNG KINH TẾ & QUẢN LÝ CÁC MỐC THANH TOÁN         */}
      {/* ============================================================== */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileSignature className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Chưa có hợp đồng nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Chỉ những đơn hàng mua vật tư (PO) được tích chọn ô{' '}
            <strong>"Hợp Đồng Kinh Tế (Đơn hàng lớn)"</strong> và có số hợp đồng mới được hiển thị tại tab này để tạo các mốc thanh toán.
          </p>
          <button
            onClick={onOpenCreateOrder}
            className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Đơn Hàng Có Hợp Đồng Ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const { totalContractValue, paidAmount, remainingAmount, paidPercentage, allocatedAmount, unallocatedAmount, status } = getContractPaidInfo(contract);
            const isExpanded = expandedContractIds[contract.id] ?? true;
            const stages = contract.contractPaymentStages || [];

            return (
              <div
                key={contract.id}
                className="bg-white rounded-xl border-2 border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-sky-400"
              >
                {/* Header Card Hợp Đồng */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-sky-50/30 border-b border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Thông tin số HĐ & Tên NCC */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-sky-950 bg-sky-100 border border-sky-300 px-3 py-1 rounded shadow-2xs">
                          {contract.contractNumber || `HĐ-${contract.code.replace(/\s+/g, '')}/PN-2026`}
                        </span>

                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Đơn PO: {contract.code}
                        </span>

                        {status === 'completed' ? (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            Đã Tất Toán 100%
                          </span>
                        ) : status === 'in_progress' ? (
                          <span className="text-[11px] font-bold text-blue-800 bg-blue-100/80 border border-blue-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                            Đang Chi Theo Mốc ({paidPercentage}%)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            Chờ Tạm Ứng Đợt 1
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
                        <span className="text-slate-500 font-normal">Nhà Cung Cấp:</span>
                        <strong className="text-sky-950">{contract.supplier}</strong>
                      </h4>

                      <div className="text-xs text-slate-600 flex items-center gap-4 flex-wrap">
                        <span>Dự án thi công: <strong className="text-slate-900">{contract.projectName}</strong></span>
                        <span>Ngày lập: <strong>{formatDateVN(contract.contractDate || contract.date)}</strong></span>
                        <span>Người phụ trách: <strong>{contract.createdByName}</strong></span>
                      </div>
                    </div>

                    {/* Khối THỂ HIỆN SỐ TIỀN TỔNG HỢP ĐỒNG (THEO YÊU CẦU NỔI BẬT) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div>
                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                          SỐ TIỀN TỔNG HỢP ĐỒNG
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800">
                          {formatVND(totalContractValue)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Đã bao gồm thuế VAT</div>
                      </div>

                      <div className="sm:border-l sm:border-slate-200 sm:pl-4 space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Tiến Độ Thanh Toán</div>
                        <div className="text-xs font-mono font-bold text-blue-700">
                          Đã chi: {formatVND(paidAmount)} ({paidPercentage}%)
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-700">
                          Còn lại: {formatVND(remainingAmount)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
                        <button
                          onClick={() => onViewOrder(contract)}
                          className="p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer"
                          title="Xem chi tiết đơn hàng & In PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditOrder(contract)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin đơn hàng / hợp đồng"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleExpand(contract.id)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title={isExpanded ? 'Thu gọn các mốc' : 'Mở rộng các mốc'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Thanh Progress Bar */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <span className="font-medium">Tiến độ giải ngân theo các mốc:</span>
                      <span className="font-mono font-bold text-slate-900">{paidPercentage}% hoàn thành ({stages.filter((s) => s.status === 'paid').length}/{stages.length} mốc)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          paidPercentage >= 100
                            ? 'bg-emerald-500'
                            : paidPercentage > 50
                            ? 'bg-blue-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, paidPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Danh Sách Các Mốc Thanh Toán: Tạm ứng, Lần 1, Lần 2, ..., Tất toán */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-white space-y-4">
                    {/* Header mốc & Các nút tạo mốc nhanh */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-sky-600" />
                          <span>CÁC MỐC THANH TOÁN (TẠM ỨNG, LẦN 1, LẦN 2, TẤT TOÁN)</span>
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tổng HĐ: <strong className="font-mono text-slate-800">{formatVND(totalContractValue)}</strong> • 
                          Đã phân bổ mốc: <strong className="font-mono text-sky-800">{formatVND(allocatedAmount)}</strong>
                          {unallocatedAmount > 0 && (
                            <span className="text-amber-700 ml-1.5 font-bold">
                              (Chưa phân bổ: {formatVND(unallocatedAmount)})
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Các nút thêm mốc */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {stages.length === 0 && (
                          <button
                            onClick={() => handleCreateStandardMilestones(contract)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Tự động tạo 4 mốc: Tạm ứng (30%) → Lần 1 (40%) → Lần 2 (20%) → Tất toán (10%)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tạo 4 Mốc Chuẩn Tự Động</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenAddStage(contract)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Thêm Mốc Thanh Toán</span>
                        </button>
                      </div>
                    </div>

                    {/* Nếu chưa có mốc nào */}
                    {stages.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">Chưa có mốc thanh toán nào cho hợp đồng này</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Bạn có thể tạo nhanh bộ 4 mốc chuẩn (Tạm ứng 30% → Lần 1 40% → Lần 2 20% → Tất toán 10%) hoặc tự thêm mốc theo nhu cầu.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            onClick={() => handleCreateStandardMilestones(contract)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Tạo Bộ 4 Mốc Chuẩn Ngay</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddStage(contract, 'advance')}
                            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-500" />
                            <span>Tự Thêm Mốc Tạm Ứng</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Milestone Timeline Cards (Trực quan các mốc) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {stages.map((stage, idx) => {
                            const isPaid = stage.status === 'paid';
                            return (
                              <div
                                key={stage.id}
                                className={`p-3 rounded-lg border text-xs transition-all relative ${
                                  isPaid
                                    ? 'bg-emerald-50/40 border-emerald-300'
                                    : 'bg-slate-50/70 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                    isPaid ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    Mốc #{idx + 1}
                                  </span>

                                  <button
                                    onClick={() => handleToggleStageStatus(contract, stage.id)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 transition-all cursor-pointer ${
                                      isPaid
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                        : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                    }`}
                                    title="Bấm để chuyển trạng thái"
                                  >
                                    {isPaid ? (
                                      <>
                                        <Check className="w-2.5 h-2.5 text-emerald-700" />
                                        <span>Đã TT</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-2.5 h-2.5 text-amber-700" />
                                        <span>Chờ TT</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="font-bold text-slate-900 truncate" title={stage.title}>
                                  {stage.title}
                                </div>

                                <div className="text-sm font-black font-mono text-slate-900 mt-1">
                                  {formatVND(stage.amount)}{' '}
                                  {stage.percentage && (
                                    <span className="text-[10px] font-semibold text-slate-500 font-sans">
                                      ({stage.percentage}%)
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                                  <span>{isPaid && stage.paidDate ? formatDateVN(stage.paidDate) : formatDateVN(stage.dueDate || '')}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleOpenEditStage(contract, stage)}
                                      className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer"
                                      title="Sửa mốc này"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStage(contract, stage.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                      title="Xóa mốc này"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bảng Kê Chi Tiết Các Mốc */}
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3 w-14 text-center">Mốc</th>
                                <th className="py-2.5 px-3">Tên Mốc Thanh Toán &amp; Điều Kiện Giải Ngân</th>
                                <th className="py-2.5 px-3 w-20 text-center">% HĐ</th>
                                <th className="py-2.5 px-3 w-32 text-right">Số Tiền (VNĐ)</th>
                                <th className="py-2.5 px-3 w-28 text-center">Ngày Thực Hiện</th>
                                <th className="py-2.5 px-3 w-32 text-center">Trạng Thái</th>
                                <th className="py-2.5 px-3 w-24 text-center">Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {stages.map((stage, idx) => (
                                <tr
                                  key={stage.id}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    stage.status === 'paid' ? 'bg-emerald-50/20' : 'bg-white'
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 font-mono">
                                    #{idx + 1}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900">{stage.title}</div>
                                    {stage.notes && (
                                      <div className="text-[11px] text-slate-500 mt-0.5">{stage.notes}</div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">
                                    {stage.percentage ? `${stage.percentage}%` : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                                    {formatVND(stage.amount)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                                    {stage.status === 'paid' && stage.paidDate
                                      ? formatDateVN(stage.paidDate)
                                      : stage.dueDate
                                      ? formatDateVN(stage.dueDate)
                                      : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => handleToggleStageStatus(contract, stage.id)}
                                      className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border inline-flex items-center gap-1 transition-all cursor-pointer ${
                                        stage.status === 'paid'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                          : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                      }`}
                                      title="Bấm để chuyển đổi trạng thái Đã thanh toán / Chờ thanh toán"
                                    >
                                      {stage.status === 'paid' ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-700" />
                                          <span>Đã Thanh Toán</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3 text-amber-700" />
                                          <span>Chờ Thanh Toán</span>
                                        </>
                                      )}
                                    </button>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditStage(contract, stage)}
                                        className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                                        title="Chỉnh sửa mốc này"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteStage(contract, stage.id)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Xóa mốc thanh toán này"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL THÊM / CẬP NHẬT MỐC THANH TOÁN (TẠM ỨNG, LẦN 1, TẤT TOÁN) */}
      {/* ============================================================== */}
      {isStageModalOpen && activeContractForStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#102742] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-400" />
                <h4 className="font-bold text-sm uppercase">
                  {editingStageId ? 'Cập Nhật Mốc Thanh Toán' : 'Thêm Mốc Thanh Toán Mới'}
                </h4>
              </div>
              <button
                onClick={() => {
                  setIsStageModalOpen(false);
                  setActiveContractForStage(null);
                  setEditingStageId(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="p-5 space-y-3.5 text-xs">
              <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 text-[11px] text-sky-950 space-y-1">
                <div>Hợp đồng: <strong>{activeContractForStage.contractNumber || activeContractForStage.code}</strong></div>
                <div>Nhà cung cấp: <strong>{activeContractForStage.supplier}</strong></div>
                <div>Số tiền tổng HĐ: <strong className="font-mono text-sm text-emerald-900">{formatVND(activeContractForStage.totalAmount)}</strong></div>
              </div>

              {/* CHỌN NHANH LOẠI MỐC: TẠM ỨNG / LẦN 1 / LẦN 2 / LẦN 3 / TẤT TOÁN */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Chọn Loại Mốc Thanh Toán Chuẩn:
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectMilestonePreset('advance', activeContractForStage)}
                    className={`py-1.5 px-1 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      stageType === 'advance'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Tạm Ứng
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMilestonePreset('stage_1', activeContractForStage)}
                    className={`py-1.5 px-1 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      stageType === 'stage_1'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Lần 1
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMilestonePreset('stage_2', activeContractForStage)}
                    className={`py-1.5 px-1 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      stageType === 'stage_2'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Lần 2
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMilestonePreset('stage_3', activeContractForStage)}
                    className={`py-1.5 px-1 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      stageType === 'stage_3'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Lần 3
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMilestonePreset('final', activeContractForStage)}
                    className={`py-1.5 px-1 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      stageType === 'final'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    Tất Toán
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên Mốc Thanh Toán <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stageTitle}
                  onChange={(e) => setStageTitle(e.target.value)}
                  placeholder="VD: Tạm ứng hợp đồng / Thanh toán Lần 1 / Tất toán..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    % Tỷ Lệ Hợp Đồng
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={stagePercentage}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        setStagePercentage(pct);
                        setStageAmount(Math.round(activeContractForStage.totalAmount * (pct / 100)));
                      }}
                      className="w-full py-2 px-3 pr-7 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Số Tiền Thanh Toán (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={stageAmount}
                    onChange={(e) => setStageAmount(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Ngày Thanh Toán / Dự Kiến
                  </label>
                  <input
                    type="date"
                    value={stageDueDate}
                    onChange={(e) => setStageDueDate(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Trạng Thái Mốc
                  </label>
                  <select
                    value={stageStatus}
                    onChange={(e) => setStageStatus(e.target.value as any)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg font-bold bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="pending">⏳ Chờ thanh toán</option>
                    <option value="paid">✓ Đã thanh toán</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Hình Thức Chi Trả
                </label>
                <select
                  value={stagePaymentMethod}
                  onChange={(e) => setStagePaymentMethod(e.target.value as any)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="transfer">Chuyển khoản công ty</option>
                  <option value="cash">Tiền mặt</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Ghi Chú Điều Kiện Giải Ngân
                </label>
                <textarea
                  rows={2}
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="VD: Sau khi giao hàng đủ số lượng kèm CO/CQ và hóa đơn VAT..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsStageModalOpen(false);
                    setActiveContractForStage(null);
                    setEditingStageId(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingStageId ? 'Cập Nhật Mốc' : 'Lưu Mốc Thanh Toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
