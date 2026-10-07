import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { ExpenseItem, Project, Supplier, User, MaterialItem, Customer, BankAccount } from '../types';

export const CLIENT_TABLE_SQL = `-- ================================================================
-- TẠO BẢNG KHÁCH HÀNG & CHỦ ĐẦU TƯ (CLIENT & CLIENTS) TRÊN SUPABASE
-- Hệ thống M&E Phúc Nguyên - Quản lý Khách Hàng / Chủ Đầu Tư
-- ================================================================

-- 1. BẢNG CLIENT (Chính xác theo tên bảng 'client' bạn yêu cầu)
CREATE TABLE IF NOT EXISTS public.client (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_name TEXT,
    tax_code TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_client_code ON public.client(code);
CREATE INDEX IF NOT EXISTS idx_client_name ON public.client(name);

ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Client" ON public.client;
CREATE POLICY "Allow All Client" ON public.client FOR ALL USING (true) WITH CHECK (true);

-- 2. BẢNG CLIENTS (Đồng thời tạo bảng clients để tương thích 100%)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_name TEXT,
    tax_code TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clients_code ON public.clients(code);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Clients" ON public.clients;
CREATE POLICY "Allow All Clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Tự động đồng bộ 2 chiều giữa bảng client và clients
CREATE OR REPLACE FUNCTION sync_client_to_clients()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.clients (id, code, name, short_name, tax_code, phone, email, address, contact_person, notes, created_at, updated_at)
  VALUES (NEW.id, NEW.code, NEW.name, NEW.short_name, NEW.tax_code, NEW.phone, NEW.email, NEW.address, NEW.contact_person, NEW.notes, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    tax_code = EXCLUDED.tax_code,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    contact_person = EXCLUDED.contact_person,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_client_to_clients ON public.client;
CREATE TRIGGER trg_sync_client_to_clients
AFTER INSERT OR UPDATE ON public.client
FOR EACH ROW EXECUTE FUNCTION sync_client_to_clients();

-- 3. KÍCH HOẠT REALTIME ĐỒNG BỘ TỰ ĐỘNG
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'client') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'clients') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  END IF;
END $$;

-- 4. THÊM DỮ LIỆU MẪU BAN ĐẦU VÀO CẢ 2 BẢNG CLIENT & CLIENTS
INSERT INTO public.client (id, code, name, short_name, tax_code, phone, email, address, contact_person, notes)
VALUES
    ('kh-002', 'KH-002', 'Công Ty TNHH Tialoc Việt Nam', 'Tialoc Việt Nam', '0310892299', '028.3822.8899', 'contact@tialoc.com.vn', 'Số 68 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Mr. David Wong (Giám đốc Dự án Coherent)', 'Khách hàng FDI chủ đầu tư chuỗi nhà xưởng công nghệ cao VSIP 3'),
    ('kh-001', 'KH-001', 'Tập đoàn Bất động sản Thịnh Vượng', 'Thịnh Vượng Corp', '0308765432', '028.3999.8888', 'contact@thinhvuong.vn', 'Quận 2, TP. Thủ Đức, TP.HCM', 'Anh Trần Hùng (Ban Quản Lý Dự Án M&E)', 'Chủ đầu tư tổ hợp trung tâm thương mại & căn hộ Landmark'),
    ('kh-003', 'KH-003', 'Công ty Cổ phần Công Nghiệp Sài Gòn', 'Sài Gòn Industry', '3701234567', '0274.3888.777', 'info@saigonindustry.com', 'KCN VSIP II, Bến Cát, Bình Dương', 'Chị Mai (Trưởng phòng Mua hàng Nhà xưởng)', 'Tổng thầu nhà xưởng may mặc và linh kiện cơ khí'),
    ('kh-004', 'KH-004', 'Tập đoàn Đầu tư & Phát triển Khang Điền', 'Khang Điền', '0303456789', '028.3740.1122', 'info@khangdien.com.vn', 'Khu dân cư cao cấp Riverfront City, Quận 9, TP.HCM', 'Anh Nam (Chỉ huy trưởng MEP CĐT)', 'Dự án biệt thự ven sông và hạ tầng cáp ngầm')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, code, name, short_name, tax_code, phone, email, address, contact_person, notes)
VALUES
    ('kh-002', 'KH-002', 'Công Ty TNHH Tialoc Việt Nam', 'Tialoc Việt Nam', '0310892299', '028.3822.8899', 'contact@tialoc.com.vn', 'Số 68 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Mr. David Wong (Giám đốc Dự án Coherent)', 'Khách hàng FDI chủ đầu tư chuỗi nhà xưởng công nghệ cao VSIP 3'),
    ('kh-001', 'KH-001', 'Tập đoàn Bất động sản Thịnh Vượng', 'Thịnh Vượng Corp', '0308765432', '028.3999.8888', 'contact@thinhvuong.vn', 'Quận 2, TP. Thủ Đức, TP.HCM', 'Anh Trần Hùng (Ban Quản Lý Dự Án M&E)', 'Chủ đầu tư tổ hợp trung tâm thương mại & căn hộ Landmark'),
    ('kh-003', 'KH-003', 'Công ty Cổ phần Công Nghiệp Sài Gòn', 'Sài Gòn Industry', '3701234567', '0274.3888.777', 'info@saigonindustry.com', 'KCN VSIP II, Bến Cát, Bình Dương', 'Chị Mai (Trưởng phòng Mua hàng Nhà xưởng)', 'Tổng thầu nhà xưởng may mặc và linh kiện cơ khí'),
    ('kh-004', 'KH-004', 'Tập đoàn Đầu tư & Phát triển Khang Điền', 'Khang Điền', '0303456789', '028.3740.1122', 'info@khangdien.com.vn', 'Khu dân cư cao cấp Riverfront City, Quận 9, TP.HCM', 'Anh Nam (Chỉ huy trưởng MEP CĐT)', 'Dự án biệt thự ven sông và hạ tầng cáp ngầm')
ON CONFLICT (id) DO NOTHING;`;

