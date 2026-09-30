import React, { useState } from 'react';
import { X, DollarSign, Building2, Calendar, FileText, CheckCircle2, User } from 'lucide-react';
import { Project, ExpenseItem } from '../../types';
import { formatVND } from '../../utils/formatters';

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  preselectedProjectId?: string;
  initialData?: ExpenseItem | null;
  onSaveReceipt: (item: ExpenseItem) => void;
}

export const CreateReceiptModal: React.FC<CreateReceiptModalProps> = ({
  isOpen,
  onClose,
  projects,
  preselectedProjectId,
  initialData,
  onSaveReceipt,
}) => {
  if (!isOpen) return null;

  const targetProjectId = initialData?.projectId || preselectedProjectId;
  const initialProject = projects.find((p) => p.id === targetProjectId || p.code === targetProjectId) || projects[0];

  const [projectId, setProjectId] = useState<string>(initialData?.projectId || initialProject?.id || '');
  const [amount, setAmount] = useState<number>(initialData?.totalAmount || 200000000);
  const [date, setDate] = useState<string>(initialData?.date || (() => new Date().toISOString().split('T')[0]));
  const [stageType, setStageType] = useState<string>('advance');
  const [title, setTitle] = useState<string>(initialData?.title || 'Thu tiền tạm ứng đợt 1 từ Chủ Đầu Tư');
  const [payerName, setPayerName] = useState<string>(initialData?.receiverOrPayer || initialData?.supplier || initialProject?.client || '');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>(initialData?.paymentMethod === 'cash' ? 'cash' : 'transfer');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  const selectedProj = projects.find((p) => p.id === projectId || p.code === projectId) || initialProject;

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const p = projects.find((item) => item.id === id);
    if (p) {
      setPayerName(p.client);
    }
  };

  const handleStageChange = (stage: string) => {
    setStageType(stage);
    if (stage === 'advance') {
      setTitle('Thu tiền tạm ứng hợp đồng từ Chủ Đầu Tư');
    } else if (stage === 'stage_1') {
      setTitle('Thu tiền nghiệm thu thanh toán đợt 1');
    } else if (stage === 'stage_2') {
      setTitle('Thu tiền nghiệm thu thanh toán đợt 2');
    } else if (stage === 'final') {
      setTitle('Thu tiền quyết toán thanh lý hợp đồng');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj || amount <= 0) return;

    const receiptItem: ExpenseItem = {
      ...initialData,
      id: initialData?.id || `rcp-${Date.now()}`,
      code: initialData?.code || `PT-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      type: 'revenue',
      category: 'other',
      title: title.trim(),
      subDescription: initialData?.subDescription || `Thu tiền dự án: ${selectedProj.name} (${selectedProj.code})`,
      projectId: selectedProj.id,
      projectName: selectedProj.name,
      supplier: payerName.trim() || selectedProj.client,
      receiverOrPayer: payerName.trim() || selectedProj.client,
      createdById: initialData?.createdById || 'u-1',
      createdByName: initialData?.createdByName || 'Trần Anh Minh',
      createdByRole: initialData?.createdByRole || 'Chỉ Huy Trưởng',
      date: date,
      amount: amount,
      vatRate: 0,
      vatAmount: 0,
      totalAmount: amount,
      priority: initialData?.priority || 'normal',
      status: initialData?.status || 'paid',
      paymentMethod: paymentMethod,
      notes: notes.trim(),
    };

    onSaveReceipt(receiptItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-700 text-white">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base">
                {initialData ? 'Cập Nhật Phiếu Thu Tiền' : 'Lập Phiếu Thu Tiền Dự Án'}
              </h3>
              <p className="text-xs text-emerald-200">
                {initialData ? `Mã phiếu: ${initialData.code}` : 'Ghi nhận dòng tiền thu từ Chủ Đầu Tư & Khách Hàng'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Dự Án */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dự Án Thi Công Nhận Tiền <span className="text-rose-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              required
              className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name} - {p.client}
                </option>
              ))}
            </select>
          </div>

          {/* Giai đoạn thu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Đợt Thu Tiền</label>
              <select
                value={stageType}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="advance">Tạm ứng hợp đồng</option>
                <option value="stage_1">Thanh toán đợt 1</option>
                <option value="stage_2">Thanh toán đợt 2</option>
                <option value="stage_3">Thanh toán đợt 3</option>
                <option value="final">Quyết toán tất toán</option>
                <option value="custom">Khoản thu phát sinh khác</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày Thu Tiền</label>
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
              Nội Dung Phiếu Thu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="VD: Thu tiền tạm ứng 30% HĐ PCCC Coherent Vsip 3"
              className="w-full py-2 px-3 border border-slate-300 rounded-xl font-medium bg-white"
            />
          </div>

          {/* Số tiền & Phương thức */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số Tiền Thu Thực Tế (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full py-2 px-3 border border-emerald-300 bg-emerald-50/60 rounded-xl font-mono font-black text-emerald-800 text-sm"
              />
              <div className="text-[10.5px] text-slate-400 mt-1 font-mono">{formatVND(amount)}</div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hình Thức Thu</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="transfer">Chuyển khoản công ty</option>
                <option value="cash">Tiền mặt thủ quỹ</option>
              </select>
            </div>
          </div>

          {/* Người nộp / Chủ đầu tư */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Chủ Đầu Tư / Đơn Vị Nộp Tiền</label>
            <input
              type="text"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Tên công ty hoặc người đại diện nộp tiền"
              className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú Chứng Từ / Ủy Nhiệm Chi</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Số UNC ngân hàng, chứng từ chuyển tiền..."
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
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{initialData ? 'Cập Nhật Phiếu Thu' : 'Lưu & Ghi Sổ Thu Tiền'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
