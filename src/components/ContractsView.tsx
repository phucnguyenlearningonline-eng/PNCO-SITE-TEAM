import React, { useState, useMemo } from 'react';
import { 
  FileSignature, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Building, 
  Users, 
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
  Package
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

  // Modal thêm / sửa đợt thanh toán
  const [activeContractForStage, setActiveContractForStage] = useState<ExpenseItem | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageTitle, setStageTitle] = useState('');
  const [stageAmount, setStageAmount] = useState<number>(0);
  const [stagePercentage, setStagePercentage] = useState<number>(20);
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
      // Nếu chưa có mảng stages nhưng có contractAdvanceAmount
      paidAmount = item.contractAdvanceAmount || 0;
    }

    const remainingAmount = Math.max(0, totalContractValue - paidAmount);
    const paidPercentage = totalContractValue > 0 ? Math.round((paidAmount / totalContractValue) * 100) : 0;

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

  // Mở modal thêm đợt thanh toán
  const handleOpenAddStage = (contract: ExpenseItem) => {
    setActiveContractForStage(contract);
    const existingStages = contract.contractPaymentStages || [];
    const nextStageNum = existingStages.length + 1;
    const { remainingAmount } = getContractPaidInfo(contract);

    setStageTitle(`Thanh toán tiến độ đợt ${nextStageNum}`);
    setStagePercentage(20);
    setStageAmount(Math.min(remainingAmount, Math.round(contract.totalAmount * 0.2)));
    setStageDueDate(new Date().toISOString().split('T')[0]);
    setStageStatus('pending');
    setStagePaymentMethod('transfer');
    setStageNotes('');
    setIsStageModalOpen(true);
  };

  // Lưu đợt thanh toán mới vào hợp đồng
  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContractForStage || stageAmount <= 0) return;

    const existingStages: ContractPaymentStage[] = activeContractForStage.contractPaymentStages || [];
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

    const updatedStages = [...existingStages, newStage];
    const updatedContract: ExpenseItem = {
      ...activeContractForStage,
      contractPaymentStages: updatedStages,
    };

    onUpdateExpense(updatedContract);
    setIsStageModalOpen(false);
    setActiveContractForStage(null);
  };

  // Toggle trạng thái Đã thanh toán / Chờ thanh toán của 1 đợt
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

  // Xóa một đợt thanh toán
  const handleDeleteStage = (contract: ExpenseItem, stageId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đợt thanh toán này khỏi hợp đồng?')) return;
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
            Dành cho các đơn hàng lớn có hồ sơ kinh tế
          </p>
        </div>

        {/* Card 2: Tổng giá trị HĐ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Tổng Giá Trị HĐ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 truncate">
            {formatVND(totalContractsValue)}
          </div>
          <p className="text-[11px] text-slate-500">
            Đã bao gồm thuế GTGT (VAT)
          </p>
        </div>

        {/* Card 3: Đã giải ngân / thanh toán */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Đã Thanh Toán (Tạm ứng)</span>
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

        {/* Card 4: Dư nợ còn lại */}
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
            Các đợt giao hàng &amp; quyết toán tiếp theo
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
              <option value="in_progress">Đang thanh toán các đợt</option>
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
      {/* DANH SÁCH HỢP ĐỒNG KINH TẾ                                      */}
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
            Chỉ những đơn hàng mua vật tư (PO) lớn được tích chọn ô{' '}
            <strong>"Hợp Đồng Kinh Tế (Đơn hàng lớn)"</strong> mới được hiển thị tại tab này.
          </p>
          <button
            onClick={onOpenCreateOrder}
            className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Đơn Hàng Có Hợp Đồng Ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const { totalContractValue, paidAmount, remainingAmount, paidPercentage, status } = getContractPaidInfo(contract);
            const isExpanded = expandedContractIds[contract.id] ?? true;
            const stages = contract.contractPaymentStages || [];

            return (
              <div
                key={contract.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-sky-300"
              >
                {/* Header Card Hợp Đồng */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Thông tin số HĐ & Tên NCC */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-sky-950 bg-sky-100/70 border border-sky-300 px-2.5 py-0.5 rounded shadow-2xs">
                          {contract.contractNumber || `HĐ-${contract.code.replace(/\s+/g, '')}/PN-2026`}
                        </span>

                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Đơn PO: {contract.code}
                        </span>

                        {status === 'completed' ? (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã Tất Toán 100%
                          </span>
                        ) : status === 'in_progress' ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Đang Thanh Toán ({paidPercentage}%)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-sky-600" />
                            Chờ Tạm Ứng Đợt 1
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
                        <span>Nhà Cung Cấp:</span>
                        <strong className="text-sky-900">{contract.supplier}</strong>
                      </h4>

                      <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                        <span>Công trình: <strong className="text-slate-800">{contract.projectName}</strong></span>
                        <span>Ngày ký: <strong className="text-slate-800">{formatDateVN(contract.contractDate || contract.date)}</strong></span>
                        <span>Người lập: <strong>{contract.createdByName}</strong></span>
                      </div>
                    </div>

                    {/* Khối Giá Trị Hợp Đồng & Thanh Toán */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right shrink-0">
                      <div>
                        <div className="text-[10.5px] uppercase font-bold text-slate-500">Giá Trị Hợp Đồng (Có VAT)</div>
                        <div className="text-lg sm:text-xl font-black font-mono text-slate-950">
                          {formatVND(totalContractValue)}
                        </div>
                      </div>

                      <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                        <div className="text-[10.5px] uppercase font-bold text-slate-500">Đã Chi / Còn Phải Thanh Toán</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-700">
                            {formatVND(paidAmount)} ({paidPercentage}%)
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-mono font-bold text-amber-700">
                            Còn: {formatVND(remainingAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
                        <button
                          onClick={() => onViewOrder(contract)}
                          className="p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-colors"
                          title="Xem chi tiết đơn hàng & In PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditOrder(contract)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white transition-colors"
                          title="Chỉnh sửa thông tin đơn hàng / hợp đồng"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleExpand(contract.id)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          title={isExpanded ? 'Thu gọn các đợt thanh toán' : 'Mở rộng các đợt thanh toán'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Thanh Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Tiến độ thanh toán hợp đồng:</span>
                      <span className="font-mono font-bold text-slate-800">{paidPercentage}% hoàn thành</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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

                {/* Danh Sách Các Đợt Thanh Toán Chi Tiết */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                        <span>Kế Hoạch &amp; Lịch Sử Thanh Toán Từng Đợt ({stages.length} đợt)</span>
                      </h5>

                      <button
                        onClick={() => handleOpenAddStage(contract)}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Đợt Thanh Toán Tiếp Theo</span>
                      </button>
                    </div>

                    {stages.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        Chưa thiết lập các đợt thanh toán chi tiết cho hợp đồng này. Bấm nút{' '}
                        <strong>"+ Thêm Đợt Thanh Toán Tiếp Theo"</strong> để tạo đợt tạm ứng hoặc giao hàng.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 w-14 text-center">Đợt</th>
                              <th className="py-2.5 px-3">Nội Dung / Điều Khoản Giải Ngân</th>
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
                                className={`hover:bg-slate-50/70 transition-colors ${
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
                                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border inline-flex items-center gap-1 transition-all cursor-pointer ${
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
                                  <button
                                    onClick={() => handleDeleteStage(contract, stage.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Xóa đợt thanh toán này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
      {/* MODAL THÊM / CẬP NHẬT ĐỢT THANH TOÁN TIẾP THEO                   */}
      {/* ============================================================== */}
      {isStageModalOpen && activeContractForStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#102742] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-400" />
                <h4 className="font-bold text-sm uppercase">Thêm Đợt Thanh Toán Hợp Đồng</h4>
              </div>
              <button
                onClick={() => {
                  setIsStageModalOpen(false);
                  setActiveContractForStage(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="p-5 space-y-3.5 text-xs">
              <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 text-[11px] text-sky-950 space-y-1">
                <div>Hợp đồng: <strong>{activeContractForStage.contractNumber || activeContractForStage.code}</strong></div>
                <div>Nhà cung cấp: <strong>{activeContractForStage.supplier}</strong></div>
                <div>Tổng giá trị HĐ: <strong className="font-mono">{formatVND(activeContractForStage.totalAmount)}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nội Dung Đợt Thanh Toán <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stageTitle}
                  onChange={(e) => setStageTitle(e.target.value)}
                  placeholder="VD: Thanh toán đợt 2 (Giao 50% hàng) / Quyết toán nghiệm thu..."
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
                    Trạng Thái Đợt
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
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Lưu Đợt Thanh Toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