export const BANK_ACCOUNTS_TABLE_SQL = `-- ================================================================
-- TẠO BẢNG TÀI KHOẢN NGÂN HÀNG (BANK_ACCOUNTS) TRÊN SUPABASE
-- Hệ thống M&E Phúc Nguyên - Quản lý Danh Sách Tài Khoản Ngân Hàng
-- ================================================================

-- 1. BẢNG BANK_ACCOUNTS (Số nhiều tiêu chuẩn)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id TEXT PRIMARY KEY,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL UNIQUE,
    account_holder TEXT NOT NULL,
    branch TEXT,
    account_type TEXT DEFAULT 'company' CHECK (account_type IN ('company', 'project', 'personal', 'cash')),
    initial_balance BIGINT DEFAULT 0,
    current_balance BIGINT DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG BANK_ACCOUNT (Số ít tương thích 100%)
CREATE TABLE IF NOT EXISTS public.bank_account (
    id TEXT PRIMARY KEY,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL UNIQUE,
    account_holder TEXT NOT NULL,
    branch TEXT,
    account_type TEXT DEFAULT 'company' CHECK (account_type IN ('company', 'project', 'personal', 'cash')),
    initial_balance BIGINT DEFAULT 0,
    current_balance BIGINT DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_number ON public.bank_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_name ON public.bank_accounts(bank_name);
CREATE INDEX IF NOT EXISTS idx_bank_account_number ON public.bank_account(account_number);

-- Cấp toàn quyền RLS đọc, ghi, sửa, xóa
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Bank Accounts" ON public.bank_accounts;
CREATE POLICY "Allow All Bank Accounts" ON public.bank_accounts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.bank_account ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Bank Account" ON public.bank_account;
CREATE POLICY "Allow All Bank Account" ON public.bank_account FOR ALL USING (true) WITH CHECK (true);

-- Tự động đồng bộ 2 chiều giữa bank_account và bank_accounts
CREATE OR REPLACE FUNCTION sync_bank_account_to_accounts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.bank_accounts (id, bank_name, account_number, account_holder, branch, account_type, initial_balance, current_balance, is_default, status, notes, created_at, updated_at)
  VALUES (NEW.id, NEW.bank_name, NEW.account_number, NEW.account_holder, NEW.branch, NEW.account_type, NEW.initial_balance, NEW.current_balance, NEW.is_default, NEW.status, NEW.notes, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    bank_name = EXCLUDED.bank_name,
    account_number = EXCLUDED.account_number,
    account_holder = EXCLUDED.account_holder,
    branch = EXCLUDED.branch,
    account_type = EXCLUDED.account_type,
    initial_balance = EXCLUDED.initial_balance,
    current_balance = EXCLUDED.current_balance,
    is_default = EXCLUDED.is_default,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bank_account_to_accounts ON public.bank_account;
CREATE TRIGGER trg_sync_bank_account_to_accounts
AFTER INSERT OR UPDATE ON public.bank_account
FOR EACH ROW EXECUTE FUNCTION sync_bank_account_to_accounts();

-- Kích hoạt Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bank_accounts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bank_account') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_account;
  END IF;
END $$;

-- Thêm dữ liệu mẫu tài khoản ngân hàng ban đầu
INSERT INTO public.bank_accounts (id, bank_name, account_number, account_holder, branch, account_type, initial_balance, current_balance, is_default, status, notes)
VALUES
    ('bank-01', 'Vietcombank', '0071001234567', 'CÔNG TY TNHH KỸ THUẬT CƠ ĐIỆN PHÚC NGUYÊN', 'Chi nhánh Tân Bình, TP. Hồ Chí Minh', 'company', 1500000000, 1500000000, true, 'active', 'Tài khoản chính thanh toán hợp đồng dự án và nhận tiền tạm ứng CĐT'),
    ('bank-02', 'Techcombank', '19036789123018', 'CÔNG TY TNHH KỸ THUẬT CƠ ĐIỆN PHÚC NGUYÊN', 'Chi nhánh Bình Dương', 'company', 850000000, 850000000, false, 'active', 'Tài khoản thanh toán nhà thầu phụ, đơn mua vật tư PO và chi phí site'),
    ('bank-03', 'MB Bank (Quân Đội)', '686899998888', 'Trần Anh Minh', 'Chi nhánh Sài Gòn', 'personal', 120000000, 120000000, false, 'active', 'Tài khoản quỹ tạm ứng hiện trường (Chỉ huy trưởng Trần Anh Minh)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bank_account (id, bank_name, account_number, account_holder, branch, account_type, initial_balance, current_balance, is_default, status, notes)
VALUES
    ('bank-01', 'Vietcombank', '0071001234567', 'CÔNG TY TNHH KỸ THUẬT CƠ ĐIỆN PHÚC NGUYÊN', 'Chi nhánh Tân Bình, TP. Hồ Chí Minh', 'company', 1500000000, 1500000000, true, 'active', 'Tài khoản chính thanh toán hợp đồng dự án và nhận tiền tạm ứng CĐT'),
    ('bank-02', 'Techcombank', '19036789123018', 'CÔNG TY TNHH KỸ THUẬT CƠ ĐIỆN PHÚC NGUYÊN', 'Chi nhánh Bình Dương', 'company', 850000000, 850000000, false, 'active', 'Tài khoản thanh toán nhà thầu phụ, đơn mua vật tư PO và chi phí site'),
    ('bank-03', 'MB Bank (Quân Đội)', '686899998888', 'Trần Anh Minh', 'Chi nhánh Sài Gòn', 'personal', 120000000, 120000000, false, 'active', 'Tài khoản quỹ tạm ứng hiện trường (Chỉ huy trưởng Trần Anh Minh)')
ON CONFLICT (id) DO NOTHING;`;

export const CLIENT_AND_BANK_SQL = `-- ================================================================
-- KỊCH BẢN TẠO CẢ 2 BẢNG: KHÁCH HÀNG (CLIENT) & TÀI KHOẢN NGÂN HÀNG (BANK_ACCOUNTS)
-- Hệ thống M&E Phúc Nguyên - Chạy trên Supabase SQL Editor
-- ================================================================

${CLIENT_TABLE_SQL}

${BANK_ACCOUNTS_TABLE_SQL}
`;

