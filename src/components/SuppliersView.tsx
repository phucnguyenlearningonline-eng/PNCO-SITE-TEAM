import React, { useState } from 'react';
import { Users, Truck, Package, Utensils, Phone, MapPin, PlusCircle, Building2 } from 'lucide-react';
import { Supplier, ExpenseItem } from '../types';
import { formatVND } from '../utils/formatters';

interface SuppliersViewProps {
  suppliers: Supplier[];
  expenses: ExpenseItem[];
  onAddSupplier: (supplier: Supplier) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  expenses,
  onAddSupplier,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'material' | 'transport' | 'food' | 'other'>('material');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [address, setAddress] = useState('');

  const filteredSuppliers = filterType === 'all'
    ? suppliers
    : suppliers.filter((s) => s.type === filterType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: name.trim(),
      type,
      phone: phone.trim() || '0900.000.000',
      contactPerson: contactPerson.trim() || 'Liên hệ mua hàng',
      address: address.trim() || 'TP. Hồ Chí Minh',
      unpaidBalance: 0,
    };

    onAddSupplier(newSupplier);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setContactPerson('');
    setAddress('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>DANH BẠ NHÀ CUNG CẤP VẬT TƯ, NHÀ XE & ĐƠN VỊ SUẤT ĂN SITE</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin liên lạc, xe cẩu kéo, nhà cung cấp thiết bị M&E và nhà hàng/quán ăn phục vụ tăng ca.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Thêm Đối Tác / Nhà Xe</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterType === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tất cả đối tác ({suppliers.length})
        </button>
        <button
          onClick={() => setFilterType('material')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            filterType === 'material'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Nhà cung cấp vật tư
        </button>
        <button
          onClick={() => setFilterType('transport')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            filterType === 'transport'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Đội xe cẩu & vận chuyển
        </button>
        <button
          onClick={() => setFilterType('food')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            filterType === 'food'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          Quán cơm & Suất ăn tăng ca
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          const supplierExpenses = expenses.filter((e) => e.supplier.toLowerCase().includes(supplier.name.toLowerCase()));
          const totalSpent = supplierExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

          return (
            <div
              key={supplier.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded uppercase ${
                      supplier.type === 'material'
                        ? 'bg-blue-100 text-blue-800'
                        : supplier.type === 'transport'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {supplier.type === 'material'
                      ? 'Vật tư thiết bị'
                      : supplier.type === 'transport'
                      ? 'Xe cẩu & Vận chuyển'
                      : 'Cơm tăng ca'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    {supplierExpenses.length} đơn hàng
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2 line-clamp-1" title={supplier.name}>
                  {supplier.name}
                </h3>
                <div className="text-xs text-slate-600 mt-1 font-medium">{supplier.contactPerson}</div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Tổng thanh toán:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{formatVND(totalSpent)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Thêm Nhà Cung Cấp / Đội Xe / Quán Cơm</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Tên Đơn Vị / Đối Tác</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cáp CADIVI / Đội Xe Cẩu Hoàng Long / Quán Cơm Cô Sáu"
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Lĩnh Vực Hoạt Động</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full py-2 px-3 border border-slate-300 rounded bg-white"
                >
                  <option value="material">🧱 Nhà cung cấp vật tư & thiết bị M&E</option>
                  <option value="transport">🚚 Đội xe cẩu kéo, container & vận chuyển</option>
                  <option value="food">🍱 Quán cơm, bánh mì, đồ ăn bồi dưỡng tăng ca</option>
                  <option value="other">📌 Dịch vụ khác</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Người Liên Hệ</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Anh Tuấn (Điều phối xe)"
                    className="w-full py-2 px-3 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx.xxx.xxx"
                    className="w-full py-2 px-3 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Địa Chỉ / Bãi Xe / Vị Trí Gần Site</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Khu công nghiệp VSIP II hoặc gần công trường"
                  className="w-full py-2 px-3 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded shadow-sm"
                >
                  Lưu Đơn Vị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
