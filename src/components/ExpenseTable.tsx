import React, { useState, useMemo } from 'react';
import { SortableHeader } from './common/SortableHeader';
import { SortDirection, naturalCompareCode, parseDateTimestamp } from '../utils/sortUtils';
import { 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  Eye, 
  Printer,
  FileText, 
  AlertCircle,
  Truck,
  Utensils,
  Package,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { ExpenseItem, User } from '../types';
import { 
  formatDateVN, 
  formatNumber, 
  getCategoryLabel, 
  getCategoryBadgeClass,
  getPriorityLabel, 
  getPriorityBadgeClass,
  getStatusLabel,
  getStatusBadgeClass
} from '../utils/formatters';

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  currentUser: User;
  onApprove: (item: ExpenseItem) => void;
  onReject: (item: ExpenseItem) => void;
  onPay: (item: ExpenseItem) => void;
  onEdit: (item: ExpenseItem) => void;
  onDelete: (item: ExpenseItem) => void;
  onViewDetails: (item: ExpenseItem) => void;
  onPrint?: (item: ExpenseItem) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  currentUser,
  onApprove,
  onReject,
  onPay,
  onEdit,
  onDelete,
  onViewDetails,
  onPrint,
}) => {
  const canApprove = currentUser.role === 'director' || currentUser.role === 'accountant';

  // Quản lý trạng thái sắp xếp cột
  const [sortKey, setSortKey] = useState<string>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'date' || key === 'amount' || key === 'totalAmount' ? 'desc' : 'asc');
    }
  };

  const handleResetSort = () => {
    setSortKey('code');
    setSortDirection('desc');
  };

  // Sắp xếp danh sách đơn hàng theo cột được chọn
  const sortedExpenses = useMemo(() => {
    const list = [...expenses.filter(Boolean)];
    return list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'code':
        case 'stt':
          cmp = naturalCompareCode(a.code, b.code);
          break;
        case 'date': {
          const tA = parseDateTimestamp(a.date);
          const tB = parseDateTimestamp(b.date);
          cmp = tA - tB;
          if (cmp === 0) cmp = naturalCompareCode(a.code, b.code);
          break;
        }
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '', 'vi');
          break;
        case 'projectName':
          cmp = (a.projectName || '').localeCompare(b.projectName || '', 'vi');
          break;
        case 'supplier':
          cmp = (a.supplier || '').localeCompare(b.supplier || '', 'vi');
          break;
        case 'createdByName':
          cmp = (a.createdByName || '').localeCompare(b.createdByName || '', 'vi');
          break;
        case 'amount':
          cmp = (Number(a.amount) || 0) - (Number(b.amount) || 0);
          break;
        case 'vatAmount':
          cmp = (Number(a.vatAmount) || 0) - (Number(b.vatAmount) || 0);
          break;
        case 'totalAmount':
          cmp = (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0);
          break;
        case 'priority':
          cmp = (a.priority || '').localeCompare(b.priority || '');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          cmp = naturalCompareCode(a.code, b.code);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [expenses, sortKey, sortDirection]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'material':
        return <Package className="w-3.5 h-3.5 text-blue-600 inline mr-1" />;
      case 'transport':
        return <Truck className="w-3.5 h-3.5 text-amber-600 inline mr-1" />;
      case 'overtime_meal':
        return <Utensils className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500 inline mr-1" />;
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy đơn hàng mua vật tư nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Chỉ các đơn đặt hàng mua vật tư &amp; thiết bị M&amp;E (PO) được hiển thị tại đây. Hợp đồng nhân công được quản lý tại tab "Quản Lý Hợp Đồng", các chi phí site khác nằm tại tab "Giao Dịch (Thu - Chi)".
        </p>
      </div>
    );
  }

  // Calculate table totals
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalVat = expenses.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalPayment = expenses.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Thanh hiển thị trạng thái sắp xếp */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-600" />
            <span>Thứ tự hiển thị:</span>
          </span>
          <span className="font-extrabold text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200">
            {sortKey === 'code' ? 'MÃ ĐƠN HÀNG (PO)' : sortKey === 'date' ? 'NGÀY ĐẶT' : sortKey === 'totalAmount' ? 'TỔNG THANH TOÁN' : sortKey === 'amount' ? 'TIỀN HÀNG' : sortKey === 'supplier' ? 'NHÀ CUNG CẤP' : sortKey === 'projectName' ? 'DỰ ÁN' : sortKey} 
            {' '}({sortDirection === 'desc' ? 'Từ trên xuống / Giảm dần ▼' : 'Từ dưới lên / Tăng dần ▲'})
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Bấm vào tiêu đề cột để đảo chiều ▲ / ▼)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Đảo Chiều Sắp Xếp: Từ Trên Xuống / Từ Dưới Lên (Mũi tên lên xuống rõ nét) */}
          <button
            type="button"
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
              sortDirection === 'desc'
                ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title="Bấm để đảo chiều: Từ trên xuống (Giảm dần ⬇️) hoặc Từ dưới lên (Tăng dần ⬆️)"
          >
            {sortDirection === 'desc' ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-rose-600 stroke-[2.8]" />
                <span>Thứ tự: Từ trên xuống (Mới nhất) ▼</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.8]" />
                <span>Thứ tự: Từ dưới lên (Cũ nhất) ▲</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetSort}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            title="Đặt lại thứ tự theo mã đơn hàng"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Thứ tự chuẩn</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#102742] text-white font-bold tracking-wider uppercase text-[11px] select-none">
              <SortableHeader
                label="STT"
                sortKey="stt"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="center"
                className="w-12 border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="MÃ ĐƠN HÀNG (PO)"
                sortKey="code"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="left"
                className="min-w-[130px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="TÊN VẬT TƯ / HÀNG HÓA M&E"
                sortKey="title"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="left"
                className="min-w-[260px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="DỰ ÁN THI CÔNG"
                sortKey="projectName"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="left"
                className="min-w-[170px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="NHÀ CUNG CẤP / ĐƠN VỊ"
                sortKey="supplier"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="left"
                className="min-w-[170px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="NGƯỜI LẬP"
                sortKey="createdByName"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="left"
                className="min-w-[140px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="NGÀY ĐẶT"
                sortKey="date"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="center"
                className="min-w-[105px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="TIỀN HÀNG"
                sortKey="amount"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
                className="min-w-[115px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="THUẾ VAT"
                sortKey="vatAmount"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
                className="min-w-[100px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="TỔNG THANH TOÁN"
                sortKey="totalAmount"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
                className="min-w-[130px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="ƯU TIÊN"
                sortKey="priority"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="center"
                className="min-w-[90px] border-r border-[#1d3d63]"
              />
              <SortableHeader
                label="TRẠNG THÁI"
                sortKey="status"
                currentSortKey={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="center"
                className="min-w-[115px] border-r border-[#1d3d63]"
              />
              <th className="py-3 px-3 text-center min-w-[110px]">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedExpenses.map((item, index) => {
              const isEven = index % 2 === 1;
              return (
                <tr 
                  key={item.id} 
                  className={`transition-colors hover:bg-sky-50/70 group ${
                    isEven ? 'bg-slate-50/40' : 'bg-white'
                  }`}
                >
                  {/* STT */}
                  <td className="py-3 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                    {index + 1}
                  </td>

                  {/* Mã PO */}
                  <td className="py-3 px-3.5 border-r border-slate-200 font-mono font-bold text-sky-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button 
                        onClick={() => onViewDetails(item)}
                        className="hover:underline hover:text-sky-600 focus:outline-none"
                      >
                        {item.code}
                      </button>
                      {(item.hasContract || item.contractNumber) && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Có HĐ
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tên vật tư / Hạng mục chính */}
                  <td className="py-3 px-4 border-r border-slate-200">
                    <div className="font-semibold text-slate-900 group-hover:text-sky-900 leading-snug">
                      {item.title}
                    </div>
                    {item.subDescription && (
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {item.subDescription}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {item.materialCode && (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#102742] text-sky-300 border border-sky-400">
                          {item.materialCode}
                        </span>
                      )}
                      <span className={`inline-flex items-center text-[10px] px-2 py-0.2 rounded border font-medium ${getCategoryBadgeClass(item.category)}`}>
                        {getCategoryIcon(item.category)}
                        {getCategoryLabel(item.category)}
                      </span>
                      {item.paymentMethod === 'advance_fund' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Tạm ứng site
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dự án thi công */}
                  <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700 font-medium">
                    <span className="line-clamp-2" title={item.projectName}>
                      {item.projectName}
                    </span>
                  </td>

                  {/* Nhà cung cấp / Đơn vị */}
                  <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700">
                    <span className="line-clamp-2 font-medium" title={item.supplier}>
                      {item.supplier}
                    </span>
                  </td>

                  {/* Người lập */}
                  <td className="py-3 px-3.5 border-r border-slate-200">
                    <div className="font-semibold text-slate-900">{item.createdByName}</div>
                    <div className="text-[10.5px] text-slate-500 leading-tight">{item.createdByRole}</div>
                  </td>

                  {/* Ngày đặt */}
                  <td className="py-3 px-3 text-center border-r border-slate-200 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {formatDateVN(item.date)}
                  </td>

                  {/* Tiền hàng (trước thuế) */}
                  <td className="py-3 px-3.5 text-right border-r border-slate-200 font-mono text-slate-800 font-medium whitespace-nowrap">
                    {formatNumber(item.amount)}
                  </td>

                  {/* Thuế VAT */}
                  <td className="py-3 px-3.5 text-right border-r border-slate-200 font-mono font-medium text-rose-600 whitespace-nowrap">
                    {formatNumber(item.vatAmount)}
                  </td>

                  {/* Tổng thanh toán */}
                  <td className="py-3 px-3.5 text-right border-r border-slate-200 font-mono font-bold text-slate-950 text-[12.5px] whitespace-nowrap">
                    {formatNumber(item.totalAmount)}
                  </td>

                  {/* Mức ưu tiên */}
                  <td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10.5px] ${getPriorityBadgeClass(item.priority)}`}>
                      {getPriorityLabel(item.priority)}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* View details */}
                      <button
                        onClick={() => onViewDetails(item)}
                        className="p-1.5 rounded text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Xem chi tiết đơn hàng & hóa đơn"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* In đơn hàng & Xuất PDF (có đầy đủ header công ty) */}
                      <button
                        onClick={() => onPrint ? onPrint(item) : onViewDetails(item)}
                        className="p-1.5 rounded text-sky-700 hover:text-white hover:bg-sky-600 transition-colors"
                        title="In đơn hàng & Xuất file PDF (đầy đủ thông tin công ty)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Approval buttons for Director or Accountant */}
                      {canApprove && item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onApprove(item)}
                            className="p-1.5 rounded text-emerald-600 hover:text-white hover:bg-emerald-600 transition-colors"
                            title="Phê duyệt khoản chi"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onReject(item)}
                            className="p-1.5 rounded text-rose-600 hover:text-white hover:bg-rose-600 transition-colors"
                            title="Từ chối duyệt"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Chỉnh sửa khoản chi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa bản ghi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Table Footer Totals */}
          <tfoot>
            <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
              <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-slate-700">
                TỔNG CỘNG ({expenses.length} GIAO DỊCH):
              </td>
              <td className="py-3 px-3.5 text-right font-mono text-slate-900 border-r border-slate-300 whitespace-nowrap">
                {formatNumber(totalAmount)}
              </td>
              <td className="py-3 px-3.5 text-right font-mono text-rose-600 border-r border-slate-300 whitespace-nowrap">
                {formatNumber(totalVat)}
              </td>
              <td className="py-3 px-3.5 text-right font-mono text-emerald-800 text-sm whitespace-nowrap">
                {formatNumber(totalPayment)}
              </td>
              <td colSpan={3} className="py-3 px-3 text-center text-slate-500 font-normal text-[11px]">
                Đơn vị tính: VNĐ
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