// ==============================================================
// EXPENSES SERVICE
// ==============================================================
// Row mapper
export function mapRowToExpense(row: any): ExpenseItem {
  let hasContract = Boolean(row.has_contract || row.hasContract || row.contract_number || row.contractNumber);
  let contractNumber = row.contract_number || row.contractNumber;
  let contractDate = row.contract_date || row.contractDate;
  let contractAdvanceAmount = typeof row.contract_advance_amount === 'number' ? row.contract_advance_amount : (typeof row.contractAdvanceAmount === 'number' ? row.contractAdvanceAmount : undefined);
  let contractAdvancePercentage = typeof row.contract_advance_percentage === 'number' ? row.contract_advance_percentage : (typeof row.contractAdvancePercentage === 'number' ? row.contractAdvancePercentage : undefined);
  let contractPaymentStages = row.contract_payment_stages || row.contractPaymentStages;
  let contractNotes = row.contract_notes || row.contractNotes;
  let contractFileUrl = row.contract_file_url || row.contractFileUrl;
  let cleanNotes = row.notes;

  // Extract embedded contract JSON comment from notes if available
  if (row.notes && typeof row.notes === 'string' && row.notes.includes('<!--CONTRACT_META:')) {
    try {
      const match = row.notes.match(/<!--CONTRACT_META:(.*?)-->/s);
      if (match && match[1]) {
        const meta = JSON.parse(match[1]);
        if (meta.hasContract !== undefined) hasContract = Boolean(meta.hasContract);
        if (meta.contractNumber) contractNumber = meta.contractNumber;
        if (meta.contractDate) contractDate = meta.contractDate;
        if (meta.contractFileUrl) contractFileUrl = meta.contractFileUrl;
        if (meta.contractAdvanceAmount !== undefined) contractAdvanceAmount = meta.contractAdvanceAmount;
        if (meta.contractAdvancePercentage !== undefined) contractAdvancePercentage = meta.contractAdvancePercentage;
        if (meta.contractPaymentStages) contractPaymentStages = meta.contractPaymentStages;
        if (meta.contractNotes) contractNotes = meta.contractNotes;
        cleanNotes = row.notes.replace(/<!--CONTRACT_META:.*?-->/s, '').trim();
      }
    } catch (e) {
      // ignore JSON parse error
    }
  }

  return {
    id: row.id,
    code: row.code,
    type: row.type,
    category: row.category,
    title: row.title,
    subDescription: row.sub_description || undefined,
    projectId: row.project_id || '',
    projectName: row.project_name || '',
    supplier: row.supplier || '',
    createdById: row.created_by_id || '',
    createdByName: row.created_by_name || '',
    createdByRole: row.created_by_role || '',
    date: row.date,
    amount: Number(row.amount || 0),
    vatRate: Number(row.vat_rate || 0),
    vatAmount: Number(row.vat_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    priority: row.priority || 'normal',
    status: row.status || 'pending',
    paymentMethod: row.payment_method || 'advance_fund',
    receiptImage: row.receipt_image || undefined,
    notes: cleanNotes || undefined,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,

    // Hợp đồng kinh tế
    hasContract: hasContract || Boolean(contractNumber),
    contractNumber: contractNumber || undefined,
    contractDate: contractDate || undefined,
    contractFileUrl: contractFileUrl || undefined,
    contractAdvanceAmount: contractAdvanceAmount,
    contractAdvancePercentage: contractAdvancePercentage,
    contractPaymentStages: Array.isArray(contractPaymentStages) ? contractPaymentStages : undefined,
    contractNotes: contractNotes || undefined,
  };
}

export async function fetchExpensesFromSupabase(): Promise<ExpenseItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch expenses error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map(mapRowToExpense);
  } catch (err) {
    console.error('Failed to load expenses from Supabase:', err);
    return null;
  }
}

export async function upsertExpenseToSupabase(item: ExpenseItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // Encode contract info into notes so it's guaranteed to persist across all database schemas
    let serializedNotes = item.notes ? item.notes.replace(/<!--CONTRACT_META:.*?-->/s, '').trim() : '';
    if (item.hasContract || item.contractNumber || item.contractFileUrl) {
      const contractMeta = {
        hasContract: Boolean(item.hasContract),
        contractNumber: item.contractNumber,
        contractDate: item.contractDate,
        contractFileUrl: item.contractFileUrl,
        contractAdvanceAmount: item.contractAdvanceAmount,
        contractAdvancePercentage: item.contractAdvancePercentage,
        contractPaymentStages: item.contractPaymentStages,
        contractNotes: item.contractNotes,
      };
      const metaComment = `<!--CONTRACT_META:${JSON.stringify(contractMeta)}-->`;
      serializedNotes = serializedNotes ? `${serializedNotes}\n${metaComment}` : metaComment;
    }

    const payload = {
      id: item.id,
      code: item.code,
      type: item.type,
      category: item.category,
      title: item.title,
      sub_description: item.subDescription || null,
      project_id: item.projectId || null,
      project_name: item.projectName,
      supplier: item.supplier,
      created_by_id: item.createdById,
      created_by_name: item.createdByName,
      created_by_role: item.createdByRole,
      date: item.date,
      amount: item.amount,
      vat_rate: item.vatRate,
      vat_amount: item.vatAmount,
      total_amount: item.totalAmount,
      priority: item.priority,
      status: item.status,
      payment_method: item.paymentMethod,
      receipt_image: item.receiptImage || null,
      notes: serializedNotes || null,
      approved_by: item.approvedBy || null,
      approved_at: item.approvedAt || null,
    };

    const { error } = await supabase.from('expenses').upsert(payload);
    if (error) {
      console.error('Supabase upsert expense error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to upsert expense:', err);
    return false;
  }
}

export async function deleteExpenseFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete expense error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete expense from Supabase:', err);
    return false;
  }
}

