import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  DollarSign, 
  CreditCard, 
  Plus, 
  Minus, 
  Layers, 
  FileSpreadsheet, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  X,
  PieChart,
  BarChart3,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { Project, ExpenseItem, ExpenseCategory } from '../types';
import { formatVND, formatDateVN, formatTy } from '../utils/formatters';
import { CreateReceiptModal } from './transactions/CreateReceiptModal';
import { CreatePaymentModal } from './transactions/CreatePaymentModal';
import { PendingPayablesTable } from './transactions/PendingPayablesTable';

interface TransactionsViewProps {
  projects: Project[];
  expenses: ExpenseItem[];
  onSaveExpense: (expense: ExpenseItem) => void;
  onDeleteExpense?: (item: ExpenseItem) => void;
  onRefreshData?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  projects,
  expenses,
  onSaveExpense,
  onDeleteExpense,
  onRefreshData,
}) => {
  // Tabs: 'summary' (Thống kê theo dự án) | 'ledger' (Sổ nhật ký giao dịch) | 'pending_po' (Dự chi từ đơn hàng) | 'charts' (Biểu đồ)
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'ledger' | 'pending_po' | 'charts'>('summary');

  // Filter dự án
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'revenue' | 'expense'>('all');

  // Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [preselectedPoForPayment, setPreselectedPoForPayment] = useState<ExpenseItem | null>(null);
  const [preselectedProjForAction, setPreselectedProjForAction] = useState<string | undefined>(undefined);

  // Đơn hàng PO chưa thanh toán hoặc còn nợ (Dự chi)
  const pendingOrders = useMemo(() => {
    return expenses.filter((e) => {
      const isOrder = e.type === 'po' || e.type === 'expense';
      if (!isOrder) return false;
      const paid = e.paidAmount || expenses
        .filter((exp) => exp.linkedPoId === e.id && exp.status === 'paid')
        .reduce((sum, exp) => sum + exp.totalAmount, 0);
      const rem = e.totalAmount - paid;
      return e.status !== 'paid' || rem > 0;
    });
  }, [expenses]);

  // Danh sách giao dịch thu - chi thực tế đã phát sinh
  const transactionItems = useMemo(() => {
    return expenses.filter((e) => {
      // Thu tiền từ CĐT
      const isRevenue = e.type === 'revenue';
      // Chi tiền thực tế đã chi
      const isPaidExpense = e.status === 'paid' && (e.type === 'expense' || e.type === 'po' || e.type === 'advance');
      return isRevenue || isPaidExpense;
    });
  }, [expenses]);

  // Thống kê cân đối thu chi cho từng dự án
  const projectBalances = useMemo(() => {
    return projects.map((p) => {
      // 1. Thu tiền CĐT của dự án này
      const prjRevenues = expenses.filter(
        (e) => e.projectId === p.id && e.type === 'revenue' && e.status === 'paid'
      );
      const totalRevenueFromItems = prjRevenues.reduce((sum, item) => sum + item.totalAmount, 0);
      // Kết hợp cả currentAdvance của dự án nếu lớn hơn
      const totalIncome = Math.max(totalRevenueFromItems, p.currentAdvance || 0);

      // 2. Chi phí đã chi thực tế
      const prjPaidExpenses = expenses.filter(
        (e) => e.projectId === p.id && e.type !== 'revenue' && e.status === 'paid'
      );
      const totalPaidExpenses = prjPaidExpenses.reduce((sum, item) => sum + item.totalAmount, 0);

      // 3. Dự chi từ đơn hàng PO chưa thanh toán (tính theo số tiền còn nợ sau các đợt đã chi)
      const prjPendingOrders = expenses.filter((e) => {
        const isOrder = (e.type === 'po' || e.type === 'expense') && e.projectId === p.id;
        if (!isOrder) return false;
        const paid = e.paidAmount || expenses
          .filter((exp) => exp.linkedPoId === e.id && exp.status === 'paid')
          .reduce((sum, exp) => sum + exp.totalAmount, 0);
        const rem = e.totalAmount - paid;
        return e.status !== 'paid' || rem > 0;
      });
      const totalPendingOrdersAmount = prjPendingOrders.reduce((sum, item) => {
        const paid = item.paidAmount || expenses
          .filter((exp) => exp.linkedPoId === item.id && exp.status === 'paid')
          .reduce((s, exp) => s + exp.totalAmount, 0);
        return sum + Math.max(0, item.totalAmount - paid);
      }, 0);

      // 4. Giá trị hợp đồng sau PLHĐ
      const contractValue = p.totalRevenue || p.originalContractValue || 0;

      // 5. Dòng tiền ròng hiện tại (Thu - Chi đã thanh toán)
      const netCashflow = totalIncome - totalPaidExpenses;

      // 6. Tỷ suất lợi nhuận dòng tiền
      const profitMargin = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

      // 7. Tiến độ dòng tiền
      const incomeProgress = contractValue > 0 ? (totalIncome / contractValue) * 100 : 0;
      const expenseProgress = contractValue > 0 ? (totalPaidExpenses / contractValue) * 100 : 0;

      // 8. Dòng tiền dự kiến sau khi trừ đơn hàng chưa thanh toán
      const forecastedNetCashflow = netCashflow - totalPendingOrdersAmount;

      return {
        project: p,
        contractValue,
        totalIncome,
        revenuesCount: Math.max(prjRevenues.length, totalIncome > 0 ? 1 : 0),
        totalPaidExpenses,
        expensesCount: prjPaidExpenses.length,
        totalPendingOrdersAmount,
        pendingOrdersCount: prjPendingOrders.length,
        netCashflow,
        profitMargin,
        incomeProgress,
        expenseProgress,
        forecastedNetCashflow,
      };
    });
  }, [projects, expenses]);

  // Lọc danh sách dự án hiển thị
  const filteredProjectBalances = useMemo(() => {
    return projectBalances.filter((item) => {
      if (selectedProjectId !== 'all' && item.project.id !== selectedProjectId) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.project.name.toLowerCase().includes(q);
        const matchCode = item.project.code.toLowerCase().includes(q);
        const matchClient = item.project.client.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchClient) return false;
      }
      return true;
    });
  }, [projectBalances, selectedProjectId, searchTerm]);

  // Tổng cộng toàn công ty
  const companyTotals = useMemo(() => {
    let totalContract = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let totalPending = 0;
    let totalTransactions = 0;

    projectBalances.forEach((item) => {
      totalContract += item.contractValue;
      totalIncome += item.totalIncome;
      totalExpense += item.totalPaidExpenses;
      totalPending += item.totalPendingOrdersAmount;
      totalTransactions += item.revenuesCount + item.expensesCount;
    });

    const netCashflow = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

    return {
      totalContract,
      totalIncome,
      totalExpense,
      totalPending,
      netCashflow,
      profitMargin,
      totalTransactions,
    };
  }, [projectBalances]);

  // Lọc nhật ký giao dịch
  const filteredTransactions = useMemo(() => {
    return transactionItems.filter((item) => {
      if (selectedProjectId !== 'all' && item.projectId !== selectedProjectId) return false;
      if (ledgerTypeFilter === 'revenue' && item.type !== 'revenue') return false;
      if (ledgerTypeFilter === 'expense' && item.type === 'revenue') return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPrj = item.projectName.toLowerCase().includes(q);
        const matchSup = item.supplier.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchPrj && !matchSup) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionItems, selectedProjectId, ledgerTypeFilter, searchTerm]);

  // Xử lý lưu phiếu thu
  const handleSaveReceipt = (receipt: ExpenseItem) => {
    onSaveExpense(receipt);
    // Cập nhật currentAdvance của dự án nếu cần
    const prj = projects.find((p) => p.id === receipt.projectId);
    if (prj) {
      prj.currentAdvance = (prj.currentAdvance || 0) + receipt.totalAmount;
    }
  };

  // Xử lý lưu phiếu chi (có đồng bộ PO nếu chọn)
  const handleSavePayment = (
    payment: ExpenseItem, 
    syncedPoId?: string,
    paymentStageDetails?: { isFullyPaid: boolean; newTotalPaid: number; stageTitle?: string }
  ) => {
    onSaveExpense(payment);

    // Đồng bộ PO nếu liên kết
    if (syncedPoId) {
      const po = expenses.find((e) => e.id === syncedPoId);
      if (po) {
        const isFullyPaid = paymentStageDetails ? paymentStageDetails.isFullyPaid : true;
        const newTotalPaid = paymentStageDetails ? paymentStageDetails.newTotalPaid : po.totalAmount;
        const stageNote = paymentStageDetails?.stageTitle ? `[${paymentStageDetails.stageTitle}]` : '';

        onSaveExpense({
          ...po,
          status: isFullyPaid ? 'paid' : (po.status === 'pending' ? 'approved' : po.status),
          paidAmount: newTotalPaid,
          notes: (po.notes ? `${po.notes} • ` : '') + `${stageNote} Đã chi ${formatVND(payment.totalAmount)} (Phiếu ${payment.code})`,
        });
      }
    }
  };

  // Mở modal tạo phiếu chi cho một PO cụ thể
  const handleOpenCreatePaymentForPo = (po: ExpenseItem) => {
    setPreselectedPoForPayment(po);
    setIsPaymentModalOpen(true);
  };

  // Xuất Excel Sổ Thu Chi
  const handleExportExcel = () => {
    const rows = filteredProjectBalances.map((item, idx) => ({
      STT: idx + 1,
      'Mã DA': item.project.code,
      'Tên Dự Án': item.project.name,
      'Chủ Đầu Tư': item.project.client,
      'Giá Trị Hợp Đồng (VNĐ)': item.contractValue,
      'Tổng Thu Nhập (+VNĐ)': item.totalIncome,
      'Tỷ Lệ Thu (%)': item.incomeProgress.toFixed(1) + '%',
      'Tổng Chi Phí (-VNĐ)': item.totalPaidExpenses,
      'Tỷ Lệ Chi (%)': item.expenseProgress.toFixed(1) + '%',
      'Dự Chi Đơn Hàng PO (VNĐ)': item.totalPendingOrdersAmount,
      'Dòng Tiền Ròng Hiện Tại (VNĐ)': item.netCashflow,
      'Dòng Tiền Dự Kiến Sau Khi Chi PO (VNĐ)': item.forecastedNetCashflow,
      'Tỷ Suất Lợi Nhuận (%)': item.profitMargin.toFixed(1) + '%',
    }));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `So_Thu_Chi_Dong_Tien_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ============================================================== */}
      {/* 1. HEADER SECTION (TIÊU ĐỀ & CÁC NÚT HÀNH ĐỘNG THU - CHI)      */}
      {/* ============================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-800 border border-sky-200">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              SỔ GIAO DỊCH THU - CHI THEO DỰ ÁN
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý dòng tiền thực tế: Thu nhập từ dự án và Chi phí cho dự án, tổng hợp tự động theo từng công trình
          </p>
        </div>

        {/* Nút Lập Phiếu Thu, Lập Phiếu Chi, Đồng Bộ PO, Xuất Excel */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút + Lập Phiếu Thu (Màu xanh lá) */}
          <button
            type="button"
            onClick={() => {
              setPreselectedProjForAction(undefined);
              setIsReceiptModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            title="Lập phiếu thu tiền tạm ứng, nghiệm thu đợt từ Chủ Đầu Tư"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lập Phiếu Thu</span>
          </button>

          {/* Nút - Lập Phiếu Chi (Màu đỏ/rose) */}
          <button
            type="button"
            onClick={() => {
              setPreselectedPoForPayment(null);
              setIsPaymentModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            title="Lập phiếu chi thanh toán vật tư, nhân công, dịch vụ (đồng bộ với PO)"
          >
            <Minus className="w-4 h-4" />
            <span>- Lập Phiếu Chi</span>
          </button>

          {/* Nút Đồng Bộ từ PO */}
          <button
            type="button"
            onClick={() => setActiveSubTab('pending_po')}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'pending_po'
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-amber-50/70 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
            title="Xem danh sách đơn hàng PO chưa thanh toán và lập phiếu chi đồng bộ"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Đồng bộ từ PO ({pendingOrders.length})</span>
          </button>

          {/* Nút Nạp Lại Chuẩn */}
          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              title="Nạp lại dữ liệu dòng tiền chuẩn"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Nút Xuất Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            title="Xuất bảng Excel cân đối thu chi & dòng tiền"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BỐN THẺ KPI DÒNG TIỀN (CHUẨN THEO HÌNH ẢNH USER)           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Thẻ 1: Tổng thu nhập dự án */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>TỔNG THU NHẬP DỰ ÁN</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 mt-1">
            {formatVND(companyTotals.totalIncome)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Đã thu từ CĐT &amp; nghiệm thu</span>
            <span className="font-semibold text-slate-700 font-mono">
              {filteredTransactions.filter((t) => t.type === 'revenue').length} phiếu thu
            </span>
          </div>
        </div>

        {/* Thẻ 2: Tổng chi phí dự án */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>TỔNG CHI PHÍ DỰ ÁN</span>
            <span className="p-1 rounded-lg bg-rose-50 text-rose-600"><TrendingDown className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-700 mt-1">
            {formatVND(companyTotals.totalExpense)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Vật tư + Thầu phụ + Nhân công</span>
            <span className="font-semibold text-slate-700 font-mono">
              {filteredTransactions.filter((t) => t.type !== 'revenue').length} phiếu chi
            </span>
          </div>
        </div>

        {/* Thẻ 3: Dòng tiền ròng (Thu - Chi) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>DÒNG TIỀN RÒNG (THU - CHI)</span>
            <span className="p-1 rounded-lg bg-sky-50 text-sky-600"><CreditCard className="w-4 h-4" /></span>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${companyTotals.netCashflow >= 0 ? 'text-sky-900' : 'text-rose-700'}`}>
            {companyTotals.netCashflow >= 0 ? '+' : ''}{formatVND(companyTotals.netCashflow)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Chênh lệch Thu thuần - Chi phí</span>
            <span className="font-bold text-emerald-700">Biên LN: {companyTotals.profitMargin.toFixed(1)}%</span>
          </div>
        </div>

        {/* Thẻ 4: Dự chi từ đơn hàng PO chưa thanh toán (YÊU CẦU: QUẢN LÝ DÒNG TIỀN CẦN PHẢI CHI) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
            <span>DỰ CHI TỪ ĐƠN HÀNG (CẦN CHI)</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-600"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 mt-1">
            {formatVND(companyTotals.totalPending)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{pendingOrders.length} đơn PO chưa thanh toán</span>
            <button
              type="button"
              onClick={() => setActiveSubTab('pending_po')}
              className="text-amber-800 font-bold hover:underline cursor-pointer"
            >
              Xem chi tiết →
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TABS PHỤ: THỐNG KÊ DA | NHẬT KÝ | DỰ CHI | BIỂU ĐỒ           */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('summary')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'summary'
                ? 'bg-[#102742] text-white shadow-2xs font-black'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>THỐNG KÊ THEO DỰ ÁN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ledger')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-[#102742] text-white shadow-2xs font-black'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>SỔ NHẬT KÝ GIAO DỊCH ({filteredTransactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pending_po')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'pending_po'
                ? 'bg-amber-600 text-white shadow-2xs font-black'
                : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>DỰ CHI TỪ ĐƠN HÀNG ({pendingOrders.length} PO CẦN CHI)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('charts')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'charts'
                ? 'bg-[#102742] text-white shadow-2xs font-black'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>BIỂU ĐỒ &amp; CƠ CẤU CHI PHÍ</span>
          </button>
        </div>

        {/* Dropdown chọn Dự án */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 shrink-0">Dự án:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer min-w-[200px]"
          >
            <option value="all">-- Tất cả {projects.length} dự án --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. NỘI DUNG TAB 1: BẢNG CÂN ĐỐI THU NHẬP - CHI PHÍ (HÌNH ẢNH)   */}
      {/* ============================================================== */}
      {activeSubTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="font-black text-slate-800 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>BẢNG CÂN ĐỐI THU NHẬP - CHI PHÍ &amp; DÒNG TIỀN THEO TỪNG DỰ ÁN</span>
              </div>
              <span className="text-[11px] text-slate-500 italic">
                Giá trị hợp đồng bao gồm Phụ lục phát sinh (PLHĐ) • Khớp nối tự động với sổ dòng tiền
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#102742] text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-2.5 w-12 text-center">STT</th>
                    <th className="py-3 px-3 w-64">Dự Án / Chủ Đầu Tư</th>
                    <th className="py-3 px-3 text-right w-36">Giá Trị Hợp Đồng</th>
                    <th className="py-3 px-3 text-right w-36 bg-emerald-950/60">Tổng Thu Nhập (+)</th>
                    <th className="py-3 px-3 text-right w-36 bg-rose-950/60">Tổng Chi Phí (-)</th>
                    <th className="py-3 px-3 text-right w-36">Dòng Tiền Ròng</th>
                    <th className="py-3 px-3 text-center w-24">Tỷ Suất LN</th>
                    <th className="py-3 px-3 text-center w-40">Tiến Độ Dòng Tiền</th>
                    <th className="py-3 px-3 text-center w-36">Thao Tác Nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjectBalances.map((item, index) => {
                    const isDeficit = item.netCashflow < 0;

                    return (
                      <tr key={item.project.id} className={`hover:bg-sky-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        {/* 1. STT */}
                        <td className="py-3.5 px-2.5 text-center font-bold text-slate-500 font-mono">
                          {index + 1}
                        </td>

                        {/* 2. DỰ ÁN / CHỦ ĐẦU TƯ */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono font-bold text-[10.5px] px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                              {item.project.code}
                            </span>
                            <span className="font-bold text-slate-900 text-xs line-clamp-1">
                              {item.project.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>CĐT: <strong className="text-slate-700">{item.project.client}</strong></span>
                            <span>•</span>
                            <span>CHT: <strong className="text-slate-700">{item.project.manager}</strong></span>
                          </div>
                        </td>

                        {/* 3. GIÁ TRỊ HỢP ĐỒNG */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatVND(item.contractValue)}
                        </td>

                        {/* 4. TỔNG THU NHẬP (+) */}
                        <td className="py-3.5 px-3 text-right bg-emerald-50/20">
                          <div className="font-mono font-bold text-emerald-800">
                            +{formatVND(item.totalIncome)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.incomeProgress.toFixed(1)}% HĐ ({item.revenuesCount} phiếu)
                          </div>
                        </td>

                        {/* 5. TỔNG CHI PHÍ (-) */}
                        <td className="py-3.5 px-3 text-right bg-rose-50/20">
                          <div className={`font-mono font-bold ${item.totalPaidExpenses > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                            -{formatVND(item.totalPaidExpenses)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.expenseProgress.toFixed(1)}% HĐ ({item.expensesCount} phiếu)
                          </div>
                        </td>

                        {/* 6. DÒNG TIỀN RÒNG */}
                        <td className="py-3.5 px-3 text-right">
                          <div className={`font-mono font-black ${item.netCashflow >= 0 ? 'text-sky-900' : 'text-rose-700'}`}>
                            {item.netCashflow >= 0 ? '+' : ''}{formatVND(item.netCashflow)}
                          </div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${item.netCashflow >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
                            {item.netCashflow >= 0 ? 'Dòng tiền dương' : 'Chi vượt thu'}
                          </div>
                        </td>

                        {/* 7. TỶ SUẤT LN */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold inline-block ${
                            item.profitMargin >= 30
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.profitMargin >= 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        </td>

                        {/* 8. TIẾN ĐỘ DÒNG TIỀN (Thu xanh, Chi đỏ) */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-1 w-32 mx-auto">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>Thu: {item.incomeProgress.toFixed(0)}%</span>
                              <span>Chi: {item.expenseProgress.toFixed(0)}%</span>
                            </div>
                            {/* Bar thu */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, item.incomeProgress)}%` }}
                              />
                            </div>
                            {/* Bar chi */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-rose-500"
                                style={{ width: `${Math.min(100, item.expenseProgress)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 9. THAO TÁC NHANH (Xem chi tiết, + Thu, - Chi) */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(item.project.id);
                                setActiveSubTab('ledger');
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-sky-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Xem sổ chi tiết thu chi của dự án này"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPreselectedProjForAction(item.project.id);
                                setIsReceiptModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-0.5 cursor-pointer shadow-2xs"
                              title="Lập phiếu thu cho dự án này"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Thu</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPreselectedPoForPayment(null);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-0.5 cursor-pointer shadow-2xs"
                              title="Lập phiếu chi cho dự án này"
                            >
                              <Minus className="w-3 h-3" />
                              <span>Chi</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* HÀNG TỔNG CỘNG TOÀN CÔNG TY */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td colSpan={2} className="py-3.5 px-4 text-center font-black uppercase text-slate-900">
                      TỔNG CỘNG TOÀN CÔNG TY:
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900">
                      {formatVND(companyTotals.totalContract)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-800 bg-emerald-100/50">
                      +{formatVND(companyTotals.totalIncome)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-rose-700 bg-rose-100/50">
                      -{formatVND(companyTotals.totalExpense)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-sky-950">
                      {companyTotals.netCashflow >= 0 ? '+' : ''}{formatVND(companyTotals.netCashflow)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-emerald-700">
                      {companyTotals.profitMargin.toFixed(1)}%
                    </td>
                    <td colSpan={2} className="py-3.5 px-3 text-center text-slate-500 font-semibold text-[11px]">
                      {companyTotals.totalTransactions} giao dịch được ghi nhận
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Dòng Thống Kê Phân Tích Dự Chi Cần Chuẩn Bị Vốn */}
          {companyTotals.totalPending > 0 && (
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-black text-amber-950 text-sm">
                    Kế Hoạch Dòng Tiền &amp; Nhu Cầu Dự Chi: {formatVND(companyTotals.totalPending)}
                  </div>
                  <p className="text-slate-600 mt-0.5 text-[11px]">
                    Hiện có <strong>{pendingOrders.length}</strong> đơn hàng PO chưa thanh toán. Dòng tiền ròng thực tế sau khi tất toán toàn bộ PO dự kiến là:{' '}
                    <strong className="text-sky-950 font-mono font-black">
                      {formatVND(companyTotals.netCashflow - companyTotals.totalPending)}
                    </strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('pending_po')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                Xem Danh Sách PO Chờ Chi →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. NỘI DUNG TAB 2: SỔ NHẬT KÝ GIAO DỊCH (THU - CHI)             */}
      {/* ============================================================== */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-4">
          {/* Filter Bar của sổ nhật ký */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLedgerTypeFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    ledgerTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Tất cả ({transactionItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerTypeFilter('revenue')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    ledgerTypeFilter === 'revenue' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Phiếu Thu ({transactionItems.filter((t) => t.type === 'revenue').length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerTypeFilter('expense')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    ledgerTypeFilter === 'expense' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Phiếu Chi ({transactionItems.filter((t) => t.type !== 'revenue').length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã phiếu, nội dung, đối tác..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Bảng Kê Nhật Ký */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3 w-28">Mã Phiếu</th>
                  <th className="py-2.5 px-3 w-28">Loại Phiếu</th>
                  <th className="py-2.5 px-3">Nội Dung Thu / Chi</th>
                  <th className="py-2.5 px-3 w-40">Dự Án Thi Công</th>
                  <th className="py-2.5 px-3 w-40">Đối Tác / CĐT</th>
                  <th className="py-2.5 px-3 text-right w-32">Số Tiền (VNĐ)</th>
                  <th className="py-2.5 px-3 text-center w-24">Ngày Ghi Sổ</th>
                  <th className="py-2.5 px-3 text-center w-28">Hình Thức</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Không tìm thấy giao dịch nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => {
                    const isRev = tx.type === 'revenue';

                    return (
                      <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${isRev ? 'bg-emerald-50/15' : ''}`}>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                          {idx + 1}
                        </td>

                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {tx.code}
                          {tx.linkedPoCode && (
                            <div className="text-[10px] text-sky-700 font-mono flex items-center gap-0.5">
                              <LinkIcon className="w-2.5 h-2.5" />
                              <span>{tx.linkedPoCode}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {isRev ? (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              + Phiếu Thu
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              - Phiếu Chi
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{tx.title}</div>
                          {tx.subDescription && (
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tx.subDescription}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-800 font-medium">
                          {tx.projectName}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 truncate" title={tx.supplier}>
                          {tx.supplier}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className={`font-mono font-bold text-sm ${isRev ? 'text-emerald-800' : 'text-rose-700'}`}>
                            {isRev ? '+' : '-'}{formatVND(tx.totalAmount)}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                          {formatDateVN(tx.date)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.paymentMethod === 'transfer' ? 'Chuyển khoản' : tx.paymentMethod === 'cash' ? 'Tiền mặt' : 'Tạm ứng'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. NỘI DUNG TAB 3: DỰ CHI TỪ ĐƠN HÀNG CHƯA THANH TOÁN (YÊU CẦU) */}
      {/* ============================================================== */}
      {activeSubTab === 'pending_po' && (
        <PendingPayablesTable
          expenses={expenses}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onOpenCreatePaymentForPo={handleOpenCreatePaymentForPo}
        />
      )}

      {/* ============================================================== */}
      {/* 7. NỘI DUNG TAB 4: BIỂU ĐỒ & CƠ CẤU CHI PHÍ                     */}
      {/* ============================================================== */}
      {activeSubTab === 'charts' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>SO SÁNH THU NHẬP - CHI PHÍ - DÒNG TIỀN THEO DỰ ÁN</span>
            </h3>
            <span className="text-xs text-slate-500">Đơn vị tính: Triệu VNĐ</span>
          </div>

          <div className="space-y-4 pt-2">
            {filteredProjectBalances.map((item) => {
              const incomeMil = Math.round(item.totalIncome / 1000000);
              const expenseMil = Math.round(item.totalPaidExpenses / 1000000);
              const maxVal = Math.max(incomeMil, expenseMil, 100);

              return (
                <div key={item.project.id} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">{item.project.code}: {item.project.name}</span>
                    <span className={item.netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      Dòng tiền ròng: {formatVND(item.netCashflow)}
                    </span>
                  </div>

                  {/* Thanh so sánh Thu */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Thu: {formatVND(item.totalIncome)}</span>
                      <span>Chi: {formatVND(item.totalPaidExpenses)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-3"
                        style={{ width: `${Math.min(100, (incomeMil / maxVal) * 100)}%` }}
                        title={`Thu: ${formatVND(item.totalIncome)}`}
                      />
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 flex overflow-hidden">
                      <div
                        className="bg-rose-500 h-3"
                        style={{ width: `${Math.min(100, (expenseMil / maxVal) * 100)}%` }}
                        title={`Chi: ${formatVND(item.totalPaidExpenses)}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODALS LẬP PHIẾU THU & LẬP PHIẾU CHI                         */}
      {/* ============================================================== */}
      {isReceiptModalOpen && (
        <CreateReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          projects={projects}
          preselectedProjectId={preselectedProjForAction}
          onSaveReceipt={handleSaveReceipt}
        />
      )}

      {isPaymentModalOpen && (
        <CreatePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPreselectedPoForPayment(null);
          }}
          projects={projects}
          expenses={expenses}
          preselectedPo={preselectedPoForPayment}
          onSavePayment={handleSavePayment}
        />
      )}
    </div>
  );
};
