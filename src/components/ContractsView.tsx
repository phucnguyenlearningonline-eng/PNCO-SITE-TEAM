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
  Layers,
  Table as TableIcon,
  List as ListIcon,
  LayoutGrid,
  ChevronRight,
  Eye
} from 'lucide-react';
import { ExpenseItem, Project, User, ContractPaymentStage } from '../types';
import { formatVND, formatDateVN } from '../utils/formatters';
import { CreateContractModal } from './contracts/CreateContractModal';

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
export type ContractViewMode = 'table' | 'list' | 'cards';

export const ContractsView: React.FC<ContractsViewProps> = ({
  expenses,
  projects,
  currentUser,
  onUpdateExpense,
  onViewOrder,
  onEditOrder,
  onOpenCreateOrder,
}) => {
  // Lọc các hợp đồng: gồm HĐ kinh tế mua bán vật tư và HĐ giao khoán nhân công / thầu phụ
  const contractExpenses = useMemo(() => {
    return expenses.filter((e) => Boolean(e.hasContract || e.contractNumber || e.category === 'labor_sub'));
  }, [expenses]);

  // Modal tạo hợp đồng mới
  const [isCreateContractModalOpen, setIsCreateContractModalOpen] = useState(false);
  const [contractTypeFilter, setContractTypeFilter] = useState<'all' | 'labor' | 'material'>('all');

  // Chế độ xem: Bảng (table) | Danh sách gọn (list) | Thẻ (cards)
  const [viewMode, setViewMode] = useState<ContractViewMode>(() => {
    return (localStorage.getItem('contract_view_mode_v1') as ContractViewMode) || 'table';
  });

  const handleSetViewMode = (mode: ContractViewMode) => {
    setViewMode(mode);
    localStorage.setItem('contract_view_mode_v1', mode);
  };

  // Bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending_advance' | 'in_progress' | 'completed'>('all');

  // Modal xem và quản lý mốc thanh toán độc lập
  const [managingMilestonesContract, setManagingMilestonesContract] = useState<ExpenseItem | null>(null);

  // Modal thêm / sửa mốc thanh toán
  const [activeContractForStage, setActiveContractForStage] = useState<ExpenseItem | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  
  const [stageType, setStageType] = useState<MilestoneType>('advance');
  const [stageTitle, setStageTitle] = useState('');
  const [stageAmount, setStageAmount] = useState<number>(0);
  const [stagePercentage, setStagePercentage] = useState<number>(30);
  const [stageHasVat, setStageHasVat] = useState<boolean>(true);
  const [stageVatRate, setStageVatRate] = useState<number>(10);
  const [stageDueDate, setStageDueDate] = useState('');
  const [stageStatus, setStageStatus] = useState<'pending' | 'paid'>('pending');
  const [stagePaymentMethod, setStagePaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [stageNotes, setStageNotes] = useState('');

  // Expand / collapse details for contracts (Mặc định thu gọn để không chiếm màn hình)
  const [expandedContractIds, setExpandedContractIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedContractIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    contractExpenses.forEach((c) => {
      next[c.id] = true;
    });
    setExpandedContractIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedContractIds({});
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

      const matchType =
        contractTypeFilter === 'all' ||
        (contractTypeFilter === 'labor' && item.category === 'labor_sub') ||
        (contractTypeFilter === 'material' && item.category !== 'labor_sub');

      return matchSearch && matchProject && matchStatus && matchType;
    });
  }, [contractExpenses, searchTerm, selectedProjectId, paymentStatusFilter, contractTypeFilter]);

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
    const contractHasVat = contract.vatRate !== undefined ? contract.vatRate > 0 : true;
    setStageHasVat(contractHasVat);
    setStageVatRate(contract.vatRate || 10);
    setIsStageModalOpen(true);
  };

  // Mở modal sửa mốc
  const handleOpenEditStage = (contract: ExpenseItem, stage: ContractPaymentStage) => {
    setActiveContractForStage(contract);
    setEditingStageId(stage.id);
    setStageTitle(stage.title);
    setStageAmount(stage.amount);
    setStagePercentage(stage.percentage || (contract.totalAmount > 0 ? Math.round((stage.amount / contract.totalAmount) * 100) : 0));
    setStageHasVat(stage.hasVat ?? (contract.vatRate !== undefined ? contract.vatRate > 0 : true));
    setStageVatRate(stage.vatRate ?? (contract.vatRate ?? 10));
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

    const effectiveVatRate = stageHasVat ? stageVatRate : 0;
    const subtotal = stageHasVat && stageVatRate > 0
      ? Math.round(stageAmount / (1 + stageVatRate / 100))
      : stageAmount;
    const vatAmt = stageHasVat && stageVatRate > 0
      ? stageAmount - subtotal
      : 0;

    if (editingStageId) {
      // Đang sửa
      updatedStages = existingStages.map((s) => {
        if (s.id === editingStageId) {
          return {
            ...s,
            title: stageTitle.trim(),
            percentage: stagePercentage,
            amount: stageAmount,
            hasVat: stageHasVat,
            vatRate: effectiveVatRate,
            vatAmount: vatAmt,
            subtotalAmount: subtotal,
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
        hasVat: stageHasVat,
        vatRate: effectiveVatRate,
        vatAmount: vatAmt,
        subtotalAmount: subtotal,
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

  // Helper render bảng chi tiết các mốc thanh toán (gọn gàng, dùng chung cho cả Table, List, Cards)
  const renderMilestoneContent = (contract: ExpenseItem) => {
    const { totalContractValue, allocatedAmount, unallocatedAmount } = getContractPaidInfo(contract);
    const stages = contract.contractPaymentStages || [];

    return (
      <div className="p-3.5 sm:p-4 bg-slate-50/70 border-t border-slate-200 space-y-3">
        {/* Header bar mốc thanh toán */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
          <div className="text-xs">
            <span className="font-bold text-slate-800">Tiến độ phân bổ mốc: </span>
            <span className="font-mono font-bold text-sky-800">{formatVND(allocatedAmount)}</span>
            <span className="text-slate-400"> / </span>
            <span className="font-mono font-semibold text-slate-700">{formatVND(totalContractValue)}</span>
            {unallocatedAmount > 0 && (
              <span className="text-amber-700 font-bold ml-2">
                (Chưa phân bổ: {formatVND(unallocatedAmount)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {stages.length === 0 && (
              <button
                type="button"
                onClick={() => handleCreateStandardMilestones(contract)}
                className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1 cursor-pointer"
                title="Tạo nhanh 4 mốc: Tạm ứng 30% → Lần 1 40% → Lần 2 20% → Tất toán 10%"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Tạo 4 mốc chuẩn</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAddStage(contract)}
              className="text-xs font-bold px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Thêm mốc</span>
            </button>
          </div>
        </div>

        {/* Bảng kê chi tiết các mốc */}
        {stages.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
            Hợp đồng này chưa có mốc thanh toán nào.{' '}
            <button
              type="button"
              onClick={() => handleCreateStandardMilestones(contract)}
              className="text-emerald-700 font-bold hover:underline cursor-pointer ml-1"
            >
              Tạo nhanh bộ 4 mốc chuẩn
            </button>{' '}
            hoặc{' '}
            <button
              type="button"
              onClick={() => handleOpenAddStage(contract, 'advance')}
              className="text-sky-700 font-bold hover:underline cursor-pointer"
            >
              tự thêm mốc
            </button>.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5 w-12 text-center">Mốc</th>
                  <th className="py-2 px-2.5">Tên mốc thanh toán &amp; điều kiện giải ngân</th>
                  <th className="py-2 px-2 text-center w-16">% HĐ</th>
                  <th className="py-2 px-2.5 text-right w-28">Số tiền (VNĐ)</th>
                  <th className="py-2 px-2.5 text-center w-24">Ngày thực hiện</th>
                  <th className="py-2 px-2.5 text-center w-28">Trạng thái</th>
                  <th className="py-2 px-2 text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stages.map((stage, idx) => (
                  <tr
                    key={stage.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      stage.status === 'paid' ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    <td className="py-2 px-2.5 text-center font-bold text-slate-700 font-mono">
                      #{idx + 1}
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>{stage.title}</span>
                        {stage.hasVat && stage.vatRate ? (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            VAT {stage.vatRate}%
                          </span>
                        ) : stage.hasVat === false ? (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600">
                            0% VAT
                          </span>
                        ) : null}
                      </div>
                      {stage.notes && <div className="text-[10.5px] text-slate-500 mt-0.5">{stage.notes}</div>}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold text-slate-600">
                      {stage.percentage ? `${stage.percentage}%` : '-'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                      <div>{formatVND(stage.amount)}</div>
                      {stage.hasVat && stage.vatAmount ? (
                        <div className="text-[9.5px] text-rose-600 font-normal">
                          (VAT: {formatVND(stage.vatAmount)})
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono text-[11px] text-slate-600">
                      {stage.status === 'paid' && stage.paidDate
                        ? formatDateVN(stage.paidDate)
                        : stage.dueDate
                        ? formatDateVN(stage.dueDate)
                        : '-'}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStageStatus(contract, stage.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 transition-all cursor-pointer ${
                          stage.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                        }`}
                        title="Bấm để chuyển đổi trạng thái Đã thanh toán / Chờ thanh toán"
                      >
                        {stage.status === 'paid' ? (
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
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStage(contract, stage)}
                          className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 cursor-pointer"
                          title="Sửa mốc"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStage(contract, stage.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Xóa mốc"
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
        )}
      </div>
    );
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
      {/* FILTER & ACTIONS BAR & VIEW MODE SWITCHER                      */}
      {/* ============================================================== */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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
              className="py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
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
              className="py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">⚡ Tất cả trạng thái thanh toán</option>
              <option value="pending_advance">Chờ tạm ứng ban đầu</option>
              <option value="in_progress">Đang thanh toán các mốc</option>
              <option value="completed">Đã tất toán 100% hợp đồng</option>
            </select>

            {/* Filter by Contract Type (Nhân công vs Mua bán vật tư) */}
            <select
              value={contractTypeFilter}
              onChange={(e) => setContractTypeFilter(e.target.value as any)}
              className="py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">📑 Tất cả loại hợp đồng</option>
              <option value="labor">👷 Hợp đồng nhân công &amp; Thầu phụ</option>
              <option value="material">📦 Hợp đồng mua bán vật tư</option>
            </select>

            {/* Nút Tạo Hợp Đồng Mới */}
            <button
              onClick={() => setIsCreateContractModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Hợp Đồng Mới</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher Bar */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Kiểu hiển thị:</span>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleSetViewMode('table')}
                className={`py-1.5 px-3 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-sky-800 shadow-2xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dạng bảng Excel / ERP gọn gàng, hiển thị nhiều hợp đồng trên một màn hình"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Dạng Bảng (Table)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                className={`py-1.5 px-3 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-sky-800 shadow-2xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dạng danh sách thẻ ngang thu gọn, thao tác nhanh"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Dạng Danh Sách (List)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('cards')}
                className={`py-1.5 px-3 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-sky-800 shadow-2xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dạng thẻ khối chi tiết"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dạng Thẻ Chi Tiết</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">
              Hiển thị <strong>{filteredContracts.length}</strong> / <strong>{contractExpenses.length}</strong> hợp đồng
            </span>

            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 cursor-pointer"
                title="Mở rộng chi tiết tất cả các hợp đồng"
              >
                Mở rộng tất cả
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                title="Thu gọn tất cả về dạng tóm tắt"
              >
                Thu gọn tất cả
              </button>
            </div>
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
        <>
          {/* ============================================================== */}
          {/* CHẾ ĐỘ 1: DẠNG BẢNG (TABLE VIEW) - GỌN GÀNG, NHIỀU HỢP ĐỒNG    */}
          {/* ============================================================== */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#102742] text-white font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-2.5 w-12 text-center">STT</th>
                      <th className="py-3 px-3 w-48">Số Hợp Đồng &amp; Đơn PO</th>
                      <th className="py-3 px-3">Nhà Cung Cấp</th>
                      <th className="py-3 px-3 w-48">Dự Án Thi Công</th>
                      <th className="py-3 px-3 text-right w-36">Tổng Tiền HĐ</th>
                      <th className="py-3 px-3 text-right w-32">Đã Thanh Toán</th>
                      <th className="py-3 px-3 text-right w-32">Còn Lại (Dư Nợ)</th>
                      <th className="py-3 px-3 text-center w-36">Tiến Độ Mốc</th>
                      <th className="py-3 px-3 text-center w-32">Trạng Thái</th>
                      <th className="py-3 px-3 text-center w-32">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredContracts.map((contract, index) => {
                      const { totalContractValue, paidAmount, remainingAmount, paidPercentage, status } = getContractPaidInfo(contract);
                      const isExpanded = Boolean(expandedContractIds[contract.id]);
                      const stages = contract.contractPaymentStages || [];
                      const paidStagesCount = stages.filter((s) => s.status === 'paid').length;

                      return (
                        <React.Fragment key={contract.id}>
                          <tr
                            className={`hover:bg-sky-50/50 transition-colors ${
                              isExpanded ? 'bg-sky-50/30' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                            }`}
                          >
                            {/* STT */}
                            <td className="py-3 px-2.5 text-center font-bold text-slate-500 font-mono">
                              {index + 1}
                            </td>

                            {/* Số HĐ & Đơn PO */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-sky-950 text-xs bg-sky-100/80 px-2 py-0.5 rounded border border-sky-300">
                                  {contract.contractNumber || `HĐ-${contract.code.replace(/\s+/g, '')}/PN-2026`}
                                </span>
                                {contract.category === 'labor_sub' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                    👷 HĐ Nhân Công
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                    📦 HĐ Mua Bán Vật Tư
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  Mã: {contract.code}
                                </span>
                                <span>{formatDateVN(contract.contractDate || contract.date)}</span>
                              </div>
                            </td>

                            {/* Nhà Cung Cấp */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 line-clamp-2" title={contract.supplier}>
                                {contract.supplier}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <span>Phụ trách:</span>
                                <strong className="text-slate-700">{contract.createdByName}</strong>
                              </div>
                            </td>

                            {/* Dự Án */}
                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-800 line-clamp-2" title={contract.projectName}>
                                {contract.projectName}
                              </div>
                            </td>

                            {/* Tổng Tiền HĐ */}
                            <td className="py-3 px-3 text-right">
                              <div className="font-mono font-black text-emerald-800 text-sm">
                                {formatVND(totalContractValue)}
                              </div>
                              <div className="text-[10px] text-slate-400">Đã gồm VAT</div>
                            </td>

                            {/* Đã Thanh Toán */}
                            <td className="py-3 px-3 text-right">
                              <div className="font-mono font-bold text-blue-700">
                                {formatVND(paidAmount)}
                              </div>
                              <div className="text-[10px] font-bold text-blue-600">
                                ({paidPercentage}%)
                              </div>
                            </td>

                            {/* Còn Lại */}
                            <td className="py-3 px-3 text-right">
                              <div className="font-mono font-bold text-amber-700">
                                {formatVND(remainingAmount)}
                              </div>
                            </td>

                            {/* Tiến Độ Mốc */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                                <span>{paidStagesCount}/{stages.length} mốc đã TT</span>
                              </div>
                              <div className="w-24 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    paidPercentage >= 100
                                      ? 'bg-emerald-500'
                                      : paidPercentage > 50
                                      ? 'bg-blue-600'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, paidPercentage)}%` }}
                                />
                              </div>
                            </td>

                            {/* Trạng Thái */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  Đã Tất Toán
                                </span>
                              ) : status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-800 bg-blue-100/90 border border-blue-300 px-2 py-0.5 rounded-full">
                                  <TrendingUp className="w-3 h-3 text-blue-700" />
                                  Đang Chi Mốc
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  Chờ Tạm Ứng
                                </span>
                              )}
                            </td>

                            {/* Thao Tác */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Toggle inline mốc */}
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(contract.id)}
                                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                    isExpanded
                                      ? 'bg-sky-600 text-white shadow-2xs'
                                      : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                                  }`}
                                  title={isExpanded ? 'Thu gọn các mốc' : 'Xem & mở rộng các mốc thanh toán'}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span className="text-[10.5px]">{stages.length}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>

                                {/* In PDF */}
                                <button
                                  type="button"
                                  onClick={() => onViewOrder(contract)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-sky-700 hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="In đơn hàng & Xem chi tiết"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                {/* Chỉnh sửa */}
                                <button
                                  type="button"
                                  onClick={() => onEditOrder(contract)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Chỉnh sửa thông tin đơn hàng / hợp đồng"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Dòng mở rộng chi tiết các mốc của Table */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="p-0 border-b-2 border-sky-300">
                                {renderMilestoneContent(contract)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CHẾ ĐỘ 2: DẠNG DANH SÁCH GỌN (LIST VIEW) - THẺ NGANG TINH GỌN  */}
          {/* ============================================================== */}
          {viewMode === 'list' && (
            <div className="space-y-2.5">
              {filteredContracts.map((contract) => {
                const { totalContractValue, paidAmount, remainingAmount, paidPercentage, status } = getContractPaidInfo(contract);
                const isExpanded = Boolean(expandedContractIds[contract.id]);
                const stages = contract.contractPaymentStages || [];
                const paidStagesCount = stages.filter((s) => s.status === 'paid').length;

                return (
                  <div
                    key={contract.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-sky-400"
                  >
                    <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Cột 1: Mã HĐ, PO, Nhà Cung Cấp */}
                      <div className="space-y-1 flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-sky-950 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                            {contract.contractNumber || `HĐ-${contract.code.replace(/\s+/g, '')}/PN-2026`}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            PO: {contract.code}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateVN(contract.contractDate || contract.date)}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-slate-900 truncate" title={contract.supplier}>
                          {contract.supplier}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          Công trình: <strong className="text-slate-800">{contract.projectName}</strong>
                        </div>
                      </div>

                      {/* Cột 2: Tiền HĐ, Đã chi, Còn lại */}
                      <div className="flex items-center gap-4 text-left md:text-right shrink-0">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Tổng HĐ</div>
                          <div className="font-mono font-black text-emerald-800 text-sm sm:text-base">
                            {formatVND(totalContractValue)}
                          </div>
                        </div>

                        <div className="border-l border-slate-200 pl-4">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Đã chi / Còn lại</div>
                          <div className="font-mono font-bold text-blue-700 text-xs">
                            {formatVND(paidAmount)} ({paidPercentage}%)
                          </div>
                          <div className="font-mono font-bold text-amber-700 text-xs">
                            Còn: {formatVND(remainingAmount)}
                          </div>
                        </div>
                      </div>

                      {/* Cột 3: Tiến độ mốc & Trạng thái */}
                      <div className="min-w-[140px] shrink-0 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Tiến độ:</span>
                          <span className="font-bold text-slate-800">{paidStagesCount}/{stages.length} mốc</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              paidPercentage >= 100
                                ? 'bg-emerald-500'
                                : paidPercentage > 50
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, paidPercentage)}%` }}
                          />
                        </div>
                        <div className="pt-0.5">
                          {status === 'completed' ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                              ✓ Đã Tất Toán
                            </span>
                          ) : status === 'in_progress' ? (
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block">
                              ⚡ Đang Chi Mốc
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block">
                              ⏳ Chờ Tạm Ứng
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cột 4: Nút thao tác */}
                      <div className="flex items-center gap-1.5 shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={() => toggleExpand(contract.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                          }`}
                          title="Xem chi tiết các mốc thanh toán"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Mốc ({stages.length})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewOrder(contract)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-sky-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="In đơn hàng & Xem chi tiết"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditOrder(contract)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Sửa hợp đồng / PO"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mở rộng chi tiết mốc */}
                    {isExpanded && renderMilestoneContent(contract)}
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================== */}
          {/* CHẾ ĐỘ 3: DẠNG THẺ CHI TIẾT (CARDS VIEW)                       */}
          {/* ============================================================== */}
          {viewMode === 'cards' && (
            <div className="space-y-4">
              {filteredContracts.map((contract) => {
                const { totalContractValue, paidAmount, remainingAmount, paidPercentage, status } = getContractPaidInfo(contract);
                const isExpanded = Boolean(expandedContractIds[contract.id]);
                const stages = contract.contractPaymentStages || [];

                return (
                  <div
                    key={contract.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-sky-400"
                  >
                    {/* Header Card Hợp Đồng */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-sky-50/30 border-b border-slate-200">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                            <span>Dự án: <strong className="text-slate-900">{contract.projectName}</strong></span>
                            <span>Ngày lập: <strong>{formatDateVN(contract.contractDate || contract.date)}</strong></span>
                            <span>Phụ trách: <strong>{contract.createdByName}</strong></span>
                          </div>
                        </div>

                        {/* Số tiền tổng HĐ */}
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

                          <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => onViewOrder(contract)}
                              className="p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer"
                              title="Xem chi tiết đơn hàng & In PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditOrder(contract)}
                              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin đơn hàng / hợp đồng"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
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
                        <div className="w-full bg-slate-200 rounded-full h-2 bg-slate-200 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
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

                    {/* Mở rộng chi tiết mốc */}
                    {isExpanded && renderMilestoneContent(contract)}
                  </div>
                );
              })}
            </div>
          )}
        </>
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

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 uppercase">
                        % Tỷ Lệ Hợp Đồng
                      </label>
                      <span className="text-[10px] text-sky-700 font-semibold">Tự tính số tiền</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={stagePercentage || ''}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          const pct = parseFloat(valStr);
                          const val = isNaN(pct) ? 0 : pct;
                          setStagePercentage(val);
                          if (activeContractForStage && activeContractForStage.totalAmount > 0) {
                            const calculatedAmount = Math.round(activeContractForStage.totalAmount * (val / 100));
                            setStageAmount(calculatedAmount);
                          }
                        }}
                        placeholder="Nhập %..."
                        className="w-full py-2 px-3 pr-7 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400 font-bold">%</span>
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {[10, 20, 30, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setStagePercentage(pct);
                            if (activeContractForStage && activeContractForStage.totalAmount > 0) {
                              setStageAmount(Math.round(activeContractForStage.totalAmount * (pct / 100)));
                            }
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                            stagePercentage === pct
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 uppercase">
                        Số Tiền Thanh Toán <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 font-semibold">Tự tính %</span>
                    </div>
                    <input
                      type="number"
                      required
                      min={0}
                      step="any"
                      value={stageAmount || ''}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        const amt = parseFloat(valStr);
                        const val = isNaN(amt) ? 0 : amt;
                        setStageAmount(val);
                        if (activeContractForStage && activeContractForStage.totalAmount > 0) {
                          const rawPct = (val / activeContractForStage.totalAmount) * 100;
                          const formattedPct = Math.round(rawPct * 100) / 100;
                          setStagePercentage(formattedPct);
                        }
                      }}
                      placeholder="Nhập số tiền..."
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <div className="text-[11px] font-mono text-emerald-700 font-bold mt-1 truncate">
                      = {formatVND(stageAmount)}
                    </div>
                  </div>
                </div>

                {/* Ô CÓ THUẾ VAT HAY KHÔNG (THEO YÊU CẦU CỦA USER) */}
                <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={stageHasVat}
                        onChange={(e) => setStageHasVat(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                      />
                      <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                        <span>Thuế VAT (Hóa đơn GTGT):</span>
                        {stageHasVat ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                            ✓ Có VAT
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                            ✕ Không có VAT (0%)
                          </span>
                        )}
                      </span>
                    </label>

                    {stageHasVat && (
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="text-[11px] font-semibold text-slate-600">Thuế suất:</span>
                        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
                          {[10, 8, 5, 0].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setStageVatRate(rate)}
                              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                stageVatRate === rate
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chi tiết phân rã số tiền trước thuế & tiền thuế VAT */}
                  {stageHasVat && stageVatRate > 0 ? (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <div className="text-slate-500 text-[10px]">Tiền trước thuế:</div>
                        <div className="font-mono font-bold text-slate-800">
                          {formatVND(Math.round(stageAmount / (1 + stageVatRate / 100)))}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <div className="text-rose-600 text-[10px]">Tiền thuế VAT ({stageVatRate}%):</div>
                        <div className="font-mono font-bold text-rose-600">
                          {formatVND(stageAmount - Math.round(stageAmount / (1 + stageVatRate / 100)))}
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <div className="text-emerald-800 text-[10px] font-bold">Tổng thanh toán mốc:</div>
                        <div className="font-mono font-black text-emerald-800">
                          {formatVND(stageAmount)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                      Mốc thanh toán không tính thuế VAT (hoặc chi phí nhân công / trọn gói đã miễn VAT 0%).
                    </div>
                  )}
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

      {/* ============================================================== */}
      {/* MODAL TẠO HỢP ĐỒNG MỚI (HỢP ĐỒNG NHÂN CÔNG HOẶC HỢP ĐỒNG VẬT TƯ) */}
      {/* ============================================================== */}
      {isCreateContractModalOpen && (
        <CreateContractModal
          isOpen={isCreateContractModalOpen}
          onClose={() => setIsCreateContractModalOpen(false)}
          projects={projects}
          currentUser={currentUser}
          onSaveContract={(newContract) => {
            onUpdateExpense(newContract);
            setIsCreateContractModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