// ==============================================================
// REALTIME SUBSCRIPTION (ĐỒNG BỘ TỨC THỜI GIỮA CÁC MÁY TÍNH)
// ==============================================================
export function subscribeToExpensesRealtime(
  onInsert: (item: ExpenseItem) => void,
  onUpdate: (item: ExpenseItem) => void,
  onDelete: (id: string) => void
) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public-finance-realtime')
      // Lắng nghe bảng expenses (Đơn hàng PO)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.new) {
            onInsert(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.new) {
            onUpdate(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      // Lắng nghe bảng transactions (Phiếu Thu & Phiếu Chi tách biệt)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.new) {
            onInsert(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.new) {
            onUpdate(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to start Realtime subscription:', err);
    return () => {};
  }
}

// ==============================================================
// PROJECTS SERVICE
// ==============================================================
export async function fetchProjectsFromSupabase(): Promise<Project[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase fetch projects error:', error.message);
      return null;
    }

    return (data || []).map((row: any): Project => ({
      id: row.id,
      code: row.code,
      name: row.name,
      client: row.client || '',
      totalBudget: Number(row.total_budget || 0),
      totalRevenue: Number(row.total_revenue || 0),
      currentAdvance: Number(row.current_advance || 0),
      status: row.status || 'active',
      location: row.location || '',
      manager: row.manager || '',
    }));
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    return null;
  }
}

export async function upsertProjectToSupabase(project: Project): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: project.id,
      code: project.code,
      name: project.name,
      client: project.client,
      total_budget: project.totalBudget,
      total_revenue: project.totalRevenue,
      current_advance: project.currentAdvance,
      status: project.status,
      location: project.location,
      manager: project.manager,
    };

    const { error } = await supabase.from('projects').upsert(payload);
    return !error;
  } catch (err) {
    console.error('Failed to upsert project:', err);
    return false;
  }
}

export async function deleteProjectFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete project error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete project:', err);
    return false;
  }
}

// ==============================================================
// SUPPLIERS SERVICE
// ==============================================================
export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) {
      console.warn('Supabase fetch suppliers error:', error.message);
      return null;
    }

    return (data || []).map((row: any): Supplier => ({
      id: row.id,
      name: row.name,
      type: row.type || 'material',
      phone: row.phone || '',
      contactPerson: row.contact_person || '',
      address: row.address || '',
      unpaidBalance: Number(row.unpaid_balance || 0),
    }));
  } catch (err) {
    console.error('Failed to fetch suppliers:', err);
    return null;
  }
}

export async function upsertSupplierToSupabase(supplier: Supplier): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: supplier.id,
      name: supplier.name,
      type: supplier.type,
      phone: supplier.phone,
      contact_person: supplier.contactPerson,
      address: supplier.address,
      unpaid_balance: supplier.unpaidBalance,
    };

    const { error } = await supabase.from('suppliers').upsert(payload);
    return !error;
  } catch (err) {
    console.error('Failed to upsert supplier:', err);
    return false;
  }
}

export async function deleteSupplierFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete supplier error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete supplier:', err);
    return false;
  }
}

// ==============================================================
// CLIENTS / CUSTOMERS SERVICE (HỖ TRỢ CẢ BẢNG 'client' VÀ 'clients')
// ==============================================================

/**
 * Kiểm tra xem bảng 'client' hoặc 'clients' đã tồn tại trên Supabase hay chưa
 */
export async function checkClientTableOnSupabase(): Promise<{
  clientTableExists: boolean;
  clientsTableExists: boolean;
  activeTable: 'client' | 'clients' | null;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { clientTableExists: false, clientsTableExists: false, activeTable: null };

  let clientTableExists = false;
  let clientsTableExists = false;

  try {
    const { error: err1 } = await supabase.from('client').select('id', { head: true, count: 'exact' });
    if (!err1 || err1.code !== '42P01') {
      clientTableExists = true;
    }
  } catch (e) {}

  try {
    const { error: err2 } = await supabase.from('clients').select('id', { head: true, count: 'exact' });
    if (!err2 || err2.code !== '42P01') {
      clientsTableExists = true;
    }
  } catch (e) {}

  return {
    clientTableExists,
    clientsTableExists,
    activeTable: clientTableExists ? 'client' : (clientsTableExists ? 'clients' : null),
  };
}

export async function fetchClientsFromSupabase(): Promise<Customer[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const mapRows = (data: any[]): Customer[] =>
    (data || []).map((row: any): Customer => ({
      id: row.id,
      code: row.code || `KH-${row.id}`,
      name: row.name,
      shortName: row.short_name || row.shortName || undefined,
      taxCode: row.tax_code || row.taxCode || undefined,
      phone: row.phone || undefined,
      email: row.email || undefined,
      address: row.address || undefined,
      contactPerson: row.contact_person || row.contactPerson || undefined,
      notes: row.notes || undefined,
    }));

  // 1. Thử lấy từ bảng 'client' trước (chính xác theo yêu cầu người dùng)
  try {
    const { data: dataClient, error: errClient } = await supabase.from('client').select('*');
    if (!errClient && dataClient && dataClient.length > 0) {
      return mapRows(dataClient);
    }
    // Nếu bảng client tồn tại nhưng chưa có dòng nào, thử kiểm tra clients
    if (!errClient && dataClient && dataClient.length === 0) {
      const { data: dataClients, error: errClients } = await supabase.from('clients').select('*');
      if (!errClients && dataClients && dataClients.length > 0) {
        return mapRows(dataClients);
      }
      return [];
    }
  } catch (err) {}

  // 2. Dự phòng: Thử lấy từ bảng 'clients'
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (!error && data) {
      return mapRows(data);
    }
    if (error && error.code === '42P01') {
      console.warn('Cả hai bảng public.client và public.clients chưa được tạo trên Supabase.');
      return null;
    }
    if (error) {
      console.warn('Supabase fetch clients error:', error.message);
      return null;
    }
  } catch (err) {
    console.error('Failed to fetch clients:', err);
    return null;
  }

  return null;
}

