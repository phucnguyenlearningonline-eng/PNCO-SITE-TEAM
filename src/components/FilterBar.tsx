import React from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  FileSpreadsheet, 
  PlusCircle,
  X
} from 'lucide-react';
import { FilterState, Project } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  projects: Project[];
  totalFilteredCount: number;
  onExportExcel: () => void;
  onOpenCreateModal: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  projects,
  totalFilteredCount,
  onExportExcel,
  onOpenCreateModal,
}) => {
  const months = [
    { value: 'all', label: 'Toàn bộ các tháng' },
    { value: '2026-09', label: 'Tháng Chín 2026' },
    { value: '2026-08', label: 'Tháng Tám 2026' },
    { value: '2026-07', label: 'Tháng Bảy 2026' },
  ];

  const currentMonthIndex = months.findIndex((m) => m.value === filters.month);

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      onFilterChange({ ...filters, month: months[currentMonthIndex - 1].value });
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < months.length - 1 && currentMonthIndex !== -1) {
      onFilterChange({ ...filters, month: months[currentMonthIndex + 1].value });
    }
  };

  const currentMonthLabel = months.find((m) => m.value === filters.month)?.label || 'Tháng Chín 2026';

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-4 overflow-hidden">
      {/* Top Banner of Filter */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>BẢNG QUẢN LÝ ĐƠN MUA HÀNG & CHI TIÊU THI CÔNG</span>
            <span className="text-slate-400 font-normal">—</span>
            <span className="text-sky-800 uppercase font-bold">KỲ {currentMonthLabel}</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
              {totalFilteredCount} giao dịch
            </span>
          </h2>
        </div>

        {/* Date Month Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <span className="text-xs text-slate-600 font-medium mr-1">Kỳ xem:</span>
          
          <button
            onClick={handlePrevMonth}
            disabled={currentMonthIndex <= 0}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Tháng trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <select
            value={filters.month}
            onChange={(e) => onFilterChange({ ...filters, month: e.target.value })}
            className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer py-0.5 pl-1 pr-6"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            disabled={currentMonthIndex >= months.length - 1 || currentMonthIndex === -1}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Tháng sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="p-3 sm:p-4 flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Tìm mã PO, vật tư, NCC, xe cẩu, kỹ sư..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 hover:bg-white transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Project Selector */}
        <div className="min-w-[170px]">
          <select
            value={filters.projectId}
            onChange={(e) => onFilterChange({ ...filters, projectId: e.target.value })}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white cursor-pointer"
          >
            <option value="all">Tất cả dự án ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector (Vật tư, Vận chuyển, Cơm tăng ca...) */}
        <div className="min-w-[160px]">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white cursor-pointer font-medium text-slate-700"
          >
            <option value="all">Tất cả phân loại chi</option>
            <option value="material">🧱 Chi phí vật tư M&E</option>
            <option value="transport">🚚 Chi phí vận chuyển & cẩu kéo</option>
            <option value="overtime_meal">🍱 Chi phí đồ ăn tăng ca</option>
            <option value="labor_sub">🛠️ Nhân công phụ & dịch vụ</option>
            <option value="other">📌 Chi phí khác</option>
          </select>
        </div>

        {/* Status Selector */}
        <div className="min-w-[140px]">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">⏳ Chờ phê duyệt</option>
            <option value="approved">✓ Đã phê duyệt</option>
            <option value="paid">💰 Đã thanh toán / Đã chi</option>
            <option value="rejected">✕ Từ chối</option>
          </select>
        </div>

        {/* Checkbox: Chỉ hiện đơn chờ duyệt */}
        <button
          onClick={() => onFilterChange({ ...filters, onlyPending: !filters.onlyPending })}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
            filters.onlyPending
              ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-2xs'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
          title="Lọc nhanh các khoản chi cần phê duyệt"
        >
          <Filter className={`w-3.5 h-3.5 ${filters.onlyPending ? 'text-amber-700' : 'text-slate-500'}`} />
          <span>Chỉ hiện đơn chờ duyệt</span>
        </button>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Xuất Excel */}
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white transition-all shadow-sm"
            title="Xuất danh sách theo bộ lọc ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          {/* Tạo Đơn Mua Mới */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#004e89] hover:bg-[#003865] text-white transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Tạo đơn mua mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
