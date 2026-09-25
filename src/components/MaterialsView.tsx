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
  X,
  Building2,
  Warehouse,
  MapPin,
  AlertTriangle,
  List,
  LayoutGrid,
  DollarSign,
  Boxes,
  FileText,
  Link as LinkIcon,
  Store,
  Layers,
  Percent,
  Flame,
  Tag,
  ChevronDown,
  Check,
} from 'lucide-react';
import { MaterialItem, ExpenseItem, Supplier } from '../types';
import { formatVND } from '../utils/formatters';
import { SnapToolModal } from './SnapToolModal';
import { InlineImageCropper } from './InlineImageCropper';
import { STANDARD_WAREHOUSES, PCCC_SUB_CATEGORIES, MNE_SUB_CATEGORIES } from '../data/materialsData';

interface MaterialsViewProps {
  materials: MaterialItem[];
  suppliers?: Supplier[];
  expenses: ExpenseItem[];
  onAddMaterial: (material: MaterialItem) => void;
  onEditMaterial: (material: MaterialItem) => void;
  onDeleteMaterial: (materialId: string) => void;
  onSelectMaterialForPO?: (material: MaterialItem) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  suppliers = [],
  expenses,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onSelectMaterialForPO,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'in_stock'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // State cho Snap Tool Modal
  const [snapTargetMaterial, setSnapTargetMaterial] = useState<MaterialItem | null>(null);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);

  // State cho Add / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  // Form states theo đúng yêu cầu:
  // - Mã: VT0001 đếm lên
  // - Tên (Bắt buộc)
  // - Setting là Số lượng (Bắt buộc)
  // - Đơn vị (Bắt buộc)
  // - Hạng mục (Sol Khí, Thoát Hiểm, Hút Khói, Sprinkler, Vách Tường...)
  // - Thuế VAT (0%, 8%, 10%)
  // - Hình ảnh (chụp từ Snap Tool)
  // - Link Catalogue
  // - Nhà Cung Cấp (rê từ bảng NCC)
  // - Giá Tiền (không bắt buộc)
  // - Kho lưu trữ & Vị trí kệ
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStockQuantity, setFormStockQuantity] = useState<number | string>(100);
  const [formUnit, setFormUnit] = useState('Mét');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCatalogueUrl, setFormCatalogueUrl] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState<number | string>('');
  const [formVatRate, setFormVatRate] = useState<number>(10);
  const [formCategory, setFormCategory] = useState<MaterialItem['category']>('fire_protection');
  const [formSubCategory, setFormSubCategory] = useState('Sol Khí (Aerosol / FM200 / Novec)');
  const [formBrand, setFormBrand] = useState('');
  const [formSpecifications, setFormSpecifications] = useState('');
  const [formWarehouse, setFormWarehouse] = useState(STANDARD_WAREHOUSES[0]);
  const [formCustomWarehouse, setFormCustomWarehouse] = useState('');
  const [formShelfLocation, setFormShelfLocation] = useState('');
  const [formMinStock, setFormMinStock] = useState<number | string>(15);
  const [isHangMucDropdownOpen, setIsHangMucDropdownOpen] = useState(false);
  const [isNccDropdownOpen, setIsNccDropdownOpen] = useState(false);

  // Zoom image state
  const [zoomImage, setZoomImage] = useState<{ url: string; code: string; name: string } | null>(null);

  // Danh sách các kho thực tế
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

  // Tự động tính toán mã tiếp theo theo định dạng "VT0001" trở lên
  const getNextMaterialCode = (): string => {
    let maxNumber = 0;
    materials.forEach((m) => {
      const match = m.code.replace(/\s+/g, '').match(/^VT(\d+)$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextNum = maxNumber > 0 ? maxNumber + 1 : 1;
    return `VT${String(nextNum).padStart(4, '0')}`;
  };

  const openAddModal = () => {
    const nextCode = getNextMaterialCode();
    setEditingMaterial(null);
    setFormCode(nextCode);
    setFormName('');
    setFormStockQuantity(100);
    setFormUnit('Cái');
    setFormImageUrl('');
    setFormCatalogueUrl('');
    setFormSupplier('');
    setFormUnitPrice('');
    setFormVatRate(10);
    setFormCategory('fire_protection');
    setFormSubCategory('Sol Khí (Aerosol / FM200 / Novec)');
    setFormBrand('');
    setFormSpecifications('');
    setFormWarehouse(STANDARD_WAREHOUSES[0]);
    setFormCustomWarehouse('');
    setFormShelfLocation('');
    setFormMinStock(15);
    setIsHangMucDropdownOpen(false);
    setIsNccDropdownOpen(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (m: MaterialItem) => {
    setEditingMaterial(m);
    setFormCode(m.code);
    setFormName(m.name);
    setFormStockQuantity(m.stockQuantity ?? 0);
    setFormUnit(m.unit);
    setFormImageUrl(m.imageUrl || '');
    setFormCatalogueUrl(m.catalogueUrl || '');
    setFormSupplier(m.supplier || '');
    setFormUnitPrice(m.unitPrice !== undefined ? m.unitPrice : '');
    setFormVatRate(m.vatRate !== undefined ? m.vatRate : 10);
    setFormCategory(m.category || 'fire_protection');
    setFormSubCategory(m.subCategory || '');
    setFormBrand(m.brand || '');
    setFormSpecifications(m.specifications || '');
    setFormWarehouse(m.warehouseLocation || STANDARD_WAREHOUSES[0]);
    setFormCustomWarehouse('');
    setFormShelfLocation(m.shelfLocation || '');
    setFormMinStock(m.minStock ?? 10);
    setIsHangMucDropdownOpen(false);
    setIsNccDropdownOpen(false);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim() || !formUnit.trim()) return;

    // Chuẩn hóa mã vật tư theo định dạng VT0001, VT0002...
    let cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode.startsWith('VT')) {
      const numOnly = cleanCode.replace(/\D/g, '');
      cleanCode = numOnly ? `VT${numOnly.padStart(4, '0')}` : getNextMaterialCode();
    } else {
      const numPart = cleanCode.replace('VT', '');
      if (numPart) {
        cleanCode = `VT${numPart.padStart(4, '0')}`;
      }
    }

    const finalWarehouse =
      formWarehouse === '__custom__' && formCustomWarehouse.trim()
        ? formCustomWarehouse.trim()
        : formWarehouse;

    const parsedPrice =
      formUnitPrice === '' || formUnitPrice === null || isNaN(Number(formUnitPrice))
        ? undefined
        : Number(formUnitPrice);

    const parsedStock =
      formStockQuantity === '' || isNaN(Number(formStockQuantity))
        ? 0
        : Number(formStockQuantity);

    const parsedMinStock =
      formMinStock === '' || isNaN(Number(formMinStock))
        ? 10
        : Number(formMinStock);

    const parsedVat = typeof formVatRate === 'number' ? formVatRate : Number(formVatRate) || 0;

    if (editingMaterial) {
      const updated: MaterialItem = {
        ...editingMaterial,
        code: cleanCode,
        name: formName.trim(),
        stockQuantity: parsedStock,
        unit: formUnit.trim(),
        imageUrl: formImageUrl.trim() || undefined,
        catalogueUrl: formCatalogueUrl.trim() || undefined,
        supplier: formSupplier.trim() || undefined,
        unitPrice: parsedPrice,
        vatRate: parsedVat,
        category: formCategory,
        subCategory: formSubCategory.trim() || undefined,
        brand: formBrand.trim() || undefined,
        specifications: formSpecifications.trim() || undefined,
        warehouseLocation: finalWarehouse || 'Kho Tổng Dĩ An (Bình Dương)',
        minStock: parsedMinStock,
        shelfLocation: formShelfLocation.trim() || undefined,
      };
      onEditMaterial(updated);
    } else {
      const newMaterial: MaterialItem = {
        id: `mat-${Date.now()}`,
        code: cleanCode,
        name: formName.trim(),
        stockQuantity: parsedStock,
        unit: formUnit.trim(),
        imageUrl: formImageUrl.trim() || undefined,
        catalogueUrl: formCatalogueUrl.trim() || undefined,
        supplier: formSupplier.trim() || undefined,
        unitPrice: parsedPrice,
        vatRate: parsedVat,
        category: formCategory,
        subCategory: formSubCategory.trim() || undefined,
        brand: formBrand.trim() || undefined,
        specifications: formSpecifications.trim() || undefined,
        warehouseLocation: finalWarehouse || 'Kho Tổng Dĩ An (Bình Dương)',
        minStock: parsedMinStock,
        shelfLocation: formShelfLocation.trim() || undefined,
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
      const matchSubCategory =
        selectedSubCategory === 'all' ||
        (m.subCategory && m.subCategory.toLowerCase().includes(selectedSubCategory.toLowerCase()));
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
        (m.subCategory && m.subCategory.toLowerCase().includes(q)) ||
        (m.brand && m.brand.toLowerCase().includes(q)) ||
        (m.supplier && m.supplier.toLowerCase().includes(q)) ||
        (m.warehouseLocation && m.warehouseLocation.toLowerCase().includes(q)) ||
        (m.shelfLocation && m.shelfLocation.toLowerCase().includes(q)) ||
        (m.specifications && m.specifications.toLowerCase().includes(q));

      return matchCategory && matchSubCategory && matchWarehouse && matchStock && matchSearch;
    });
  }, [materials, selectedCategory, selectedSubCategory, selectedWarehouse, stockFilter, search]);

  const getCategoryBadge = (category?: MaterialItem['category']) => {
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
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">Cơ Điện M&E</span>;
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
                <span>QUẢN LÝ SẢN PHẨM & VẬT TƯ THI CÔNG M&E</span>
                <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-sky-300">
                  MÃ VT0001+ ({materials.length})
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vật tư được thêm từ mã <strong className="text-sky-700 font-mono">VT0001</strong> đếm lên. Quản lý <strong>tên</strong>, <strong>setting số lượng</strong>, <strong>đơn vị</strong>, <strong>ảnh từ Snap Tool</strong>, <strong>link catalogue</strong>, <strong>nhà cung cấp</strong> &amp; <strong>giá tiền</strong>.
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
            Mã tiếp theo: <span className="font-mono font-bold text-sky-600">{getNextMaterialCode()}</span>
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
            Theo đơn giá đã khai báo
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase flex items-center justify-between">
            <span>Điểm Kho Đang Tồn</span>
            <Warehouse className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {existingWarehouses.length} <span className="text-xs font-normal text-slate-500">Điểm Kho</span>
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold truncate mt-0.5" title="Kho Tổng Dĩ An & các Site công trường">
            Kho Tổng Dĩ An &amp; Site Dự Án
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
              placeholder="Tìm theo mã (VT0001), tên, NCC, kho, catalogue..."
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

          {/* Lọc theo Kho Lưu Trữ */}
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
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubCategory('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-sky-700 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả hệ
          </button>
          <button
            onClick={() => {
              setSelectedCategory('fire_protection');
              setSelectedSubCategory('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'fire_protection'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔥 PCCC Cứu Hỏa
          </button>
          <button
            onClick={() => {
              setSelectedCategory('electrical');
              setSelectedSubCategory('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'electrical'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⚡ Điện &amp; MSB
          </button>
          <button
            onClick={() => {
              setSelectedCategory('cable_tray');
              setSelectedSubCategory('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'cable_tray'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📦 Máng &amp; Thang cáp
          </button>
          <button
            onClick={() => {
              setSelectedCategory('water');
              setSelectedSubCategory('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'water'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💧 Cấp Thoát Nước
          </button>
          <button
            onClick={() => {
              setSelectedCategory('hvac');
              setSelectedSubCategory('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
              selectedCategory === 'hvac'
                ? 'bg-teal-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ❄️ HVAC
          </button>
        </div>

        {/* Lọc theo Hạng mục PCCC & Hệ thống chi tiết */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold pt-1 border-t border-slate-100 bg-rose-50/40 p-2 rounded-lg border border-rose-100">
          <span className="text-[11px] font-bold text-rose-700 uppercase mr-1 shrink-0 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Hạng Mục PCCC:</span>
          </span>
          <button
            onClick={() => setSelectedSubCategory('all')}
            className={`px-2.5 py-1 rounded-md transition-all shrink-0 text-xs ${
              selectedSubCategory === 'all'
                ? 'bg-rose-700 text-white font-bold shadow-xs'
                : 'bg-white text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Tất cả hạng mục
          </button>
          {[
            { label: '🔥 Sol Khí', val: 'Sol Khí' },
            { label: '🚪 Thoát Hiểm', val: 'Thoát Hiểm' },
            { label: '💨 Hút Khói', val: 'Hút Khói' },
            { label: '💦 Sprinkler', val: 'Sprinkler' },
            { label: '🚒 Vách Tường', val: 'Vách Tường' },
            { label: '🔔 Báo Cháy', val: 'Báo Cháy' },
            { label: '🧯 Bình Chữa Cháy', val: 'Bình' },
            { label: '⚡ Bơm PCCC', val: 'Bơm' },
          ].map((item) => {
            const isMatch = selectedSubCategory === item.val;
            return (
              <button
                key={item.val}
                onClick={() => {
                  setSelectedSubCategory(isMatch ? 'all' : item.val);
                  if (selectedCategory !== 'fire_protection' && selectedCategory !== 'all') {
                    setSelectedCategory('fire_protection');
                  }
                }}
                className={`px-2.5 py-1 rounded-md transition-all shrink-0 text-xs font-medium cursor-pointer ${
                  isMatch
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW CHÍNH: DẠNG DANH SÁCH (LIST VIEW) */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3 w-24">Mã VT</th>
                  <th className="py-3 px-3 w-20 text-center">Ảnh (Snap)</th>
                  <th className="py-3 px-4 min-w-[220px]">Tên Vật Tư &amp; Quy Cách</th>
                  <th className="py-3 px-3 w-28 text-center">Link Catalogue</th>
                  <th className="py-3 px-3 min-w-[150px]">Nhà Cung Cấp</th>
                  <th className="py-3 px-2 w-16 text-center">Đơn Vị</th>
                  <th className="py-3 px-3 w-28 text-right">Giá Tiền</th>
                  {/* CỘT THỂ HIỆN ĐANG TỒN Ở KHO NÀO */}
                  <th className="py-3 px-4 min-w-[200px] bg-sky-50/60 text-sky-950 border-x border-sky-100">
                    <div className="flex items-center gap-1.5">
                      <Warehouse className="w-4 h-4 text-sky-600" />
                      <span>Đang Tồn Ở Kho Nào</span>
                    </div>
                  </th>
                  {/* CỘT SETTING LÀ SỐ LƯỢNG */}
                  <th className="py-3 px-3 w-28 text-right bg-sky-50/60 text-sky-950 border-r border-sky-100">
                    Số Lượng Tồn
                  </th>
                  <th className="py-3 px-3 w-24 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Không tìm thấy vật tư nào phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Bấm nút "+ Thêm Vật Tư Mới" để tạo mã tiếp theo.</p>
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

                        {/* Mã VT0001+ */}
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
                                title="Bấm để chụp / dán ảnh từ Snap Tool"
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
                                title="Chụp lại / dán ảnh nhận dạng khác (Snap Tool)"
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
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {getCategoryBadge(m.category)}
                            {m.subCategory && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                <Tag className="w-2.5 h-2.5 text-rose-600" />
                                {m.subCategory}
                              </span>
                            )}
                            {m.brand && (
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 py-0.2 rounded">
                                {m.brand}
                              </span>
                            )}
                          </div>
                          {m.specifications && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={m.specifications}>
                              {m.specifications}
                            </div>
                          )}
                        </td>

                        {/* Link Catalogue */}
                        <td className="py-3 px-3 text-center">
                          {m.catalogueUrl ? (
                            <a
                              href={m.catalogueUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200 text-[11px] font-bold transition-all shadow-2xs"
                              title={`Xem catalogue: ${m.catalogueUrl}`}
                            >
                              <FileText className="w-3 h-3 text-sky-600" />
                              <span>Xem Cat</span>
                              <ExternalLink className="w-2.5 h-2.5 text-sky-500" />
                            </a>
                          ) : (
                            <button
                              onClick={() => openEditModal(m)}
                              className="text-[11px] text-slate-400 hover:text-sky-600 inline-flex items-center gap-1 italic"
                              title="Bấm để bổ sung Link Catalogue"
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span>+ Thêm</span>
                            </button>
                          )}
                        </td>

                        {/* Nhà Cung Cấp */}
                        <td className="py-3 px-3">
                          {m.supplier ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Store className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span className="font-medium text-[11px] line-clamp-2" title={m.supplier}>
                                {m.supplier}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Chưa xác định</span>
                          )}
                        </td>

                        {/* Đơn vị */}
                        <td className="py-3 px-2 text-center">
                          <span className="font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {m.unit}
                          </span>
                        </td>

                        {/* Giá Tiền & Thuế VAT */}
                        <td className="py-3 px-3 text-right">
                          {m.unitPrice !== undefined && m.unitPrice > 0 ? (
                            <div>
                              <div className="font-mono font-bold text-slate-900 text-xs">
                                {formatVND(m.unitPrice)}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 font-mono">
                                +{m.vatRate ?? 10}% VAT ({formatVND(Math.round(m.unitPrice * (1 + (m.vatRate ?? 10) / 100)))})
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Liên hệ</span>
                          )}
                        </td>

                        {/* THỂ HIỆN ĐANG TỒN Ở KHO NÀO & VỊ TRÍ */}
                        <td className="py-3 px-4 bg-sky-50/30 border-x border-sky-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getWarehouseBadgeClass(m.warehouseLocation || '')}`}>
                                {m.warehouseLocation || 'Kho Tổng Dĩ An (Bình Dương)'}
                              </span>
                            </div>
                            {m.shelfLocation && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 pl-5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{m.shelfLocation}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* SETTING LÀ SỐ LƯỢNG (SỐ LƯỢNG TỒN) */}
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
                              title="Sửa thông tin, số lượng &amp; kho tồn"
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
        /* VIEW PHỤ: DẠNG LƯỚI THẺ (GRID CARDS) */
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

                    {/* Mã vật tư Badge VT0001+ */}
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

                    {/* Category & SubCategory Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {getCategoryBadge(m.category)}
                      {m.subCategory && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-rose-600" />
                          {m.subCategory}
                        </span>
                      )}
                    </div>

                    {/* Catalogue Link & Nhà cung cấp */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      {m.catalogueUrl ? (
                        <a
                          href={m.catalogueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-sky-800 font-bold inline-flex items-center gap-1 text-[11px]"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Catalogue</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chưa có Cat</span>
                      )}

                      {m.supplier && (
                        <span className="text-[11px] text-slate-600 font-medium truncate max-w-[120px]" title={m.supplier}>
                          {m.supplier}
                        </span>
                      )}
                    </div>

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
                        <div className="text-[10px] text-slate-400 font-medium">Setting số lượng:</div>
                        <div className="font-mono font-extrabold text-sm text-slate-900">
                          {qty.toLocaleString('vi-VN')} {m.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-medium">Giá tiền &amp; VAT:</div>
                        <div className="font-mono font-bold text-sky-700 text-xs">
                          {m.unitPrice !== undefined && m.unitPrice > 0 ? formatVND(m.unitPrice) : 'Liên hệ'}
                        </div>
                        {m.unitPrice !== undefined && m.unitPrice > 0 && (
                          <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                            +VAT {m.vatRate ?? 10}% ({formatVND(Math.round(m.unitPrice * (1 + (m.vatRate ?? 10) / 100)))})
                          </div>
                        )}
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
                      title="Chỉnh sửa thông tin vật tư &amp; kho"
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
                <span>{editingMaterial ? `Chỉnh Sửa Vật Tư [${formCode}]` : `Thêm Mới Vật Tư [${formCode}]`}</span>
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
              {/* HÀNG 1: MÃ VẬT TƯ & PHÂN LOẠI HỆ & HẠNG MỤC CHI TIẾT (DROPDOWN TIẾT KIỆM KHÔNG GIAN) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Mã Vật Tư <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: VT0001..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg font-mono font-bold text-sky-800 focus:ring-2 focus:ring-sky-500 uppercase bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Phân Loại Hệ M&amp;E <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as any;
                      setFormCategory(newCat);
                      const defaults = MNE_SUB_CATEGORIES[newCat] || [];
                      if (defaults.length > 0) {
                        setFormSubCategory(defaults[0]);
                      }
                    }}
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold bg-white text-xs"
                  >
                    <option value="fire_protection">🔥 Hệ PCCC Cứu hỏa</option>
                    <option value="electrical">⚡ Hệ Điện &amp; MSB</option>
                    <option value="cable_tray">📦 Thang Máng Cáp</option>
                    <option value="water">💧 Cấp Thoát Nước</option>
                    <option value="hvac">❄️ Hệ Thống HVAC</option>
                    <option value="other">Cơ điện khác</option>
                  </select>
                </div>

                {/* ĐÚNG 1 TEXT BOX LÀ HẠNG MỤC VÀ CHỨC NĂNG DROPDOWN */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Hạng Mục
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="hang-muc-datalist"
                      value={formSubCategory}
                      onChange={(e) => setFormSubCategory(e.target.value)}
                      onFocus={() => setIsHangMucDropdownOpen(true)}
                      placeholder="Gõ hoặc chọn: Sol Khí, Thoát Hiểm, Sprinkler..."
                      className="w-full py-1.5 pl-2.5 pr-7 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setIsHangMucDropdownOpen((prev) => !prev)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Mở danh sách hạng mục"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <datalist id="hang-muc-datalist">
                      {PCCC_SUB_CATEGORIES.map((sub) => (
                        <option key={`dl-pccc-${sub}`} value={sub} />
                      ))}
                      {Object.values(MNE_SUB_CATEGORIES)
                        .flat()
                        .map((sub) => (
                          <option key={`dl-mne-${sub}`} value={sub} />
                        ))}
                    </datalist>

                    {isHangMucDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-xl text-xs py-1 divide-y divide-slate-100">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 flex items-center justify-between">
                          <span>Danh mục Hạng Mục</span>
                          <button
                            type="button"
                            onClick={() => setIsHangMucDropdownOpen(false)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="py-0.5">
                          {(MNE_SUB_CATEGORIES[formCategory || 'fire_protection'] || PCCC_SUB_CATEGORIES).map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                setFormSubCategory(sub);
                                setIsHangMucDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 transition-colors flex items-center justify-between cursor-pointer ${
                                formSubCategory === sub ? 'bg-sky-100/60 text-sky-800 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <span>{sub}</span>
                              {formSubCategory === sub && <Check className="w-3.5 h-3.5 text-sky-600" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* HÀNG 2: TÊN SẢN PHẨM / VẬT TƯ */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên Sản Phẩm / Vật Tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Đèn cảnh báo xả khí, CẤM VÀO / Đầu phun Sprinkler Tyco / Cáp đồng..."
                  className="w-full py-1.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-xs font-semibold"
                />
              </div>

              {/* HÀNG 3: TỒN KHO & ĐƠN VỊ TÍNH & CẢNH BÁO TỒN (GỌN GÀNG 3 CỘT) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    Tồn Kho Ban Đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formStockQuantity}
                    onChange={(e) => setFormStockQuantity(e.target.value)}
                    placeholder="100..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    Đơn Vị Tính (ĐVT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Cái, Bộ, Mét, Cuộn..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    Cảnh Báo Tồn Tối Thiểu
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    placeholder="10..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 text-xs"
                  />
                </div>
              </div>

              {/* HÀNG 4: NHÀ CUNG CẤP & THƯƠNG HIỆU / HÃNG (NGAY SAU NHÀ CUNG CẤP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
                {/* Nhà Cung Cấp: Đúng 1 Text Box với Chức Năng Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-sky-600" />
                      <span>Nhà Cung Cấp</span>
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      list="ncc-datalist"
                      value={formSupplier}
                      onChange={(e) => setFormSupplier(e.target.value)}
                      onFocus={() => setIsNccDropdownOpen(true)}
                      placeholder="Gõ hoặc chọn từ bảng Nhà Cung Cấp..."
                      className="w-full py-1.5 pl-2.5 pr-7 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setIsNccDropdownOpen((prev) => !prev)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Mở danh sách Nhà Cung Cấp"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <datalist id="ncc-datalist">
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>

                    {isNccDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-xl text-xs py-1 divide-y divide-slate-100">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 flex items-center justify-between">
                          <span>Chọn từ bảng NCC ({suppliers.length})</span>
                          <button
                            type="button"
                            onClick={() => setIsNccDropdownOpen(false)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="py-0.5">
                          {suppliers.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setFormSupplier(s.name);
                                setIsNccDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-sky-50 hover:text-sky-700 transition-colors flex items-center justify-between cursor-pointer ${
                                formSupplier === s.name ? 'bg-sky-100/60 text-sky-800 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <div>
                                <div className="font-semibold">🏢 {s.name}</div>
                                {s.contactPerson && (
                                  <div className="text-[10px] text-slate-400">
                                    {s.contactPerson} {s.phone ? `• ${s.phone}` : ''}
                                  </div>
                                )}
                              </div>
                              {formSupplier === s.name && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thương Hiệu / Hãng: Đặt ngay sau Nhà Cung Cấp */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Thương Hiệu / Hãng
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="VD: CADIVI, Schneider, Viking, Tyco..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* HÀNG 5: Ô GIÁ TIỀN & THUẾ VAT (ĐỂ BÊN DƯỚI) */}
              <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase flex items-center gap-1 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đơn Giá &amp; Thuế VAT</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold lowercase">
                    (Dropdown VAT)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="sm:col-span-3 relative">
                    <input
                      type="number"
                      min={0}
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(e.target.value)}
                      placeholder="VD: 694000 (để trống nếu báo giá sau)..."
                      className="w-full py-1.5 pl-2.5 pr-8 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 text-xs"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] pointer-events-none">
                      VNĐ
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={formVatRate}
                      onChange={(e) => setFormVatRate(Number(e.target.value))}
                      className="w-full py-1.5 px-2 border border-emerald-300 bg-white rounded-lg font-bold text-emerald-900 text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value={10}>VAT 10% (Chuẩn)</option>
                      <option value={8}>VAT 8% (Ưu đãi)</option>
                      <option value={0}>VAT 0% (Không thuế)</option>
                    </select>
                  </div>
                </div>

                {formUnitPrice && Number(formUnitPrice) > 0 && (
                  <div className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center justify-between">
                    <span>Gồm VAT ({formVatRate}%):</span>
                    <span className="font-mono font-bold">
                      {formatVND(Math.round(Number(formUnitPrice) * (1 + formVatRate / 100)))}
                    </span>
                  </div>
                )}
              </div>

              {/* HÀNG 6: KHO LƯU TRỮ & VỊ TRÍ KỆ / Ô BÃI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 bg-amber-50/40 rounded-xl border border-amber-200/80">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Kho Lưu Trữ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formWarehouse}
                    onChange={(e) => setFormWarehouse(e.target.value)}
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 font-medium text-xs"
                  >
                    {existingWarehouses.map((wh) => (
                      <option key={wh} value={wh}>
                        {wh}
                      </option>
                    ))}
                    <option value="__custom__">+ Nhập kho mới...</option>
                  </select>
                  {formWarehouse === '__custom__' && (
                    <input
                      type="text"
                      required
                      value={formCustomWarehouse}
                      onChange={(e) => setFormCustomWarehouse(e.target.value)}
                      placeholder="Tên kho mới..."
                      className="w-full mt-1 py-1 px-2.5 border border-sky-400 bg-white rounded-lg text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Vị Trí Kệ / Ô Bãi
                  </label>
                  <input
                    type="text"
                    value={formShelfLocation}
                    onChange={(e) => setFormShelfLocation(e.target.value)}
                    placeholder="Kệ A1-04, Bãi C1..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 text-xs"
                  />
                </div>
              </div>

              {/* HÀNG 7: LINK CATALOGUE & QUY CÁCH KỸ THUẬT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px] flex items-center gap-1">
                    <FileText className="w-3 h-3 text-sky-600" />
                    <span>Link Catalogue / Datasheet</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formCatalogueUrl}
                      onChange={(e) => setFormCatalogueUrl(e.target.value)}
                      placeholder="https://... (link tài liệu / PDF)"
                      className="w-full py-1.5 pl-2.5 pr-7 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white text-xs"
                    />
                    {formCatalogueUrl && (
                      <a
                        href={formCatalogueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 hover:text-sky-800"
                        title="Mở thử liên kết"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Quy Cách &amp; Tiêu Chuẩn Kỹ Thuật
                  </label>
                  <input
                    type="text"
                    value={formSpecifications}
                    onChange={(e) => setFormSpecifications(e.target.value)}
                    placeholder="Thông số, cấp điện áp, kiểm định..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* HÀNG 8: CẮT HÌNH TRỰC TIẾP TẠI CỬA SỔ LUÔN (IN-WINDOW IMAGE CROPPER) */}
              <InlineImageCropper
                imageUrl={formImageUrl}
                materialCode={formCode || 'VT0001'}
                onChange={(url) => setFormImageUrl(url)}
                isModalOpen={isFormModalOpen}
              />

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