export async function upsertClientToSupabase(client: Customer): Promise<{
  success: boolean;
  tableMissing?: boolean;
  error?: string;
  tableUsed?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa cấu hình Supabase' };

  const payload = {
    id: client.id,
    code: client.code,
    name: client.name,
    short_name: client.shortName || null,
    tax_code: client.taxCode || null,
    phone: client.phone || null,
    email: client.email || null,
    address: client.address || null,
    contact_person: client.contactPerson || null,
    notes: client.notes || null,
    updated_at: new Date().toISOString(),
  };

  let savedTable: string | null = null;
  let clientTableMissing = false;
  let clientsTableMissing = false;
  let lastError: string | undefined;

  // 1. Lưu vào bảng 'client' trước (chính xác theo yêu cầu người dùng)
  try {
    const { error: err1 } = await supabase.from('client').upsert(payload);
    if (!err1) {
      savedTable = 'client';
    } else if (err1.code === '42P01') {
      clientTableMissing = true;
    } else {
      lastError = err1.message;
      console.warn('Supabase upsert into table client error:', err1.message);
    }
  } catch (e: any) {
    lastError = e?.message || String(e);
  }

  // 2. Đồng bộ tiếp vào bảng 'clients' (nếu có để đồng nhất dữ liệu)
  try {
    const { error: err2 } = await supabase.from('clients').upsert(payload);
    if (!err2) {
      savedTable = savedTable ? `${savedTable} & clients` : 'clients';
    } else if (err2.code === '42P01') {
      clientsTableMissing = true;
    } else if (!savedTable) {
      lastError = err2.message;
      console.warn('Supabase upsert into table clients error:', err2.message);
    }
  } catch (e: any) {
    if (!savedTable) lastError = e?.message || String(e);
  }

  if (savedTable) {
    return { success: true, tableUsed: savedTable };
  }

  if (clientTableMissing && clientsTableMissing) {
    console.warn('Cả hai bảng public.client và public.clients đều chưa tồn tại trên Supabase.');
    return {
      success: false,
      tableMissing: true,
      error: 'Bảng client chưa được tạo trên Supabase. Hãy chạy mã SQL tạo bảng client.',
    };
  }

  return { success: false, error: lastError || 'Lỗi khi lưu thông tin khách hàng' };
}

export async function deleteClientFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  let success = false;
  try {
    const { error: err1 } = await supabase.from('client').delete().eq('id', id);
    if (!err1) success = true;
  } catch (err) {}

  try {
    const { error: err2 } = await supabase.from('clients').delete().eq('id', id);
    if (!err2) success = true;
  } catch (err) {}

  return success;
}

