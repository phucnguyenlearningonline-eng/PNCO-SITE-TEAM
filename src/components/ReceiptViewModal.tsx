import React, { useMemo } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Building, 
  UserCheck, 
  FileText, 
  Edit3, 
  ShoppingCart, 
  Layers 
} from 'lucide-react';
import { ExpenseItem, User, MaterialItem, OrderItemLine } from '../types';
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
  onApprove?: (item: ExpenseItem) => void;
  onEdit?: (item: ExpenseItem) => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  item,
  onClose,
  currentUser,
  materials = [],
  onApprove,
  onEdit,
}) => {
  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  // Trích xuất hoặc phân tích danh sách các sản phẩm trong đơn hàng
  const orderLines: OrderItemLine[] = useMemo(() => {
    if (!item) return [];

    // 1. Nếu đơn hàng đã có mảng items sẵn
    if (item.items && item.items.length > 0) {
      return item.items;
    }

    // 2. Nếu chưa có items (như các đơn hàng cũ hoặc nạp từ database cũ),
    // tự động phân tích cú pháp từ subDescription hoặc title
    const text = item.subDescription || item.title || '';
    const lines: OrderItemLine[] = [];

    if (text.includes(';') || text.includes('VT') || text.includes('(x')) {
      const parts = text.split(';').map((p) => p.trim()).filter(Boolean);
      parts.forEach((part) => {
        // Tìm Mã VT: VT0001, VT0002...
        const codeMatch = part.match(/(VT\s*\d+)/i);
        const code = codeMatch ? codeMatch[1].replace(/\s+/g, '').toUpperCase() : '';

        // Tìm số lượng và ĐVT: (x19 Cái), (x14 Bộ)...
        const qtyMatch = part.match(/\(x\s*(\d+(?:\.\d+)?)\s*([^)]*)\)/i);
        const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
        const parsedUnit = qtyMatch && qtyMatch[2] ? qtyMatch[2].trim() : '';

        // Tên hàng: phần nằm giữa mã và số lượng
        let name = part;
        if (codeMatch) {
          const afterCode = part.substring(part.indexOf(codeMatch[0]) + codeMatch[0].length).replace(/^[:\s-]+/, '');
          name = afterCode;
        }
        if (qtyMatch) {
          name = name.substring(0, name.indexOf(qtyMatch[0])).trim();
        }
        name = name.replace(/[,;]+$/, '').trim();

        // Tra cứu trong danh mục materials để lấy đơn vị tính & đơn giá niêm yết
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
            name: finalName,
            unit: finalUnit,
            quantity: quantity || 1,
            unitPrice: unitPrice,
            total: total,
          });
        }
      });
    }

    if (lines.length > 0) {
      // Nếu các dòng chưa có đơn giá mà đơn hàng có tổng tiền amount
      const sumCalculated = lines.reduce((s, l) => s + l.total, 0);
      if (sumCalculated === 0 && item.amount > 0) {
        const totalQty = lines.reduce((s, l) => s + l.quantity, 0) || lines.length;
        lines.forEach((l) => {
          l.unitPrice = Math.round(item.amount / totalQty);
          l.total = l.quantity * l.unitPrice;
        });
      }
      return lines;
    }

    // 3. Trường hợp đơn lẻ thông thường
    const singleMat = materials.find(
      (m) => m.code.replace(/\s+/g, '').toUpperCase() === (item.materialCode || '').replace(/\s+/g, '').toUpperCase()
    );

    return [
      {
        materialId: singleMat?.id,
        code: item.materialCode || singleMat?.code || 'VT-0001',
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
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="no-print bg-[#102742] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.type === 'po' ? (
              <ShoppingCart className="w-5 h-5 text-amber-400" />
            ) : (
              <FileText className="w-5 h-5 text-cyan-400" />
            )}
            <span className="font-bold text-sm uppercase">
              {item.type === 'po' ? 'PHIẾU ĐẶT HÀNG & DUYỆT MUA VẬT TƯ (PO)' : 'PHIẾU ĐỀ NGHỊ CHI TIÊU & DUYỆT SITE'}
            </span>
            <span className="ml-2 font-mono font-bold text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
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

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5 px-3 transition-colors font-bold shadow-xs"
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

        {/* Printable Paper Area */}
        <div className="p-6 sm:p-8 space-y-5 print:p-0 print:space-y-4 text-slate-800 bg-white">
          {/* Company Letterhead */}
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Văn phòng: 70 Nam Kỳ Khởi Nghĩa, Q.1, TP. Hồ Chí Minh
              </p>
              <p className="text-[11px] text-slate-600">
                Bộ phận: Ban Chỉ Huy Công Trường &amp; Phòng Kế Toán Dự Án
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-black text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-300 inline-block">
                {item.code}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Ngày lập: <strong className="text-slate-800">{formatDateVN(item.date)}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Mẫu số: <strong className="text-slate-800">02-TT/EPC</strong>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center pt-1">
            <h2 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-wide">
              {item.type === 'po' ? 'PHIẾU ĐẶT HÀNG & DUYỆT MUA VẬT TƯ (PO)' : 'GIẤY ĐỀ NGHỊ THANH TOÁN CHI TIÊU SITE'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 italic">
              (Dành cho việc kiểm tra duyệt mua vật tư, vận chuyển &amp; dịch vụ phục vụ công trình)
            </p>
          </div>

          {/* Details Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500">Dự án thi công:</span>{' '}
              <strong className="text-slate-900 font-bold text-sm">{item.projectName}</strong>
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

          {/* ============================================================== */}
          {/* BẢNG TÊN HÀNG, SỐ LƯỢNG, GIÁ TIỀN CHO NHÂN VIÊN KIỂM TRA TRƯỚC IN */}
          {/* ============================================================== */}
          <div className="border-2 border-slate-800 rounded-lg overflow-hidden text-xs shadow-2xs">
            <div className="bg-[#102742] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <span>BẢNG KÊ DANH MỤC HÀNG HÓA &amp; VẬT TƯ MUA SẮM</span>
              <span>Tổng cộng: {orderLines.length} mặt hàng</span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-2 text-center w-10 border-r border-slate-300">STT</th>
                  <th className="py-2.5 px-2.5 w-24 border-r border-slate-300">Mã VT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Tên Hàng / Quy Cách Kỹ Thuật</th>
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
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Model / Mã TB: {line.deviceCode}
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

          {/* Ghi chú đơn hàng nếu có */}
          {item.notes && (
            <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-300 text-xs text-amber-900">
              <strong className="font-bold">Ghi chú giao nhận &amp; thi công:</strong> {item.notes}
            </div>
          )}

          {/* Chữ Ký Các Bên */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-bold uppercase text-slate-900">Người Lập Phiếu</div>
              <div className="text-slate-400 text-[10px] italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-16 flex items-center justify-center font-bold text-slate-800 mt-2">
                {item.createdByName}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900">Kế Toán Dự Án</div>
              <div className="text-slate-400 text-[10px] italic">(Kiểm tra, xác nhận)</div>
              <div className="h-16 flex items-center justify-center font-bold text-emerald-700 mt-2">
                {item.status === 'approved' || item.status === 'paid' ? 'Đã kiểm tra ✓' : 'Chờ xác nhận'}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900">Giám Đốc / Duyệt Chi</div>
              <div className="text-slate-400 text-[10px] italic">(Ký duyệt đơn hàng)</div>
              <div className="h-16 flex items-center justify-center font-black text-sky-900 mt-2">
                {item.status === 'approved' || item.status === 'paid' ? 'ĐÃ PHÊ DUYỆT' : 'Chờ duyệt'}
              </div>
            </div>
          </div>

          {/* Action button inside modal if pending */}
          <div className="no-print pt-4 border-t border-slate-200 flex justify-between items-center">
            <div className="text-xs text-slate-500">
              Nhân viên vui lòng kiểm tra kỹ danh sách tên hàng, số lượng và đơn giá trước khi in hoặc xuất trình.
            </div>

            <div className="flex items-center gap-2">
              {onApprove && item.status === 'pending' && (currentUser.role === 'director' || currentUser.role === 'accountant') && (
                <button
                  onClick={() => {
                    onApprove(item);
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Phê Duyệt Đơn Hàng</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
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
