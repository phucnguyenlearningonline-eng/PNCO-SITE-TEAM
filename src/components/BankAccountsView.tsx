import React, { useState, useMemo, useEffect } from 'react';
import { 
  Landmark, 
  CreditCard, 
  PlusCircle, 
  Search, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  X, 
  Database, 
  RefreshCw, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Wallet,
  ArrowUpDown,
  FileCode
} from 'lucide-react';
import { BankAccount } from '../types';
import { formatVND } from '../utils/formatters';
import { 
  BANK_ACCOUNTS_TABLE_SQL, 
  CLIENT_AND_BANK_SQL, 
  checkBankAccountsTableOnSupabase,
  upsertBankAccountToSupabase 
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface BankAccountsViewProps {
  bankAccounts: BankAccount[];
  onAddBankAccount: (account: BankAccount) => Promise<void> | void;
  onEditBankAccount?: (account: BankAccount) => Promise<void> | void;
  onDeleteBankAccount?: (accountId: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  onOpenSupabaseModal?: () => void;
}

// Danh sách gợi ý các ngân hàng phổ biến tại Việt Nam kèm màu thương hiệu
const POPULAR_BANKS = [
  { name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam', bgGradient: 'from-emerald-800 to-green-950', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam', bgGradient: 'from-rose-900 to-red-950', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300' },
  { name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân đội', bgGradient: 'from-blue-900 to-indigo-950', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' },
  { name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu', bgGradient: 'from-sky-800 to-blue-950', badgeColor: 'bg-sky-100 text-sky-800 border-sky-300' },
  { name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', bgGradient: 'from-teal-800 to-emerald-950', badgeColor: 'bg-teal-100 text-teal-800 border-teal-300' },
  { name: 'VietinBank', fullName: 'Ngân hàng TMCP Công thương Việt Nam', bgGradient: 'from-cyan-900 to-blue-950', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong', bgGradient: 'from-purple-900 to-violet-950', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300' },
  { name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', bgGradient: 'from-emerald-900 to-green-950', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { name: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín', bgGradient: 'from-blue-900 to-sky-950', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' },
  { name: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TP.HCM', bgGradient: 'from-amber-900 to-red-950', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
  { name: 'Agribank', fullName: 'Ngân hàng Nông nghiệp & Phát triển Nông thôn', bgGradient: 'from-rose-950 to-red-950', badgeColor: 'bg-red-100 text-red-800 border-red-300' },
  { name: 'Khác...', fullName: 'Tài khoản Ngân hàng khác', bgGradient: 'from-slate-800 to-slate-950', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300' },
];

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({
  bankAccounts = [],
  onAddBankAccount,
  onEditBankAccount,
  onDeleteBankAccount,
  onRefreshData,
  onOpenSupabaseModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  // Form Fields
  const [bankName, setBankName] = useState('Vietcombank');
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('CÔNG TY TNHH KỸ THUẬT CƠ ĐIỆN PHÚC NGUYÊN');
  const [branch, setBranch] = useState('Chi nhánh Tân Bình, TP. Hồ Chí Minh');
  const [accountType, setAccountType] = useState<'company' | 'project' | 'personal' | 'cash'>('company');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [isDefault, setIsDefault] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');

  // Modal SQL Supabase
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlTab, setSqlTab] = useState<'both' | 'bank' | 'client'>('both');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [supabaseTableStatus, setSupabaseTableStatus] = useState<{
    checked: boolean;
    tableExists: boolean;
  }>({ checked: false, tableExists: false });

  // Kiểm tra bảng trên Supabase khi mount hoặc mở modal
  const checkSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    setIsCheckingSupabase(true);
    try {
      const res = await checkBankAccountsTableOnSupabase();
      setSupabaseTableStatus({
        checked: true,
        tableExists: Boolean(res.bankAccountsTableExists || res.bankAccountTableExists),
      });
    } catch (e) {
      setSupabaseTableStatus({ checked: true, tableExists: false });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  useEffect(() => {
    checkSupabase();
  }, []);

  // Lọc danh sách
  const filteredAccounts = useMemo(() => {
    return bankAccounts.filter((item) => {
      const matchType = filterType === 'all' || item.accountType === filterType;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || (
        item.bankName.toLowerCase().includes(q) ||
        item.accountNumber.toLowerCase().includes(q) ||
        item.accountHolder.toLowerCase().includes(q) ||
        (item.branch && item.branch.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
      return matchType && matchSearch;
    });
  }, [bankAccounts, filterType, searchTerm]);

  // Thống kê
  const stats = useMemo(() => {
    const totalBalance = bankAccounts.reduce((sum, a) => sum + (a.currentBalance || a.initialBalance || 0), 0);
    const companyCount = bankAccounts.filter((a) => a.accountType === 'company').length;
    const defaultAcc = bankAccounts.find((a) => a.isDefault) || bankAccounts[0];
    return {
      total: bankAccounts.length,
      totalBalance,
      companyCount,
      defaultAcc,
    };
  }, [bankAccounts]);

  const handleCopyAccountNumber = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopySql = () => {
    const textToCopy = sqlTab === 'both' ? CLIENT_AND_BANK_SQL : (sqlTab === 'bank' ? BANK_ACCOUNTS_TABLE_SQL : CLIENT_AND_BANK_SQL);
    navigator.clipboard.writeText(textToCopy);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setFormError(null);
    setBankName('Vietcombank');
    setCustomBankName('');
    setAccountNumber('');
    setAccountHolder('CÔNG TY TNHH KỸ THUẬT CƠ ĐIỆN PHÚC NGUYÊN');
    setBranch('Chi nhánh Tân Bình, TP. Hồ Chí Minh');
    setAccountType('company');
    setInitialBalance(0);
    setIsDefault(bankAccounts.length === 0);
    setStatus('active');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFormError(null);
    const isPopular = POPULAR_BANKS.some((b) => b.name === acc.bankName);
    if (isPopular) {
      setBankName(acc.bankName);
      setCustomBankName('');
    } else {
      setBankName('Khác...');
      setCustomBankName(acc.bankName);
    }
    setAccountNumber(acc.accountNumber);
    setAccountHolder(acc.accountHolder);
    setBranch(acc.branch || '');
    setAccountType(acc.accountType || 'company');
    setInitialBalance(acc.initialBalance || 0);
    setIsDefault(Boolean(acc.isDefault));
    setStatus(acc.status || 'active');
    setNotes(acc.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBankName = bankName === 'Khác...' ? customBankName.trim() : bankName;
    if (!finalBankName || !accountNumber.trim() || !accountHolder.trim()) {
      setFormError('Vui lòng điền đầy đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản.');
      return;
    }
    setFormError(null);

    if (editingAccount) {
      const updated: BankAccount = {
        ...editingAccount,
        bankName: finalBankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        branch: branch.trim() || undefined,
        accountType,
        initialBalance,
        currentBalance: editingAccount.currentBalance !== undefined ? editingAccount.currentBalance : initialBalance,
        isDefault,
        status,
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      if (onEditBankAccount) {
        await onEditBankAccount(updated);
      }
    } else {
      const newAcc: BankAccount = {
        id: `bank-${Date.now()}`,
        bankName: finalBankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        branch: branch.trim() || undefined,
        accountType,
        initialBalance,
        currentBalance: initialBalance,
        isDefault,
        status,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await onAddBankAccount(newAcc);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (acc: BankAccount) => {
    if (!onDeleteBankAccount) return;
    setAccountToDelete(acc);
  };

  const handleConfirmDelete = async () => {
    if (accountToDelete && onDeleteBankAccount) {
      await onDeleteBankAccount(accountToDelete.id);
      setAccountToDelete(null);
    }
  };

  const getBankStyle = (name: string) => {
    const found = POPULAR_BANKS.find((b) => b.name.toLowerCase() === (name || '').toLowerCase());
    return found || {
      name,
      fullName: name,
      bgGradient: 'from-slate-800 to-slate-950',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    };
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" />
              <span>DANH SÁCH TÀI KHOẢN NGÂN HÀNG ({bankAccounts.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý các tài khoản ngân hàng giao dịch của công ty M&amp;E Phúc Nguyên, tài khoản dự án và tài khoản quỹ hiện trường site.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Nút Thêm Tài Khoản Ngân Hàng Mới */}
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>+ Thêm Tài Khoản Ngân Hàng</span>
            </button>

            {/* Nút Xem Mã SQL Tạo Bảng Supabase */}
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Xem và sao chép mã SQL tạo bảng bank_accounts & client trên Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>⚡ SQL Tạo Bảng Supabase</span>
            </button>

            {/* Nút Tải lại dữ liệu */}
            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Tải lại dữ liệu mới nhất từ Supabase"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Trạng thái Supabase Cloud Sync */}
        {isSupabaseConfigured() && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-700">Đồng bộ Cloud Supabase:</span>
              {supabaseTableStatus.checked ? (
                supabaseTableStatus.tableExists ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bảng <code>bank_accounts</code> đã sẵn sàng
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Chưa tìm thấy bảng <code>bank_accounts</code> trên Supabase
                  </span>
                )
              ) : (
                <span className="text-slate-500">Đang kiểm tra kết nối...</span>
              )}
            </div>

            {!supabaseTableStatus.tableExists && (
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Chạy mã SQL tạo bảng ngay</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-100">
            <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">Tổng số tài khoản</div>
            <div className="text-lg font-black text-indigo-950 mt-0.5">{stats.total} Tài khoản</div>
            <div className="text-[11px] text-indigo-600/80 mt-0.5 font-medium">
              {stats.companyCount} TK Doanh nghiệp • {stats.total - stats.companyCount} TK Khác
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Tài khoản chính (Mặc định)</div>
            <div className="text-sm font-black text-emerald-950 mt-0.5 truncate">
              {stats.defaultAcc ? `${stats.defaultAcc.bankName} - ${stats.defaultAcc.accountNumber}` : 'Chưa thiết lập'}
            </div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5 font-medium truncate">
              {stats.defaultAcc ? stats.defaultAcc.accountHolder : 'Nhấn chỉnh sửa để đặt mặc định'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-100">
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Tổng số dư theo dõi</div>
            <div className="text-lg font-black text-purple-950 font-mono mt-0.5">
              {formatVND(stats.totalBalance)}
            </div>
            <div className="text-[11px] text-purple-600/80 mt-0.5 font-medium">
              Số dư thực tế đối soát theo sao kê
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên ngân hàng, số tài khoản, chủ TK..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Loại tài khoản:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Tất cả ({bankAccounts.length})</option>
              <option value="company">Tài khoản Công ty</option>
              <option value="project">Tài khoản Dự án</option>
              <option value="personal">Tài khoản Cá nhân / Thủ quỹ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid danh sách thẻ tài khoản ngân hàng */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Chưa có tài khoản ngân hàng nào</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy bấm nút <strong>"+ Thêm Tài Khoản Ngân Hàng"</strong> ở góc trên để thêm tài khoản giao dịch cho công ty Phúc Nguyên M&amp;E.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm Tài Khoản Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const style = getBankStyle(acc.bankName);
            const isCopied = copiedId === acc.id;

            return (
              <div
                key={acc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col hover:shadow-md transition-all group"
              >
                {/* Thẻ mô phỏng ATM Card sang trọng */}
                <div className={`p-4 bg-gradient-to-br ${style.bgGradient} text-white relative flex flex-col justify-between min-h-[170px]`}>
                  {/* Họa tiết trang trí */}
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/5 rounded-l-full pointer-events-none"></div>

                  {/* Header thẻ */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-amber-300" />
                      <div>
                        <div className="text-sm font-black tracking-wider uppercase drop-shadow-xs">{acc.bankName}</div>
                        <div className="text-[10px] text-white/75 truncate max-w-[180px]">{acc.branch || 'Ngân hàng Việt Nam'}</div>
                      </div>
                    </div>

                    {acc.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-950 font-black text-[10px] uppercase shadow-xs">
                        Mặc định
                      </span>
                    )}
                  </div>

                  {/* Số tài khoản nổi bật */}
                  <div className="my-2 relative z-10">
                    <div className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">Số tài khoản</div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="font-mono text-lg font-black tracking-widest text-white drop-shadow-sm">
                        {acc.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyAccountNumber(acc.accountNumber, acc.id)}
                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer"
                        title="Sao chép số tài khoản"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Footer thẻ: Chủ tài khoản & Loại */}
                  <div className="flex items-end justify-between relative z-10 border-t border-white/10 pt-2">
                    <div className="truncate pr-2">
                      <div className="text-[9.5px] text-white/70 uppercase tracking-wider">Chủ tài khoản</div>
                      <div className="font-bold text-xs uppercase tracking-wide truncate">{acc.accountHolder}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/15 font-semibold shrink-0">
                      {acc.accountType === 'company' ? 'Công Ty' : (acc.accountType === 'project' ? 'Dự Án' : 'Thủ Quỹ Site')}
                    </span>
                  </div>
                </div>

                {/* Thông tin chi tiết & Hành động phía dưới thẻ */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-slate-50/50">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Số dư theo dõi:</span>
                      <span className="font-bold font-mono text-indigo-700 text-sm">
                        {formatVND(acc.currentBalance || acc.initialBalance || 0)}
                      </span>
                    </div>

                    {acc.branch && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Chi nhánh:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">{acc.branch}</span>
                      </div>
                    )}

                    {acc.notes && (
                      <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200 mt-1 italic">
                        "{acc.notes}"
                      </div>
                    )}
                  </div>

                  {/* Nút sửa / xóa */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>

                    {onDeleteBankAccount && (
                      <button
                        type="button"
                        onClick={() => handleDelete(acc)}
                        className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA TÀI KHOẢN NGÂN HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base">
                    {editingAccount ? 'Chỉnh Sửa Tài Khoản Ngân Hàng' : 'Thêm Mới Tài Khoản Ngân Hàng'}
                  </h4>
                  <p className="text-[11px] text-indigo-100">
                    Lưu vào cơ sở dữ liệu Supabase (bảng <code>bank_accounts</code>)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Ngân hàng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngân hàng phát hành <span className="text-red-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} - {b.fullName}
                    </option>
                  ))}
                </select>
                {bankName === 'Khác...' && (
                  <input
                    type="text"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Nhập tên ngân hàng (VD: Shinhan Bank, Woori Bank...)"
                    className="w-full px-3 py-2 mt-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                )}
              </div>

              {/* Số tài khoản */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tài khoản (STK) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 0071001234567"
                  className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Tên chủ tài khoản */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên chủ tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="CÔNG TY TNHH PHÚC NGUYÊN M&E"
                  className="w-full px-3 py-2 text-xs uppercase font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Chi nhánh & Loại TK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chi nhánh</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="VD: CN Tân Bình, TP.HCM"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại tài khoản</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="company">Tài khoản Công Ty</option>
                    <option value="project">Tài khoản Dự Án</option>
                    <option value="personal">Tài khoản Cá Nhân / Thủ Quỹ</option>
                    <option value="cash">Tiền mặt tại quỹ</option>
                  </select>
                </div>
              </div>

              {/* Số dư ban đầu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số dư theo dõi (VNĐ)</label>
                <input
                  type="number"
                  value={initialBalance || ''}
                  onChange={(e) => setInitialBalance(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                  Hiển thị: {formatVND(initialBalance)}
                </span>
              </div>

              {/* Checkbox Mặc định */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultAcc"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="isDefaultAcc" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Đặt làm tài khoản giao dịch chính (Mặc định)
                </label>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú mục đích sử dụng</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về mục đích chi trả, hạn mức, v.v..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                >
                  {editingAccount ? 'Lưu Thay Đổi' : 'Lưu Tài Khoản Vào Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MÃ SQL TẠO BẢNG SUPABASE */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base">
                    Mã SQL Khởi Tạo Bảng Supabase: Khách Hàng &amp; Tài Khoản Ngân Hàng
                  </h4>
                  <p className="text-[11px] text-emerald-100">
                    Tạo bảng <code>client</code> và <code>bank_accounts</code> chỉ với 1 click
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Tab chọn kịch bản SQL */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setSqlTab('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sqlTab === 'both' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cả 2 Bảng (Khách Hàng + Ngân Hàng)
                </button>
                <button
                  type="button"
                  onClick={() => setSqlTab('bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sqlTab === 'bank' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Chỉ Bảng bank_accounts
                </button>
                <button
                  type="button"
                  onClick={() => setSqlTab('client')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sqlTab === 'client' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Chỉ Bảng client
                </button>
              </div>

              {/* 3 Bước thực hiện */}
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3 Bước chạy mã SQL trên Supabase Dashboard của bạn:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11.5px] text-slate-700">
                  <li>Bấm nút <strong>"Sao Chép Mã SQL"</strong> màu xanh bên dưới.</li>
                  <li>Mở Supabase Dashboard, nhấn vào biểu tượng <strong>SQL Editor</strong> (icon <code>&gt;_</code> ở menu bên trái).</li>
                  <li>Bấm <strong>"New Query"</strong>, Dán (Ctrl + V) và nhấn <strong>Run</strong> (hoặc nhấn Ctrl + Enter). Xong 100%!</li>
                </ol>
              </div>

              {/* Hộp mã code */}
              <div className="relative">
                <div className="flex items-center justify-between pb-1 text-xs text-slate-500 font-semibold">
                  <span>Kịch bản SQL PostgreSQL:</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Đã sao chép vào Clipboard!' : 'Sao Chép Mã SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
                  {sqlTab === 'both' ? CLIENT_AND_BANK_SQL : (sqlTab === 'bank' ? BANK_ACCOUNTS_TABLE_SQL : CLIENT_AND_BANK_SQL)}
                </pre>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={checkSupabase}
                  disabled={isCheckingSupabase}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
                  <span>Kiểm tra lại kết nối Supabase</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa tài khoản */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Xác Nhận Xóa Tài Khoản</h4>
                <p className="text-xs text-slate-500">Thao tác này sẽ xóa khỏi hệ thống và Supabase</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <div>Ngân hàng: <strong>{accountToDelete.bankName}</strong></div>
              <div>Số tài khoản: <strong className="font-mono">{accountToDelete.accountNumber}</strong></div>
              <div>Chủ tài khoản: <strong>{accountToDelete.accountHolder}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-xs"
              >
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