export function subscribeToClientsRealtime(
  onInsert?: (client: Customer) => void,
  onUpdate?: (client: Customer) => void,
  onDelete?: (id: string) => void
) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const mapRow = (row: any): Customer => ({
    id: row.id,
    code: row.code,
    name: row.name,
    shortName: row.short_name || undefined,
    taxCode: row.tax_code || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    contactPerson: row.contact_person || undefined,
    notes: row.notes || undefined,
  });

  // Đăng ký realtime cho bảng client
  const channelClient = supabase
    .channel('public:client:realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client' }, (p) => {
      if (onInsert && p.new) onInsert(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'client' }, (p) => {
      if (onUpdate && p.new) onUpdate(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'client' }, (p) => {
      if (onDelete && p.old) onDelete(p.old.id);
    })
    .subscribe();

  // Đăng ký realtime cho bảng clients
  const channelClients = supabase
    .channel('public:clients:realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, (p) => {
      if (onInsert && p.new) onInsert(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, (p) => {
      if (onUpdate && p.new) onUpdate(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, (p) => {
      if (onDelete && p.old) onDelete(p.old.id);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channelClient);
    supabase.removeChannel(channelClients);
  };
}

// ==============================================================
// BANK ACCOUNTS SERVICE (HỖ TRỢ CẢ BẢNG 'bank_accounts' VÀ 'bank_account')
// ==============================================================

/**
 * Kiểm tra xem bảng 'bank_accounts' hoặc 'bank_account' đã tồn tại trên Supabase hay chưa
 */
export async function checkBankAccountsTableOnSupabase(): Promise<{
  bankAccountsTableExists: boolean;
  bankAccountTableExists: boolean;
  activeTable: 'bank_accounts' | 'bank_account' | null;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { bankAccountsTableExists: false, bankAccountTableExists: false, activeTable: null };

  let bankAccountsTableExists = false;
  let bankAccountTableExists = false;

  try {
    const { error: err1 } = await supabase.from('bank_accounts').select('id', { head: true, count: 'exact' });
    if (!err1 || err1.code !== '42P01') {
      bankAccountsTableExists = true;
    }
  } catch (e) {}

  try {
    const { error: err2 } = await supabase.from('bank_account').select('id', { head: true, count: 'exact' });
    if (!err2 || err2.code !== '42P01') {
      bankAccountTableExists = true;
    }
  } catch (e) {}

  return {
    bankAccountsTableExists,
    bankAccountTableExists,
    activeTable: bankAccountsTableExists ? 'bank_accounts' : (bankAccountTableExists ? 'bank_account' : null),
  };
}

export async function fetchBankAccountsFromSupabase(): Promise<BankAccount[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const mapRows = (data: any[]): BankAccount[] =>
    (data || []).map((row: any): BankAccount => ({
      id: row.id,
      bankName: row.bank_name || row.bankName || '',
      accountNumber: row.account_number || row.accountNumber || '',
      accountHolder: row.account_holder || row.accountHolder || '',
      branch: row.branch || undefined,
      accountType: (row.account_type || row.accountType || 'company') as any,
      initialBalance: Number(row.initial_balance || row.initialBalance || 0),
      currentBalance: Number(row.current_balance || row.currentBalance || row.initial_balance || 0),
      isDefault: Boolean(row.is_default || row.isDefault),
      status: (row.status || 'active') as any,
      notes: row.notes || undefined,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
    }));

  // 1. Thử lấy từ bảng 'bank_accounts'
  try {
    const { data: dataAccounts, error: errAccounts } = await supabase.from('bank_accounts').select('*');
    if (!errAccounts && dataAccounts && dataAccounts.length > 0) {
      return mapRows(dataAccounts);
    }
    if (!errAccounts && dataAccounts && dataAccounts.length === 0) {
      // Nếu có bảng nhưng chưa có dữ liệu, thử xem bank_account
      const { data: dataAccount, error: errAccount } = await supabase.from('bank_account').select('*');
      if (!errAccount && dataAccount && dataAccount.length > 0) {
        return mapRows(dataAccount);
      }
      return [];
    }
  } catch (err) {}

  // 2. Dự phòng: Thử lấy từ bảng 'bank_account'
  try {
    const { data, error } = await supabase.from('bank_account').select('*');
    if (!error && data) {
      return mapRows(data);
    }
    if (error && error.code === '42P01') {
      console.warn('Cả hai bảng public.bank_accounts và public.bank_account chưa được tạo trên Supabase.');
      return null;
    }
    if (error) {
      console.warn('Supabase fetch bank accounts error:', error.message);
      return null;
    }
  } catch (err) {
    console.error('Failed to fetch bank accounts:', err);
    return null;
  }

  return null;
}

export async function upsertBankAccountToSupabase(item: BankAccount): Promise<{
  success: boolean;
  tableMissing?: boolean;
  error?: string;
  tableUsed?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa cấu hình Supabase' };

  const payload = {
    id: item.id,
    bank_name: item.bankName,
    account_number: item.accountNumber,
    account_holder: item.accountHolder,
    branch: item.branch || null,
    account_type: item.accountType || 'company',
    initial_balance: item.initialBalance || 0,
    current_balance: item.currentBalance !== undefined ? item.currentBalance : (item.initialBalance || 0),
    is_default: Boolean(item.isDefault),
    status: item.status || 'active',
    notes: item.notes || null,
    updated_at: new Date().toISOString(),
  };

  let savedTable: string | null = null;
  let bankAccountsTableMissing = false;
  let bankAccountTableMissing = false;
  let lastError: string | undefined;

  // 1. Lưu vào bảng 'bank_accounts'
  try {
    const { error: err1 } = await supabase.from('bank_accounts').upsert(payload);
    if (!err1) {
      savedTable = 'bank_accounts';
    } else if (err1.code === '42P01') {
      bankAccountsTableMissing = true;
    } else {
      lastError = err1.message;
      console.warn('Supabase upsert into bank_accounts error:', err1.message);
    }
  } catch (e: any) {
    lastError = e?.message || String(e);
  }

  // 2. Đồng bộ tiếp vào bảng 'bank_account' (nếu có)
  try {
    const { error: err2 } = await supabase.from('bank_account').upsert(payload);
    if (!err2) {
      savedTable = savedTable ? `${savedTable} & bank_account` : 'bank_account';
    } else if (err2.code === '42P01') {
      bankAccountTableMissing = true;
    } else if (!savedTable) {
      lastError = err2.message;
      console.warn('Supabase upsert into bank_account error:', err2.message);
    }
  } catch (e: any) {
    if (!savedTable) lastError = e?.message || String(e);
  }

  if (savedTable) {
    return { success: true, tableUsed: savedTable };
  }

  if (bankAccountsTableMissing && bankAccountTableMissing) {
    console.warn('Cả hai bảng public.bank_accounts và public.bank_account đều chưa tồn tại trên Supabase.');
    return {
      success: false,
      tableMissing: true,
      error: 'Bảng bank_accounts chưa được tạo trên Supabase. Hãy chạy mã SQL tạo bảng bank_accounts.',
    };
  }

  return { success: false, error: lastError || 'Lỗi khi lưu thông tin tài khoản ngân hàng' };
}

export async function deleteBankAccountFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  let success = false;
  try {
    const { error: err1 } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (!err1) success = true;
  } catch (err) {}

  try {
    const { error: err2 } = await supabase.from('bank_account').delete().eq('id', id);
    if (!err2) success = true;
  } catch (err) {}

  return success;
}

export function subscribeToBankAccountsRealtime(
  onInsert?: (account: BankAccount) => void,
  onUpdate?: (account: BankAccount) => void,
  onDelete?: (id: string) => void
) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const mapRow = (row: any): BankAccount => ({
    id: row.id,
    bankName: row.bank_name || row.bankName || '',
    accountNumber: row.account_number || row.accountNumber || '',
    accountHolder: row.account_holder || row.accountHolder || '',
    branch: row.branch || undefined,
    accountType: (row.account_type || row.accountType || 'company') as any,
    initialBalance: Number(row.initial_balance || row.initialBalance || 0),
    currentBalance: Number(row.current_balance || row.currentBalance || row.initial_balance || 0),
    isDefault: Boolean(row.is_default || row.isDefault),
    status: (row.status || 'active') as any,
    notes: row.notes || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  });

  const channelAccounts = supabase
    .channel('public:bank_accounts:realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bank_accounts' }, (p) => {
      if (onInsert && p.new) onInsert(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bank_accounts' }, (p) => {
      if (onUpdate && p.new) onUpdate(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bank_accounts' }, (p) => {
      if (onDelete && p.old) onDelete(p.old.id);
    })
    .subscribe();

  const channelAccount = supabase
    .channel('public:bank_account:realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bank_account' }, (p) => {
      if (onInsert && p.new) onInsert(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bank_account' }, (p) => {
      if (onUpdate && p.new) onUpdate(mapRow(p.new));
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bank_account' }, (p) => {
      if (onDelete && p.old) onDelete(p.old.id);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channelAccounts);
    supabase.removeChannel(channelAccount);
  };
}

// ==============================================================
// USERS SERVICE
// ==============================================================
export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('site_users').select('*');
    if (error) {
      console.warn('Supabase fetch users error:', error.message);
      return null;
    }

    return (data || []).map((row: any): User => {
      const isMinh = row.id === 'u-1' || (row.name && row.name.toLowerCase().includes('trần anh minh')) || row.username === 'Pncons';
      return {
        id: row.id,
        name: row.name,
        email: row.email || '',
        username: row.username || (isMinh ? 'Pncons' : ''),
        password: row.password || (isMinh ? 'Minhatea1987@' : ''),
        role: row.role || 'site_engineer',
        roleTitle: row.role_title || '',
        siteName: row.site_name || '',
        monthlyLimit: Number(row.monthly_limit || 50000000),
        pin: row.pin || '1234',
        phone: row.phone || '',
        avatarColor: row.avatar_color || 'bg-sky-600',
        isAuthorized: row.is_authorized !== undefined ? Boolean(row.is_authorized) : isMinh,
        permissions: row.permissions || undefined,
      };
    });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return null;
  }
}

export async function upsertUserToSupabase(user: User): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      role_title: user.roleTitle,
      site_name: user.siteName,
      monthly_limit: user.monthlyLimit,
      pin: user.pin,
      phone: user.phone,
      avatar_color: user.avatarColor,
      is_authorized: user.isAuthorized,
      username: user.username,
      password: user.password,
      permissions: user.permissions,
    };

    const { error } = await supabase.from('site_users').upsert(payload);
    return !error;
  } catch (err) {
    console.error('Failed to upsert user:', err);
    return false;
  }
}

