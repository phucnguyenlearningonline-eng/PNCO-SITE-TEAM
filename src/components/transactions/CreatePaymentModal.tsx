import React, { useState, useEffect, useMemo } from 'react';
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
  DollarSign,
  Layers,
  ArrowRight,
  Percent,
  Clock,
  AlertCircle,
  Hash
} from 'lucide-react';
import { Project, ExpenseItem, ExpenseCategory } from '../../types';
import { formatVND, formatTy, formatDateVN } from '../../utils/formatters';
import { generateNextVoucherCode, isPaymentVoucher, isReceiptVoucher, sortVouchersAndOrders } from '../../utils/voucherCode';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  expenses: ExpenseItem[];
  preselectedPo?: ExpenseItem | null;
  preselectedProjectId?: string;
  initialData?: ExpenseItem | null;
  onSavePayment: (
    payment: ExpenseItem, 
    syncedPoId?: string,
    paymentStageDetails?: { isFullyPaid: boolean; newTotalPaid: number; stageTitle?: string }
  ) => void;
}

type PaymentSourceType = 'po' | 'labor_contract' | 'other';

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  onClose,
  projects,
  expenses,
  preselectedPo,
  preselectedProjectId,
  initialData,
  onSavePayment,
}) => {
  if (!isOpen) return null;

  // Lọc danh sách ĐƠN HÀNG THỰC TẾ (TUYỆT ĐỐI KHÔNG LẤY PHIẾU CHI PC- HOẶC PHIẾU THU PT-)
  // CHỈ lấy đơn hàng còn nợ mốc thanh toán (đơn đã thanh toán đủ thì KHÔNG show lên)
  const payableOrders = useMemo<ExpenseItem[]>(() => {
    const filtered = expenses.filter((e) => {
      // 1. TUYỆT ĐỐI KHÔNG SHOW PHIẾU CHI VÀ PHIẾU THU TRONG MỤC ĐƠN HÀNG
      if (isPaymentVoucher(e) || isReceiptVoucher(e)) return false;
      const codeUpper = (e.code || '').trim().toUpperCase();
      if (
        codeUpper.startsWith('PC-') || 
        codeUpper.startsWith('PNCO-PC-') || 
        codeUpper.includes('PC') || 
        codeUpper.startsWith('PT-') || 
        codeUpper.startsWith('PNCO-PT-')
      ) return false;
      if (e.id?.startsWith('pay-') || e.id?.startsWith('pc-') || e.id?.startsWith('rcp-') || e.id?.startsWith('pt-')) return false;
      if (e.type === 'revenue') return false;
      // Phiếu chi liên kết đơn hàng PO khác -> tuyệt đối không phải đơn hàng
      if (e.linkedPoId) return false;

      // 2. PHẢI LÀ ĐƠN HÀNG THỰC SỰ (PO / DH mua sắm vật tư thiết bị)
      const isOrder = e.type === 'po' || codeUpper.startsWith('PO') || codeUpper.startsWith('DH');
      if (!isOrder) return false;

      // 3. Nếu đang mở modal chỉnh sửa phiếu chi này thì luôn giữ đơn hàng đang liên kết
      if (initialData?.linkedPoId && e.id === initialData.linkedPoId) {
        return true;
      }
      if (preselectedPo && e.id === preselectedPo.id) {
        return true;
      }

      // 4. CHỈ LIÊN KẾT VỚI ĐƠN HÀNG CÒN NỢ MỐC THANH TOÁN (ĐÃ THANH TOÁN ĐỦ THÌ KHÔNG CẦN SHOW LÊN)
      const vouchersPaid = expenses
        .filter((item) => item.linkedPoId === e.id && (item.status === 'paid' || isPaymentVoucher(item)) && item.id !== initialData?.id)
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

      const paidSoFar = Math.max(e.paidAmount || 0, vouchersPaid);
      const remainingDebt = Math.max(0, e.totalAmount - paidSoFar);

      // Nếu đơn hàng có các mốc thanh toán trong hợp đồng (contractPaymentStages)
      const hasContractStages = e.contractPaymentStages && e.contractPaymentStages.length > 0;
      const hasUnpaidStage = hasContractStages
        ? e.contractPaymentStages!.some((st) => st.status === 'pending')
        : remainingDebt > 1000;

      // Đơn hàng thanh toán rồi (còn nợ <= 0 hoặc trạng thái paid và không còn mốc nợ) thì KHÔNG CẦN SHOW LÊN
      if (remainingDebt <= 1000 && !hasUnpaidStage) return false;
      if (e.status === 'paid' && remainingDebt <= 1000) return false;
      if (remainingDebt <= 0) return false;

      return true;
    });

    // Sắp xếp đơn hàng cần chi theo thứ tự mới nhất lên đầu
    return sortVouchersAndOrders(filtered, 'newest');
  }, [expenses, initialData, preselectedPo]);

  // 3 chế độ nguồn chi: 'po' (Từ đơn hàng) | 'labor_contract' (Hợp đồng nhân công) | 'other' (Tự nhập)
  const defaultSourceType: PaymentSourceType = initialData
    ? initialData.linkedPoId
      ? 'po'
      : initialData.category === 'labor_sub'
      ? 'labor_contract'
      : 'other'
    : preselectedPo
    ? 'po'
    : payableOrders.length > 0
    ? 'po'
    : 'other';

  const [sourceType, setSourceType] = useState<PaymentSourceType>(defaultSourceType);

  // States cho Ref PO
  const [selectedPoId, setSelectedPoId] = useState<string>(
    initialData?.linkedPoId || preselectedPo?.id || payableOrders[0]?.id || ''
  );

  // Lấy chi tiết đơn hàng PO đang chọn
  const currentPo = useMemo(() => {
    return payableOrders.find((p) => p.id === selectedPoId) || preselectedPo || payableOrders[0] || null;
  }, [payableOrders, selectedPoId, preselectedPo]);

  // Tính số tiền PO đã trả trước đó
  const poAlreadyPaid = useMemo(() => {
    if (!currentPo) return 0;
    const historyPaid = expenses
      .filter((e) => e.linkedPoId === currentPo.id && (e.status === 'paid' || isPaymentVoucher(e)) && e.id !== initialData?.id)
      .reduce((sum, e) => sum + e.totalAmount, 0);
    return Math.max(currentPo.paidAmount || 0, historyPaid);
  }, [currentPo, expenses, initialData]);

  const poOriginalValue = currentPo ? currentPo.totalAmount : 0;
  const poRemainingValue = Math.max(0, poOriginalValue - poAlreadyPaid);

  // Giai đoạn thanh toán cho PO: 'full' | 'stage_1' | 'stage_2' | 'stage_3' | 'custom'
  const [poStageType, setPoStageType] = useState<'full' | 'stage_1' | 'stage_2' | 'stage_3' | 'custom'>('full');
  const [stageName, setStageName] = useState<string>(initialData?.paymentStageTitle || 'Tất toán toàn bộ đơn hàng');

  // States cho Hợp đồng nhân công
  const [laborContractCode, setLaborContractCode] = useState<string>('HĐNC-01/COHERENT');
  const [laborTeamName, setLaborTeamName] = useState<string>('Đội thợ thi công ống thép & Sprinkler PCCC (Anh Nam)');
  const [laborStage, setLaborStage] = useState<string>('Tạm ứng đợt 1 (30% HĐ nhân công)');
  const [laborLeader, setLaborLeader] = useState<string>('Nguyễn Văn Nam (Đội trưởng)');
  const [isCustomLaborContract, setIsCustomLaborContract] = useState<boolean>(false);

  // Form Fields Chung
  const [projectId, setProjectId] = useState<string>(initialData?.projectId || preselectedProjectId || currentPo?.projectId || projects[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || currentPo?.category || 'material');
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [supplier, setSupplier] = useState<string>(initialData?.supplier || currentPo?.supplier || '');
  const [receiverName, setReceiverName] = useState<string>(initialData?.receiverOrPayer || initialData?.supplier || currentPo?.supplier || '');
  const [amount, setAmount] = useState<number>(initialData?.totalAmount || poRemainingValue || 50000000);
  const [hasVat, setHasVat] = useState<boolean>(initialData ? Boolean(initialData.vatRate && initialData.vatRate > 0) : true);
  const [vatRate, setVatRate] = useState<number>(initialData?.vatRate ?? 10);
  const [date, setDate] = useState<string>(initialData?.date || (() => new Date().toISOString().split('T')[0]));
  const [voucherCode, setVoucherCode] = useState<string>(() => {
    if (initialData?.code) return initialData.code;
    return generateNextVoucherCode('payment', expenses, initialData?.date || new Date().toISOString().split('T')[0]);
  });
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'advance_fund'>(initialData?.paymentMethod || 'transfer');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  // Hàm cập nhật số tiền và nội dung khi chọn đợt thanh toán PO
  const applyPoPaymentStage = (
    stage: 'full' | 'stage_1' | 'stage_2' | 'stage_3' | 'custom', 
    targetPo?: ExpenseItem,
    customPercentage?: number
  ) => {
    const po = targetPo || currentPo;
    if (!po) return;

    setPoStageType(stage);

    const orig = po.totalAmount;
    const paid = po.paidAmount || expenses
      .filter((e) => e.linkedPoId === po.id && e.status === 'paid')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const rem = Math.max(0, orig - paid);

    let stageAmount = rem;
    let sTitle = 'Tất toán toàn bộ đơn hàng';

    if (stage === 'full') {
      stageAmount = rem > 0 ? rem : orig;
      sTitle = 'Tất toán toàn bộ đơn hàng';
    } else if (stage === 'stage_1') {
      const pct = customPercentage ?? 30;
      stageAmount = Math.round((orig * pct) / 100);
      sTitle = `Thanh toán Đợt 1 (Tạm ứng ${pct}%)`;
    } else if (stage === 'stage_2') {
      const pct = customPercentage ?? 50;
      stageAmount = Math.round((orig * pct) / 100);
      sTitle = `Thanh toán Đợt 2 (Giao hàng nghiệm thu ${pct}%)`;
    } else if (stage === 'stage_3') {
      const pct = customPercentage ?? 20;
      stageAmount = Math.min(rem, Math.round((orig * pct) / 100));
      sTitle = `Thanh toán Đợt 3 (Quyết toán giữ bảo hành ${pct}%)`;
    } else {
      sTitle = 'Thanh toán đợt theo thỏa thuận';
    }

    setStageName(sTitle);
    setAmount(stageAmount);
    setTitle(`[${po.code}] ${sTitle} - ${po.title}`);
    setProjectId(po.projectId);
    setCategory(po.category);
    setSupplier(po.supplier);
    setReceiverName(po.supplier);
  };

  // Khởi tạo form khi đổi đơn hàng PO
  const handleSelectPo = (poId: string) => {
    setSelectedPoId(poId);
    const po = payableOrders.find((item) => item.id === poId);
    if (po) {
      applyPoPaymentStage('full', po);
    }
  };

  // Khởi tạo khi mở modal với preselectedPo hoặc khi mount
  useEffect(() => {
    // Nếu đang chỉnh sửa phiếu chi đã có (initialData), KHÔNG được ghi đè thông tin
    if (initialData) return;

    if (preselectedPo) {
      setSourceType('po');
      setSelectedPoId(preselectedPo.id);
      applyPoPaymentStage('full', preselectedPo);
    } else if (currentPo && sourceType === 'po') {
      applyPoPaymentStage('full', currentPo);
    }
  }, [preselectedPo]);

  // Khi đổi tab Nguồn chi
  const handleChangeSourceType = (type: PaymentSourceType) => {
    setSourceType(type);

    if (type === 'po') {
      if (currentPo) {
        applyPoPaymentStage('full', currentPo);
      }
    } else if (type === 'labor_contract') {
      setCategory('labor_sub');
      setSupplier(laborTeamName);
      setReceiverName(laborLeader);
      setTitle(`[${laborContractCode}] ${laborStage} - ${laborTeamName}`);
      setAmount(35000000);
    } else {
      // 'other' - Tự nhập tự do
      setTitle('');
      setCategory('other');
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

  // Tính % của đợt thanh toán này so với giá trị đơn hàng gốc
  const currentPercentage = useMemo(() => {
    if (!poOriginalValue || poOriginalValue <= 0 || !amount) return 0;
    return (amount / poOriginalValue) * 100;
  }, [amount, poOriginalValue]);

  // Số tiền còn nợ sau đợt thanh toán này
  const remainingAfterThisPayment = useMemo(() => {
    if (!currentPo) return 0;
    const newTotalPaid = poAlreadyPaid + (amount || 0);
    return Math.max(0, poOriginalValue - newTotalPaid);
  }, [currentPo, poAlreadyPaid, amount, poOriginalValue]);

  const selectedProj = projects.find((p) => p.id === projectId) || projects[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !title.trim()) return;

    const matchedPo = sourceType === 'po' ? currentPo : null;

    let subDesc = '';
    let isFullyPaid = false;
    let newTotalPaid = 0;

    if (sourceType === 'po' && matchedPo) {
      newTotalPaid = poAlreadyPaid + amount;
      isFullyPaid = newTotalPaid >= matchedPo.totalAmount;
      subDesc = `Đồng bộ đơn PO ${matchedPo.code} • ${stageName} • Đã chi: ${formatVND(newTotalPaid)}/${formatVND(matchedPo.totalAmount)}`;
    } else if (sourceType === 'labor_contract') {
      subDesc = `HĐ khoán nhân công: ${laborContractCode} • ${laborStage}`;
    } else {
      subDesc = `Chi phí site ${selectedProj?.name || ''}`;
    }

    const paymentItem: ExpenseItem = {
      ...initialData,
      id: initialData?.id || `pay-${Date.now()}`,
      code: voucherCode.trim() || generateNextVoucherCode('payment', expenses, date),
      type: 'expense',
      category: category,
      title: title.trim(),
      subDescription: subDesc,
      projectId: selectedProj?.id || '',
      projectName: selectedProj?.name || '',
      supplier: supplier.trim() || (sourceType === 'labor_contract' ? laborTeamName : 'Đối tác / Nhà cung cấp'),
      receiverOrPayer: receiverName.trim() || supplier.trim(),
      createdById: initialData?.createdById || 'u-1',
      createdByName: initialData?.createdByName || 'Trần Anh Minh',
      createdByRole: initialData?.createdByRole || 'Chỉ Huy Trưởng',
      date: date,
      amount: hasVat && vatRate > 0 ? Math.round(amount / (1 + vatRate / 100)) : amount,
      vatRate: hasVat ? vatRate : 0,
      vatAmount: hasVat && vatRate > 0 ? amount - Math.round(amount / (1 + vatRate / 100)) : 0,
      totalAmount: amount,
      priority: initialData?.priority || 'normal',
      status: initialData?.status || 'paid',
      paymentMethod: paymentMethod,
      notes: notes.trim(),
      linkedPoId: matchedPo?.id,
      linkedPoCode: matchedPo?.code,
      paymentStageTitle: sourceType === 'po' ? stageName : laborStage,
    };

    onSavePayment(paymentItem, matchedPo?.id, {
      isFullyPaid,
      newTotalPaid,
      stageTitle: sourceType === 'po' ? stageName : laborStage,
    });

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
              <h3 className="font-bold text-base">
                {initialData ? 'Cập Nhật Phiếu Chi Tiền' : 'Lập Phiếu Chi Tiền Dự Án'}
              </h3>
              <p className="text-xs text-rose-200">
                {initialData ? `Mã phiếu: ${initialData.code}` : 'Ref từ đơn hàng PO (link giá trị, đợt 1, đợt 2), HĐ nhân công hoặc chi tự do'}
              </p>
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
                  Link giá trị &amp; đợt chi
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
          {/* KHỐI CON 1: NẾU CHỌN TỪ ĐƠN HÀNG (PO) - LINK GIÁ TRỊ & ĐỢT CHI  */}
          {/* ============================================================== */}
          {sourceType === 'po' && (
            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 space-y-3 animate-in fade-in">
              {/* Chọn đơn hàng */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-950 text-[11px] flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-rose-600" />
                    <span>Chọn Đơn Hàng PO Để Liên Kết:</span>
                  </span>
                  <span className="text-[10.5px] font-semibold text-rose-700">
                    {payableOrders.length} đơn hàng còn nợ thanh toán
                  </span>
                </div>

                {payableOrders.length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-amber-300 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Không có đơn hàng nào còn nợ mốc thanh toán</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tất cả các đơn hàng PO đã được thanh toán hoàn tất. Nếu muốn chi tiền cho các mục khác (không theo đơn hàng), vui lòng chọn <strong>Hợp Đồng Nhân Công</strong> hoặc <strong>Chi Phí Khác (Tự nhập)</strong> ở trên.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedPoId}
                    onChange={(e) => handleSelectPo(e.target.value)}
                    className="w-full py-2 px-2.5 border border-rose-300 rounded-lg bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500"
                  >
                    {payableOrders.map((po) => {
                      const paid = po.paidAmount || expenses
                        .filter((e) => e.linkedPoId === po.id && (e.status === 'paid' || isPaymentVoucher(e)) && e.id !== initialData?.id)
                        .reduce((sum, e) => sum + (e.totalAmount || 0), 0);
                      const rem = Math.max(0, po.totalAmount - paid);
                      return (
                        <option key={po.id} value={po.id}>
                          [{po.code}] {po.title} - {po.supplier} (Còn nợ: {formatVND(rem)} / Tổng đơn: {formatTy(po.totalAmount)})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* BẢNG LINK GIÁ TRỊ ĐƠN HÀNG CHI TIẾT (ĐÁP ỨNG TRỰC TIẾP YÊU CẦU USER) */}
              {currentPo && (
                <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs border-b pb-1.5">
                    <span className="font-bold text-slate-700">Giá trị đơn hàng &amp; Tiến độ thanh toán:</span>
                    <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {currentPo.code}
                    </span>
                  </div>

                  {/* 3 Thẻ số liệu: Tổng đơn | Đã chi | Còn nợ */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tổng đơn hàng</span>
                      <strong className="font-mono font-black text-slate-900 text-xs sm:text-sm mt-0.5 block">
                        {formatVND(poOriginalValue)}
                      </strong>
                    </div>

                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Đã thanh toán</span>
                      <strong className="font-mono font-black text-emerald-700 text-xs sm:text-sm mt-0.5 block">
                        {formatVND(poAlreadyPaid)}
                      </strong>
                    </div>

                    <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                      <span className="text-[10px] uppercase font-bold text-rose-800 block">Còn lại cần chi</span>
                      <strong className="font-mono font-black text-rose-700 text-xs sm:text-sm mt-0.5 block">
                        {formatVND(poRemainingValue)}
                      </strong>
                    </div>
                  </div>

                  {/* Thanh tiến độ thanh toán của PO */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10.5px] text-slate-500 font-semibold">
                      <span>Đã chi trước: {((poAlreadyPaid / (poOriginalValue || 1)) * 100).toFixed(0)}%</span>
                      <span className="text-amber-700">Đợt này chi: {currentPercentage.toFixed(0)}%</span>
                      <span className="text-rose-700">Còn lại sau đợt này: {formatVND(remainingAfterThisPayment)}</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 transition-all"
                        style={{ width: `${Math.min(100, (poAlreadyPaid / (poOriginalValue || 1)) * 100)}%` }}
                        title="Đã chi trước đó"
                      />
                      <div
                        className="bg-amber-500 h-2 transition-all"
                        style={{ width: `${Math.min(100, currentPercentage)}%` }}
                        title="Đợt thanh toán này"
                      />
                    </div>
                  </div>

                  {/* CÁC NÚT TẠO THANH TOÁN ĐỢT 1, ĐỢT 2, ĐỢT 3... (THEO YÊU CẦU CỦA USER) */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="font-bold text-[11px] text-slate-700 block">
                      Chọn giai đoạn thanh toán đợt:
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {/* Nút 1: Tất toán 100% */}
                      <button
                        type="button"
                        onClick={() => applyPoPaymentStage('full')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          poStageType === 'full'
                            ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[11px] font-bold">Tất toán 100%</div>
                        <div className="text-[9.5px] opacity-80 font-mono">
                          {formatTy(poRemainingValue)}
                        </div>
                      </button>

                      {/* Nút 2: Đợt 1 (Tạm ứng 30%) */}
                      <button
                        type="button"
                        onClick={() => applyPoPaymentStage('stage_1', undefined, 30)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          poStageType === 'stage_1'
                            ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[11px] font-bold">Đợt 1 (30%)</div>
                        <div className="text-[9.5px] opacity-80 font-mono">
                          {formatTy(Math.round(poOriginalValue * 0.3))}
                        </div>
                      </button>

                      {/* Nút 3: Đợt 2 (Giao hàng 50%) */}
                      <button
                        type="button"
                        onClick={() => applyPoPaymentStage('stage_2', undefined, 50)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          poStageType === 'stage_2'
                            ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[11px] font-bold">Đợt 2 (50%)</div>
                        <div className="text-[9.5px] opacity-80 font-mono">
                          {formatTy(Math.round(poOriginalValue * 0.5))}
                        </div>
                      </button>

                      {/* Nút 4: Đợt 3 (Quyết toán 20%) */}
                      <button
                        type="button"
                        onClick={() => applyPoPaymentStage('stage_3', undefined, 20)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          poStageType === 'stage_3'
                            ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[11px] font-bold">Đợt 3 (20%)</div>
                        <div className="text-[9.5px] opacity-80 font-mono">
                          {formatTy(Math.round(poOriginalValue * 0.2))}
                        </div>
                      </button>
                    </div>

                    {/* Hoặc tự nhập % tùy ý */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <span>Tùy chỉnh đợt:</span>
                      <button
                        type="button"
                        onClick={() => applyPoPaymentStage('stage_1', undefined, 40)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                      >
                        Tạm ứng 40%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPoPaymentStage('stage_1', undefined, 50)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                      >
                        Tạm ứng 50%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPoPaymentStage('stage_3', undefined, 10)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                      >
                        Giữ bảo hành 10%
                      </button>
                    </div>
                  </div>
                </div>
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

          {/* Số Phiếu Chi & Ngày Chi Tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-rose-700" />
                  <span>Số Phiếu Chi</span> <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded font-mono">
                  PNCO-Năm-0001
                </span>
              </div>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                required
                placeholder="PNCO-PC-2026-0001"
                className="w-full py-2 px-3 border border-rose-300 rounded-xl font-mono font-black text-rose-900 bg-rose-50/50 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Ngày Chi Tiền</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  if (!initialData) {
                    setVoucherCode(generateNextVoucherCode('payment', expenses, newDate));
                  }
                }}
                required
                className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono bg-white text-xs"
              />
            </div>
          </div>

          {/* Hạng mục chi phí */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Hạng Mục Chi Phí</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-medium text-xs"
            >
              <option value="material">📦 Vật tư &amp; Thiết bị M&amp;E</option>
              <option value="labor_sub">👷 Nhân công / Lương thợ thi công</option>
              <option value="transport">🚚 Xe cẩu &amp; Vận chuyển</option>
              <option value="overtime_meal">🍲 Cơm ca &amp; Tiếp khách site</option>
              <option value="other">⚡ Chi phí khác</option>
            </select>
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
              placeholder="VD: [PO-2026-0224] Thanh toán Đợt 1 (Tạm ứng 30%) - Mua cáp đồng hạ thế"
              className="w-full py-2 px-3 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Số tiền & Phương thức & Tỷ lệ % */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Số Tiền Chi Đợt Này (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  {sourceType === 'po' && poOriginalValue > 0 && (
                    <span className="text-[10.5px] text-amber-800 font-bold font-mono">
                      ~ {currentPercentage.toFixed(1)}% đơn hàng
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  value={amount || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAmount(val);
                    setPoStageType('custom');
                  }}
                  required
                  placeholder="Nhập số tiền..."
                  className="w-full py-2 px-3 border border-rose-300 bg-rose-50/60 rounded-xl font-mono font-black text-rose-900 text-sm focus:ring-2 focus:ring-rose-500"
                />
                <div className="text-[11px] text-slate-500 mt-1 font-mono font-bold">
                  = {formatVND(amount)}
                </div>
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

            {/* Ô CÓ THUẾ VAT HAY KHÔNG */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasVat}
                    onChange={(e) => setHasVat(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                    <span>Thuế VAT (Hóa đơn GTGT):</span>
                    {hasVat ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        ✓ Có VAT
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                        ✕ Không có VAT (0%)
                      </span>
                    )}
                  </span>
                </label>

                {hasVat && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[11px] font-semibold text-slate-600">Thuế suất:</span>
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
                      {[10, 8, 5, 0].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setVatRate(rate)}
                          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                            vatRate === rate
                              ? 'bg-rose-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {hasVat && vatRate > 0 ? (
                <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[10px]">Tiền trước thuế:</div>
                    <div className="font-mono font-bold text-slate-800">
                      {formatVND(Math.round(amount / (1 + vatRate / 100)))}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-rose-600 text-[10px]">Tiền thuế VAT ({vatRate}%):</div>
                    <div className="font-mono font-bold text-rose-600">
                      {formatVND(amount - Math.round(amount / (1 + vatRate / 100)))}
                    </div>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <div className="text-rose-800 text-[10px] font-bold">Tổng thanh toán:</div>
                    <div className="font-mono font-black text-rose-900">
                      {formatVND(amount)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10.5px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                  Khoản thanh toán không chịu thuế VAT (hoặc chi phí đã bao gồm thuế VAT).
                </div>
              )}
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
