import React, { useState, useEffect, useMemo } from 'react';
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
  Scissors,
  Search,
  Check,
  CheckSquare,
  Square,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  ExpenseCategory, 
  ExpenseItem, 
  ExpenseType, 
  PriorityLevel, 
  Project, 
  Supplier, 
  User, 
  MaterialItem,
  OrderItemLine 
} from '../types';
import { formatVND } from '../utils/formatters';
import { SnapToolModal } from './SnapToolModal';

export const getNextOrderCode = (allExpenses: ExpenseItem[] = []): string => {
  let maxNum = 0;
  allExpenses.forEach((exp) => {
    const code = exp.code || '';
    const match = code.match(/DH\s*-?\s*(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `DH ${String(nextNum).padStart(4, '0')}`;
};

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseItem) => void;
  initialData?: ExpenseItem | null;
  projects: Project[];
  suppliers: Supplier[];
  currentUser: User;
  materials?: MaterialItem[];
  expenses?: ExpenseItem[];
  onUpdateMaterialImage?: (materialCode: string, imageUrl: string) => void;
  defaultType?: 'expense' | 'po';
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
  expenses = [],
  onUpdateMaterialImage,
  defaultType = 'po',
}) => {
  const [code, setCode] = useState('');
  const [type, setType] = useState<ExpenseType>('po');
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'advance_fund'>('transfer');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);

  // Danh sách sản phẩm mua hàng (cho đơn hàng PO)
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItemLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

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

      // Load selected items if available
      if (initialData.items && initialData.items.length > 0) {
        setSelectedOrderItems(initialData.items);
      } else if (initialData.type === 'po' && initialData.subDescription && (initialData.subDescription.includes(';') || initialData.subDescription.includes('VT'))) {
        const parts = initialData.subDescription.split(';').map((p) => p.trim()).filter(Boolean);
        const parsedLines: OrderItemLine[] = [];
        parts.forEach((part) => {
          const codeMatch = part.match(/(VT\s*\d+)/i);
          const code = codeMatch ? codeMatch[1].replace(/\s+/g, '').toUpperCase() : '';
          const qtyMatch = part.match(/\(x\s*(\d+(?:\.\d+)?)\s*([^)]*)\)/i);
          const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
          const parsedUnit = qtyMatch && qtyMatch[2] ? qtyMatch[2].trim() : '';

          let name = part;
          if (codeMatch) {
            name = part.substring(part.indexOf(codeMatch[0]) + codeMatch[0].length).replace(/^[:\s-]+/, '');
          }
          if (qtyMatch) {
            name = name.substring(0, name.indexOf(qtyMatch[0])).trim();
          }
          name = name.replace(/[,;]+$/, '').trim();

          const matched = materials.find((m) => m.code.replace(/\s+/g, '').toUpperCase() === code);
          const finalName = name || matched?.name || (code ? `Vật tư ${code}` : 'Sản phẩm M&E');
          const finalUnit = parsedUnit || matched?.unit || 'Cái';
          const unitPrice = typeof matched?.unitPrice === 'number' ? matched.unitPrice : 0;
          parsedLines.push({
            materialId: matched?.id,
            code: code || matched?.code || 'VT',
            name: finalName,
            unit: finalUnit,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
          });
        });
        if (parsedLines.length > 0) {
          setSelectedOrderItems(parsedLines);
        } else {
          setSelectedOrderItems([]);
        }
      } else if (initialData.type === 'po' && initialData.materialCode) {
        const found = materials.find(
          (m) => m.code.replace(/\s+/g, '').toLowerCase() === initialData.materialCode?.replace(/\s+/g, '').toLowerCase()
        );
        if (found) {
          const price = typeof found.unitPrice === 'number' ? found.unitPrice : initialData.amount;
          setSelectedOrderItems([{
            materialId: found.id,
            code: found.code,
            name: found.name,
            unit: found.unit,
            quantity: 1,
            unitPrice: price,
            total: price,
          }]);
        }
      } else {
        setSelectedOrderItems([]);
      }
    } else {
      // Default: tạo mới đơn hàng PO
      const targetType = defaultType || 'po';
      setType(targetType);
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
      setPaymentMethod('transfer');
      setNotes('');
      setReceiptImage('');
      setSelectedOrderItems([]);

      if (targetType === 'po') {
        setCode(getNextOrderCode(expenses));
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setCode(`EXP-2026-${randomNum}`);
      }
    }
  }, [initialData, isOpen, projects, expenses, defaultType]);

  // Danh sách sản phẩm hiển thị khi lọc
  const filteredMaterialsForOrder = useMemo(() => {
    return materials.filter((m) => {
      const matchCat = productCategoryFilter === 'all' || m.category === productCategoryFilter;
      const q = productSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.subCategory && m.subCategory.toLowerCase().includes(q)) ||
        (m.brand && m.brand.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [materials, productCategoryFilter, productSearch]);

  // Toggle tick chọn / bỏ chọn sản phẩm vào đơn hàng
  const handleToggleProduct = (material: MaterialItem) => {
    const isSelected = selectedOrderItems.some(
      (item) => item.code.replace(/\s+/g, '').toLowerCase() === material.code.replace(/\s+/g, '').toLowerCase()
    );

    if (isSelected) {
      setSelectedOrderItems((prev) =>
        prev.filter(
          (item) => item.code.replace(/\s+/g, '').toLowerCase() !== material.code.replace(/\s+/g, '').toLowerCase()
        )
      );
    } else {
      const price = typeof material.unitPrice === 'number' ? material.unitPrice : 0;
      const newLine: OrderItemLine = {
        materialId: material.id,
        code: material.code,
        name: material.name,
        unit: material.unit || 'Cái',
        quantity: 1,
        unitPrice: price,
        total: price * 1,
      };
      setSelectedOrderItems((prev) => [...prev, newLine]);
    }
  };

  // Cập nhật số lượng của sản phẩm đã chọn
  const handleUpdateQuantity = (code: string, newQty: number) => {
    const safeQty = Math.max(1, isNaN(newQty) ? 1 : newQty);
    setSelectedOrderItems((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          return {
            ...item,
            quantity: safeQty,
            total: safeQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  // Xóa sản phẩm khỏi đơn hàng
  const handleRemoveItem = (code: string) => {
    setSelectedOrderItems((prev) => prev.filter((item) => item.code !== code));
  };

  // Chọn tất cả sản phẩm đang lọc
  const handleSelectAllFiltered = () => {
    const allFilteredCodes = new Set(
      filteredMaterialsForOrder.map((m) => m.code.replace(/\s+/g, '').toLowerCase())
    );
    const isAllSelected =
      filteredMaterialsForOrder.length > 0 &&
      filteredMaterialsForOrder.every((m) =>
        selectedOrderItems.some(
          (item) => item.code.replace(/\s+/g, '').toLowerCase() === m.code.replace(/\s+/g, '').toLowerCase()
        )
      );

    if (isAllSelected) {
      setSelectedOrderItems((prev) =>
        prev.filter((item) => !allFilteredCodes.has(item.code.replace(/\s+/g, '').toLowerCase()))
      );
    } else {
      const newItems: OrderItemLine[] = [...selectedOrderItems];
      filteredMaterialsForOrder.forEach((m) => {
        const cleanCode = m.code.replace(/\s+/g, '').toLowerCase();
        if (!newItems.some((item) => item.code.replace(/\s+/g, '').toLowerCase() === cleanCode)) {
          const price = typeof m.unitPrice === 'number' ? m.unitPrice : 0;
          newItems.push({
            materialId: m.id,
            code: m.code,
            name: m.name,
            unit: m.unit || 'Cái',
            quantity: 1,
            unitPrice: price,
            total: price * 1,
          });
        }
      });
      setSelectedOrderItems(newItems);
    }
  };

  // Tính toán tiền hàng của Đơn hàng PO từ các sản phẩm đã tick chọn
  const orderSubtotal = useMemo(() => {
    return selectedOrderItems.reduce((sum, item) => sum + item.total, 0);
  }, [selectedOrderItems]);

  const orderVatAmount = Math.round((orderSubtotal * vatRate) / 100);
  const orderTotalPayment = orderSubtotal + orderVatAmount;

  // Tính toán tiền của Phiếu chi site thông thường
  const expenseVatAmount = Math.round((amount * vatRate) / 100);
  const expenseTotalPayment = amount + expenseVatAmount;

  const selectedProject = projects.find((p) => p.id === projectId) || projects[0];

  // Tìm vật tư tương ứng khi dùng form Phiếu chi thường
  const matchedMaterial = materials.find(
    (m) => m.code.replace(/\s+/g, '').toLowerCase() === materialCode.replace(/\s+/g, '').toLowerCase()
  );

  const handleSelectMaterialCode = (inputCode: string) => {
    setMaterialCode(inputCode);
    const found = materials.find(
      (m) => m.code.replace(/\s+/g, '').toLowerCase() === inputCode.replace(/\s+/g, '').toLowerCase()
    );
    if (found) {
      setTitle(found.name);
      if (found.specifications) setSubDescription(found.specifications);
      if (found.unitPrice && amount === 0) setAmount(found.unitPrice);
      if (found.supplier) setSupplier(found.supplier);
      if (found.imageUrl && !receiptImage) setReceiptImage(found.imageUrl);
    }
  };

  // Quick preset cho phiếu chi site
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

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'po') {
      // Xử lý lưu Đơn Hàng Mua Vật Tư (PO)
      if (!projectId) {
        alert('Vui lòng chọn Dự Án Thi Công.');
        return;
      }
      if (!code.trim()) {
        alert('Vui lòng nhập Mã Đơn Hàng.');
        return;
      }
      if (selectedOrderItems.length === 0) {
        alert('Vui lòng tick chọn ít nhất một sản phẩm vào đơn hàng mua.');
        return;
      }

      // Tạo tiêu đề tự động tóm tắt các sản phẩm đã chọn
      const firstItemsNames = selectedOrderItems.slice(0, 2).map((i) => i.name).join(', ');
      const titleSummary =
        selectedOrderItems.length === 1
          ? `${selectedOrderItems[0].name} (x${selectedOrderItems[0].quantity} ${selectedOrderItems[0].unit})`
          : `Đơn hàng [${code.trim()}]: ${selectedOrderItems.length} mặt hàng (${firstItemsNames}${
              selectedOrderItems.length > 2 ? '...' : ''
            })`;

      const subDesc = selectedOrderItems
        .map((i) => `${i.code}: ${i.name} (x${i.quantity} ${i.unit})`)
        .join('; ');

      // Nhà cung cấp: lấy từ sản phẩm đầu tiên hoặc mặc định
      const firstMat = materials.find(
        (m) => m.code.replace(/\s+/g, '').toLowerCase() === selectedOrderItems[0].code.replace(/\s+/g, '').toLowerCase()
      );
      const supplierName = firstMat?.supplier || 'Nhà cung cấp vật tư Phúc Nguyên';

      const newOrder: ExpenseItem = {
        id: initialData?.id || `po-${Date.now()}`,
        code: code.trim(),
        type: 'po',
        category: 'material',
        materialCode: selectedOrderItems[0]?.code,
        title: titleSummary,
        subDescription: subDesc,
        items: selectedOrderItems,
        projectId: selectedProject?.id || '',
        projectName: selectedProject?.name || 'Công trình Phúc Nguyên',
        supplier: supplierName,
        createdById: initialData?.createdById || currentUser.id,
        createdByName: initialData?.createdByName || currentUser.name,
        createdByRole: initialData?.createdByRole || currentUser.roleTitle,
        date: date || new Date().toISOString().split('T')[0],
        amount: orderSubtotal,
        vatRate,
        vatAmount: orderVatAmount,
        totalAmount: orderTotalPayment,
        priority: 'normal',
        status: initialData?.status || 'pending',
        paymentMethod: 'transfer',
        notes: notes.trim(),
        receiptImage: firstMat?.imageUrl || undefined,
      };

      onSave(newOrder);
      onClose();
    } else {
      // Xử lý lưu Phiếu Chi Site thông thường
      if (!title.trim() || amount <= 0) {
        alert('Vui lòng nhập tên hạng mục/khoản chi và số tiền lớn hơn 0.');
        return;
      }

      const newExpense: ExpenseItem = {
        id: initialData?.id || `exp-${Date.now()}`,
        code: code || `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'expense',
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
        vatAmount: expenseVatAmount,
        totalAmount: expenseTotalPayment,
        priority,
        status: initialData?.status || 'pending',
        paymentMethod,
        notes: notes.trim(),
        receiptImage: receiptImage || matchedMaterial?.imageUrl || undefined,
      };

      onSave(newExpense);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {type === 'po' ? <ShoppingCart className="w-5 h-5 text-amber-400" /> : <FileText className="w-5 h-5 text-sky-400" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{initialData ? (type === 'po' ? 'Chỉnh Sửa Đơn Hàng' : 'Chỉnh Sửa Phiếu Chi') : (type === 'po' ? 'Lập Đơn Hàng Mua Vật Tư (PO)' : 'Tạo Khoản Chi Tiêu Mới Tại Site')}</span>
                {type === 'po' && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Mã Đơn: {code || 'DH 0001'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {type === 'po'
                  ? 'Chọn dự án, mã đơn hàng tự động tăng từ DH 0001, tick chọn sản phẩm từ bảng giá danh mục.'
                  : 'Nhập chi phí vật tư, chi phí xe vận chuyển/cẩu hoặc chi phí đồ ăn tăng ca của kỹ sư/thợ site.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chuyển đổi loại hồ sơ (Tabs) */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
            <span>Phân Loại Hồ Sơ:</span>
            <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setType('po');
                  if (!code.startsWith('DH ')) {
                    setCode(getNextOrderCode(expenses));
                  }
                }}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  type === 'po'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Đơn Hàng (PO)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (code.startsWith('DH ')) {
                    setCode(`EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                  }
                }}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Phiếu Chi Site</span>
              </button>
            </div>
          </div>

          {type === 'po' && (
            <div className="text-xs text-slate-600 font-medium hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đã chọn <strong className="text-amber-700 font-bold font-mono">{selectedOrderItems.length}</strong> sản phẩm</span>
            </div>
          )}
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[76vh] overflow-y-auto">
          {type === 'po' ? (
            /* ============================================================== */
            /* FORM ĐƠN HÀNG (PO) THEO YÊU CẦU ĐẶC BIỆT CỦA USER               */
            /* 1. Chọn Dự Án (Ref danh sách Dự Án)                            */
            /* 2. Mã Đơn Hàng (Code từ DH 0001 và tăng theo)                  */
            /* 3. Tick chọn nhiều sản phẩm trong bảng sản phẩm                */
            /*    Đơn giá theo bảng sản phẩm, còn lại không cần               */
            /* ============================================================== */
            <div className="space-y-4">
              {/* HÀNG 1 & HÀNG 2: DỰ ÁN THI CÔNG & MÃ ĐƠN HÀNG (DH 0001+) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* 1. TÊN DỰ ÁN THI CÔNG (REF DANH SÁCH DỰ ÁN) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-600" />
                    <span>1. Chọn Tên Dự Án Thi Công <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                    className="w-full py-2.5 px-3 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white shadow-2xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>Chủ đầu tư:</span>
                    <strong className="text-slate-700">{selectedProject?.client || 'Chủ đầu tư công trình'}</strong>
                  </div>
                </div>

                {/* 2. MÃ ĐƠN HÀNG (TĂNG TỰ ĐỘNG TỪ DH 0001) & NGÀY ĐẶT */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1 flex items-center justify-between">
                      <span>2. Mã Đơn Hàng <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="DH 0001"
                      required
                      className="w-full py-2.5 px-3 text-xs font-mono font-black text-amber-700 bg-amber-50/60 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 uppercase tracking-wider shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Tự tăng từ <strong>DH 0001+</strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Ngày Đặt Hàng <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full py-2.5 px-2.5 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. MỤC CHỌN DANH SÁCH MUA HÀNG: TICK CHỌN NHIỀU SẢN PHẨM TRONG BẢNG SẢN PHẨM */}
              <div className="border border-sky-300 rounded-xl bg-white shadow-xs overflow-hidden">
                <div className="bg-sky-50/90 border-b border-sky-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-sky-600 text-white">
                      <Package className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      Mục Chọn Danh Sách Mua Hàng (Tick Chọn Nhiều Sản Phẩm)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold border border-sky-300 flex items-center gap-1 transition-colors text-[11px]"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Chọn Tất Cả Đang Lọc ({filteredMaterialsForOrder.length})</span>
                    </button>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Đã tick: {selectedOrderItems.length} SP
                    </span>
                  </div>
                </div>

                {/* Thanh tìm kiếm & Lọc danh mục sản phẩm */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Tìm mã VT (VT0001...), tên sản phẩm, hãng..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Lọc hệ thống */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
                  >
                    <option value="all">Tất cả hệ thống</option>
                    <option value="electrical">⚡ Điện & MSB</option>
                    <option value="fire_protection">🔥 PCCC Cứu Hỏa</option>
                    <option value="water">💧 Cấp Thoát Nước</option>
                    <option value="hvac">❄️ HVAC Thông Gió</option>
                    <option value="cable_tray">📦 Máng & Thang</option>
                  </select>
                </div>

                {/* BẢNG DANH MỤC SẢN PHẨM ĐỂ TICK CHỌN */}
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 text-xs">
                  {filteredMaterialsForOrder.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Không tìm thấy sản phẩm nào khớp với từ khóa tìm kiếm.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100/90 text-slate-700 font-bold text-[11px] sticky top-0 z-10 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">Tick</th>
                          <th className="py-2 px-2.5 w-24">Mã VT</th>
                          <th className="py-2 px-3">Tên Sản Phẩm / Vật Tư M&E</th>
                          <th className="py-2 px-2 w-16 text-center">ĐVT</th>
                          <th className="py-2 px-3 text-right w-28">Đơn Giá (Theo Bảng)</th>
                          <th className="py-2 px-2.5 text-center w-20">Tồn Kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMaterialsForOrder.map((mat) => {
                          const isChecked = selectedOrderItems.some(
                            (item) => item.code.replace(/\s+/g, '').toLowerCase() === mat.code.replace(/\s+/g, '').toLowerCase()
                          );
                          const price = typeof mat.unitPrice === 'number' ? mat.unitPrice : 0;

                          return (
                            <tr
                              key={mat.id}
                              onClick={() => handleToggleProduct(mat)}
                              className={`cursor-pointer transition-colors ${
                                isChecked ? 'bg-amber-50/80 hover:bg-amber-100/80' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // Đã được xử lý bởi tr onClick
                                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-2.5 font-mono font-bold text-sky-800">
                                {mat.code}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-900">{mat.name}</div>
                                {mat.brand && (
                                  <div className="text-[10px] text-slate-400">Hãng: {mat.brand}</div>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-600 font-medium">
                                {mat.unit}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                {price > 0 ? formatVND(price) : <span className="text-slate-400 font-normal italic">Chưa có giá</span>}
                              </td>
                              <td className="py-2 px-2.5 text-center font-mono">
                                {mat.stockQuantity && mat.stockQuantity > 0 ? (
                                  <span className="font-bold text-slate-800">{mat.stockQuantity}</span>
                                ) : (
                                  <span className="text-slate-400 font-normal">0</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* BẢNG CÁC SẢN PHẨM ĐÃ CHỌN ĐẶT HÀNG & NHẬP SỐ LƯỢNG */}
              <div className="border border-amber-300 rounded-xl bg-amber-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Danh Sách Sản Phẩm Đã Tick Chọn ({selectedOrderItems.length} mặt hàng)
                    </span>
                  </div>
                  {selectedOrderItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedOrderItems([])}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                {selectedOrderItems.length === 0 ? (
                  <div className="p-4 bg-white rounded-lg border border-dashed border-amber-300 text-center text-slate-500 text-xs">
                    👉 Hãy <strong className="text-amber-700">tick chọn các sản phẩm</strong> ở bảng danh mục phía trên để lập đơn hàng mua.
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#102742] text-white font-bold text-[11px] uppercase">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-10">STT</th>
                          <th className="py-2 px-2.5 w-24">Mã VT</th>
                          <th className="py-2 px-3">Tên Sản Phẩm</th>
                          <th className="py-2 px-2 w-16 text-center">ĐVT</th>
                          <th className="py-2 px-3 text-right w-28">Đơn Giá</th>
                          <th className="py-2 px-2 text-center w-28">Số Lượng</th>
                          <th className="py-2 px-3 text-right w-32">Thành Tiền</th>
                          <th className="py-2 px-2 text-center w-10">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrderItems.map((item, idx) => (
                          <tr key={item.code} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 text-center font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-mono font-bold text-sky-800">
                              {item.code}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600 font-medium">
                              {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                              {formatVND(item.unitPrice)}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.code, item.quantity - 1)}
                                  className="p-1 hover:bg-slate-100 text-slate-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQuantity(item.code, parseInt(e.target.value, 10))}
                                  className="w-12 text-center font-mono font-bold text-xs py-1 border-x border-slate-300 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.code, item.quantity + 1)}
                                  className="p-1 hover:bg-slate-100 text-slate-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatVND(item.total)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.code)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Bỏ mặt hàng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* TÍNH TOÁN TIỀN HÀNG, VAT & TỔNG THANH TOÁN ĐƠN HÀNG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Thuế Suất VAT (%)
                  </label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full py-2.5 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                  >
                    <option value={10}>10% (Vật tư, thiết bị M&E tiêu chuẩn)</option>
                    <option value={8}>8% (Vận chuyển, dịch vụ ưu đãi)</option>
                    <option value={0}>0% (Không chịu thuế / Hóa đơn trực tiếp)</option>
                  </select>

                  <div className="mt-2.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Ghi Chú Đơn Hàng (Nếu có)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú giao hàng tới công trường, thời gian cấp hàng..."
                      className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-xl border border-amber-500/40 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2">
                    <span>Tổng tiền hàng ({selectedOrderItems.length} mặt hàng):</span>
                    <span className="font-mono font-bold text-slate-100">{formatVND(orderSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-rose-300 border-b border-slate-800 pb-2">
                    <span>Tiền thuế VAT ({vatRate}%):</span>
                    <span className="font-mono font-bold">{formatVND(orderVatAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-[11px] uppercase font-bold text-amber-400">TỔNG THANH TOÁN ĐƠN HÀNG</div>
                      <div className="text-[10px] text-slate-400">Mã đơn: {code || 'DH 0001'}</div>
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
                      {formatVND(orderTotalPayment)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin người lập */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>Người lập đơn hàng: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.roleTitle})</span>
                <span>Công trình: <strong className="text-sky-700">{selectedProject?.name}</strong></span>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* FORM PHIẾU CHI SITE THÔNG THƯỜNG (DÀNH CHO CHI TIÊU SITE)      */
            /* ============================================================== */
            <div className="space-y-4">
              {/* Quick Template Presets */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-slate-600 uppercase flex-shrink-0">Mẫu nhanh:</span>
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

              {/* Mã Phiếu Chi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mã Phiếu Chi Site
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full py-2 px-3 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 uppercase bg-slate-50"
                />
              </div>

              {/* Danh Mục Chi Tiêu Tại Site */}
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

              {/* Mã VT & Nhận dạng Snap Tool */}
              {category === 'material' && (
                <div className="p-3 bg-slate-900 text-white rounded-xl border border-sky-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 uppercase">
                      Chọn nhanh mã VT từ bảng danh mục
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSnapModalOpen(true)}
                      className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Snap Tool Cắt Ảnh</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      list="materials-datalist"
                      value={materialCode}
                      onChange={(e) => handleSelectMaterialCode(e.target.value)}
                      placeholder="Gõ mã VT (VD: VT0001) hoặc chọn..."
                      className="flex-1 py-1.5 px-3 text-xs font-mono font-bold text-sky-400 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 uppercase"
                    />
                    <datalist id="materials-datalist">
                      {materials.map((m) => (
                        <option key={m.id} value={m.code}>
                          {m.code} - {m.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              {/* Tên Khoản Chi & Quy Cách */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên Khoản Chi / Hạng Mục / Vật Tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Cáp đồng CADIVI CXV 3x120, Xe cẩu 15 tấn, Cơm hộp 35 suất..."
                  required
                  className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
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
                  placeholder="Quy cách theo bản vẽ, số giờ cẩu, số suất ăn..."
                  className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Dự án & Nhà cung cấp */}
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
                    Tiền Chi Phí Trước VAT (VNĐ) <span className="text-rose-500">*</span>
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

              {/* Khung tổng hợp tiền chi */}
              <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <div>Tiền trước thuế: <span className="font-mono font-semibold">{formatVND(amount)}</span></div>
                  <div className="text-rose-600">Thuế VAT ({vatRate}%): <span className="font-mono font-semibold">{formatVND(expenseVatAmount)}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 uppercase font-bold">Tổng thanh toán</div>
                  <div className="text-lg sm:text-xl font-mono font-black text-emerald-800">
                    {formatVND(expenseTotalPayment)}
                  </div>
                </div>
              </div>

              {/* Hình thức thanh toán & Mức độ ưu tiên */}
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

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi Chú Kế Toán / Diễn Giải
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về chứng từ, phiếu giao nhận..."
                  className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Người lập */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>Người lập phiếu: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.roleTitle})</span>
                <span>Site: <strong>{currentUser.siteName}</strong></span>
              </div>
            </div>
          )}

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
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 ${
                type === 'po'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {initialData
                  ? (type === 'po' ? 'Lưu Thay Đổi Đơn Hàng' : 'Lưu Thay Đổi Phiếu Chi')
                  : (type === 'po' ? `Tạo Đơn Hàng (${code || 'DH 0001'})` : 'Tạo Phiếu Chi Tiêu')}
              </span>
            </button>
          </div>
        </form>

        {/* Snap Tool Modal */}
        {isSnapModalOpen && (
          <SnapToolModal
            materialCode={materialCode || 'VT0001'}
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
