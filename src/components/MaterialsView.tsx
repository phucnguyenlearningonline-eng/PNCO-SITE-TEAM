import React, { useState, useMemo } from 'react';
import {
  Package,
  PlusCircle,
  Search,
  Scissors,
  Edit3,
  Trash2,
  ExternalLink,
  ZoomIn,
  CheckCircle2,
  X,
  Building2,
  Warehouse,
  MapPin,
  AlertTriangle,
  List,
  LayoutGrid,
  Filter,
  DollarSign,
  TrendingDown,
  Boxes,
  Sparkles,
} from 'lucide-react';
import { MaterialItem, ExpenseItem } from '../types';
import { formatVND } from '../utils/formatters';
import { SnapToolModal } from './SnapToolModal';
import { STANDARD_WAREHOUSES } from '../data/materialsData';

interface MaterialsViewProps {
  materials: MaterialItem[];
  expenses: ExpenseItem[];
  onAddMaterial: (material: MaterialItem) => void;
  onEditMaterial: (material: MaterialItem) => void;
  onDeleteMaterial: (materialId: string) => void;
  onSelectMaterialForPO?: (material: MaterialItem) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  expenses,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onSelectMaterialForPO,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'in_stock'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // State cho Snap Tool Modal
  const [snapTargetMaterial, setSnapTargetMaterial] = useState<MaterialItem | null>(null);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);

  // State cho Add / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MaterialItem['category']>('electrical');
  const [formUnit, setFormUnit] = useState('Mét');
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formBrand, setFormBrand] = useState('');
  const [formSpecifications, setFormSpecifications] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formWarehouse, setFormWarehouse] = useState(STANDARD_WAREHOUSES[0]);
  const [formCustomWarehouse, setFormCustomWarehouse] = useState('');
  const [formStockQuantity, setFormStockQuantity] = useState<number>(100);
  const [formMinStock, setFormMinStock] = useState<number>(20);
  const [formShelfLocation, setFormShelfLocation] = useState('');

  // Zoom image state
  const [zoomImage, setZoomImage] = useState<{ url: string; code: string; name: string } | null>(null);

  // Danh sách các kho thực tế đang có trong dữ liệu
  const existingWarehouses = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.warehouseLocation) set.add(m.warehouseLocation);
    });
    STANDARD_WAREHOUSES.forEach((w) => set.add(w));
    return Array.from(set);
  }, [materials]);

  // Thống kê tổng quan kho
  const stats = useMemo(() => {
    let totalStockValue = 0;
    let totalLowStockCount = 0;
    let totalUnits = 0;

    materials.forEach((m) => {
      const qty = m.stockQuantity || 0;
      const price = m.unitPrice || 0;
      const min = m.minStock ?? 10;
      totalStockValue += qty * price;
      totalUnits += qty;
      if (qty <= min) {
        totalLowStockCount += 1;
      }
    });

    return {
      totalItems: materials.length,
      totalStockValue,
      totalLowStockCount,
      totalUnits,
    };
  }, [materials]);

  // Tự động tính toán mã tiếp theo theo định dạng "VT 0001" trở lên
  const getNextMaterialCode = (): string => {
    let maxNumber = 0;
    materials.forEach((m) => {
      const match = m.code.match(/VT\s*(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextNum = maxNumber + 1;
    return `VT ${String(nextNum).padStart(4, '0')}`;
  };

  const openAddModal = () => {
    const nextCode = getNextMaterialCode();
    setEditingMaterial(null);
    setFormCode(nextCode);
    setFormName('');
    setFormCategory('electrical');
    setFormUnit('Mét');
    setFormUnitPrice(0);
    setFormBrand('');
    setFormSpecifications('');
    setFormImageUrl('');
    setFormWarehouse(STANDARD_WAREHOUSES[0]);
    setFormCustomWarehouse('');
    setFormStockQuantity(100);
    setFormMinStock(20);
    setFormShelfLocation('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (m: MaterialItem) => {
    setEditingMaterial(m);
    setFormCode(m.code);
    setFormName(m.name);
    setFormCategory(m.category);
    setFormUnit(m.unit);
    setFormUnitPrice(m.unitPrice);
    setFormBrand(m.brand || '');
    setFormSpecifications(m.specifications || '');
    setFormImageUrl(m.imageUrl || '');
    setFormWarehouse(m.warehouseLocation || STANDARD_WAREHOUSES[0]);
    setFormCustomWarehouse('');
    setFormStockQuantity(m.stockQuantity ?? 0);
    setFormMinStock(m.minStock ?? 10);
    setFormShelfLocation(m.shelfLocation || '');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    // Chuẩn hóa định dạng mã: nếu người dùng nhập VT0001 -> VT 0001
    let normalizedCode = formCode.trim().toUpperCase();
    if (/^VT\d+$/.test(normalizedCode)) {
      const numPart = normalizedCode.replace('VT', '');
      normalizedCode = `VT ${numPart.padStart(4, '0')}`;
    }

    const finalWarehouse =
      formWarehouse === '__custom__' && formCustomWarehouse.trim()
        ? formCustomWarehouse.trim()
        : formWarehouse;

    if (editingMaterial) {
      const updated: MaterialItem = {
        ...editingMaterial,
        code: normalizedCode,
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim() || 'Cái',
        unitPrice: Number(formUnitPrice) || 0,
        brand: formBrand.trim(),
        specifications: formSpecifications.trim(),
        imageUrl: formImageUrl,
        warehouseLocation: finalWarehouse || 'Kho Tổng Dĩ An (Bình Dương)',
        stockQuantity: Number(formStockQuantity) || 0,
        minStock: Number(formMinStock) || 0,
        shelfLocation: formShelfLocation.trim(),
      };
      onEditMaterial(updated);
    } else {
      const newMaterial: MaterialItem = {
        id: `mat-${Date.now()}`,
        code: normalizedCode,
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim() || 'Cái',
        unitPrice: Number(formUnitPrice) || 0,
        brand: formBrand.trim(),
        specifications: formSpecifications.trim(),
        imageUrl: formImageUrl,
        warehouseLocation: finalWarehouse || 'Kho Tổng Dĩ An (Bình Dương)',
        stockQuantity: Number(formStockQuantity) || 0,
        minStock: Number(formMinStock) || 0,
        shelfLocation: formShelfLocation.trim(),
      };
      onAddMaterial(newMaterial);
    }

    setIsFormModalOpen(false);
  };

  // Mở snap tool cho 1 vật tư cụ thể
  const handleOpenSnapTool = (m: MaterialItem) => {
    setSnapTargetMaterial(m);
    setIsSnapModalOpen(true);
  };

  // Áp dụng ảnh từ snap tool vào vật tư
  const handleApplySnapImage = (imageUrl: string) => {
    if (snapTargetMaterial) {
      const updated: MaterialItem = {
        ...snapTargetMaterial,
        imageUrl,
      };
      onEditMaterial(updated);
      setSnapTargetMaterial(null);
    }
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
      const matchWarehouse =
        selectedWarehouse === 'all' ||
        (m.warehouseLocation && m.warehouseLocation.toLowerCase() === selectedWarehouse.toLowerCase());

      const qty = m.stockQuantity ?? 0;
      const min = m.minStock ?? 10;
      let matchStock = true;
      if (stockFilter === 'low') {
        matchStock = qty <= min;
      } else if (stockFilter === 'in_stock') {
        matchStock = qty > min;
      }

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.brand && m.brand.toLowerCase().includes(q)) ||
        (m.warehouseLocation && m.warehouseLocation.toLowerCase().includes(q)) ||
        (m.shelfLocation && m.shelfLocation.toLowerCase().includes(q)) ||
        (m.specifications && m.specifications.toLowerCase().includes(q));

      return matchCategory && matchWarehouse && matchStock && matchSearch;
    });
  }, [materials, selectedCategory, selectedWarehouse, stockFilter, search]);

  const getCategoryBadge = (category: MaterialItem['category']) => {
    switch (category) {
      case 'electrical':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">⚡ Điện & MSB</span>;
      case 'fire_protection':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">🔥 PCCC Cứu Hỏa</span>;
      case 'cable_tray':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">📦 Máng & Thang</span>;
      case 'water':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">💧 Cấp Thoát Nước</span>;
      case 'hvac':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">❄️ HVAC Thông Gió</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">Vật tư khác</span>;
    }
  };

  const getWarehouseBadgeClass = (warehouse: string) => {
    if (warehouse.includes('Kho Tổng') || warehouse.includes('Dĩ An')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (warehouse.includes('VSIP')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (warehouse.includes('AkzoNobel')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (warehouse.includes('Landmark')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-700">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>QUẢN LÝ SẢN PHẨM & TỒN KHO VẬT TƯ M&E</span>
                <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-sky-300">
                  MÃ VT 0001+ ({materials.length})
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh mục vật tư chuẩn hóa từ <strong className="text-sky-700 font-mono">VT 0001</strong>. Theo dõi <strong>đang tồn ở kho nào</strong>, số lượng tồn kho, vị trí kệ và nhận dạng qua <strong>Snap Tool</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng Bảng Danh Sách chi tiết"
            >
              <List className="w-4 h-4" />
              <span>Dạng Danh Sách</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng Lưới Thẻ trực quan"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Dạng Thẻ</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Thêm Vật Tư Mới ({getNextMaterialCode()})</span>
          </button>
        </div>
      </div>

      {/* Top Warehouse & Inventory KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase flex items-center justify-between">
            <span>Tổng Mặt Hàng VT</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {stats.totalItems} <span className="text-xs font-normal text-slate-500">Mã VT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Từ <span className="font-mono font-bold text-sky-600">VT 0001</span> đến <span className="font-mono font-bold text-sky-600">{materials[materials.length - 1]?.code || 'VT 0014'}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase flex items-center justify-between">
            <span>Tổng Giá Trị Tồn Kho</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1 font-mono">
            {formatVND(stats.totalStockValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Ước tính theo đơn giá tham khảo
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase flex items-center justify-between">
            <span>Số Kho Đang Lưu Trữ</span>
            <Warehouse className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {existingWarehouses.length} <span className="text-xs font-normal text-slate-500">Điểm Kho</span>
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold truncate mt-0.5" title="Kho Tổng Dĩ An & các Site công trường">
            Kho Tổng Dĩ An & Kho Site
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase flex items-center justify-between">
            <span>Cảnh Báo Tồn Thấp</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 mt-1 font-mono">
            {stats.totalLowStockCount} <span className="text-xs font-normal text-slate-500">Mặt hàng</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Cần lên đơn PO bổ sung kho
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã (VT 0001), tên vật tư, kho, kệ..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc theo Kho Đang Lưu Trữ */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
              <Warehouse className="w-3.5 h-3.5 text-sky-600" />
              <span>Kho Lưu Trữ:</span>
            </span>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none max-w-xs"
            >
              <option value="all">Tất cả các kho ({materials.length})</option>
              {existingWarehouses.map((wh) => {
                const count = materials.filter((m) => m.warehouseLocation === wh).length;
                return (
                  <option key={wh} value={wh}>
                    {wh} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Lọc theo Tình trạng tồn kho */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả tồn
            </button>
            <button
              onClick={() => setStockFilter('in_stock')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockFilter === 'in_stock'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Còn hàng ({materials.length - stats.totalLowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockFilter === 'low'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sắp hết / Cần nhập ({stats.totalLowStockCount})
            </button>
          </div>
        </div>

        {/* Lọc theo Hệ M&E */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">Hệ M&E:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-sky-700 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả hệ
          </button>
          <button
            onClick={() => setSelectedCategory('electrical')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'electrical'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⚡ Điện & MSB
          </button>
          <button
            onClick={() => setSelectedCategory('fire_protection')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'fire_protection'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔥 PCCC Cứu Hỏa
          </button>
          <button
            onClick={() => setSelectedCategory('cable_tray')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'cable_tray'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📦 Máng & Thang cáp
          </button>
          <button
            onClick={() => setSelectedCategory('water')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'water'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💧 Cấp Thoát Nước
          </button>
          <button
            onClick={() => setSelectedCategory('hvac')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'hvac'
                ? 'bg-teal-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ❄️ HVAC
          </button>
        </div>
      </div>

      {/* VIEW CHÍNH: DẠNG DANH SÁCH (LIST VIEW) - BẢNG QUẢN LÝ KHO */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-14 text-center">STT</th>
                  <th className="py-3 px-3 w-28">Mã VT</th>
                  <th className="py-3 px-3 w-20 text-center">Ảnh Nhận Dạng</th>
                  <th className="py-3 px-4 min-w-[240px]">Tên Sản Phẩm & Quy Cách Kỹ Thuật</th>
                  <th className="py-3 px-3 w-32">Phân Loại Hệ</th>
                  <th className="py-3 px-3 w-20 text-center">ĐVT</th>
                  <th className="py-3 px-3 w-28 text-right">Đơn Giá (VNĐ)</th>
                  {/* CỘT NỔI BẬT: ĐANG TỒN Ở KHO NÀO & VỊ TRÍ */}
                  <th className="py-3 px-4 min-w-[220px] bg-sky-50/60 text-sky-950 border-x border-sky-100">
                    <div className="flex items-center gap-1.5">
                      <Warehouse className="w-4 h-4 text-sky-600" />
                      <span>Đang Tồn Ở Kho Nào & Kệ</span>
                    </div>
                  </th>
                  {/* CỘT SỐ LƯỢNG TỒN */}
                  <th className="py-3 px-3 w-32 text-right bg-sky-50/60 text-sky-950 border-r border-sky-100">
                    Số Lượng Tồn
                  </th>
                  <th className="py-3 px-3 w-28 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Không tìm thấy vật tư nào phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Hãy thử xóa bộ lọc tìm kiếm hoặc thêm mới vật tư.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((m, index) => {
                    const qty = m.stockQuantity ?? 0;
                    const min = m.minStock ?? 10;
                    const isLowStock = qty <= min;
                    const isOutOfStock = qty === 0;

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-sky-50/30 transition-colors group"
                      >
                        {/* STT */}
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {index + 1}
                        </td>

                        {/* Mã Vật Tư VT 0001+ */}
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#102742] text-sky-300 border border-sky-400 font-mono font-extrabold text-xs shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span>{m.code}</span>
                          </div>
                        </td>

                        {/* Thumbnail ảnh & Snap tool trigger */}
                        <td className="py-2 px-3 text-center">
                          <div className="relative inline-block group/img">
                            {m.imageUrl ? (
                              <div
                                onClick={() => setZoomImage({ url: m.imageUrl!, code: m.code, name: m.name })}
                                className="w-12 h-10 rounded border border-slate-300 bg-slate-900 overflow-hidden cursor-pointer hover:border-sky-500 transition-all flex items-center justify-center p-0.5 shadow-2xs"
                              >
                                <img
                                  src={m.imageUrl}
                                  alt={m.code}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenSnapTool(m)}
                                className="w-12 h-10 rounded border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-600 transition-all"
                                title="Bấm để chụp / dán ảnh nhận dạng (Snap Tool)"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-bold mt-0.5">Snap</span>
                              </button>
                            )}
                            {/* Hover quick snap button */}
                            {m.imageUrl && (
                              <button
                                onClick={() => handleOpenSnapTool(m)}
                                className="absolute -bottom-1 -right-1 p-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white shadow opacity-0 group-hover/img:opacity-100 transition-opacity"
                                title="Chụp lại / dán ảnh khác"
                              >
                                <Scissors className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Tên & Quy cách */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs hover:text-sky-700 transition-colors">
                            {m.name}
                          </div>
                          {m.brand && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 py-0.2 rounded mr-2">
                              Hãng: {m.brand}
                            </span>
                          )}
                          {m.specifications && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={m.specifications}>
                              {m.specifications}
                            </div>
                          )}
                        </td>

                        {/* Phân loại */}
                        <td className="py-3 px-3">
                          {getCategoryBadge(m.category)}
                        </td>

                        {/* ĐVT */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {m.unit}
                          </span>
                        </td>

                        {/* Đơn giá */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono font-bold text-slate-800">
                            {formatVND(m.unitPrice)}
                          </span>
                        </td>

                        {/* ĐANG TỒN Ở KHO NÀO & VỊ TRÍ KỆ (ĐIỂM NHẤN CHÍNH) */}
                        <td className="py-3 px-4 bg-sky-50/30 border-x border-sky-100">
                          <div className="space-y-1">
                            {/* Tên Kho */}
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getWarehouseBadgeClass(m.warehouseLocation || '')}`}>
                                {m.warehouseLocation || 'Kho Tổng Dĩ An (Bình Dương)'}
                              </span>
                            </div>

                            {/* Vị trí kệ / ô bãi */}
                            {m.shelfLocation && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 pl-5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{m.shelfLocation}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* SỐ LƯỢNG TỒN & TRẠNG THÁI */}
                        <td className="py-3 px-3 text-right bg-sky-50/30 border-r border-sky-100">
                          <div className="font-mono font-extrabold text-sm text-slate-900">
                            {qty.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-500">{m.unit}</span>
                          </div>

                          <div className="mt-1">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Hết hàng
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200" title={`Mức an toàn: ${min} ${m.unit}`}>
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                Sắp hết
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Đủ tồn kho
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Thao tác Thêm / Sửa / Xóa / Snap / Lên PO */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenSnapTool(m)}
                              className="p-1.5 rounded-md text-sky-600 hover:bg-sky-100 transition-colors"
                              title="Chụp ảnh / Dán ảnh màn hình Snap Tool"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(m)}
                              className="p-1.5 rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
                              title="Sửa thông tin & kho tồn"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Bạn có chắc chắn muốn xóa vật tư "${m.code} - ${m.name}"? Hiện đang tồn ${m.stockQuantity || 0} ${m.unit} tại ${m.warehouseLocation}.`
                                  )
                                ) {
                                  onDeleteMaterial(m.id);
                                }
                              }}
                              className="p-1.5 rounded-md text-rose-500 hover:bg-rose-100 transition-colors"
                              title="Xóa vật tư"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {onSelectMaterialForPO && (
                              <button
                                onClick={() => onSelectMaterialForPO(m)}
                                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Tạo đơn PO mua hàng cho vật tư này"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium">
            <div>
              Đang hiển thị <strong>{filteredMaterials.length}</strong> / <strong>{materials.length}</strong> sản phẩm vật tư
              {selectedWarehouse !== 'all' && (
                <span className="ml-1 text-sky-700">tại <strong>{selectedWarehouse}</strong></span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>
                Tổng SL tồn lọc được: <strong>{filteredMaterials.reduce((acc, m) => acc + (m.stockQuantity || 0), 0).toLocaleString('vi-VN')}</strong>
              </span>
              <span>
                Tổng giá trị: <strong className="text-emerald-700 font-mono">{formatVND(filteredMaterials.reduce((acc, m) => acc + (m.stockQuantity || 0) * (m.unitPrice || 0), 0))}</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW PHỤ: DẠNG LƯỚI THẺ (GRID CARDS) NẾU USER CẦN XEM HÌNH ẢNH TO */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map((m) => {
            const qty = m.stockQuantity ?? 0;
            const min = m.minStock ?? 10;
            const isLowStock = qty <= min;

            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image Snapshot Area */}
                  <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-200">
                    {m.imageUrl ? (
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <Package className="w-10 h-10 mx-auto mb-1 text-slate-600" />
                        <span className="text-[11px]">Chưa có hình ảnh nhận dạng</span>
                      </div>
                    )}

                    {/* Mã vật tư Badge nổi bật */}
                    <div className="absolute top-2.5 left-2.5 bg-[#102742]/95 border border-sky-400 text-sky-300 font-mono font-extrabold text-xs px-2.5 py-1 rounded-md shadow-md backdrop-blur-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      <span>{m.code}</span>
                    </div>

                    {/* Nút Phóng to & Snap Tool overlay */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {m.imageUrl && (
                        <button
                          onClick={() => setZoomImage({ url: m.imageUrl!, code: m.code, name: m.name })}
                          className="p-1.5 rounded-md bg-black/60 hover:bg-black text-white backdrop-blur-xs transition-colors"
                          title="Xem ảnh phóng to"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenSnapTool(m)}
                        className="p-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white shadow transition-colors flex items-center gap-1 text-[10px] font-bold"
                        title="Chụp ảnh / Dán ảnh màn hình từ Snap Tool"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Snap</span>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider">{m.brand || 'M&E'}</span>
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        ĐVT: {m.unit}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug" title={m.name}>
                      {m.name}
                    </h3>

                    {/* Badge Kho Lưu Trữ */}
                    <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100 text-xs">
                      <div className="flex items-center gap-1 text-sky-800 font-bold truncate">
                        <Warehouse className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{m.warehouseLocation || 'Kho Tổng Dĩ An'}</span>
                      </div>
                      {m.shelfLocation && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 pl-4.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{m.shelfLocation}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Tồn kho:</div>
                        <div className="font-mono font-extrabold text-sm text-slate-900">
                          {qty.toLocaleString('vi-VN')} {m.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-medium">Đơn giá tham khảo:</div>
                        <div className="font-mono font-bold text-sky-700 text-xs">
                          {formatVND(m.unitPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1.5 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Chỉnh sửa thông tin vật tư & kho"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa vật tư "${m.code} - ${m.name}"?`)) {
                          onDeleteMaterial(m.id);
                        }
                      }}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa vật tư"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {onSelectMaterialForPO && (
                    <button
                      onClick={() => onSelectMaterialForPO(m)}
                      className="px-2.5 py-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <span>Lên Đơn PO</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-400" />
                <span>{editingMaterial ? 'Chỉnh Sửa Vật Tư & Kho Tồn' : 'Thêm Mới Vật Tư Thi Công & Phân Kho'}</span>
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Mã Vật Tư (Từ VT 0001+) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: VT 0001, VT 0015..."
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold text-sky-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Phân Loại Hệ M&E
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  >
                    <option value="electrical">⚡ Hệ Điện & Tủ cáp</option>
                    <option value="fire_protection">🔥 Hệ PCCC Cứu hỏa</option>
                    <option value="cable_tray">📦 Thang Máng Cáp</option>
                    <option value="water">💧 Cấp Thoát Nước</option>
                    <option value="hvac">❄️ Hệ Thống HVAC / Thông Gió</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên Sản Phẩm / Vật Tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Cáp CADIVI CXV 3x120+1x70 mm2..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                />
              </div>

              {/* KHU VỰC QUẢN LÝ KHO & TỒN KHO */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs">
                  <Warehouse className="w-4 h-4 text-sky-600" />
                  <span>THÔNG TIN KHO LƯU TRỮ & VỊ TRÍ TỒN KHO</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Kho Đang Lưu Trữ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formWarehouse}
                      onChange={(e) => setFormWarehouse(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 font-medium"
                    >
                      {existingWarehouses.map((wh) => (
                        <option key={wh} value={wh}>
                          {wh}
                        </option>
                      ))}
                      <option value="__custom__">+ Nhập kho công trường mới...</option>
                    </select>

                    {formWarehouse === '__custom__' && (
                      <input
                        type="text"
                        required
                        value={formCustomWarehouse}
                        onChange={(e) => setFormCustomWarehouse(e.target.value)}
                        placeholder="Nhập tên kho mới (VD: Kho Site Nhà Bè)..."
                        className="w-full mt-2 py-1.5 px-3 border border-sky-400 bg-white rounded-lg focus:ring-2 focus:ring-sky-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Vị Trí Kệ / Ô Bãi Trong Kho
                    </label>
                    <input
                      type="text"
                      value={formShelfLocation}
                      onChange={(e) => setFormShelfLocation(e.target.value)}
                      placeholder="VD: Kệ A1-04, Bãi Cáp Lô C1..."
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Số Lượng Tồn Kho Hiện Tại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formStockQuantity}
                      onChange={(e) => setFormStockQuantity(Number(e.target.value))}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Mức Tồn Cảnh Báo Tối Thiểu
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(Number(e.target.value))}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Đơn Vị Tính (ĐVT)
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Mét, Cái, Cuộn..."
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Đơn Giá Tham Khảo (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Thương Hiệu / Nhà Sản Xuất
                </label>
                <input
                  type="text"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  placeholder="VD: CADIVI, Schneider, Hòa Phát, Viking..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Quy Cách & Tiêu Chuẩn Kỹ Thuật
                </label>
                <textarea
                  rows={2}
                  value={formSpecifications}
                  onChange={(e) => setFormSpecifications(e.target.value)}
                  placeholder="Quy cách, thông số, cấp điện áp, tiêu chuẩn kiểm định..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg resize-none"
                />
              </div>

              {/* Hình ảnh nhận dạng & Snap Tool Trigger */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase">
                    Hình Ảnh Nhận Dạng (Snap Tool)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSnapTargetMaterial({
                        id: editingMaterial?.id || 'temp',
                        code: formCode || 'VT 0001',
                        name: formName || 'Vật tư mới',
                        category: formCategory,
                        unit: formUnit,
                        unitPrice: formUnitPrice,
                        imageUrl: formImageUrl,
                        warehouseLocation: formWarehouse,
                        stockQuantity: formStockQuantity,
                        shelfLocation: formShelfLocation,
                      });
                      setIsSnapModalOpen(true);
                    }}
                    className="text-xs text-sky-700 font-bold hover:text-sky-800 flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 transition-colors"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Mở Snap Tool (Chụp / Dán Ctrl+V)</span>
                  </button>
                </div>

                {formImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-900 max-h-36 flex items-center justify-center">
                    <img src={formImageUrl} alt="Nhận dạng" className="max-h-36 object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="absolute top-2 right-2 bg-rose-600 text-white rounded p-1 text-xs hover:bg-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50 text-slate-500 text-xs">
                    Chưa có hình ảnh. Bấm nút <strong>"Mở Snap Tool"</strong> ở trên để chụp màn hình hoặc tải ảnh nhận dạng.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm"
                >
                  {editingMaterial ? 'Cập Nhật Vật Tư' : 'Lưu Vật Tư Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snap Tool Modal */}
      {isSnapModalOpen && snapTargetMaterial && (
        <SnapToolModal
          materialCode={snapTargetMaterial.code}
          materialName={snapTargetMaterial.name}
          currentImage={snapTargetMaterial.imageUrl}
          isOpen={isSnapModalOpen}
          onClose={() => {
            setIsSnapModalOpen(false);
            setSnapTargetMaterial(null);
          }}
          onApplyImage={(imageDataUrl) => {
            if (isFormModalOpen) {
              setFormImageUrl(imageDataUrl);
            }
            handleApplySnapImage(imageDataUrl);
          }}
        />
      )}

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold bg-sky-500 text-white px-2.5 py-0.5 rounded text-xs">
                  {zoomImage.code}
                </span>
                <span className="font-bold text-sm truncate">{zoomImage.name}</span>
              </div>
              <button onClick={() => setZoomImage(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[70vh] bg-black/60 rounded-xl overflow-hidden">
              <img src={zoomImage.url} alt={zoomImage.name} className="max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
