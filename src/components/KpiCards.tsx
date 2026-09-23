import React from 'react';
import { ShoppingBag, TrendingUp, DollarSign, PieChart, AlertCircle } from 'lucide-react';
import { ExpenseItem, Project } from '../types';
import { formatVND } from '../utils/formatters';

interface KpiCardsProps {
  expenses: ExpenseItem[];
  allExpenses: ExpenseItem[];
  projects: Project[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  expenses,
  allExpenses,
  projects,
}) => {
  // Pending count
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const filteredCount = expenses.length;
  const totalCount = allExpenses.length;

  // Total filtered expenses
  const totalFilteredExpense = expenses.reduce((sum, item) => sum + item.totalAmount, 0);

  // Breakdown of categories in filtered items
  const materialCost = expenses
    .filter((e) => e.category === 'material')
    .reduce((sum, item) => sum + item.totalAmount, 0);
  const transportCost = expenses
    .filter((e) => e.category === 'transport')
    .reduce((sum, item) => sum + item.totalAmount, 0);
  const mealCost = expenses
    .filter((e) => e.category === 'overtime_meal')
    .reduce((sum, item) => sum + item.totalAmount, 0);

  // Total revenue from projects
  const totalProjectRevenue = projects.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0);

  // Gross profit = Total Revenue - Total Expense
  const totalAllExpensesCost = allExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const grossProfit = Math.max(0, totalProjectRevenue - totalAllExpensesCost);
  const profitMargin = totalProjectRevenue > 0 
    ? ((grossProfit / totalProjectRevenue) * 100).toFixed(1) 
    : '0';

  const avgRevenuePerPrj = projects.length > 0 
    ? Math.round(totalProjectRevenue / projects.length) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
      {/* CARD 1: Tổng đơn mua hàng / phiếu chi */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
          <span>TỔNG ĐƠN MUA HÀNG & PHIẾU CHI</span>
          <ShoppingBag className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-600 font-mono">
              {filteredCount}
            </span>
            <span className="text-slate-400 font-semibold text-lg font-mono">
              / {totalCount}
            </span>
          </div>
          {pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              <AlertCircle className="w-3 h-3 text-amber-700" />
              Cần xử lý
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Đã duyệt hết
            </span>
          )}
        </div>
        <div className="mt-2 text-xs text-slate-600 font-medium flex items-center justify-between">
          <span className="text-rose-600 font-semibold">{pendingCount} đơn chờ phê duyệt</span>
          <span className="text-slate-400 text-[11px]">Kỳ hiện tại</span>
        </div>
      </div>

      {/* CARD 2: Tổng chi phí mua hàng & site */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
          <span>TỔNG CHI PHÍ MUA HÀNG & SITE</span>
          <DollarSign className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-1">
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatVND(totalFilteredExpense)}
          </div>
        </div>
        <div className="mt-2 text-[11.5px] text-slate-500 leading-tight">
          <div className="flex items-center justify-between">
            <span>Vật tư M&E + Vận chuyển + Cơm ca</span>
          </div>
          <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">
            VT: {formatVND(materialCost)} | VC: {formatVND(transportCost)} | Ăn: {formatVND(mealCost)}
          </div>
        </div>
      </div>

      {/* CARD 3: Doanh thu thực thu dự án */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
          <span>DOANH THU THỰC THU DỰ ÁN</span>
          <TrendingUp className="w-4 h-4 text-sky-500" />
        </div>
        <div className="mt-1">
          <div className="text-xl sm:text-2xl font-black text-sky-600 font-mono tracking-tight">
            {formatVND(totalProjectRevenue)}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Bình quân {formatVND(avgRevenuePerPrj)}/dự án</span>
        </div>
      </div>

      {/* CARD 4: Lợi nhuận gộp dự án */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
          <span>LỢI NHUẬN GỘP DỰ ÁN</span>
          <PieChart className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-1">
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
            {formatVND(grossProfit)}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
          <span className="font-semibold text-emerald-700">
            Tỷ suất: <span className="font-bold">{profitMargin}%</span> doanh thu
          </span>
          <span className="text-slate-400 text-[11px]">{projects.length} dự án thi công</span>
        </div>
      </div>
    </div>
  );
};
