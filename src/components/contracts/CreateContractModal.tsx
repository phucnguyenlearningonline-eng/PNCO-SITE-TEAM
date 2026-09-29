import React, { useState } from 'react';
import { 
  X, 
  FileSignature, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Package, 
  HardHat, 
  DollarSign, 
  Percent, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Project, ExpenseItem, ContractPaymentStage, User, ExpenseCategory } from '../../types';
import { formatVND } from '../../utils/formatters';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentUser: User;
  onSaveContract: (contract: ExpenseItem) => void;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentUser,
  onSaveContract,
}) => {
  if (!isOpen) return null;

  // Loại hợp đồng: 'labor' (Hợp đồng nhân công / Thầu phụ) | 'material' (Hợp đồng mua bán vật tư)
  const [contractType, setContractType] = useState<'labor' | 'material'>('labor');

  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [contractNumber, setContractNumber] = useState<string>(() => 
    `HĐNC-2026/0${Math.floor(10 + Math.random() * 90)}`
  );
  const [title, setTitle] = useState<string>('Hợp đồng khoán nhân công thi công tuyến ống thép & Sprinkler PCCC');
  const [partnerName, setPartnerName] = useState<string>('Đội thợ thi công cơ điện PCCC Anh Nam');
  const [representative, setRepresentative] = useState<string>('Nguyễn Văn Nam (Đội trưởng)');
  const [contractDate, setContractDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState<number>(350000000);
  const [vatRate, setVatRate] = useState<number>(0); // Nhân công thường VAT = 0 hoặc đã gồm VAT

  // Điều khoản tạm ứng
  const [advancePercentage, setAdvancePercentage] = useState<number>(30);
  const [notes, setNotes] = useState<string>('Bảo hành trách nhiệm kỹ thuật 12 tháng sau khi nghiệm thu bàn giao');

  // Danh sách mốc thanh toán
  const [stages, setStages] = useState<ContractPaymentStage[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = 350000000;
    return [
      {
        id: `stg-${Date.now()}-1`,
        stageNumber: 1,
        title: 'Tạm ứng hợp đồng (30%)',
        percentage: 30,
        amount: Math.round(total * 0.3),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Tạm ứng huy động quân số & chuẩn bị công cụ dụng cụ thi công',
      },
      {
        id: `stg-${Date.now()}-2`,
        stageNumber: 2,
        title: 'Thanh toán Đợt 1 (Nghiệm thu khối lượng 40%)',
        percentage: 40,
        amount: Math.round(total * 0.4),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Nghiệm thu lắp đặt ống trục chính tầng 1 & 2',
      },
      {
        id: `stg-${Date.now()}-3`,
        stageNumber: 3,
        title: 'Thanh toán Đợt 2 (Nghiệm thu lắp đặt 20%)',
        percentage: 20,
        amount: Math.round(total * 0.2),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Nghiệm thu toàn bộ tuyến ống & test áp lực nước',
      },
      {
        id: `stg-${Date.now()}-4`,
        stageNumber: 4,
        title: 'Quyết toán & Giữ bảo hành công trình (10%)',
        percentage: 10,
        amount: Math.round(total * 0.1),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Nghiệm thu PCCC với Công An PCCC & bàn giao CĐT',
      },
    ];
  });

  // Khi chuyển loại hợp đồng
  const handleSwitchContractType = (type: 'labor' | 'material') => {
    setContractType(type);
    if (type === 'labor') {
      setContractNumber(`HĐNC-2026/0${Math.floor(10 + Math.random() * 90)}`);
      setTitle('Hợp đồng khoán nhân công thi công lắp đặt tuyến ống thép & Sprinkler PCCC');
      setPartnerName('Đội thợ thi công cơ điện PCCC Anh Nam');
      setRepresentative('Nguyễn Văn Nam (Đội trưởng)');
      setVatRate(0);
      setTotalAmount(350000000);
      regenerateStages(350000000);
    } else {
      setContractNumber(`HĐMB-2026/0${Math.floor(10 + Math.random() * 90)}`);
      setTitle('Hợp đồng mua bán cung cấp ống thép mạ kẽm & phụ kiện ren PCCC');
      setPartnerName('Tập Đoàn Hòa Phát - Chi nhánh M&E Ống thép');
      setRepresentative('Trần Văn Bình (Trưởng phòng KD)');
      setVatRate(10);
      setTotalAmount(1200000000);
      regenerateStages(1200000000);
    }
  };

  const regenerateStages = (total: number) => {
    const today = new Date().toISOString().split('T')[0];
    setStages([
      {
        id: `stg-${Date.now()}-1`,
        stageNumber: 1,
        title: 'Tạm ứng hợp đồng (30%)',
        percentage: 30,
        amount: Math.round(total * 0.3),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Tạm ứng sau khi ký hợp đồng',
      },
      {
        id: `stg-${Date.now()}-2`,
        stageNumber: 2,
        title: 'Thanh toán Đợt 1 (Giao hàng / Nghiệm thu đợt 1 - 40%)',
        percentage: 40,
        amount: Math.round(total * 0.4),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Thanh toán theo khối lượng nghiệm thu',
      },
      {
        id: `stg-${Date.now()}-3`,
        stageNumber: 3,
        title: 'Thanh toán Đợt 2 (Nghiệm thu hoàn tất 20%)',
        percentage: 20,
        amount: Math.round(total * 0.2),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Nghiệm thu chạy thử hệ thống',
      },
      {
        id: `stg-${Date.now()}-4`,
        stageNumber: 4,
        title: 'Tất toán hợp đồng & Bảo hành (10%)',
        percentage: 10,
        amount: Math.max(0, total - Math.round(total * 0.3) - Math.round(total * 0.4) - Math.round(total * 0.2)),
        dueDate: today,
        status: 'pending',
        paymentMethod: 'transfer',
        notes: 'Quyết toán thanh lý hợp đồng',
      },
    ]);
  };

  const handleTotalAmountChange = (newTotal: number) => {
    setTotalAmount(newTotal);
    // Tự động phân bổ lại mốc
    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        amount: Math.round((newTotal * (s.percentage || 25)) / 100),
      }))
    );
  };

  const handleRemoveStage = (id: string) => {
    setStages((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddCustomStage = () => {
    const today = new Date().toISOString().split('T')[0];
    const newStage: ContractPaymentStage = {
      id: `stg-${Date.now()}`,
      stageNumber: stages.length + 1,
      title: `Thanh toán Đợt ${stages.length + 1}`,
      percentage: 10,
      amount: Math.round(totalAmount * 0.1),
      dueDate: today,
      status: 'pending',
      paymentMethod: 'transfer',
      notes: '',
    };
    setStages([...stages, newStage]);
  };

  const selectedProj = projects.find((p) => p.id === projectId) || projects[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || totalAmount <= 0) return;

    const baseAmount = Math.round(totalAmount / (1 + vatRate / 100));
    const vatAmount = totalAmount - baseAmount;

    const newContractItem: ExpenseItem = {
      id: `contract-${Date.now()}`,
      code: contractNumber.trim(),
      type: contractType === 'labor' ? 'expense' : 'po',
      category: contractType === 'labor' ? 'labor_sub' : 'material',
      title: title.trim(),
      subDescription: `${contractNumber.trim()}: ${
        contractType === 'labor' ? 'Hợp đồng khoán nhân công' : 'Hợp đồng mua bán vật tư'
      } - ${partnerName.trim()}`,
      projectId: selectedProj?.id || '',
      projectName: selectedProj?.name || '',
      supplier: partnerName.trim(),
      receiverOrPayer: representative.trim() || partnerName.trim(),
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.roleTitle,
      date: contractDate,
      amount: baseAmount,
      vatRate,
      vatAmount,
      totalAmount,
      priority: 'normal',
      status: 'approved',
      paymentMethod: 'transfer',
      hasContract: true,
      contractNumber: contractNumber.trim(),
      contractDate,
      contractAdvancePercentage: advancePercentage,
      contractAdvanceAmount: Math.round((totalAmount * advancePercentage) / 100),
      contractPaymentStages: stages,
      contractNotes: notes.trim(),
    };

    onSaveContract(newContractItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-600 text-white">
              <FileSignature className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base">Tạo Hợp Đồng Mới</h3>
              <p className="text-xs text-slate-300">
                Quản lý Hợp đồng Nhân công &amp; Hợp đồng Mua bán vật tư (Tách biệt khỏi đơn hàng mua lẻ)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* 1. CHỌN LOẠI HỢP ĐỒNG (NHÂN CÔNG VS MUA BÁN VẬT TƯ) */}
          <div>
            <label className="block font-bold text-slate-800 uppercase text-[11px] mb-1.5">
              Phân Loại Hợp Đồng <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSwitchContractType('labor')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  contractType === 'labor'
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${contractType === 'labor' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">1. Hợp Đồng Nhân Công &amp; Thầu Phụ</div>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    Giao khoán tổ thợ kéo cáp, hàn ống PCCC, thi công điện... (Không nằm trong Đơn hàng PO)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchContractType('material')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  contractType === 'material'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${contractType === 'material' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">2. Hợp Đồng Mua Bán Vật Tư (Lớn)</div>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    Hợp đồng kinh tế cung cấp vật tư, cáp điện, ống thép, tủ điện có ký hợp đồng
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. DỰ ÁN & SỐ HỢP ĐỒNG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dự Án Thi Công Áp Dụng <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số Hợp Đồng Kinh Tế <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                required
                placeholder="VD: HĐNC-2026/01 hoặc HĐMB-2026/01"
                className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono font-bold bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 3. TÊN HỢP ĐỒNG */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên Hợp Đồng / Nội Dung Khoán <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full py-2 px-3 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* 4. ĐỐI TÁC / ĐỘI THỢ & ĐẠI DIỆN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {contractType === 'labor' ? 'Tên Tổ Đội / Nhà Thầu Phụ' : 'Nhà Cung Cấp Vật Tư'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Người Đại Diện / Đội Trưởng
              </label>
              <input
                type="text"
                value={representative}
                onChange={(e) => setRepresentative(e.target.value)}
                placeholder="Họ tên người đại diện nhận thanh toán"
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* 5. GIÁ TRỊ HỢP ĐỒNG & NGÀY KÝ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Giá Trị Hợp Đồng (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={totalAmount}
                onChange={(e) => handleTotalAmountChange(Number(e.target.value))}
                required
                className="w-full py-2 px-3 border border-emerald-300 bg-emerald-50/50 rounded-xl font-mono font-black text-emerald-800 text-sm"
              />
              <div className="text-[10.5px] text-slate-400 mt-1 font-mono">{formatVND(totalAmount)}</div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Thuế VAT (%)</label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value={0}>0% (Không chịu thuế / Đã gồm thuế)</option>
                <option value={8}>8% VAT</option>
                <option value={10}>10% VAT</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày Ký Hợp Đồng</label>
              <input
                type="date"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                required
                className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono bg-white"
              />
            </div>
          </div>

          {/* 6. CÁC MỐC THANH TOÁN (ĐỢT 1, ĐỢT 2, TẤT TOÁN) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs">Kế Hoạch Các Mốc Giải Ngân ({stages.length} mốc):</span>
                <p className="text-[10px] text-slate-500">Tự động phân bổ theo tiến độ thi công và nghiệm thu</p>
              </div>

              <button
                type="button"
                onClick={handleAddCustomStage}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm mốc</span>
              </button>
            </div>

            <div className="space-y-2">
              {stages.map((stg, idx) => (
                <div key={stg.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={stg.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStages((prev) => prev.map((s) => (s.id === stg.id ? { ...s, title: val } : s)));
                      }}
                      className="font-bold text-slate-800 text-xs py-1 px-2 border border-slate-200 rounded flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={stg.percentage || 0}
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          setStages((prev) =>
                            prev.map((s) =>
                              s.id === stg.id
                                ? { ...s, percentage: pct, amount: Math.round((totalAmount * pct) / 100) }
                                : s
                            )
                          );
                        }}
                        className="w-14 py-1 px-1.5 border border-slate-200 rounded font-mono text-center text-xs"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>

                    <div className="font-mono font-bold text-slate-900 text-xs w-28 text-right">
                      {formatVND(stg.amount)}
                    </div>

                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(stg.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Xóa mốc"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. GHI CHÚ ĐIỀU KHOẢN */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú Điều Khoản Hợp Đồng &amp; Bảo Hành</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thời gian bảo hành, điều kiện phạt trễ tiến độ, giữ bảo hành..."
              className="w-full py-1.5 px-3 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Lưu &amp; Kích Hoạt Hợp Đồng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
