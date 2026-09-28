import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShoppingCart, Calendar, CheckCircle2, User, Link as LinkIcon, Building2 } from 'lucide-react';
import { Project, ExpenseItem, ExpenseCategory } from '../../types';
import { formatVND } from '../../utils/formatters';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  expenses: ExpenseItem[];
  preselectedPo?: ExpenseItem | null;
  onSavePayment: (payment: ExpenseItem, syncedPoId?: string) => void;
}

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  onClose,
  projects,
  expenses,
  preselectedPo,
  onSavePayment,
}) => {
  if (!isOpen) return null;

  // Lọc các đơn hàng PO chưa thanh toán để đồng bộ
  const pendingOrders = expenses.filter(
    (e) => (e.type === 'po' || e.type === 'expense') && e.status !== 'paid'
  );

  const [isSyncWithPo, setIsSyncWithPo] = useState<boolean>(Boolean(preselectedPo) || pendingOrders.length > 0);
  const [selectedPoId, setSelectedPoId] = useState<string>(preselectedPo?.id || pendingOrders[0]?.id || '');

  const [projectId, setProjectId] = useState<string>(preselectedPo?.projectId || projects[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>(preselectedPo?.category || 'material');
  const [title, setTitle] = useState<string>(preselectedPo?.title || '');
  const [supplier, setSupplier] = useState<string>(preselectedPo?.supplier || '');
  const [receiverName, setReceiverName] = useState<string>(preselectedPo?.supplier || '');
  const [amount, setAmount] = useState<number>(preselectedPo?.totalAmount || 50000000);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'advance_fund'>('transfer');
  const [notes, setNotes] = useState<string>('');

  // Khi chọn PO khác trong dropdown
  const handleSelectPo = (poId: string) => {
    setSelectedPoId(poId);
    const po = pendingOrders.find((item) => item.id === poId);
    if (po) {
      setProjectId(po.projectId);
      setCategory(po.category);
      setTitle(`Thanh toán đơn hàng ${po.code}: ${po.title}`);
      setSupplier(po.supplier);
      setReceiverName(po.supplier);
      setAmount(po.totalAmount);
    }
  };

  useEffect(() => {
    if (preselectedPo) {
      setIsSyncWithPo(true);
      setSelectedPoId(preselectedPo.id);
      setProjectId(preselectedPo.projectId);
      setCategory(preselectedPo.category);
      setTitle(`Thanh toán đơn hàng ${preselectedPo.code}: ${preselectedPo.title}`);
      setSupplier(preselectedPo.supplier);
      setReceiverName(preselectedPo.supplier);
      setAmount(preselectedPo.totalAmount);
    }
  }, [preselectedPo]);

  const selectedProj = projects.find((p) => p.id === projectId) || projects[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !title.trim()) return;

    const matchedPo = isSyncWithPo ? pendingOrders.find((p) => p.id === selectedPoId) : null;

    const paymentItem: ExpenseItem = {
      id: `pay-${Date.now()}`,
      code: `PC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      type: 'expense',
      category: category,
      title: title.trim(),
      subDescription: isSyncWithPo && matchedPo ? `Đồng bộ thanh toán đơn PO ${matchedPo.code}` : `Chi phí site ${selectedProj?.name || ''}`,
      projectId: selectedProj?.id || '',
      projectName: selectedProj?.name || '',
      supplier: supplier.trim() || 'Nhà cung cấp / Đối tác',
      receiverOrPayer: receiverName.trim() || supplier.trim(),
      createdById: 'u-1',
      createdByName: 'Trần Anh Minh',
      createdByRole: 'Chỉ Huy Trưởng',
      date: date,
      amount: amount,
      vatRate: 0,
      vatAmount: 0,
      totalAmount: amount,
      priority: 'normal',
      status: 'paid',
      paymentMethod: paymentMethod,
      notes: notes.trim(),
      linkedPoId: matchedPo?.id,
      linkedPoCode: matchedPo?.code,
    };

    onSavePayment(paymentItem, matchedPo?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-rose-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-700 text-white">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base">Lập Phiếu Chi Tiền Dự Án</h3>
              <p className="text-xs text-rose-200">Đồng bộ tự động với Đơn hàng PO &amp; Chi phí site</p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Tùy chọn Đồng bộ với Đơn hàng (PO) */}
          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-rose-950 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSyncWithPo}
                  onChange={(e) => setIsSyncWithPo(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span className="uppercase text-[11px]">Đồng bộ từ Đơn Hàng PO ({pendingOrders.length} PO chờ chi)</span>
              </label>

              <span className="text-[10.5px] text-rose-700 font-semibold flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                <span>Tự động tất toán PO</span>
              </span>
            </div>

            {isSyncWithPo && (
              <div>
                <select
                  value={selectedPoId}
                  onChange={(e) => handleSelectPo(e.target.value)}
                  className="w-full py-2 px-2.5 border border-rose-300 rounded-lg bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- Chọn đơn hàng PO chưa thanh toán --</option>
                  {pendingOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      [{po.code}] {po.title} - {po.supplier} ({formatVND(po.totalAmount)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Dự Án */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dự Án Thi Công Chịu Chi Phí <span className="text-rose-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phân loại & Ngày chi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hạng Mục Chi Phí</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="material">📦 Vật tư &amp; Thiết bị M&amp;E</option>
                <option value="labor_sub">👷 Nhân công / Lương thợ thi công</option>
                <option value="transport">🚚 Xe cẩu &amp; Vận chuyển</option>
                <option value="overtime_meal">🍲 Cơm ca &amp; Tiếp khách site</option>
                <option value="other">⚡ Chi phí khác</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày Chi Tiền</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono bg-white"
              />
            </div>
          </div>

          {/* Tiêu đề nội dung */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nội Dung Phiếu Chi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="VD: Chi thanh toán tiền nhân công kéo cáp tuần 36"
              className="w-full py-2 px-3 border border-slate-300 rounded-xl font-medium bg-white"
            />
          </div>

          {/* Số tiền & Phương thức */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số Tiền Chi Thực Tế (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1000000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full py-2 px-3 border border-rose-300 bg-rose-50/60 rounded-xl font-mono font-black text-rose-900 text-sm"
              />
              <div className="text-[10.5px] text-slate-400 mt-1 font-mono">{formatVND(amount)}</div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hình Thức Chi</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="transfer">Chuyển khoản công ty</option>
                <option value="cash">Tiền mặt thủ quỹ</option>
                <option value="advance_fund">Quỹ tạm ứng site</option>
              </select>
            </div>
          </div>

          {/* Đơn vị nhận tiền */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nhà Cung Cấp / Đối Tác</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Tên NCC hoặc đội thợ"
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Người Nhận Tiền</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Người nhận tiền trực tiếp"
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú Chứng Từ</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú hóa đơn VAT, phiếu chi, biên bản bàn giao..."
              className="w-full py-1.5 px-3 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold shadow-xs cursor-pointer"
            >
              Lưu &amp; Ghi Sổ Chi Tiền
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
