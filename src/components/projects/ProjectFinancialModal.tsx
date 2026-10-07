import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package, 
  Truck, 
  Coffee, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Layers,
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import { Project, ExpenseItem } from '../../types';
import { formatVND, formatDateVN, formatTy } from '../../utils/formatters';
import { calculateProjectFinances } from '../../utils/projectFinance';

interface ProjectFinancialModalProps {
  project: Project;
  expenses: ExpenseItem[];
  isOpen: boolean;
  onClose: () => void;
  onAddExpense?: (expense: ExpenseItem) => void;
}

export const ProjectFinancialModal: React.FC<ProjectFinancialModalProps> = ({
  project,
  expenses,
  isOpen,
  onClose,
  onAddExpense,
}) => {
  if (!isOpen) return null;

  // Tính toán tài chính dự án chuẩn xác từ Phiếu Thu và các khoản chi thực tế
  const fin = calculateProjectFinances(project, expenses);

  const {
    totalAfterPLHD: totalRevenue,
    collected: collectedAmount,
    remainingToCollect,
    collectedPercentage: collectedPct,
    receipts,
    receiptsCount,
    laborExpenses,
    labor: laborTotal,
    materialExpenses,
    material: materialTotal,
    transportExpenses,
    transport: transportTotal,
    mealAndOtherExpenses,
    mealAndOther: mealTotal,
    totalSpent,
    grossProfit,
    profitMargin,
    cashBalance,
    expensesCount
  } = fin;

  // Filter tab bên trong modal: 'all' | 'receipts' | 'labor' | 'material' | 'other'
  const [filterType, setFilterType] = useState<'all' | 'receipts' | 'labor' | 'material' | 'other'>('all');

  const displayedExpenses = (projectExpenses: ExpenseItem[]) => {
    if (filterType === 'labor') return laborExpenses;
    if (filterType === 'material') return materialExpenses;
    if (filterType === 'other') return [...transportExpenses, ...mealAndOtherExpenses];
    return projectExpenses;
  };

  const currentExpenses = expenses.filter(
    (e) => (fin.laborExpenses.includes(e) || fin.materialExpenses.includes(e) || fin.transportExpenses.includes(e) || fin.mealAndOtherExpenses.includes(e))
  );

  const displayedList = displayedExpenses(currentExpenses);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-sky-600 px-2 py-0.5 rounded text-white">
                {project.code}
              </span>
              <h3 className="font-bold text-base text-white">
                Báo Cáo Thu - Chi &amp; Chi Phí Nhân Công Dự Án
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">
              {project.name} • CĐT: <strong className="text-white">{project.client}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Dashboard */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
          {/* Card 1: Doanh thu HĐ */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Doanh thu sau PLHĐ</span>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900 mt-0.5">
              {formatVND(totalRevenue)}
            </div>
            <div className="text-[10.5px] text-slate-500 mt-1 flex justify-between">
              <span>Đã thu CĐT:</span>
              <strong className="text-sky-700">{formatVND(collectedAmount)} ({collectedPct.toFixed(0)}%)</strong>
            </div>
          </div>

          {/* Card 2: Chi phí Nhân công */}
          <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-purple-800">Chi phí Nhân công</span>
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-purple-900 mt-0.5">
              {formatVND(laborTotal)}
            </div>
            <div className="text-[10.5px] text-purple-700 mt-1 flex justify-between">
              <span>{laborExpenses.length} đợt chi trả</span>
              <span>Dự toán: {formatVND(project.laborBudget || 0)}</span>
            </div>
          </div>

          {/* Card 3: Chi phí Vật tư */}
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-800">Chi phí Vật tư / PO</span>
              <Package className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-blue-900 mt-0.5">
              {formatVND(materialTotal)}
            </div>
            <div className="text-[10.5px] text-blue-700 mt-1 flex justify-between">
              <span>{materialExpenses.length} đơn hàng</span>
              <span>Dự toán: {formatVND(project.materialBudget || 0)}</span>
            </div>
          </div>

          {/* Card 4: Tổng chi & Lợi nhuận gộp */}
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Lợi nhuận gộp</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-emerald-900 mt-0.5">
              {formatVND(grossProfit)}
            </div>
            <div className="text-[10.5px] text-emerald-700 mt-1 flex justify-between">
              <span>Tổng chi: {formatVND(totalSpent)}</span>
              <strong>{profitMargin.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Secondary Details: Transport, Meals, Cash Balance */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>Xe cẩu / Vận chuyển: <strong className="font-mono text-slate-900">{formatVND(transportTotal)}</strong></span>
            </span>

            <span className="flex items-center gap-1.5 text-slate-700">
              <Coffee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cơm ca &amp; Tiếp khách: <strong className="font-mono text-slate-900">{formatVND(mealTotal + otherTotal)}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Dòng tiền tại site (Đã thu CĐT - Tổng chi):</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${cashBalance >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {cashBalance >= 0 ? '+' : ''}{formatVND(cashBalance)}
            </span>
          </div>
        </div>

        {/* Content Body: Bảng kê chi phí */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {/* Sub Filters */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs flex-wrap">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded font-bold transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
              >
                Tất cả chi phí ({currentExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('receipts')}
                className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${filterType === 'receipts' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:bg-emerald-50'}`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Phiếu Thu CĐT ({receipts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('labor')}
                className={`px-3 py-1 rounded font-bold transition-all ${filterType === 'labor' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                Nhân công ({laborExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('material')}
                className={`px-3 py-1 rounded font-bold transition-all ${filterType === 'material' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                Vật tư / PO ({materialExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('other')}
                className={`px-3 py-1 rounded font-bold transition-all ${filterType === 'other' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                Xe cẩu &amp; Khác ({transportExpenses.length + mealAndOtherExpenses.length})
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Đang hiển thị <strong>{filterType === 'receipts' ? receipts.length : displayedList.length}</strong> chứng từ
            </span>
          </div>

          {/* Table for Receipts */}
          {filterType === 'receipts' ? (
            receipts.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-dashed border-emerald-300 space-y-2">
                <Receipt className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-emerald-900 text-xs">Chưa có Phiếu Thu nào được lập cho dự án này</p>
                <p className="text-[11px] text-slate-500">
                  Số tiền đã thu từ Chủ đầu tư (CĐT) sẽ tự động hiển thị chính xác theo từng Phiếu Thu phát sinh trong hệ thống.
                </p>
              </div>
            ) : (
              <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-emerald-50 text-emerald-900 font-bold text-[11px] uppercase border-b border-emerald-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3 w-28">Mã Phiếu Thu</th>
                      <th className="py-2.5 px-3">Nội Dung Thu Tiền / Đợt Tạm Ứng</th>
                      <th className="py-2.5 px-3 w-40">Chủ Đầu Tư / Người Nộp</th>
                      <th className="py-2.5 px-3 text-right w-32">Số Tiền Thu (VNĐ)</th>
                      <th className="py-2.5 px-3 text-center w-24">Ngày Thu</th>
                      <th className="py-2.5 px-3 text-center w-24">Hình Thức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {receipts.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                          {item.code}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.title}</div>
                          {item.subDescription && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.subDescription}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                          {item.receiverOrPayer || item.supplier || project.client}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                          +{formatVND(item.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                          {formatDateVN(item.date)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {item.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Table for Expenses */
            displayedList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">Chưa có phiếu chi nào thuộc danh mục này</p>
                <p className="text-[11px] text-slate-400">
                  Các phiếu chi tạo ở tab Đơn Hàng / Giao Dịch gán dự án này sẽ tự động tổng hợp vào đây.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3 w-28">Mã Phiếu / PO</th>
                      <th className="py-2.5 px-3 w-28">Phân Loại</th>
                      <th className="py-2.5 px-3">Nội Dung Chi Phí / Nhân Công</th>
                      <th className="py-2.5 px-3 w-36">Đối Tác / Đội Thợ</th>
                      <th className="py-2.5 px-3 text-right w-28">Số Tiền (VNĐ)</th>
                      <th className="py-2.5 px-3 text-center w-24">Ngày Chi</th>
                      <th className="py-2.5 px-3 text-center w-24">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedList.map((item, idx) => {
                      const isLabor = laborExpenses.includes(item);
                      return (
                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLabor ? 'bg-purple-50/20' : ''}`}>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {item.code}
                          </td>
                          <td className="py-2.5 px-3">
                            {isLabor ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                👷 Nhân công
                              </span>
                            ) : item.category === 'material' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                📦 Vật tư
                              </span>
                            ) : item.category === 'transport' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                🚚 Xe cẩu
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                🍲 Cơm ca
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.title}</div>
                            {item.subDescription && (
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.subDescription}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 text-[11px] truncate" title={item.supplier}>
                            {item.supplier}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatVND(item.totalAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                            {formatDateVN(item.date)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status === 'paid' ? 'Đã chi' : item.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center shrink-0 text-xs">
          <div className="text-slate-600">
            <span>Tổng chi tại công trình: <strong className="font-mono text-rose-700 font-bold">{formatVND(totalSpent)}</strong></span>
            <span className="mx-2">•</span>
            <span>Lợi nhuận gộp: <strong className="font-mono text-emerald-800 font-bold">{formatVND(grossProfit)} ({profitMargin.toFixed(1)}%)</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
