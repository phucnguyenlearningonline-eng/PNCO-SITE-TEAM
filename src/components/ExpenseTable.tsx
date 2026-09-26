import React from 'react';
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
  Layers
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
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy đơn hàng hoặc khoản chi nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Không có dữ liệu phù hợp với điều kiện lọc hiện tại. Thử thay đổi từ khóa tìm kiếm, dự án hoặc chọn "Toàn bộ các tháng".
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#102742] text-white font-bold tracking-wider uppercase text-[11px] select-none">
              <th className="py-3 px-3 text-center border-r border-[#1d3d63] w-12">STT</th>
              <th className="py-3 px-3.5 border-r border-[#1d3d63] min-w-[110px]">MÃ PO / CHI</th>
              <th className="py-3 px-4 border-r border-[#1d3d63] min-w-[260px]">TÊN VẬT TƯ / HẠNG MỤC CHÍNH</th>
              <th className="py-3 px-3.5 border-r border-[#1d3d63] min-w-[170px]">DỰ ÁN THI CÔNG</th>
              <th className="py-3 px-3.5 border-r border-[#1d3d63] min-w-[170px]">NHÀ CUNG CẤP / ĐƠN VỊ</th>
              <th className="py-3 px-3.5 border-r border-[#1d3d63] min-w-[140px]">NGƯỜI LẬP</th>
              <th className="py-3 px-3 text-center border-r border-[#1d3d63] min-w-[95px]">NGÀY ĐẶT</th>
              <th className="py-3 px-3.5 text-right border-r border-[#1d3d63] min-w-[115px]">TIỀN HÀNG</th>
              <th className="py-3 px-3.5 text-right border-r border-[#1d3d63] min-w-[100px]">THUẾ VAT</th>
              <th className="py-3 px-3.5 text-right border-r border-[#1d3d63] min-w-[130px]">TỔNG THANH TOÁN</th>
              <th className="py-3 px-3 text-center border-r border-[#1d3d63] min-w-[90px]">ƯU TIÊN</th>
              <th className="py-3 px-3 text-center border-r border-[#1d3d63] min-w-[115px]">TRẠNG THÁI</th>
              <th className="py-3 px-3 text-center min-w-[110px]">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {expenses.map((item, index) => {
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
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => onViewDetails(item)}
                        className="hover:underline hover:text-sky-600 focus:outline-none"
                      >
                        {item.code}
                      </button>
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