// ==============================================================
// MATERIALS SERVICE
// ==============================================================
export function mapRowToMaterial(row: any): MaterialItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category || 'fire_protection',
    subCategory: row.sub_category || undefined,
    unit: row.unit || 'Cái',
    unitPrice: row.unit_price !== null && row.unit_price !== undefined ? Number(row.unit_price) : undefined,
    vatRate: row.vat_rate !== null && row.vat_rate !== undefined ? Number(row.vat_rate) : 10,
    stockQuantity: Number(row.stock_quantity || 0),
    minStock: Number(row.min_stock || 10),
    warehouseLocation: row.warehouse_location || 'Kho Tổng Dĩ An (Bình Dương)',
    shelfLocation: row.shelf_location || undefined,
    brand: row.brand || undefined,
    supplier: row.supplier || undefined,
    catalogueUrl: row.catalogue_url || undefined,
    specifications: row.specifications || undefined,
    imageUrl: row.image_url || undefined,
  };
}

export async function fetchMaterialsFromSupabase(): Promise<MaterialItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.warn('Supabase fetch materials warning (có thể bảng materials chưa được tạo):', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(mapRowToMaterial);
  } catch (err) {
    console.error('Failed to load materials from Supabase:', err);
    return null;
  }
}

export async function upsertMaterialToSupabase(item: MaterialItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category || 'fire_protection',
      sub_category: item.subCategory || null,
      unit: item.unit,
      unit_price: item.unitPrice !== undefined ? item.unitPrice : null,
      vat_rate: item.vatRate !== undefined ? item.vatRate : 10,
      stock_quantity: item.stockQuantity,
      min_stock: item.minStock !== undefined ? item.minStock : 10,
      warehouse_location: item.warehouseLocation || 'Kho Tổng Dĩ An (Bình Dương)',
      shelf_location: item.shelfLocation || null,
      brand: item.brand || null,
      supplier: item.supplier || null,
      catalogue_url: item.catalogueUrl || null,
      specifications: item.specifications || null,
      image_url: item.imageUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('materials').upsert(payload);
    if (error) {
      console.error('Supabase upsert material error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to upsert material:', err);
    return false;
  }
}

export async function deleteMaterialFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete material error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete material:', err);
    return false;
  }
}

// ==============================================================
// TRANSACTIONS SERVICE (BẢNG QUẢN LÝ THU - CHI)
// ==============================================================
export async function fetchTransactionsFromSupabase(): Promise<ExpenseItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch transactions error:', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(mapRowToExpense);
  } catch (err) {
    console.error('Failed to load transactions from Supabase:', err);
    return null;
  }
}

export async function upsertTransactionToSupabase(item: ExpenseItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: item.id,
      code: item.code,
      type: item.type === 'revenue' ? 'revenue' : 'expense',
      category: item.category || 'other',
      title: item.title,
      sub_description: item.subDescription || null,
      project_id: item.projectId || null,
      project_name: item.projectName || '',
      supplier: item.supplier || '',
      receiver_or_payer: item.receiverOrPayer || item.supplier || '',
      created_by_id: item.createdById || null,
      created_by_name: item.createdByName || '',
      created_by_role: item.createdByRole || '',
      date: item.date,
      amount: item.amount || item.totalAmount || 0,
      vat_rate: item.vatRate || 0,
      vat_amount: item.vatAmount || 0,
      total_amount: item.totalAmount || 0,
      priority: item.priority || 'normal',
      status: item.status || 'paid',
      payment_method: item.paymentMethod || 'transfer',
      bank_account: item.bankAccount || null,
      receipt_image: item.receiptImage || null,
      notes: item.notes || null,
      linked_po_id: item.linkedPoId || null,
      linked_po_code: item.linkedPoCode || null,
      approved_by: item.approvedBy || null,
      approved_at: item.approvedAt || null,
    };

    const { error } = await supabase.from('transactions').upsert(payload);
    if (error) {
      console.error('Supabase upsert transaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to upsert transaction:', err);
    return false;
  }
}

export async function deleteTransactionFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete transaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete transaction:', err);
    return false;
  }
}

// Helper xác định một bản ghi là Phiếu Thu / Phiếu Chi hay Đơn Hàng PO
export function isTransactionRecord(item: { type?: string; code?: string; id?: string }): boolean {
  if (!item) return false;
  if (item.type === 'revenue') return true;
  if (item.code) {
    const c = item.code.toUpperCase();
    if (c.startsWith('PT-') || c.startsWith('PC-') || c.startsWith('PNCO-') || c.includes('PC') || c.includes('PT')) return true;
  }
  if (item.id && (item.id.startsWith('pay-') || item.id.startsWith('rcp-') || item.id.startsWith('pt-') || item.id.startsWith('pc-'))) return true;
  return false;
}

// Lưu thông minh vào đúng bảng chuyên biệt: Phiếu thu chi -> transactions | Đơn hàng PO -> expenses
export async function saveRecordToAppropriateTable(item: ExpenseItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  if (isTransactionRecord(item)) {
    // 1. Lưu vào bảng transactions
    const ok = await upsertTransactionToSupabase(item);
    // 2. Tách sạch: Xóa khỏi bảng expenses nếu trước đây bị lưu nhầm vào expenses
    try {
      await supabase.from('expenses').delete().eq('id', item.id);
    } catch (e) {
      // ignore
    }
    return ok;
  } else {
    // 1. Lưu vào bảng expenses (Đơn hàng mua sắm vật tư PO)
    const ok = await upsertExpenseToSupabase(item);
    // 2. Xóa khỏi bảng transactions nếu có
    try {
      await supabase.from('transactions').delete().eq('id', item.id);
    } catch (e) {
      // ignore
    }
    return ok;
  }
}

// Xóa bản ghi ở đúng bảng chuyên biệt
export async function deleteRecordFromAppropriateTable(id: string, code?: string, type?: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const isTx = isTransactionRecord({ id, code, type });
  if (isTx) {
    const ok = await deleteTransactionFromSupabase(id);
    await deleteExpenseFromSupabase(id); // đảm bảo sạch cả 2 bảng
    return ok;
  } else {
    const ok = await deleteExpenseFromSupabase(id);
    await deleteTransactionFromSupabase(id);
    return ok;
  }
}

