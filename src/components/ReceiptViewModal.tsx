import React, { useMemo, useEffect } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Building, 
  UserCheck, 
  FileText, 
  Edit3, 
  ShoppingCart, 
  Layers,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { ExpenseItem, User, MaterialItem, OrderItemLine, Supplier } from '../types';
import { 
  formatDateVN, 
  formatVND, 
  getCategoryLabel, 
  getPriorityLabel, 
  getStatusLabel,
  numberToWordsVN 
} from '../utils/formatters';

interface ReceiptViewModalProps {
  item: ExpenseItem | null;
  onClose: () => void;
  currentUser: User;
  materials?: MaterialItem[];
  suppliers?: Supplier[];
  autoPrint?: boolean;
  onApprove?: (item: ExpenseItem) => void;
  onEdit?: (item: ExpenseItem) => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  item,
  onClose,
  currentUser,
  materials = [],
  suppliers = [],
  autoPrint = false,
  onApprove,
  onEdit,
}) => {
  if (!item) return null;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Don_Hang_${item.code.replace(/\s+/g, '_')}_PhucNguyen_ME`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  useEffect(() => {
    if (autoPrint && item) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, item]);

  // Tìm nhà cung cấp tương ứng nếu có trong danh sách
  const matchedSupplier = useMemo(() => {
    if (!item.supplier) return null;
    return suppliers.find(
      (s) => s.name.trim().toLowerCase() === item.supplier.trim().toLowerCase()
    );
  }, [item.supplier, suppliers]);

  // Trích xuất hoặc phân tích danh sách các sản phẩm trong đơn hàng
  const orderLines: OrderItemLine[] = useMemo(() => {
    if (!item) return [];

    // 1. Nếu đơn hàng đã có mảng items sẵn
    if (item.items && item.items.length > 0) {
      return item.items;
    }

    // 2. Phân tích cú pháp nếu chưa có items sẵn
    const text = item.subDescription || item.title || '';
    const lines: OrderItemLine[] = [];

    if (text.includes(';') || text.includes('VT') || text.includes('(x')) {
      const parts = text.split(';').map((p) => p.trim()).filter(Boolean);
      parts.forEach((part) => {
        const codeMatch = part.match(/(VT\s*\d+)/i);
        const code = codeMatch ? codeMatch[1].replace(/\s+/g, '').toUpperCase() : '';

        const qtyMatch = part.match(/\(x\s*(\d+(?:\.\d+)?)\s*([^)]*)\)/i);
        const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
        const parsedUnit = qtyMatch && qtyMatch[2] ? qtyMatch[2].trim() : '';

        let name = part;
        if (codeMatch) {
          const afterCode = part.substring(part.indexOf(codeMatch[0]) + codeMatch[0].length).replace(/^[:\s-]+/, '');
          name = afterCode;
        }
        if (qtyMatch) {
          name = name.substring(0, name.indexOf(qtyMatch[0])).trim();
        }
        name = name.replace(/[,;]+$/, '').trim();

        const cleanCode = code ? code.replace(/\s+/g, '').toUpperCase() : '';
        const matched = materials.find(
          (m) => m.code.replace(/\s+/g, '').toUpperCase() === cleanCode
        );

        const finalName = name || matched?.name || (code ? `Vật tư ${code}` : 'Sản phẩm M&E');
        const finalUnit = parsedUnit || matched?.unit || 'Cái';
        const unitPrice = typeof matched?.unitPrice === 'number' ? matched.unitPrice : 0;
        const total = quantity * unitPrice;

        if (finalName || code) {
          lines.push({
            materialId: matched?.id,
            code: code || matched?.code || 'VT',
            deviceCode: matched?.deviceCode,
            name: finalName,
            unit: finalUnit,
            quantity: quantity || 1,
            unitPrice: unitPrice,
            total: total > 0 ? total : 0,
          });
        }
      });
    }

    if (lines.length > 0) return lines;

    const singleMat = materials.find(
      (m) => m.code.replace(/\s+/g, '').toUpperCase() === (item.materialCode || '').replace(/\s+/g, '').toUpperCase()
    );

    return [
      {
        materialId: singleMat?.id,
        code: item.materialCode || 'VT0001',
        deviceCode: singleMat?.deviceCode,
        name: item.title,
        unit: singleMat?.unit || 'Hạng mục',
        quantity: 1,
        unitPrice: item.amount,
        total: item.amount,
      },
    ];
  }, [item, materials]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar (Controls - Hidden during print) */}
        <div className="no-print bg-[#102742] text-white px-5 py-3 flex items-center justify-between border-b border-[#1d3d63]">
          <div className="flex items-center gap-2">
            {item.type === 'po' ? (
              <ShoppingCart className="w-5 h-5 text-amber-400" />
            ) : (
              <FileText className="w-5 h-5 text-cyan-400" />
            )}
            <span className="font-bold text-sm uppercase tracking-wide">
              {item.type === 'po' ? 'ĐƠN ĐẶT HÀNG MUA VẬT TƯ THIẾT BỊ (PURCHASE ORDER)' : 'PHIẾU ĐỀ NGHỊ THANH TOÁN CHI TIÊU SITE'}
            </span>
            <span className="ml-2 font-mono font-bold text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow-2xs">
              {item.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(item);
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-xs flex items-center gap-1.5 px-3 transition-colors font-semibold"
                title="Chỉnh sửa đơn hàng nếu có sai sót"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa Đơn Hàng</span>
              </button>
            )}

            {/* Nút In đơn hàng / Xuất PDF */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-2 px-4 transition-all font-bold shadow-md cursor-pointer hover:scale-102"
              title="In ra máy in hoặc Lưu dưới dạng file PDF (Save as PDF)"
            >
              <Printer className="w-4 h-4" />
              <span>In Đơn Hàng (Xuất PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area - Targeted by #printable-order in print CSS */}
        <div id="printable-order" className="p-6 sm:p-9 space-y-4 text-slate-900 bg-white">
          {/* ============================================================== */}
          {/* HEADER CÔNG TY ĐẦY ĐỦ THÔNG TIN DOANH NGHIỆP THEO YÊU CẦU       */}
          {/* ============================================================== */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              {/* Logo & Thông Tin Doanh Nghiệp */}
              <div className="flex items-start gap-3.5 flex-1">
                {/* Logo PNCONS M&E */}
                <div className="w-16 h-16 rounded-xl bg-[#102742] text-white flex flex-col items-center justify-center font-black p-1 shrink-0 shadow-md border-2 border-sky-400">
                  <span className="text-base tracking-tighter text-sky-300 font-mono leading-none">PN</span>
                  <span className="text-[8.5px] tracking-widest text-amber-400 font-sans uppercase font-black mt-0.5">CONS</span>
                  <span className="text-[7px] text-slate-300 tracking-wider font-mono">M&amp;E</span>
                </div>

                <div className="space-y-0.5">
                  <h1 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight leading-snug">
                    CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN
                  </h1>
                  <div className="text-[10px] sm:text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                    PHUC NGUYEN MECHANICAL &amp; ELECTRICAL CONSTRUCTION CO., LTD
                  </div>
                  <div className="text-[10.5px] text-slate-700 font-medium">
                    <strong>Mã số thuế:</strong> <span className="font-mono font-bold text-slate-950">0314892668</span> • <strong>Điện thoại:</strong> (028) 3821 6889 - <strong>Hotline:</strong> 0908 123 456
                  </div>
                  <div className="text-[10px] text-slate-600">
                    <strong>Trụ sở chính:</strong> Tầng 5, Số 70 Nam Kỳ Khởi Nghĩa, P. Nguyễn Thái Bình, Quận 1, TP. Hồ Chí Minh
                  </div>
                  <div className="text-[10px] text-slate-600">
                    <strong>VP Điều Hành &amp; Kho Tổng:</strong> Số 12 Đường DT743, KCN Sóng Thần, TP. Dĩ An, Tỉnh Bình Dương
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Email: ketoan@phucnguyencons.com.vn • Website: www.phucnguyencons.com.vn
                  </div>
                </div>
              </div>

              {/* Thông Tin Số Đơn Hàng & Mẫu Biểu */}
              <div className="text-right shrink-0 sm:border-l sm:border-slate-300 sm:pl-4 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Mẫu số: <strong className="text-slate-950 font-mono">01-PO/PNCONS-2026</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Mã Đơn Hàng:</span>
                  <span className="text-base font-mono font-black text-sky-950 bg-sky-50 px-3 py-1 rounded border border-sky-300 inline-block shadow-2xs">
                    {item.code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Ngày lập đơn: <strong className="text-slate-950">{formatDateVN(item.date)}</strong>
                </div>
                <div className="text-[10.5px] text-slate-500 font-medium">
                  Trạng thái: <span className="font-bold text-emerald-700">{getStatusLabel(item.status)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TIÊU ĐỀ ĐƠN HÀNG                                                */}
          {/* ============================================================== */}
          <div className="text-center py-1">
            <h2 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-wider">
              {item.type === 'po' ? 'ĐƠN ĐẶT HÀNG MUA VẬT TƯ THIẾT BỊ (PURCHASE ORDER)' : 'GIẤY ĐỀ NGHỊ THANH TOÁN CHI TIÊU SITE'}
            </h2>
            <p className="text-[11px] text-slate-500 italic mt-0.5">
              (Ban hành theo quy chuẩn quản lý vật tư &amp; thanh toán dự án công trình PNCONS M&amp;E)
            </p>
          </div>

          {/* ============================================================== */}
          {/* KHUNG THÔNG TIN BÊN MUA (BÊN A) & BÊN BÁN (BÊN B)               */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* BÊN A: ĐƠN VỊ ĐẶT HÀNG (BÊN MUA) */}
            <div className="bg-sky-50/60 p-3 rounded-lg border border-sky-200 space-y-1">
              <div className="font-black text-sky-950 text-[11px] uppercase tracking-wide border-b border-sky-200 pb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-700" />
                <span>BÊN A: ĐƠN VỊ ĐẶT HÀNG (BÊN MUA)</span>
              </div>
              <div className="font-bold text-slate-900">CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN</div>
              <div>
                <span className="text-slate-500">Dự án thi công:</span>{' '}
                <strong className="text-sky-900 font-bold text-sm">{item.projectName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Người lập đơn:</span>{' '}
                <strong className="text-slate-900">{item.createdByName}</strong> ({item.createdByRole})
              </div>
              <div>
                <span className="text-slate-500">Hình thức thanh toán:</span>{' '}
                <strong className="text-slate-900">
                  {item.paymentMethod === 'advance_fund'
                    ? 'Tạm ứng quỹ site (Kỹ sư thanh toán trước)'
                    : item.paymentMethod === 'transfer'
                    ? 'Chuyển khoản công ty (Theo hợp đồng)'
                    : 'Tiền mặt'}
                </strong>
              </div>
            </div>

            {/* BÊN B: ĐƠN VỊ CUNG CẤP (BÊN BÁN) */}
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 space-y-1">
              <div className="font-black text-amber-950 text-[11px] uppercase tracking-wide border-b border-amber-200 pb-1 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-amber-700" />
                <span>BÊN B: ĐƠN VỊ CUNG CẤP (BÊN BÁN)</span>
              </div>
              <div>
                <span className="text-slate-500">Nhà Cung Cấp:</span>{' '}
                <strong className="text-slate-950 text-sm">{item.supplier}</strong>
              </div>
              {matchedSupplier?.contactPerson && (
                <div>
                  <span className="text-slate-500">Người liên hệ:</span>{' '}
                  <strong className="text-slate-900">{matchedSupplier.contactPerson}</strong>
                  {matchedSupplier.phone && ` • SĐT: ${matchedSupplier.phone}`}
                </div>
              )}
              {matchedSupplier?.address && (
                <div>
                  <span className="text-slate-500">Địa chỉ:</span>{' '}
                  <span className="text-slate-800">{matchedSupplier.address}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Phân loại hàng hóa:</span>{' '}
                <strong className="text-sky-800">{getCategoryLabel(item.category)}</strong> •{' '}
                <span className="text-slate-500">Ưu tiên:</span>{' '}
                <strong className="text-slate-900">{getPriorityLabel(item.priority)}</strong>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* BẢNG KÊ CHI TIẾT TÊN HÀNG, MÃ TB, SỐ LƯỢNG, ĐƠN GIÁ, THÀNH TIỀN   */}
          {/* ============================================================== */}
          <div className="border-2 border-slate-800 rounded-lg overflow-hidden text-xs shadow-2xs">
            <div className="bg-[#102742] text-white px-3.5 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <span>BẢNG KÊ DANH MỤC HÀNG HÓA &amp; VẬT TƯ MUA SẮM</span>
              <span>Tổng cộng: {orderLines.length} mặt hàng</span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-2 text-center w-10 border-r border-slate-300">STT</th>
                  <th className="py-2.5 px-2.5 w-24 border-r border-slate-300">Mã VT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Tên Hàng Hóa &amp; Quy Cách Kỹ Thuật</th>
                  <th className="py-2.5 px-2 text-center w-16 border-r border-slate-300">ĐVT</th>
                  <th className="py-2.5 px-2 text-center w-20 border-r border-slate-300">Số Lượng</th>
                  <th className="py-2.5 px-3 text-right w-28 border-r border-slate-300">Đơn Giá (VNĐ)</th>
                  <th className="py-2.5 px-3 text-right w-32">Thành Tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orderLines.map((line, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono font-bold text-sky-800 border-r border-slate-200 whitespace-nowrap">
                      {line.code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      <div>{line.name}</div>
                      {line.deviceCode && (
                        <div className="text-[10px] text-indigo-700 font-mono font-bold mt-0.5">
                          Model / Mã Thiết Bị: {line.deviceCode}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium border-r border-slate-200">
                      {line.unit}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-black text-slate-950 border-r border-slate-200 bg-amber-50/40">
                      {line.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                      {formatVND(line.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatVND(line.total)}
                    </td>
                  </tr>
                ))}

                {/* DÒNG TỔNG KẾT TIỀN HÀNG */}
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-semibold">
                  <td colSpan={5} className="py-2 px-3 text-right text-slate-700 uppercase border-r border-slate-200">
                    Cộng tiền hàng (Chưa bao gồm VAT):
                  </td>
                  <td colSpan={2} className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {formatVND(item.amount)}
                  </td>
                </tr>

                {/* DÒNG TIỀN THUẾ VAT */}
                <tr className="bg-slate-50 border-t border-slate-200 font-semibold">
                  <td colSpan={5} className="py-2 px-3 text-right text-rose-700 uppercase border-r border-slate-200">
                    Thuế suất giá trị gia tăng VAT ({item.vatRate}%):
                  </td>
                  <td colSpan={2} className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                    {formatVND(item.vatAmount)}
                  </td>
                </tr>

                {/* DÒNG TỔNG CỘNG THANH TOÁN (IN ĐẬM RÕ NÉT) */}
                <tr className="bg-amber-100/60 border-t-2 border-slate-800 text-xs">
                  <td colSpan={5} className="py-2.5 px-3 text-right text-slate-950 font-black uppercase tracking-wide border-r border-slate-300">
                    TỔNG CỘNG TIỀN THANH TOÁN (ĐÃ CÓ VAT):
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-base font-black text-emerald-900">
                    {formatVND(item.totalAmount)}
                  </td>
                </tr>

                {/* SỐ TIỀN BẰNG CHỮ TIẾNG VIỆT CHUẨN KẾ TOÁN */}
                <tr className="bg-white border-t border-slate-300">
                  <td colSpan={7} className="py-2.5 px-3 text-xs italic text-slate-700 bg-slate-50/50">
                    <span className="font-bold text-slate-900 not-italic mr-1">Số tiền viết bằng chữ:</span>
                    <strong className="text-slate-900 font-medium">{numberToWordsVN(item.totalAmount)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ghi chú đơn hàng & Điều khoản thi công nếu có */}
          {item.notes ? (
            <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-300 text-xs text-amber-950">
              <strong className="font-bold">Ghi chú giao nhận &amp; thi công:</strong> {item.notes}
            </div>
          ) : (
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
              <strong>Điều khoản giao hàng:</strong> Hàng mới 100%, đúng quy cách kỹ thuật catalogue M&amp;E. Giao hàng kèm theo biên bản bàn giao, CO/CQ và hóa đơn VAT hợp lệ.
            </div>
          )}

          {/* ============================================================== */}
          {/* CHỮ KÝ 4 BÊN PHÊ DUYỆT ĐƠN HÀNG                                 */}
          {/* ============================================================== */}
          <div className="pt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-bold uppercase text-slate-900 text-[11px]">Người Lập Đơn</div>
              <div className="text-slate-400 text-[10px] italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-16 flex items-center justify-center font-bold text-slate-900 mt-1">
                {item.createdByName}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900 text-[11px]">Chỉ Huy Trưởng Site</div>
              <div className="text-slate-400 text-[10px] italic">(Kiểm tra khối lượng)</div>
              <div className="h-16 flex items-center justify-center font-bold text-sky-900 mt-1">
                Trần Anh Minh
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900 text-[11px]">Kế Toán Dự Án</div>
              <div className="text-slate-400 text-[10px] italic">(Kiểm soát ngân sách)</div>
              <div className="h-16 flex items-center justify-center font-bold text-emerald-700 mt-1">
                {item.status === 'approved' || item.status === 'paid' ? 'Đã kiểm tra ✓' : 'Chờ kiểm tra'}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900 text-[11px]">Giám Đốc Phê Duyệt</div>
              <div className="text-slate-400 text-[10px] italic">(Ký duyệt mua)</div>
              <div className="h-16 flex items-center justify-center font-black text-slate-950 mt-1">
                {item.status === 'approved' || item.status === 'paid' ? 'ĐÃ DUYỆT' : 'Chờ duyệt'}
              </div>
            </div>
          </div>

          {/* Action button inside modal if pending (Hidden during print) */}
          <div className="no-print pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
            <div className="text-xs text-slate-500">
              Mẹo: Chọn <strong>"Lưu dưới dạng PDF" (Save as PDF)</strong> trong hộp thoại in để xuất file PDF chất lượng cao.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In / Xuất PDF</span>
              </button>

              {onApprove && item.status === 'pending' && (currentUser.role === 'director' || currentUser.role === 'accountant') && (
                <button
                  onClick={() => {
                    onApprove(item);
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Phê Duyệt Đơn Hàng</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
