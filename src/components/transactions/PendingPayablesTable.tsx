import React, { useMemo } from 'react';
import { ShoppingCart, CreditCard, AlertCircle, Clock, CheckCircle2, ChevronRight, ArrowRight, DollarSign } from 'lucide-react';
import { ExpenseItem, Project } from '../../types';
import { formatVND, formatDateVN, formatTy } from '../../utils/formatters';
import { isPaymentVoucher, isReceiptVoucher, sortVouchersAndOrders } from '../../utils/voucherCode';

interface PendingPayablesTableProps {
  expenses: ExpenseItem[];
  projects: Project[];
  selectedProjectId: string;
  onOpenCreatePaymentForPo: (po: ExpenseItem) => void;
}

export const PendingPayablesTable: React.FC<PendingPayablesTableProps> = ({
  expenses,
  projects,
  selectedProjectId,
  onOpenCreatePaymentForPo,
}) => {
  const getPoPaid = (po: ExpenseItem) => {
    return po.paidAmount || expenses
      .filter((exp) => exp.linkedPoId === po.id && (exp.status === 'paid' || isPaymentVoucher(exp)))
      .reduce((sum, exp) => sum + exp.totalAmount, 0);
  };

  const getPoRemaining = (po: ExpenseItem) => {
    const paid = getPoPaid(po);
    return Math.max(0, po.totalAmount - paid);
  };

  // Lọc các đơn hàng PO thực tế còn nợ (Tuyệt đối loại bỏ Phiếu Chi PC- và Đơn đã trả đủ, sắp xếp mới nhất lên đầu)
  const pendingOrders = useMemo(() => {
    const filtered = expenses.filter((e) => {
      if (isPaymentVoucher(e) || isReceiptVoucher(e)) return false;
      const codeUpper = (e.code || '').trim().toUpperCase();
      if (codeUpper.startsWith('PC-') || codeUpper.startsWith('PNCO-PC-') || codeUpper.includes('PC') || codeUpper.startsWith('PT-') || codeUpper.startsWith('PNCO-PT-')) return false;
      if (e.id?.startsWith('pay-') || e.id?.startsWith('pc-') || e.id?.startsWith('rcp-') || e.id?.startsWith('pt-')) return false;
      if (e.type === 'revenue') return false;
      if (e.linkedPoId) return false;

      const isOrder = e.type === 'po' || codeUpper.startsWith('PO') || codeUpper.startsWith('DH');
      if (!isOrder) return false;

      const rem = getPoRemaining(e);
      if (rem <= 1000 || e.status === 'paid') return false;
      if (selectedProjectId !== 'all' && e.projectId !== selectedProjectId) return false;
      return true;
    });

    return sortVouchersAndOrders(filtered, 'newest');
  }, [expenses, selectedProjectId]);

  const totalPendingAmount = pendingOrders.reduce((sum, item) => sum + getPoRemaining(item), 0);

  // Nhóm theo dự án
  const projectSummary = projects.map((p) => {
    const prjPos = expenses.filter((e) => {
      if (isPaymentVoucher(e) || isReceiptVoucher(e)) return false;
      const codeUpper = (e.code || '').trim().toUpperCase();
      if (codeUpper.startsWith('PC-') || codeUpper.startsWith('PNCO-PC-') || codeUpper.includes('PC') || codeUpper.startsWith('PT-') || codeUpper.startsWith('PNCO-PT-')) return false;
      if (e.id?.startsWith('pay-') || e.id?.startsWith('pc-') || e.id?.startsWith('rcp-') || e.id?.startsWith('pt-')) return false;
      if (e.type === 'revenue' || e.linkedPoId) return false;
      const isOrder = (e.type === 'po' || codeUpper.startsWith('PO') || codeUpper.startsWith('DH')) && e.projectId === p.id;
      if (!isOrder) return false;
      const rem = getPoRemaining(e);
      return rem > 1000 && e.status !== 'paid';
    });
    const amount = prjPos.reduce((sum, item) => sum + getPoRemaining(item), 0);
    return {
      project: p,
      posCount: prjPos.length,
      amount: amount,
    };
  }).filter((item) => item.posCount > 0);

  return (
    <div className="space-y-4">
      {/* Banner Tổng Dự Chi */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 p-4 sm:p-5 rounded-2xl border border-amber-300 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-white">
              <Clock className="w-5 h-5" />
            </span>
            <h3 className="font-black text-slate-900 text-base">
              QUẢN LÝ DỰ CHI TỪ CÁC ĐƠN HÀNG CHƯA THANH TOÁN (CẦN QUẢN LÝ DÒNG TIỀN)
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Tổng hợp các đơn đặt hàng vật tư, thiết bị M&amp;E và hợp đồng thầu phụ đang chờ thanh toán để doanh nghiệp chủ động chuẩn bị nguồn vốn.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-2xs text-left md:text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            TỔNG NHU CẦU DÒNG TIỀN CẦN CHI
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-700 mt-0.5">
            {formatVND(totalPendingAmount)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            {pendingOrders.length} đơn hàng PO đang chờ thanh toán
          </div>
        </div>
      </div>

      {/* Thẻ dự chi theo từng dự án */}
      {projectSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projectSummary.map((item) => (
            <div key={item.project.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[10.5px] px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                  {item.project.code}
                </span>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {item.posCount} đơn PO chờ chi
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs line-clamp-1" title={item.project.name}>
                {item.project.name}
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Dòng tiền dự chi:</span>
                <span className="font-mono font-black text-rose-700 text-sm">{formatVND(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bảng Kê Chi Tiết Các Đơn Hàng PO Chờ Chi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#102742] text-white font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-2.5 w-12 text-center">STT</th>
                <th className="py-3 px-3 w-32">Mã Đơn PO</th>
                <th className="py-3 px-3">Nội Dung Đơn Hàng Mua Vật Tư / Thiết Bị</th>
                <th className="py-3 px-3 w-48">Dự Án Thi Công</th>
                <th className="py-3 px-3 w-48">Nhà Cung Cấp</th>
                <th className="py-3 px-3 text-right w-36">Số Tiền Cần Chi (VNĐ)</th>
                <th className="py-3 px-3 text-center w-28">Mức Độ Ưu Tiên</th>
                <th className="py-3 px-3 text-center w-36">Thao Tác Đồng Bộ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <p className="font-bold text-slate-700 text-sm">Tuyệt vời! Hiện không có đơn hàng nào còn nợ hoặc chưa thanh toán.</p>
                    <p className="text-xs text-slate-400 mt-1">Toàn bộ đơn hàng PO đã được thanh toán hoặc khớp nối đầy đủ với phiếu chi.</p>
                  </td>
                </tr>
              ) : (
                pendingOrders.map((po, index) => {
                  return (
                    <tr key={po.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-2.5 text-center font-bold text-slate-500 font-mono">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-sky-900">
                        {po.code}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 line-clamp-1">{po.title}</div>
                        {po.subDescription && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{po.subDescription}</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Ngày tạo: {formatDateVN(po.date)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 line-clamp-1" title={po.projectName}>
                          {po.projectName}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 line-clamp-1" title={po.supplier}>
                          {po.supplier}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {(() => {
                          const paid = getPoPaid(po);
                          const rem = getPoRemaining(po);
                          return (
                            <div>
                              <div className="font-mono font-black text-rose-700 text-sm">
                                {formatVND(rem)}
                              </div>
                              {paid > 0 ? (
                                <div className="text-[10px] text-emerald-700 font-semibold font-mono mt-0.5">
                                  Đã chi: {formatTy(paid)} • Tổng: {formatTy(po.totalAmount)}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Tổng đơn: {formatTy(po.totalAmount)}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.priority === 'urgent'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : po.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {po.priority === 'urgent' ? 'Khẩn cấp' : po.priority === 'high' ? 'Ưu tiên' : 'Bình thường'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenCreatePaymentForPo(po)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          title="Lập phiếu chi thanh toán cho đơn hàng này ngay"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Chi tiền PO</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