// Hàm tự động tách & dọn dẹp Phiếu Thu Chi ra khỏi bảng expenses trên Supabase
export async function separateAndCleanTransactionsOnSupabase(): Promise<{
  success: boolean;
  message: string;
  transferredCount: number;
  remainingOrdersCount: number;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình Supabase.', transferredCount: 0, remainingOrdersCount: 0 };
  }

  try {
    // 1. Đọc toàn bộ bản ghi hiện có trong bảng expenses
    const { data: allExpenses, error: fetchErr } = await supabase.from('expenses').select('*');
    if (fetchErr) {
      return { success: false, message: `Lỗi đọc bảng expenses: ${fetchErr.message}`, transferredCount: 0, remainingOrdersCount: 0 };
    }

    if (!allExpenses || allExpenses.length === 0) {
      return { success: true, message: 'Bảng expenses hiện tại chưa có dữ liệu.', transferredCount: 0, remainingOrdersCount: 0 };
    }

    // 2. Phân loại: Phiếu Thu/Chi vs Đơn Hàng PO
    const transactionRows = allExpenses.filter((row: any) => isTransactionRecord(row));
    const orderRows = allExpenses.filter((row: any) => !isTransactionRecord(row));

    // 3. Đẩy toàn bộ Phiếu Thu / Chi vào bảng transactions
    let transferred = 0;
    for (const row of transactionRows) {
      const item = mapRowToExpense(row);
      const ok = await upsertTransactionToSupabase(item);
      if (ok) transferred++;
    }

    // 4. Xóa toàn bộ Phiếu Thu / Chi ra khỏi bảng expenses để bảng expenses CHỈ CÒN ĐƠN HÀNG PO
    if (transactionRows.length > 0) {
      const idsToDelete = transactionRows.map((r: any) => r.id);
      for (let i = 0; i < idsToDelete.length; i += 40) {
        const chunk = idsToDelete.slice(i, i + 40);
        await supabase.from('expenses').delete().in('id', chunk);
      }
    }

    return {
      success: true,
      message: `Đã tách thành công ${transferred} phiếu thu & chi sang bảng 'transactions' và xóa sạch khỏi bảng 'expenses'. Bảng 'expenses' hiện chỉ còn ${orderRows.length} đơn hàng PO.`,
      transferredCount: transferred,
      remainingOrdersCount: orderRows.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi tách dữ liệu: ${err?.message || err}`,
      transferredCount: 0,
      remainingOrdersCount: 0,
    };
  }
}

// ==============================================================
// MIGRATE ALL LOCAL DATA TO SUPABASE (1-CLICK SYNC ĐÃ TÁCH BIỆT)
// ==============================================================
export async function syncAllLocalDataToSupabase(data: {
  projects: Project[];
  suppliers: Supplier[];
  users: User[];
  expenses: ExpenseItem[];
  materials?: MaterialItem[];
  customers?: Customer[];
  bankAccounts?: BankAccount[];
}): Promise<{ success: boolean; message: string; count: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình thông tin Supabase.', count: 0 };
  }

  try {
    let failedCount = 0;

    // 0. Clients / Khách hàng
    if (data.customers && data.customers.length > 0) {
      for (const c of data.customers) {
        const res = await upsertClientToSupabase(c);
        if (!res.success && !res.tableMissing) failedCount++;
      }
    }

    // 0.1 Bank Accounts / Tài khoản ngân hàng
    if (data.bankAccounts && data.bankAccounts.length > 0) {
      for (const b of data.bankAccounts) {
        const res = await upsertBankAccountToSupabase(b);
        if (!res.success && !res.tableMissing) failedCount++;
      }
    }

    // 1. Projects
    for (const p of data.projects) {
      const ok = await upsertProjectToSupabase(p);
      if (!ok) failedCount++;
    }

    // 2. Suppliers
    for (const s of data.suppliers) {
      const ok = await upsertSupplierToSupabase(s);
      if (!ok) failedCount++;
    }

    // 3. Users
    for (const u of data.users) {
      const ok = await upsertUserToSupabase(u);
      if (!ok) failedCount++;
    }

    // 4. Đơn hàng PO -> CHỈ LƯU VÀO BẢNG EXPENSES
    const orderList = data.expenses.filter((e) => !isTransactionRecord(e));
    for (const order of orderList) {
      const ok = await upsertExpenseToSupabase(order);
      if (!ok) failedCount++;
    }

    // 5. Phiếu Thu & Phiếu Chi -> CHỈ LƯU VÀO BẢNG TRANSACTIONS (VÀ XÓA KHỎI EXPENSES NẾU CÓ)
    const transactionList = data.expenses.filter((e) => isTransactionRecord(e));
    for (const tx of transactionList) {
      const ok = await upsertTransactionToSupabase(tx);
      if (!ok) console.warn('Could not sync to transactions table (may need schema update)');
      // Xóa khỏi bảng expenses để không bị combine
      try {
        await supabase.from('expenses').delete().eq('id', tx.id);
      } catch (e) {
        // ignore
      }
    }

    // 6. Materials (Vật tư thi công & sản phẩm)
    if (data.materials && data.materials.length > 0) {
      for (const m of data.materials) {
        const ok = await upsertMaterialToSupabase(m);
        if (!ok) failedCount++;
      }
    }

    if (failedCount > 0) {
      return {
        success: false,
        message: `Có ${failedCount} bản ghi không thể ghi vào Supabase. Vui lòng kiểm tra quyền RLS các bảng.`,
        count: (orderList.length + transactionList.length + (data.materials?.length || 0)) - failedCount,
      };
    }

    const matMsg = data.materials?.length ? `, ${data.materials.length} vật tư` : '';
    const txMsg = transactionList.length ? `, ${transactionList.length} phiếu thu chi (bảng transactions)` : '';
    return {
      success: true,
      message: `Đã đồng bộ tách biệt thành công: ${orderList.length} đơn hàng PO (bảng expenses)${txMsg}, ${data.projects.length} dự án${matMsg} lên Supabase!`,
      count: orderList.length + transactionList.length + (data.materials?.length || 0),
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi đồng bộ dữ liệu: ${err?.message || err}`,
      count: 0,
    };
  }
}
