import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  ShoppingCart, 
  Calendar, 
  CheckCircle2, 
  User, 
  Link as LinkIcon, 
  Building2,
  HardHat,
  Users,
  Edit3,
  FileText,
  DollarSign
} from 'lucide-react';
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

type PaymentSourceType = 'po' | 'labor_contract' | 'other';

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

  // 3 chế độ nguồn chi: 'po' (Từ đơn hàng) | 'labor_contract' (Hợp đồng nhân công) | 'other' (Tự nhập)
  const [sourceType, setSourceType] = useState<PaymentSourceType>(
    preselectedPo ? 'po' : pendingOrders.length > 0 ? 'po' : 'other'
  );

  // States cho Ref PO
  const [selectedPoId, setSelectedPoId] = useState<string>(preselectedPo?.id || pendingOrders[0]?.id || '');

  // States cho Hợp đồng nhân công
  const [laborContractCode, setLaborContractCode] = useState<string>('HĐNC-01/COHERENT');
  const [laborTeamName, setLaborTeamName] = useState<string>('Đội thợ thi công ống thép & Sprinkler PCCC (Anh Nam)');
  const [laborStage, setLaborStage] = useState<string>('Tạm ứng đợt 1 (30% HĐ nhân công)');
  const [laborLeader, setLaborLeader] = useState<string>('Nguyễn Văn Nam (Đội trưởng)');
  const [isCustomLaborContract, setIsCustomLaborContract] = useState<boolean>(false);

  // Form Fields Chung
  const [projectId, setProjectId] = useState<string>(preselectedPo?.projectId || projects[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>(preselectedPo?.category || 'material');
  const [title, setTitle] = useState<string>(preselectedPo?.title ? `Thanh toán đơn hàng ${preselectedPo.code}: ${preselectedPo.title}` : '');
  const [supplier, setSupplier] = useState<string>(preselectedPo?.supplier || '');
  const [receiverName, setReceiverName] = useState<string>(preselectedPo?.supplier || '');
  const [amount, setAmount] = useState<number>(preselectedPo?.totalAmount || 50000000);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'advance_fund'>('transfer');
  const [notes, setNotes] = useState<string>('');

  // Khi đổi tab Nguồn chi
  const handleChangeSourceType = (type: PaymentSourceType) => {
    setSourceType(type);

    if (type === 'po') {
      const defaultPo = pendingOrders.find((p) => p.id === selectedPoId) || pendingOrders[0];
      if (defaultPo) {
        setSelectedPoId(defaultPo.id);
        setProjectId(defaultPo.projectId);
        setCategory(defaultPo.category);
        setTitle(`Thanh toán đơn hàng ${defaultPo.code}: ${defaultPo.title}`);
        setSupplier(defaultPo.supplier);
        setReceiverName(defaultPo.supplier);
        setAmount(defaultPo.totalAmount);
      }
    } else if (type === 'labor_contract') {
      setCategory('labor_sub');
      setSupplier(laborTeamName);
      setReceiverName(laborLeader);
      setTitle(`[${laborContractCode}] ${laborStage} - ${laborTeamName}`);
      if (amount === 50000000 || (preselectedPo && amount === preselectedPo.totalAmount)) {
        setAmount(35000000);
      }
    } else {
      // 'other' - Tự nhập tự do
      setTitle('');
      setCategory('other');
    }
  };

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

  // Khi chọn HĐ nhân công có sẵn
  const handleSelectLaborPreset = (presetKey: string) => {
    if (presetKey === 'custom') {
      setIsCustomLaborContract(true);
      setLaborContractCode(`HĐNC-0${Math.floor(1 + Math.random() * 9)}`);
      setLaborTeamName('');
      setLaborLeader('');
      return;
    }
    setIsCustomLaborContract(false);
    if (presetKey === 'pccc') {
      setLaborContractCode('HĐNC-01/COHERENT');
      setLaborTeamName('Đội thợ thi công ống thép & Sprinkler PCCC (Anh Nam)');
      setLaborLeader('Nguyễn Văn Nam (Đội trưởng thi công PCCC)');
      setSupplier('Đội thợ thi công ống PCCC Anh Nam');
      setReceiverName('Nguyễn Văn Nam');
      setTitle(`[HĐNC-01/COHERENT] ${laborStage} - Đội thợ ống thép PCCC Anh Nam`);
    } else if (presetKey === 'dien') {
      setLaborContractCode('HĐNC-02/LANDMARK');
      setLaborTeamName('Đội thợ điện kéo cáp trục đứng & đấu nối tủ MSB (Anh Tuấn)');
      setLaborLeader('Trần Tuấn Anh (Tổ trưởng cơ điện)');
      setSupplier('Tổ thợ điện Anh Tuấn');
      setReceiverName('Trần Tuấn Anh');
      setTitle(`[HĐNC-02/LANDMARK] ${laborStage} - Tổ thợ điện Anh Tuấn`);
    } else if (presetKey === 'hvac') {
      setLaborContractCode('HĐNC-03/VSIP2');
      setLaborTeamName('Đội thợ gia công lắp đặt ống gió & quạt hút khói HVAC (Anh Cường)');
      setLaborLeader('Vũ Mạnh Cường (Tổ trưởng HVAC)');
      setSupplier('Đội thợ HVAC Anh Cường');
      setReceiverName('Vũ Mạnh Cường');
      setTitle(`[HĐNC-03/VSIP2] ${laborStage} - Đội thợ HVAC Anh Cường`);
    } else if (presetKey === 'han') {
      setLaborContractCode('HĐNC-04/SITE');
      setLaborTeamName('Tổ thợ hàn công nghệ cao & lắp đặt giá đỡ bồn nước (Anh Dũng)');
      setLaborLeader('Hồ Tiến Dũng (Thợ hàn bậc 6)');
      setSupplier('Tổ thợ hàn Anh Dũng');
      setReceiverName('Hồ Tiến Dũng');
      setTitle(`[HĐNC-04/SITE] ${laborStage} - Tổ thợ hàn Anh Dũng`);
    }
  };

  // Cập nhật nội dung nhân công khi đổi giai đoạn
  const handleLaborStageChange = (stage: string) => {
    setLaborStage(stage);
    setTitle(`[${laborContractCode}] ${stage} - ${laborTeamName || 'Đội thợ nhân công'}`);
  };

  useEffect(() => {
    if (preselectedPo) {
      setSourceType('po');
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

    const matchedPo = sourceType === 'po' ? pendingOrders.find((p) => p.id === selectedPoId) : null;

    let subDesc = '';
    if (sourceType === 'po' && matchedPo) {
      subDesc = `Đồng bộ tất toán đơn PO ${matchedPo.code}`;
    } else if (sourceType === 'labor_contract') {
      subDesc = `HĐ khoán nhân công: ${laborContractCode} • ${laborStage}`;
    } else {
      subDesc = `Chi phí site ${selectedProj?.name || ''}`;
    }

    const paymentItem: ExpenseItem = {
      id: `pay-${Date.now()}`,
      code: `PC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      type: 'expense',
      category: category,
      title: title.trim(),
      subDescription: subDesc,
      projectId: selectedProj?.id || '',
      projectName: selectedProj?.name || '',
      supplier: supplier.trim() || (sourceType === 'labor_contract' ? laborTeamName : 'Đối tác / Nhà cung cấp'),
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-rose-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-700 text-white">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base">Lập Phiếu Chi Tiền Dự Án</h3>
              <p className="text-xs text-rose-200">Ref từ đơn hàng PO, Hợp đồng nhân công hoặc Chi tự do</p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* ============================================================== */}
          {/* 1. NGUỒN CĂN CỨ CHI TIỀN (3 LỰA CHỌN THEO YÊU CẦU CỦA USER)    */}
          {/* ============================================================== */}
          <div>
            <label className="block font-bold text-slate-800 uppercase text-[11px] mb-1.5">
              Căn Cứ / Nguồn Chi Tiền <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Lựa chọn 1: Ref từ Đơn Hàng PO */}
              <button
                type="button"
                onClick={() => handleChangeSourceType('po')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  sourceType === 'po'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400 shadow-2xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ShoppingCart className={`w-3.5 h-3.5 ${sourceType === 'po' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-[11px]">1. Từ Đơn Hàng (PO)</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {pendingOrders.length} PO chờ chi
                </span>
              </button>

              {/* Lựa chọn 2: Hợp Đồng Nhân Công */}
              <button
                type="button"
                onClick={() => handleChangeSourceType('labor_contract')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  sourceType === 'labor_contract'
                    ? 'bg-purple-50 border-purple-400 text-purple-950 ring-2 ring-purple-400 shadow-2xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <HardHat className={`w-3.5 h-3.5 ${sourceType === 'labor_contract' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-[11px]">2. HĐ Nhân Công</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Lương thợ / Tổ đội
                </span>
              </button>

              {/* Lựa chọn 3: Chi Nội Dung Khác (Tự Đánh Vào) */}
              <button
                type="button"
                onClick={() => handleChangeSourceType('other')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  sourceType === 'other'
                    ? 'bg-sky-50 border-sky-400 text-sky-950 ring-2 ring-sky-400 shadow-2xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Edit3 className={`w-3.5 h-3.5 ${sourceType === 'other' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-[11px]">3. Chi Khác (Tự Gõ)</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Cơm ca, cẩu, xe...
                </span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* KHỐI CON 1: NẾU CHỌN TỪ ĐƠN HÀNG (PO)                           */}
          {/* ============================================================== */}
          {sourceType === 'po' && (
            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-950 text-[11px] flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-rose-600" />
                  <span>Chọn Đơn Hàng PO Để Chi &amp; Tự Động Tất Toán:</span>
                </span>
                <span className="text-[10.5px] font-semibold text-rose-700">
                  {pendingOrders.length} đơn hàng chưa chi
                </span>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="p-2.5 text-center text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                  Hiện không có đơn hàng PO nào đang chờ chi. Bạn có thể chọn "HĐ Nhân Công" hoặc "Chi Khác (Tự Gõ)".
                </div>
              ) : (
                <select
                  value={selectedPoId}
                  onChange={(e) => handleSelectPo(e.target.value)}
                  className="w-full py-2 px-2.5 border border-rose-300 rounded-lg bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500"
                >
                  {pendingOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      [{po.code}] {po.title} - {po.supplier} ({formatVND(po.totalAmount)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* KHỐI CON 2: NẾU CHỌN HỢP ĐỒNG NHÂN CÔNG                        */}
          {/* ============================================================== */}
          {sourceType === 'labor_contract' && (
            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 text-[11px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-700" />
                  <span>Chọn Hợp Đồng / Tổ Đội Thi Công Nhân Công:</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectLaborPreset('custom')}
                  className="text-[10.5px] font-bold text-purple-700 hover:underline cursor-pointer"
                >
                  + Tự nhập tổ đội mới
                </button>
              </div>

              {!isCustomLaborContract ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    onChange={(e) => handleSelectLaborPreset(e.target.value)}
                    className="w-full py-2 px-2.5 border border-purple-300 rounded-lg bg-white font-medium text-slate-900 text-xs"
                    defaultValue="pccc"
                  >
                    <option value="pccc">[HĐNC-01] Đội thợ ống thép &amp; PCCC (Anh Nam)</option>
                    <option value="dien">[HĐNC-02] Đội thợ điện kéo cáp &amp; tủ MSB (Anh Tuấn)</option>
                    <option value="hvac">[HĐNC-03] Đội thợ ống gió &amp; HVAC (Anh Cường)</option>
                    <option value="han">[HĐNC-04] Tổ thợ hàn công nghệ cao (Anh Dũng)</option>
                    <option value="custom">-- + Tự nhập tên đội thợ khác --</option>
                  </select>

                  <select
                    value={laborStage}
                    onChange={(e) => handleLaborStageChange(e.target.value)}
                    className="w-full py-2 px-2.5 border border-purple-300 rounded-lg bg-white font-medium text-slate-900 text-xs"
                  >
                    <option value="Tạm ứng đợt 1 (30% HĐ nhân công)">Tạm ứng đợt 1 (30% HĐ nhân công)</option>
                    <option value="Thanh toán khối lượng hoàn thành tuần">Thanh toán khối lượng hoàn thành tuần</option>
                    <option value="Thanh toán nghiệm thu giai đoạn (Đợt 2)">Thanh toán nghiệm thu giai đoạn (Đợt 2)</option>
                    <option value="Quyết toán thanh lý HĐ nhân công">Quyết toán thanh lý HĐ nhân công</option>
                    <option value="Bồi dưỡng tăng ca ca đêm đội thợ">Bồi dưỡng tăng ca ca đêm đội thợ</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="text"
                        value={laborContractCode}
                        onChange={(e) => {
                          setLaborContractCode(e.target.value);
                          setTitle(`[${e.target.value}] ${laborStage} - ${laborTeamName}`);
                        }}
                        placeholder="Mã HĐNC (VD: HĐNC-05)"
                        className="w-full py-1.5 px-2 border border-purple-300 rounded bg-white font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={laborTeamName}
                        onChange={(e) => {
                          setLaborTeamName(e.target.value);
                          setSupplier(e.target.value);
                          setTitle(`[${laborContractCode}] ${laborStage} - ${e.target.value}`);
                        }}
                        placeholder="Tên tổ đội thợ thi công"
                        className="w-full py-1.5 px-2 border border-purple-300 rounded bg-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={laborStage}
                      onChange={(e) => handleLaborStageChange(e.target.value)}
                      placeholder="Giai đoạn / Đợt thanh toán"
                      className="w-full py-1.5 px-2 border border-purple-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={laborLeader}
                      onChange={(e) => {
                        setLaborLeader(e.target.value);
                        setReceiverName(e.target.value);
                      }}
                      placeholder="Đội trưởng nhận tiền"
                      className="w-full py-1.5 px-2 border border-purple-300 rounded bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* KHỐI CON 3: NẾU CHỌN CHI KHÁC (TỰ GÕ TỰ DO)                     */}
          {/* ============================================================== */}
          {sourceType === 'other' && (
            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 text-sky-950 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="text-[11px]">
                Chế độ tự gõ tự do: Bạn có thể nhập bất kỳ nội dung chi nào (xe cẩu, cơm ca, tiếp khách CĐT, văn phòng phẩm, v.v.).
              </span>
            </div>
          )}

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

          {/* Hạng mục & Ngày chi */}
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

          {/* Nội Dung Phiếu Chi (Cho phép tự đánh vào hoặc sửa từ gợi ý) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                Nội Dung Phiếu Chi <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10.5px] text-slate-400 italic">Có thể tự đánh vào tùy ý</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="VD: Chi thanh toán tiền nhân công kéo cáp tuần 36 hoặc Chi tiền xe cẩu bồn nước"
              className="w-full py-2 px-3 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-rose-500"
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

          {/* Đối tác & Người nhận */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {sourceType === 'labor_contract' ? 'Đội Thợ / Đối Tác' : 'Nhà Cung Cấp / Đối Tác'}
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Tên đơn vị nhận thanh toán"
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Người Nhận Tiền Trực Tiếp</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Họ tên người nhận"
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú Chứng Từ Kèm Theo</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú số hóa đơn VAT, biên bản nghiệm thu khối lượng, phiếu xuất kho..."
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
              className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu &amp; Ghi Sổ Chi Tiền</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
