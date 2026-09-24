import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  DollarSign, 
  Calendar, 
  Building, 
  Package, 
  Truck, 
  Utensils, 
  FileText,
  AlertTriangle,
  Upload,
  Scissors,
  Sparkles,
  ZoomIn
} from 'lucide-react';
import { ExpenseCategory, ExpenseItem, ExpenseType, PriorityLevel, Project, Supplier, User, MaterialItem } from '../types';
import { formatVND } from '../utils/formatters';
import { SnapToolModal } from './SnapToolModal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseItem) => void;
  initialData?: ExpenseItem | null;
  projects: Project[];
  suppliers: Supplier[];
  currentUser: User;
  materials?: MaterialItem[];
  onUpdateMaterialImage?: (materialCode: string, imageUrl: string) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  projects,
  suppliers,
  currentUser,
  materials = [],
  onUpdateMaterialImage,
}) => {
  const [code, setCode] = useState('');
  const [type, setType] = useState<ExpenseType>('expense');
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [materialCode, setMaterialCode] = useState('');
  const [title, setTitle] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(10);
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'advance_fund'>('advance_fund');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setType(initialData.type);
      setCategory(initialData.category);
      setMaterialCode(initialData.materialCode || '');
      setTitle(initialData.title);
      setSubDescription(initialData.subDescription || '');
      setProjectId(initialData.projectId);
      setSupplier(initialData.supplier);
      setDate(initialData.date);
      setAmount(initialData.amount);
      setVatRate(initialData.vatRate);
      setPriority(initialData.priority);
      setPaymentMethod(initialData.paymentMethod);
      setNotes(initialData.notes || '');
      setReceiptImage(initialData.receiptImage || '');
    } else {
      // Default new expense
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setCode(type === 'po' ? `PO-2026-${randomNum}` : `EXP-2026-${randomNum}`);
      setType('expense');
      setCategory('material');
      setMaterialCode('');
      setTitle('');
      setSubDescription('');
      setProjectId(projects[0]?.id || '');
      setSupplier('');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount(0);
      setVatRate(10);
      setPriority('normal');
      setPaymentMethod('advance_fund');
      setNotes('');
      setReceiptImage('');
    }
  }, [initialData, isOpen, projects]);

  if (!isOpen) return null;

  const vatAmount = Math.round((amount * vatRate) / 100);
  const totalAmount = amount + vatAmount;

  const selectedProject = projects.find((p) => p.id === projectId) || projects[0];

  // Tìm vật tư tương ứng khi người dùng nhập hoặc chọn mã VT
  const matchedMaterial = materials.find(
    (m) => m.code.toLowerCase().trim() === materialCode.toLowerCase().trim()
  );

  // Khi người dùng chọn mã vật tư từ dropdown / datalist
  const handleSelectMaterialCode = (inputCode: string) => {
    setMaterialCode(inputCode);
    const found = materials.find(
      (m) => m.code.toLowerCase().trim() === inputCode.toLowerCase().trim()
    );
    if (found) {
      setTitle(found.name);
      if (found.specifications) setSubDescription(found.specifications);
      if (found.unitPrice && amount === 0) setAmount(found.unitPrice);
      if (found.supplier) setSupplier(found.supplier);
      if (found.imageUrl && !receiptImage) setReceiptImage(found.imageUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      alert('Vui lòng nhập tên hạng mục/khoản chi và số tiền lớn hơn 0.');
      return;
    }

    const newExpense: ExpenseItem = {
      id: initialData?.id || `exp-${Date.now()}`,
      code: code || `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      category,
      materialCode: materialCode.trim() || undefined,
      title: title.trim(),
      subDescription: subDescription.trim(),
      projectId: selectedProject?.id || '',
      projectName: selectedProject?.name || 'Công trình Phúc Nguyên',
      supplier: supplier.trim() || 'Nhà cung cấp tại site',
      createdById: initialData?.createdById || currentUser.id,
      createdByName: initialData?.createdByName || currentUser.name,
      createdByRole: initialData?.createdByRole || currentUser.roleTitle,
      date,
      amount,
      vatRate,
      vatAmount,
      totalAmount,
      priority,
      status: initialData?.status || 'pending',
      paymentMethod,
      notes: notes.trim(),
      receiptImage: receiptImage || matchedMaterial?.imageUrl || undefined,
    };

    onSave(newExpense);
    onClose();
  };

  // Quick fill preset templates for user convenience
  const handleApplyPreset = (presetType: 'material' | 'transport' | 'meal') => {
    if (presetType === 'transport') {
      setCategory('transport');
      setTitle('Xe cẩu 15 tấn bốc dỡ máy biến áp & cuộn cáp tại công trường');
      setSubDescription('Cẩu hạ hàng từ xe container xuống tầng hầm, nghiệm thu an toàn lao động');
      setSupplier('Đội Xe Cẩu Chuyên Dùng Miền Nam (Minh Phát)');
      setAmount(8500000);
      setVatRate(8);
      setPaymentMethod('advance_fund');
    } else if (presetType === 'meal') {
      setCategory('overtime_meal');
      setTitle('Tiền cơm hộp & nước sâm tăng ca đổ bê tông ca đêm');
      setSubDescription('30 suất cơm x 65.000 đ/suất + nước uống giải nhiệt cho anh em thợ');
      setSupplier('Quán Cơm Tấm & Suất Ăn Minh Ký');
      setAmount(1950000);
      setVatRate(0);
      setPaymentMethod('advance_fund');
    } else {
      setCategory('material');
      setTitle('Cáp đồng CADIVI CV 4x16 mm2 & ống luồn chống cháy');
      setSubDescription('Cung cấp bổ sung cho trục nhánh tầng 3 & 4 khối tháp B');
      setSupplier('Công Ty Cổ Phần Dây Cáp Điện CADIVI');
      setAmount(45000000);
      setVatRate(10);
      setPaymentMethod('transfer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              {initialData ? 'Chỉnh Sửa Khoản Chi Tiêu / PO' : 'Tạo Khoản Chi Tiêu Mới Tại Site'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Nhập chi phí vật tư, chi phí xe vận chuyển/cẩu hoặc chi phí đồ ăn tăng ca của kỹ sư/thợ site.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Presets */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-600 uppercase flex-shrink-0">Mẫu gợi ý nhanh:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('material')}
            className="text-xs px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Package className="w-3.5 h-3.5" />
            + Vật tư M&E
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('transport')}
            className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Truck className="w-3.5 h-3.5" />
            + Vận chuyển / Xe cẩu
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('meal')}
            className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Utensils className="w-3.5 h-3.5" />
            + Cơm ca đêm / Đồ ăn
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Loại giao dịch & Mã */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phân Loại Hồ Sơ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    if (code.startsWith('PO-')) setCode(code.replace('PO-', 'EXP-'));
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                    type === 'expense'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Phiếu Chi Site
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('po');
                    if (code.startsWith('EXP-')) setCode(code.replace('EXP-', 'PO-'));
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                    type === 'po'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Đơn Hàng (PO)
                </button>
              </div>
            </div>

            {/* Mã Phiếu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mã Phiếu / Mã PO
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full py-2 px-3 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 uppercase bg-slate-50"
              />
            </div>
          </div>

          {/* Phân loại danh mục chi tiêu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Danh Mục Chi Tiêu Tại Site <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                category === 'material' ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="category"
                  value="material"
                  checked={category === 'material'}
                  onChange={() => setCategory('material')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Vật tư thi công</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                category === 'transport' ? 'bg-amber-50 border-amber-400 font-bold text-amber-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="category"
                  value="transport"
                  checked={category === 'transport'}
                  onChange={() => setCategory('transport')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <Truck className="w-4 h-4 text-amber-600" />
                <span className="text-xs">Vận chuyển / Cẩu</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                category === 'overtime_meal' ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="category"
                  value="overtime_meal"
                  checked={category === 'overtime_meal'}
                  onChange={() => setCategory('overtime_meal')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Đồ ăn tăng ca</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                category === 'labor_sub' ? 'bg-purple-50 border-purple-400 font-bold text-purple-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="category"
                  value="labor_sub"
                  checked={category === 'labor_sub'}
                  onChange={() => setCategory('labor_sub')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs">Nhân công phụ</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                category === 'other' ? 'bg-slate-100 border-slate-400 font-bold text-slate-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="category"
                  value="other"
                  checked={category === 'other'}
                  onChange={() => setCategory('other')}
                  className="text-slate-600 focus:ring-slate-500"
                />
                <span className="text-xs">Chi phí khác</span>
              </label>
            </div>
          </div>

          {/* Nhập Mã Vật Tư & Hình Ảnh Nhận Dạng Snap Tool */}
          {category === 'material' && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-sky-500/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-xs font-bold text-sky-300 uppercase tracking-wide">
                    Nhập Mã Vật Tư M&E (Mã VT 0001+) & Nhận Dạng Snap Tool
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSnapModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Scissors className="w-3.5 h-3.5 text-white" />
                  <span>Mở Snap Tool (Dán Ctrl+V / Chụp)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Chọn nhanh từ danh mục hoặc nhập mã (VD: VT 0001, VT 0002...)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      list="materials-datalist"
                      value={materialCode}
                      onChange={(e) => handleSelectMaterialCode(e.target.value)}
                      placeholder="Gõ mã VT (VD: VT 0001) hoặc chọn..."
                      className="flex-1 py-1.5 px-3 text-xs font-mono font-bold text-sky-400 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
                    />
                    <datalist id="materials-datalist">
                      {materials.map((m) => (
                        <option key={m.id} value={m.code}>
                          {m.code} - {m.name} ({formatVND(m.unitPrice)}/{m.unit})
                        </option>
                      ))}
                    </datalist>

                    <select
                      value={materialCode}
                      onChange={(e) => handleSelectMaterialCode(e.target.value)}
                      className="py-1.5 px-2 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 max-w-[140px]"
                    >
                      <option value="">-- Danh mục VT --</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.code}>
                          {m.code} - {m.name.slice(0, 18)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Box Hình Ảnh Nhận Dạng Vật Tư */}
                <div className="flex items-center gap-2.5 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  {matchedMaterial?.imageUrl || receiptImage ? (
                    <div className="relative w-14 h-14 bg-slate-950 rounded border border-sky-400 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={receiptImage || matchedMaterial?.imageUrl}
                        alt="Ảnh nhận dạng"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/85 text-[8px] text-white font-mono text-center">
                        {materialCode || 'VT'}
                      </span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-slate-950 border border-dashed border-slate-600 rounded flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <Package className="w-5 h-5 text-slate-600" />
                      <span className="text-[8px] mt-0.5">Chưa ảnh</span>
                    </div>
                  )}

                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-sky-400">Hình ảnh nhận dạng</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      {matchedMaterial ? 'Đã nhận dạng mã VT' : 'Dùng Snap Tool dán ảnh'}
                    </div>
                    {matchedMaterial && matchedMaterial.warehouseLocation && (
                      <div className="text-emerald-400 text-[10px] font-medium mt-1">
                        Tồn: {matchedMaterial.stockQuantity ?? 0} {matchedMaterial.unit} tại {matchedMaterial.warehouseLocation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tên hạng mục & Mô tả */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tên Khoản Chi / Hạng Mục / Vật Tư <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cáp đồng CADIVI CXV 3x120, Xe cẩu 15 tấn nâng thiết bị, Cơm hộp 35 suất ca đêm..."
              required
              className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Quy Cách Kỹ Thuật / Diễn Giải Chi Tiết
            </label>
            <input
              type="text"
              value={subDescription}
              onChange={(e) => setSubDescription(e.target.value)}
              placeholder="Quy cách theo bản vẽ, số giờ cẩu kéo, số lượng thợ thi công ca..."
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Dự án thi công & Nhà cung cấp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Công Trình / Dự Án Thi Công <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nhà Cung Cấp / Nhà Xe / Quán Cơm
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                list="suppliers-list"
                placeholder="Chọn hoặc nhập tên đơn vị..."
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
              <datalist id="suppliers-list">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Ngày chi & Tiền hàng & VAT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ngày Thực Hiện <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tiền Hàng / Chi Phí Trước VAT (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                required
                className="w-full py-2 px-3 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Thuế Suất VAT (%)
              </label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value={0}>0% (Ăn uống, nhân công, hóa đơn trực tiếp)</option>
                <option value={8}>8% (Vận chuyển, dịch vụ giảm thuế)</option>
                <option value={10}>10% (Vật tư, thiết bị tiêu chuẩn)</option>
              </select>
            </div>
          </div>

          {/* Calculation Box */}
          <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <div>Tiền trước thuế: <span className="font-mono font-semibold">{formatVND(amount)}</span></div>
              <div className="text-rose-600">Thuế VAT ({vatRate}%): <span className="font-mono font-semibold">{formatVND(vatAmount)}</span></div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 uppercase font-bold">Tổng thanh toán</div>
              <div className="text-lg sm:text-xl font-mono font-black text-emerald-800">
                {formatVND(totalAmount)}
              </div>
            </div>
          </div>

          {/* Payment Method & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Hình Thức Thanh Toán
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="advance_fund">💰 Tạm ứng quỹ site (Kỹ sư chi trước)</option>
                <option value="transfer">🏦 Chuyển khoản công ty</option>
                <option value="cash">💵 Tiền mặt thanh toán ngay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mức Độ Ưu Tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-medium"
              >
                <option value="normal">Thường</option>
                <option value="high">Ưu tiên</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          {/* Ghi chú & Đính kèm chứng từ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ghi Chú Kế Toán / Diễn Giải
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã thanh toán tạm ứng cho bác xe cẩu, phiếu giao nhận đầy đủ chữ ký giám sát..."
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Người lập tự động ghi nhận */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <span>Người lập phiếu: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.roleTitle})</span>
            <span>Site: <strong>{currentUser.siteName}</strong></span>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Phiếu Chi Tiêu'}</span>
            </button>
          </div>
        </form>

        {/* Snap Tool Modal */}
        {isSnapModalOpen && (
          <SnapToolModal
            materialCode={materialCode || 'VT 0001'}
            materialName={title || matchedMaterial?.name || 'Vật tư thi công site'}
            currentImage={receiptImage || matchedMaterial?.imageUrl}
            isOpen={isSnapModalOpen}
            onClose={() => setIsSnapModalOpen(false)}
            onApplyImage={(imageDataUrl) => {
              setReceiptImage(imageDataUrl);
              if (materialCode && onUpdateMaterialImage) {
                onUpdateMaterialImage(materialCode, imageDataUrl);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
