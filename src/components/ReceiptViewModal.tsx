import React from 'react';
import { X, Printer, CheckCircle, Clock, Building, UserCheck, FileText } from 'lucide-react';
import { ExpenseItem, User } from '../types';
import { formatDateVN, formatVND, getCategoryLabel, getPriorityLabel, getStatusLabel } from '../utils/formatters';

interface ReceiptViewModalProps {
  item: ExpenseItem | null;
  onClose: () => void;
  currentUser: User;
  onApprove?: (item: ExpenseItem) => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  item,
  onClose,
  currentUser,
  onApprove,
}) => {
  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="no-print bg-[#102742] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm">PHIẾU ĐỀ NGHỊ CHI TIÊU & DUYỆT PO SITE</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-[#18395e] hover:bg-[#204a7a] text-white text-xs flex items-center gap-1.5 px-3 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Kế Toán</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="font-black text-sm text-slate-950 uppercase">
                CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Văn phòng: 70 Nam Kỳ Khởi Nghĩa, Q.1, TP. Hồ Chí Minh
              </div>
              <div className="text-xs text-slate-600">
                Bộ phận: Ban Chỉ Huy Công Trường & Phòng Kế Toán Dự Án
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-sky-800 text-base">{item.code}</div>
              <div className="text-xs text-slate-500">Ngày lập: {formatDateVN(item.date)}</div>
              <div className="text-xs font-semibold text-slate-700">Mẫu số: 02-TT/EPC</div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-wide">
              {item.type === 'po' ? 'PHIẾU ĐẶT HÀNG & DUYỆT MUA VẬT TƯ (PO)' : 'GIẤY ĐỀ NGHỊ THANH TOÁN CHI TIÊU SITE'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 italic">
              (Dành cho việc chi tiêu tại site: vật tư, vận chuyển, cơm tăng ca & dịch vụ hiện trường)
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500">Dự án thi công:</span>{' '}
              <strong className="text-slate-900 font-bold">{item.projectName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Phân loại chi tiêu:</span>{' '}
              <strong className="text-sky-800 font-bold">{getCategoryLabel(item.category)}</strong>
            </div>
            <div>
              <span className="text-slate-500">Người đề nghị / Lập:</span>{' '}
              <strong className="text-slate-900">{item.createdByName}</strong> ({item.createdByRole})
            </div>
            <div>
              <span className="text-slate-500">Đơn vị thụ hưởng / NCC:</span>{' '}
              <strong className="text-slate-900">{item.supplier}</strong>
            </div>
            <div>
              <span className="text-slate-500">Hình thức thanh toán:</span>{' '}
              <strong className="text-slate-900">
                {item.paymentMethod === 'advance_fund'
                  ? 'Tạm ứng quỹ site (Kỹ sư chi trước)'
                  : item.paymentMethod === 'transfer'
                  ? 'Chuyển khoản công ty'
                  : 'Tiền mặt'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Mức độ ưu tiên:</span>{' '}
              <strong className="text-slate-900">{getPriorityLabel(item.priority)}</strong>
            </div>
          </div>

          {/* Line item details */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Nội dung chi tiết / Quy cách</th>
                  <th className="py-2.5 px-3 text-right">Tiền hàng (trước VAT)</th>
                  <th className="py-2.5 px-3 text-right">Thuế VAT ({item.vatRate}%)</th>
                  <th className="py-2.5 px-3 text-right">Tổng thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.title}</div>
                    {item.subDescription && (
                      <div className="text-slate-500 text-[11px] mt-0.5">{item.subDescription}</div>
                    )}
                    {item.notes && (
                      <div className="text-slate-600 text-[11px] mt-1 bg-amber-50 p-1.5 rounded border border-amber-200">
                        Ghi chú: {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium">{formatVND(item.amount)}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-600 font-medium">
                    {formatVND(item.vatAmount)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 text-sm">
                    {formatVND(item.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-bold uppercase text-slate-800">Người Lập Phiếu</div>
              <div className="text-slate-400 text-[10px] italic">(Ký, họ tên)</div>
              <div className="h-16 flex items-center justify-center font-semibold text-slate-700 mt-2">
                {item.createdByName}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-800">Kế Toán Dự Án</div>
              <div className="text-slate-400 text-[10px] italic">(Kiểm tra, xác nhận)</div>
              <div className="h-16 flex items-center justify-center font-semibold text-emerald-700 mt-2">
                {item.status === 'approved' || item.status === 'paid' ? 'Đã kiểm tra ✓' : 'Chờ xác nhận'}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-800">Giám Đốc / Duyệt Chi</div>
              <div className="text-slate-400 text-[10px] italic">(Ký duyệt)</div>
              <div className="h-16 flex items-center justify-center font-semibold text-sky-800 mt-2">
                {item.status === 'approved' || item.status === 'paid' ? 'ĐÃ PHÊ DUYỆT' : 'Chờ duyệt'}
              </div>
            </div>
          </div>

          {/* Action button inside modal if pending */}
          <div className="no-print pt-4 border-t border-slate-200 flex justify-end gap-2">
            {onApprove && item.status === 'pending' && (currentUser.role === 'director' || currentUser.role === 'accountant') && (
              <button
                onClick={() => {
                  onApprove(item);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Phê Duyệt Ngay</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
