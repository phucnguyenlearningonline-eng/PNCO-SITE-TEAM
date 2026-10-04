import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  FileText,
  Building,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Project, ExpenseItem, Customer } from '../types';
import { formatVND } from '../utils/formatters';

interface ClientsViewProps {
  customers: Customer[];
  projects: Project[];
  expenses: ExpenseItem[];
  onAddCustomer: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer, oldName?: string) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onUpdateClient?: (oldClientName: string, newClientName: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  customers = [],
  projects = [],
  expenses = [],
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onUpdateClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with_projects'>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Customer | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // 1. Hợp nhất danh sách Khách Hàng độc nhất:
  // Lấy danh sách từ customers prop, đồng thời bổ sung bất kỳ client nào có trong projects mà chưa có trong customers
  const unifiedClients = useMemo(() => {
    const map = new Map<string, Customer>();

    // Đưa danh sách customers chính thức vào map
    customers.forEach((c) => {
      const key = (c.name || '').trim().toLowerCase();
      if (key) {
        map.set(key, { ...c });
      }
    });

    // Quét qua các dự án để bảo đảm không bị sót khách hàng nào
    projects.forEach((p, idx) => {
      const rawName = (p.client || '').trim();
      if (!rawName) return;
      const key = rawName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: p.clientId || `kh-${Date.now()}-${idx}`,
          code: p.clientCode || `KH-${String(map.size + 1).padStart(3, '0')}`,
          name: rawName,
          shortName: rawName.length > 25 ? rawName.slice(0, 22) + '...' : undefined,
          address: p.clientAddress || p.location || 'TP. Hồ Chí Minh',
          phone: '',
          taxCode: '',
          contactPerson: p.manager || 'Ban Quản Lý Dự Án',
          notes: `Khách hàng liên kết từ dự án ${p.name}`,
        });
      }
    });

    return Array.from(map.values());
  }, [customers, projects]);

  // 2. Tính toán thông tin liên kết cho từng Khách Hàng (Dự án, Doanh thu, Chi phí)
  const clientDataList = useMemo(() => {
    return unifiedClients.map((client) => {
      const clientNameLower = client.name.trim().toLowerCase();
      
      // Các dự án liên kết với khách hàng này
      const clientProjects = projects.filter((p) => {
        const pClient = (p.client || '').trim().toLowerCase();
        return pClient === clientNameLower || (client.id && p.clientId === client.id);
      });

      // Tổng doanh thu / giá trị HĐ đã ký kết
      const totalRevenue = clientProjects.reduce((sum, p) => {
        return sum + (p.totalRevenue || p.totalContractValueWithVat || p.originalContractValue || 0);
      }, 0);

      // Tổng tiền CĐT đã thanh toán / tạm ứng
      const totalCollected = clientProjects.reduce((sum, p) => sum + (p.currentAdvance || 0), 0);

      // Chi phí site phát sinh liên quan tới các dự án của khách hàng này
      const projectIds = new Set(clientProjects.map((p) => p.id));
      const clientExpenses = expenses.filter((e) => projectIds.has(e.projectId));
      const totalSpent = clientExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

      return {
        client,
        projects: clientProjects,
        totalRevenue,
        totalCollected,
        clientExpenses,
        totalSpent,
      };
    });
  }, [unifiedClients, projects, expenses]);

  // 3. Lọc và Tìm kiếm
  const filteredClients = useMemo(() => {
    let result = clientDataList;

    if (filterMode === 'with_projects') {
      result = result.filter((item) => item.projects.length > 0);
    }

    const q = searchTerm.toLowerCase().trim();
    if (q) {
      result = result.filter((item) => {
        const c = item.client;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.code && c.code.toLowerCase().includes(q)) ||
          (c.shortName && c.shortName.toLowerCase().includes(q)) ||
          (c.taxCode && c.taxCode.toLowerCase().includes(q)) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          item.projects.some((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
        );
      });
    }

    return result.sort((a, b) => {
      const cmp = a.client.name.localeCompare(b.client.name, 'vi');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [clientDataList, filterMode, searchTerm, sortDirection]);

  // Sinh mã khách hàng tự động kế tiếp (VD: KH-005)
  const getNextClientCode = () => {
    let maxNum = 0;
    unifiedClients.forEach((c) => {
      const match = (c.code || '').match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `KH-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Mở modal thêm mới
  const openAddModal = () => {
    setEditingClient(null);
    setCode(getNextClientCode());
    setName('');
    setShortName('');
    setTaxCode('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const openEditModal = (c: Customer) => {
    setEditingClient(c);
    setCode(c.code || '');
    setName(c.name || '');
    setShortName(c.shortName || '');
    setTaxCode(c.taxCode || '');
    setContactPerson(c.contactPerson || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  // Lưu Khách Hàng (Thêm mới hoặc Cập nhật)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      // Cập nhật khách hàng
      const updated: Customer = {
        ...editingClient,
        code: code.trim() || editingClient.code,
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (onEditCustomer) {
        onEditCustomer(updated, editingClient.name);
      } else if (onUpdateClient && editingClient.name !== updated.name) {
        onUpdateClient(editingClient.name, updated.name);
      }
    } else {
      // Thêm khách hàng mới
      const newCustomer: Customer = {
        id: `kh-${Date.now()}`,
        code: code.trim() || getNextClientCode(),
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      onAddCustomer(newCustomer);
    }

    setIsModalOpen(false);
    setEditingClient(null);
  };

  // Xóa Khách Hàng
  const handleDelete = (client: Customer, linkedProjectCount: number) => {
    if (!onDeleteCustomer) return;
    
    if (linkedProjectCount > 0) {
      const confirmDelete = confirm(
        `Khách hàng "${client.name}" hiện đang có ${linkedProjectCount} công trình thi công liên kết.\n\n` +
        `Bạn có chắc chắn muốn xóa hồ sơ khách hàng này khỏi danh bạ? (Lưu ý: Các công trình thi công và chứng từ thu chi thực tế sẽ KHÔNG bị mất).`
      );
      if (confirmDelete) {
        onDeleteCustomer(client.id);
      }
    } else {
      if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ khách hàng "${client.name}"?`)) {
        onDeleteCustomer(client.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <span>DANH SÁCH CHỦ ĐẦU TƯ &amp; KHÁCH HÀNG DỰ ÁN M&amp;E ({unifiedClients.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý hồ sơ doanh nghiệp khách hàng, đối tác chủ đầu tư của các dự án thi công và đồng bộ dữ liệu.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* NÚT THÊM KHÁCH HÀNG MỚI (ĐÁP ỨNG TRỰC TIẾP YÊU CẦU USER) */}
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>+ Thêm Khách Hàng Mới</span>
            </button>

            {/* Nút Đảo Chiều Thứ Tự */}
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                sortDirection === 'desc'
                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Bấm để đảo chiều thứ tự A-Z hoặc Z-A"
            >
              {sortDirection === 'desc' ? (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-rose-600 stroke-[2.8]" />
                  <span>Thứ tự: Từ trên xuống (Z → A) ▼</span>
                </>
              ) : (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.8]" />
                  <span>Thứ tự: Từ dưới lên (A → Z) ▲</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc nhanh */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên công ty, mã KH, MST, người liên hệ, dự án..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#102742] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({unifiedClients.length})
            </button>
            <button
              onClick={() => setFilterMode('with_projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'with_projects'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Có công trình thi công ({clientDataList.filter((item) => item.projects.length > 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Clients (Mỗi Card là 1 Khách Hàng / Chủ Đầu Tư độc nhất) */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">Không tìm thấy khách hàng phù hợp</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc nhấn vào nút bên dưới để thêm khách hàng mới vào hệ thống.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm Khách Hàng Mới Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((item, idx) => {
            const { client, projects: clientProjects, totalRevenue, totalSpent, clientExpenses } = item;

            return (
              <div
                key={client.id || client.name}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group"
              >
                <div>
                  {/* Card Header: STT, Mã KH, Badge Chủ Đầu Tư & Hành Động */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md">
                        STT #{idx + 1}
                      </span>
                      {client.code && (
                        <span className="font-mono text-[10.5px] font-bold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-md border border-sky-200">
                          {client.code}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Chủ Đầu Tư</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin khách hàng"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client, clientProjects.length)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa hồ sơ khách hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tên Khách Hàng / Tên Công Ty (Nổi bật) */}
                  <div className="mt-2.5">
                    <h4 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug line-clamp-2" title={client.name}>
                      {client.name}
                    </h4>
                    {client.shortName && (
                      <div className="text-xs font-semibold text-sky-700 mt-0.5">
                        Tên viết tắt: {client.shortName}
                      </div>
                    )}
                  </div>

                  {/* Thông tin hồ sơ doanh nghiệp khách hàng */}
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5">
                    {client.taxCode && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Mã số thuế:</span>
                        <span className="font-mono font-bold text-slate-800">{client.taxCode}</span>
                      </div>
                    )}
                    {client.contactPerson && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Người liên hệ:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[200px]" title={client.contactPerson}>
                          {client.contactPerson}
                        </span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Điện thoại:</span>
                        <a href={`tel:${client.phone}`} className="font-mono font-bold text-sky-700 hover:underline">
                          {client.phone}
                        </a>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Email:</span>
                        <span className="text-slate-700 truncate max-w-[190px]" title={client.email}>
                          {client.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-slate-500 pt-1 border-t border-slate-200/60">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed line-clamp-2">
                        {client.address || 'TP. Hồ Chí Minh'}
                      </span>
                    </div>
                  </div>

                  {/* DANH SÁCH DỰ ÁN THI CÔNG LIÊN KẾT CỦA KHÁCH HÀNG NÀY */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                        <span>Dự án thi công liên kết ({clientProjects.length}):</span>
                      </span>
                    </div>

                    {clientProjects.length === 0 ? (
                      <div className="p-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-[11px] italic text-center">
                        Chưa có dự án nào được gán cho CĐT này
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {clientProjects.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-lg bg-sky-50/70 border border-sky-100 hover:bg-sky-100/60 transition-colors text-xs"
                          >
                            <div className="font-bold text-slate-900 leading-snug">
                              {p.name} <span className="font-mono text-sky-700 text-[10.5px]">({p.code})</span>
                            </div>
                            <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1">
                              <span className="truncate max-w-[140px]">📍 {p.location}</span>
                              <span>CHT: <strong className="text-slate-700">{p.manager}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phần Chân Card: Thống kê Tài chính Khách Hàng (Số chuẩn từng đồng) */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  {clientProjects.length > 0 && totalRevenue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Tổng giá trị hợp đồng:</span>
                      <span className="font-mono font-bold text-sky-800">{formatVND(totalRevenue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Chi tiết chi phí site:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {clientExpenses.length} giao dịch ({formatVND(totalSpent)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Thêm Khách Hàng Mới & Chỉnh Sửa Thông Tin Khách Hàng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-400" />
                  <span>{editingClient ? 'Chỉnh Sửa Hồ Sơ Khách Hàng / CĐT' : 'Thêm Khách Hàng / Chủ Đầu Tư Mới'}</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Điền đầy đủ thông tin để phục vụ ký kết hợp đồng và hạch toán dự án M&amp;E.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingClient(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tên Doanh Nghiệp / Chủ Đầu Tư <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Công Ty TNHH Tialoc Việt Nam"
                    required
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Mã Khách Hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="KH-001"
                    required
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold text-sky-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tên Viết Tắt / Giao Dịch
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="VD: Tialoc Việt Nam"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Mã Số Thuế (MST)
                  </label>
                  <input
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="VD: 0310892299"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Người Đại Diện / Liên Hệ
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="VD: Mr. David Wong (Giám đốc)"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 028.3822.8899"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Email Liên Hệ
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: contact@tialoc.com.vn"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Địa Chỉ Trụ Sở / Văn Phòng
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: Số 68 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Ghi Chú Hợp Tác &amp; Thông Tin Bổ Sung
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú về tiến độ thanh toán, liên hệ ban QLDA, yêu cầu xuất hóa đơn..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-xs resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingClient ? 'Lưu Thay Đổi' : 'Tạo Khách Hàng Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
