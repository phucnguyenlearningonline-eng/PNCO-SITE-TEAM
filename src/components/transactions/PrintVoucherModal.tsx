import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  Edit3, 
  Building, 
  CheckCircle2,
  FileText,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { ExpenseItem, Project } from '../../types';
import { formatDateVN, formatVND, numberToWordsVN } from '../../utils/formatters';

interface PrintVoucherModalProps {
  voucher: ExpenseItem | null;
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (voucher: ExpenseItem) => void;
}

export const PrintVoucherModal: React.FC<PrintVoucherModalProps> = ({
  voucher,
  project,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !voucher) return null;

  const isRevenue = voucher.type === 'revenue';
  const voucherTitle = isRevenue ? 'PHIẾU THU' : 'PHIẾU CHI';
  const voucherFormCode = isRevenue ? 'Mẫu số 01 - TT' : 'Mẫu số 02 - TT';
  const partyRoleTitle = isRevenue ? 'Họ và tên người nộp tiền:' : 'Họ và tên người nhận tiền:';
  const partySignTitle = isRevenue ? 'Người nộp tiền' : 'Người nhận tiền';
  const reasonTitle = isRevenue ? 'Lý do thu:' : 'Lý do chi:';

  const dateObj = voucher.date ? new Date(voucher.date) : new Date();
  const day = !isNaN(dateObj.getDate()) ? String(dateObj.getDate()).padStart(2, '0') : '15';
  const month = !isNaN(dateObj.getMonth()) ? String(dateObj.getMonth() + 1).padStart(2, '0') : '06';
  const year = !isNaN(dateObj.getFullYear()) ? String(dateObj.getFullYear()) : '2026';

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${voucherTitle}_${voucher.code}_PhucNguyen_ME`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-[#102742] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#1d3d63] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`p-1.5 rounded-lg ${isRevenue ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {isRevenue ? <DollarSign className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base uppercase tracking-wide">
                  {voucherTitle} ({voucher.code})
                </h3>
                <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded ${
                  isRevenue ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {voucherFormCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Chứng từ kế toán chính thức • Đầy đủ 5 chữ ký tiêu chuẩn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(voucher);
                }}
                className="p-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs flex items-center gap-1.5 px-3 transition-colors font-semibold cursor-pointer shadow-2xs"
                title="Chỉnh sửa thông tin phiếu này"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chỉnh Sửa Phiếu</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className={`p-2 rounded-xl text-white text-xs flex items-center gap-2 px-4 transition-all font-bold shadow-md cursor-pointer hover:scale-102 ${
                isRevenue ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
              title="In ra máy in hoặc Lưu dưới dạng file PDF (Ctrl + P)"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu (Xuất PDF)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-50 flex-1 flex justify-center">
          <div 
            id="printable-voucher" 
            className="w-full max-w-[800px] bg-white border border-slate-300 shadow-sm p-8 sm:p-12 text-slate-900 space-y-6 text-sm leading-relaxed"
          >
            {/* 1. Header Đơn vị phát hành & Mẫu số */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div className="flex items-start gap-3 flex-1">
                {/* Logo Nhỏ */}
                <div className="w-14 h-14 rounded-lg bg-[#102742] text-white flex flex-col items-center justify-center font-black p-1 shrink-0 border border-sky-400">
                  <span className="text-sm tracking-tighter text-sky-300 font-mono leading-none">PN</span>
                  <span className="text-[7.5px] tracking-widest text-amber-400 font-sans uppercase font-black mt-0.5">CONS</span>
                  <span className="text-[6.5px] text-slate-300 tracking-wider font-mono">M&amp;E</span>
                </div>

                <div className="space-y-0.5">
                  <div className="font-black text-slate-950 uppercase text-xs sm:text-sm tracking-tight">
                    CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN
                  </div>
                  <div className="text-[10px] text-slate-600">
                    <strong>Mã số thuế:</strong> <span className="font-mono font-bold">0314892668</span> • <strong>Điện thoại:</strong> (028) 3821 6889
                  </div>
                  <div className="text-[10px] text-slate-600">
                    <strong>Trụ sở:</strong> Tầng 5, Số 70 Nam Kỳ Khởi Nghĩa, P. Nguyễn Thái Bình, Quận 1, TP. HCM
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <strong>Kho Site &amp; VP:</strong> KCN Sóng Thần, TP. Dĩ An, Tỉnh Bình Dương
                  </div>
                </div>
              </div>

              {/* Thông tin mẫu biểu chuẩn Bộ Tài Chính */}
              <div className="text-right shrink-0 text-[11px] space-y-1">
                <div className="font-bold text-slate-950 uppercase">{voucherFormCode}</div>
                <div className="text-[10px] text-slate-500 italic max-w-[190px]">
                  (Ban hành theo Thông tư số 200/2014/TT-BTC ngày 22/12/2014 của Bộ Tài chính)
                </div>
                <div className="pt-1 text-slate-700">
                  <span>Số phiếu: </span>
                  <strong className="font-mono font-bold text-slate-950 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300">
                    {voucher.code}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Nợ: <span className="font-bold">{isRevenue ? 'TK 111, 112' : 'TK 152, 621, 622, 331'}</span>
                  {' • '}
                  Có: <span className="font-bold">{isRevenue ? 'TK 131, 511' : 'TK 111, 112'}</span>
                </div>
              </div>
            </div>

            {/* 2. Tiêu đề Phiếu */}
            <div className="text-center py-2 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-950 tracking-wider">
                {voucherTitle}
              </h1>
              <div className="text-xs text-slate-600 italic">
                Ngày {day} tháng {month} năm {year}
              </div>
            </div>

            {/* 3. Nội dung phiếu */}
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-800">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 w-48 shrink-0">{partyRoleTitle}</span>
                <span className="font-semibold text-slate-950 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {voucher.receiverOrPayer || voucher.supplier || 'Ông / Bà đối tác'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 w-48 shrink-0">Địa chỉ / Đơn vị:</span>
                <span className="text-slate-800 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {voucher.supplier || project?.client || 'Công trình thi công Phúc Nguyên'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 w-48 shrink-0">{reasonTitle}</span>
                <span className="font-bold text-slate-950 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {voucher.title}
                </span>
              </div>

              {voucher.subDescription && (
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 w-48 shrink-0">Diễn giải chi tiết:</span>
                  <span className="text-slate-700 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                    {voucher.subDescription}
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 w-48 shrink-0">Thuộc Dự Án / Công Trình:</span>
                <span className="font-bold text-sky-950 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  [{project?.code || voucher.projectId}] {voucher.projectName || project?.name}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 w-48 shrink-0">Số tiền thanh toán:</span>
                <div className="flex-1 border-b border-dotted border-slate-400 pb-0.5 flex items-baseline gap-3 flex-wrap">
                  <span className="text-base sm:text-lg font-mono font-black text-slate-950">
                    {formatVND(voucher.totalAmount)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({voucher.paymentMethod === 'transfer' ? 'Chuyển khoản' : voucher.paymentMethod === 'cash' ? 'Tiền mặt' : 'Tạm ứng quỹ site'})
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 w-48 shrink-0">Viết bằng chữ:</span>
                <span className="italic font-bold text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {numberToWordsVN(voucher.totalAmount)}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 w-48 shrink-0">Kèm theo chứng từ gốc:</span>
                <span className="text-slate-700 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {voucher.notes || (voucher.linkedPoCode ? `Đơn hàng PO ${voucher.linkedPoCode}` : '01 bộ chứng từ gốc hợp lệ')}
                </span>
              </div>
            </div>

            {/* 4. Ngày ký xác nhận */}
            <div className="flex justify-end pt-2 text-xs italic text-slate-600">
              Ngày {day} tháng {month} năm {year}
            </div>

            {/* 5. Khung 5 Chữ Ký Chuẩn Bộ Tài Chính */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs pt-2 border-t border-slate-200">
              {/* Cột 1: Giám đốc */}
              <div className="space-y-1">
                <div className="font-black text-slate-900 uppercase">Giám Đốc</div>
                <div className="text-[10px] text-slate-500 italic">(Ký, họ tên, đóng dấu)</div>
                <div className="h-16 flex items-end justify-center font-bold text-slate-800 text-xs">
                  Nguyễn Văn Phúc
                </div>
              </div>

              {/* Cột 2: Kế toán trưởng */}
              <div className="space-y-1">
                <div className="font-black text-slate-900 uppercase">Kế Toán Trưởng</div>
                <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                <div className="h-16 flex items-end justify-center font-bold text-slate-800 text-xs">
                  Lê Thị Hồng Nhung
                </div>
              </div>

              {/* Cột 3: Thủ quỹ */}
              <div className="space-y-1">
                <div className="font-black text-slate-900 uppercase">Thủ Quỹ</div>
                <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                <div className="h-16 flex items-end justify-center font-bold text-slate-800 text-xs">
                  Phạm Thị Mai
                </div>
              </div>

              {/* Cột 4: Người lập phiếu */}
              <div className="space-y-1">
                <div className="font-black text-slate-900 uppercase">Người Lập Phiếu</div>
                <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                <div className="h-16 flex items-end justify-center font-bold text-slate-800 text-xs">
                  {voucher.createdByName || 'Trần Anh Minh'}
                </div>
              </div>

              {/* Cột 5: Người nhận / nộp */}
              <div className="space-y-1">
                <div className="font-black text-slate-900 uppercase">{partySignTitle}</div>
                <div className="text-[10px] text-slate-500 italic">(Ký, họ tên)</div>
                <div className="h-16 flex items-end justify-center font-bold text-slate-800 text-xs">
                  {voucher.receiverOrPayer || voucher.supplier || 'Đối tác'}
                </div>
              </div>
            </div>

            {/* 6. Footer ghi chú */}
            <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-200 italic">
              Đã nhận đủ số tiền (viết bằng chữ): {numberToWordsVN(voucher.totalAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
