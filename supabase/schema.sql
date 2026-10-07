-- ================================================================
-- HỆ THỐNG QUẢN LÝ TÀI CHÍNH & CHI TIÊU SITE - PHÚC NGUYÊN M&E
-- Supabase Database Schema & Seed Data
-- ================================================================

-- 1. BẢNG DỰ ÁN THI CÔNG (PROJECTS)
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    client TEXT,
    total_budget BIGINT DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    current_advance BIGINT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    location TEXT,
    manager TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG ĐỐI TÁC, NHÀ CUNG CẤP & ĐỘI XE CẨU (SUPPLIERS)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'material' CHECK (type IN ('material', 'transport', 'food', 'other')),
    phone TEXT,
    contact_person TEXT,
    address TEXT,
    unpaid_balance BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG NHÂN VIÊN & PHÂN QUYỀN (SITE_USERS)
CREATE TABLE IF NOT EXISTS public.site_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'site_engineer' CHECK (role IN ('director', 'accountant', 'supervisor', 'site_engineer')),
    role_title TEXT,
    site_name TEXT,
    monthly_limit BIGINT DEFAULT 50000000,
    pin TEXT DEFAULT '1234',
    phone TEXT,
    avatar_color TEXT DEFAULT 'bg-sky-600',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG KHOẢN CHI TIÊU & ĐƠN MUA HÀNG PO (EXPENSES)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    type TEXT DEFAULT 'expense' CHECK (type IN ('expense', 'po', 'advance', 'revenue')),
    category TEXT NOT NULL CHECK (category IN ('material', 'transport', 'overtime_meal', 'labor_sub', 'other')),
    title TEXT NOT NULL,
    sub_description TEXT,
    project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT,
    supplier TEXT,
    created_by_id TEXT,
    created_by_name TEXT,
    created_by_role TEXT,
    date DATE NOT NULL,
    amount BIGINT DEFAULT 0,
    vat_rate NUMERIC DEFAULT 10,
    vat_amount BIGINT DEFAULT 0,
    total_amount BIGINT DEFAULT 0,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    payment_method TEXT DEFAULT 'advance_fund' CHECK (payment_method IN ('cash', 'transfer', 'advance_fund')),
    receipt_image TEXT,
    notes TEXT,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. BẢNG DANH MỤC VẬT TƯ THI CÔNG & SẢN PHẨM M&E (MATERIALS)
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'fire_protection',
    sub_category TEXT,
    unit TEXT NOT NULL,
    unit_price BIGINT,
    vat_rate NUMERIC DEFAULT 10,
    stock_quantity NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 10,
    warehouse_location TEXT DEFAULT 'Kho Tổng Dĩ An (Bình Dương)',
    shelf_location TEXT,
    brand TEXT,
    supplier TEXT,
    catalogue_url TEXT,
    specifications TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. BẢNG SỔ NHẬT KÝ THU - CHI & DÒNG TIỀN (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    category TEXT NOT NULL CHECK (category IN ('material', 'transport', 'overtime_meal', 'labor_sub', 'client_advance', 'contract_payment', 'other')),
    title TEXT NOT NULL,
    sub_description TEXT,
    project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT,
    supplier TEXT,
    receiver_or_payer TEXT,
    created_by_id TEXT,
    created_by_name TEXT,
    created_by_role TEXT,
    date DATE NOT NULL,
    amount BIGINT DEFAULT 0,
    vat_rate NUMERIC DEFAULT 0,
    vat_amount BIGINT DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    status TEXT DEFAULT 'paid' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'rejected')),
    payment_method TEXT DEFAULT 'transfer' CHECK (payment_method IN ('cash', 'transfer', 'advance_fund')),
    bank_account TEXT,
    receipt_image TEXT,
    notes TEXT,
    linked_po_id TEXT,
    linked_po_code TEXT,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. BẢNG KHÁCH HÀNG & CHỦ ĐẦU TƯ (CLIENT & CLIENTS)
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

-- 8. BẢNG DANH SÁCH TÀI KHOẢN NGÂN HÀNG (BANK_ACCOUNTS & BANK_ACCOUNT)
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

-- TẠO CHỈ MỤC TĂNG TỐC ĐỘ TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON public.materials(code);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_transactions_code ON public.transactions(code);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_client_code ON public.client(code);
CREATE INDEX IF NOT EXISTS idx_client_name ON public.client(name);
CREATE INDEX IF NOT EXISTS idx_clients_code ON public.clients(code);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_number ON public.bank_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_name ON public.bank_accounts(bank_name);
CREATE INDEX IF NOT EXISTS idx_bank_account_number ON public.bank_account(account_number);

-- ================================================================
-- CẤU HÌNH BẢO MẬT & QUYỀN TRUY CẬP (TOÀN QUYỀN ĐỌC, GHI, SỬA, XÓA)
-- ================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_account ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ để tránh trùng lặp
DROP POLICY IF EXISTS "Public Read Projects" ON public.projects;
DROP POLICY IF EXISTS "Public Insert/Update Projects" ON public.projects;
DROP POLICY IF EXISTS "Allow All Projects" ON public.projects;
CREATE POLICY "Allow All Projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Public Insert/Update Suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow All Suppliers" ON public.suppliers;
CREATE POLICY "Allow All Suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Users" ON public.site_users;
DROP POLICY IF EXISTS "Public Insert/Update Users" ON public.site_users;
DROP POLICY IF EXISTS "Allow All Users" ON public.site_users;
CREATE POLICY "Allow All Users" ON public.site_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public Insert/Update Expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow All Expenses" ON public.expenses;
CREATE POLICY "Allow All Expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Materials" ON public.materials;
DROP POLICY IF EXISTS "Public Insert/Update Materials" ON public.materials;
DROP POLICY IF EXISTS "Allow All Materials" ON public.materials;
CREATE POLICY "Allow All Materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public Insert/Update Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow All Transactions" ON public.transactions;
CREATE POLICY "Allow All Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Clients" ON public.clients;
DROP POLICY IF EXISTS "Public Insert/Update Clients" ON public.clients;
DROP POLICY IF EXISTS "Allow All Clients" ON public.clients;
CREATE POLICY "Allow All Clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Client" ON public.client;
DROP POLICY IF EXISTS "Public Insert/Update Client" ON public.client;
DROP POLICY IF EXISTS "Allow All Client" ON public.client;
CREATE POLICY "Allow All Client" ON public.client FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Bank Accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Public Insert/Update Bank Accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Allow All Bank Accounts" ON public.bank_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Bank Account" ON public.bank_account;
DROP POLICY IF EXISTS "Public Insert/Update Bank Account" ON public.bank_account;
DROP POLICY IF EXISTS "Allow All Bank Account" ON public.bank_account FOR ALL USING (true) WITH CHECK (true);

-- Đồng bộ 2 chiều giữa client và clients
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

-- Đồng bộ 2 chiều giữa bank_account và bank_accounts
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

-- ================================================================
-- KÍCH HOẠT ĐỒNG BỘ REALTIME TỨC THỜI CHO CÁC MÁY TÍNH & ĐIỆN THOẠI
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'site_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_users;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'materials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'client'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'clients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bank_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bank_account'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_account;
  END IF;
END $$;

-- ================================================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA PHÚC NGUYÊN M&E)
-- ================================================================

-- 1. Insert Projects
INSERT INTO public.projects (id, code, name, client, total_budget, total_revenue, current_advance, status, location, manager)
VALUES 
    ('prj-1', 'PN-LM-2026', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Tập đoàn Bất động sản Thịnh Vượng', 38000000000, 45000000000, 2500000000, 'active', 'Quận 2, TP. Thủ Đức, TP.HCM', 'Trần Anh Minh'),
    ('prj-2', 'PN-VSIP-2026', 'Nhà xưởng Cơ điện VSIP II', 'Công ty Cổ phần Công Nghiệp Sài Gòn', 30000000000, 36500000000, 1750000000, 'active', 'KCN VSIP II, Bình Dương', 'Hán Văn Quang'),
    ('prj-3', 'PN-RVF-2026', 'Khu Biệt Thự Cao Cấp Riverfront City', 'Chủ đầu tư Khang Điền', 15000000000, 18200000000, 800000000, 'active', 'Quận 9, TP. Thủ Đức, TP.HCM', 'Trần Ngọc Hoàng Huy')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users
INSERT INTO public.site_users (id, name, email, role, role_title, site_name, monthly_limit, pin, phone, avatar_color)
VALUES 
    ('u-1', 'Trần Anh Minh', 'minh.ta@phucnguyenme.com.vn', 'supervisor', 'Chỉ Huy Trưởng / Giám Sát Site', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 150000000, '1234', '0908.123.456', 'bg-emerald-600'),
    ('u-2', 'Trần Ngọc Hoàng Huy', 'huy.tnh@phucnguyenme.com.vn', 'site_engineer', 'Kỹ Thuật Viên Thi Công M&E', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 50000000, '1234', '0912.345.678', 'bg-sky-600'),
    ('u-3', 'Hán Văn Quang', 'quang.hv@phucnguyenme.com.vn', 'site_engineer', 'Kỹ Thuật Trưởng Hiện Trường', 'Nhà xưởng Cơ điện VSIP II', 60000000, '1234', '0933.888.999', 'bg-indigo-600'),
    ('u-4', 'Nguyễn Thị Kim Dung', 'dung.ntk@phucnguyenme.com.vn', 'accountant', 'Kế Toán Trưởng Dự Án & Site', 'Văn Phòng Tổng & Toàn Site', 500000000, '1234', '0977.654.321', 'bg-purple-600'),
    ('u-5', 'Phúc Nguyễn', 'phucnguyen@phucnguyenme.com.vn', 'director', 'Giám Đốc Điều Hành / Admin', 'Toàn Quyền Toàn Hệ Thống', 5000000000, '1234', '0988.999.000', 'bg-amber-600')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Suppliers
INSERT INTO public.suppliers (id, name, type, phone, contact_person, address, unpaid_balance)
VALUES 
    ('sup-1', 'Công Ty TNHH Fisa Việt Nam', 'material', '028.3811.2233', 'Anh Tuấn (Phụ trách vật tư PCCC)', 'KCN Tân Bình, TP.HCM', 12500000),
    ('sup-2', 'Công Ty Cổ Phần Dây Cáp Điện CADIVI', 'material', '028.3829.9443', 'Chị Hằng (Kinh doanh đại lý M&E)', '70-72 Nam Kỳ Khởi Nghĩa, Q.1, TP.HCM', 84000000),
    ('sup-3', 'Schneider Electric Việt Nam Co., Ltd', 'material', '028.3822.4040', 'Kỹ sư Tuấn Schneider', 'Tòa nhà E-Town Central, Q.4, TP.HCM', 0),
    ('sup-4', 'Tập Đoàn Hòa Phát - Chi nhánh M&E Ống thép', 'material', '028.6298.5555', 'Anh Dũng', 'Khu chế xuất Linh Trung II, Thủ Đức', 25000000),
    ('sup-5', 'Đội Xe Cẩu Chuyên Dùng Miền Nam (Minh Phát)', 'transport', '0903.777.666', 'Anh Minh Cẩu', 'Bãi xe An Phú, TP. Thủ Đức', 4200000),
    ('sup-6', 'Công Ty Vận Tải An Phát Logistics', 'transport', '0918.555.222', 'Anh Cường Điều Phối Xe Tải', 'Ngã tư Thủ Đức, TP.HCM', 1800000),
    ('sup-7', 'Quán Cơm Tấm & Suất Ăn Công Nghiệp Minh Ký', 'food', '0937.112.233', 'Chị Hoa (Chủ quán nhận đặt cơm ca)', 'Đường Song Hành Xa Lộ Hà Nội, gần site', 3450000),
    ('sup-8', 'Quán Cơm Niêu & Cơm Bình Dân Phúc An', 'food', '0982.333.444', 'Cô Năm Cơm Site', 'Gần cổng KCN VSIP II, Bình Dương', 0)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Core Expenses (Material, Transport, Overtime Meals)
INSERT INTO public.expenses (id, code, type, category, title, sub_description, project_id, project_name, supplier, created_by_id, created_by_name, created_by_role, date, amount, vat_rate, vat_amount, total_amount, priority, status, payment_method, notes)
VALUES 
    ('exp-1', 'PO-2026-0224', 'po', 'material', 'Đầu phun chữa cháy tự động Sprinkler Viking VK102 Cuộn 68°C', 'Quy cách kỹ thuật theo hồ sơ thiết kế thi công hệ PCCC tầng 1 - 5', 'prj-1', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Công Ty TNHH Fisa Việt Nam', 'u-1', 'Trần Anh Minh', 'Kỹ thuật - Giám sát', '2026-09-08', 9800000, 10, 980000, 10780000, 'normal', 'approved', 'transfer', 'Vật tư đã nghiệm thu đạt chuẩn kiểm định PCCC'),
    ('exp-2', 'PO-2026-0361', 'po', 'material', 'Cáp đồng hạ thế CADIVI CXV 3x120+1x70 mm2', 'Quy cách kỹ thuật theo hồ sơ thiết kế thi công tuyến cấp điện chính', 'prj-1', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Công Ty Cổ Phần Dây Cáp Điện CADIVI', 'u-1', 'Trần Anh Minh', 'Kỹ thuật - Giám sát', '2026-09-08', 94500000, 10, 9450000, 103950000, 'normal', 'approved', 'transfer', 'Kéo dây trục đứng khối tháp A'),
    ('exp-3', 'PO-2026-0091', 'po', 'material', 'Cáp đồng hạ thế CADIVI CXV 3x120+1x70 mm2 (465 Mét)', '+ 1 loại vật tư phụ đầu cosse và băng keo chống ẩm 3M', 'prj-1', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Công Ty Cổ Phần Dây Cáp Điện CADIVI', 'u-1', 'Trần Anh Minh', 'Kỹ thuật - Giám sát', '2026-09-02', 489300000, 10, 48930000, 538230000, 'urgent', 'pending', 'transfer', 'Tiến độ đóng điện máy biến áp cần gấp trong tuần'),
    ('exp-4', 'PO-2026-0092', 'po', 'material', 'Máy cắt không khí ACB Schneider Masterpact 2500A 3P 65kA', '+ 1 loại vật tư phụ kiện đấu nối tủ điện chính MSB (10 Bộ)', 'prj-1', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Schneider Electric Việt Nam Co., Ltd', 'u-2', 'Trần Ngọc Hoàng Huy', 'Kỹ thuật - Giám sát', '2026-09-03', 449600000, 10, 44960000, 494560000, 'high', 'pending', 'transfer', 'Thiết bị tủ trạm điện trung thế'),
    ('exp-5', 'PO-2026-0093', 'po', 'material', 'Máng cáp sơn tĩnh điện 300x100x1.5mm kèm nắp (Hòa Phát)', 'Bao gồm phụ kiện cút nối, quang treo Unistrut 41x41 mạ kẽm', 'prj-2', 'Nhà xưởng Cơ điện VSIP II', 'Tập Đoàn Hòa Phát - Chi nhánh M&E Ống thép', 'u-3', 'Hán Văn Quang', 'Kỹ thuật - Giám sát', '2026-09-05', 188500000, 10, 18850000, 207350000, 'normal', 'approved', 'transfer', NULL),
    ('exp-6', 'EXP-2026-0811', 'expense', 'transport', 'Xe cẩu chuyên dùng 15 tấn bốc hạ cuộn cáp ngầm CADIVI & tủ điện MSB', 'Cẩu hạ hàng xuống ram dốc tầng hầm B1, thi công ca đêm an toàn', 'prj-1', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Đội Xe Cẩu Chuyên Dùng Miền Nam (Minh Phát)', 'u-1', 'Trần Anh Minh', 'Kỹ thuật - Giám sát', '2026-09-09', 8500000, 8, 680000, 9180000, 'high', 'pending', 'advance_fund', 'Kỹ sư Minh đã chi tạm ứng từ quỹ site thanh toán cho tài xế xe cẩu'),
    ('exp-7', 'EXP-2026-0812', 'expense', 'transport', 'Xe tải 5 tấn chuyển ống thép luồn dây & phụ kiện từ kho Thủ Đức về VSIP', 'Vận chuyển 2 chuyến trong ngày phục vụ lắp đặt khẩn cấp xưởng 1 & 2', 'prj-2', 'Nhà xưởng Cơ điện VSIP II', 'Công Ty Vận Tải An Phát Logistics', 'u-3', 'Hán Văn Quang', 'Kỹ thuật hiện trường', '2026-09-06', 3200000, 8, 256000, 3456000, 'normal', 'paid', 'cash', NULL),
    ('exp-8', 'EXP-2026-0813', 'expense', 'overtime_meal', 'Tiền cơm hộp & nước uống tăng ca ca đêm (21h - 03h sáng)', 'Phục vụ 28 anh em thợ điện & kỹ sư kéo tuyến cáp ngầm qua đường hầm', 'prj-1', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Quán Cơm Tấm & Suất Ăn Công Nghiệp Minh Ký', 'u-2', 'Trần Ngọc Hoàng Huy', 'Kỹ thuật thi công', '2026-09-09', 1960000, 0, 0, 1960000, 'normal', 'paid', 'advance_fund', '28 suất x 70k/suất (cơm tấm sườn bì chả + canh + nước sâm mát)'),
    ('exp-9', 'EXP-2026-0814', 'expense', 'overtime_meal', 'Cơm ca chiều & cà phê tăng ca hàn ống cứu hỏa trục chính xưởng B', '16 công nhân cơ điện & 2 kỹ sư giám sát tăng ca đến 22h00', 'prj-2', 'Nhà xưởng Cơ điện VSIP II', 'Quán Cơm Niêu & Cơm Bình Dân Phúc An', 'u-3', 'Hán Văn Quang', 'Kỹ thuật hiện trường', '2026-09-07', 1260000, 0, 0, 1260000, 'normal', 'paid', 'advance_fund', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Sample Transactions (Bảng Sổ Thu Chi)
INSERT INTO public.transactions (id, code, type, category, title, sub_description, project_id, project_name, supplier, receiver_or_payer, created_by_id, created_by_name, created_by_role, date, amount, vat_rate, vat_amount, total_amount, priority, status, payment_method, notes)
VALUES
    ('pt-01', 'PT-2026-001', 'revenue', 'client_advance', 'Thu tiền tạm ứng đợt 1 Hợp đồng M&E Phúc Nguyên Landmark', 'Tạm ứng 20% theo hợp đồng ký kết', 'prj-1', 'Tòa nhà phức hợp Phúc Nguyên Landmark', 'Tập đoàn Bất động sản Thịnh Vượng', 'Tập đoàn Bất động sản Thịnh Vượng', 'u-4', 'Nguyễn Thị Kim Dung', 'Kế Toán Trưởng', '2026-05-15', 2500000000, 0, 0, 2500000000, 'normal', 'paid', 'transfer', 'Đã chuyển vào tài khoản Vietcombank'),
    ('pt-02', 'PT-2026-002', 'revenue', 'client_advance', 'Thu tiền tạm ứng Hợp đồng Nhà xưởng VSIP II', 'Tạm ứng thi công đợt 1', 'prj-2', 'Nhà xưởng Cơ điện VSIP II', 'Công ty Cổ phần Công Nghiệp Sài Gòn', 'Công ty Cổ phần Công Nghiệp Sài Gòn', 'u-4', 'Nguyễn Thị Kim Dung', 'Kế Toán Trưởng', '2026-06-01', 1750000000, 0, 0, 1750000000, 'normal', 'paid', 'transfer', 'Tài khoản công ty'),
    ('pt-03', 'PT-2026-003', 'revenue', 'client_advance', 'Thu tiền tạm ứng Hợp đồng Xin phép Xây dựng Coherent Vsip 3', 'Tạm ứng 25% giá trị hợp đồng', 'prj-pnc-da02', 'Thực Hiện Hồ Sơ Xin Phép Xây Dựng - Coherent Vsip 3', 'Công Ty TNHH Tialoc Việt Nam', 'Công Ty TNHH Tialoc Việt Nam', 'u-1', 'Trần Anh Minh', 'Chỉ Huy Trưởng', '2026-05-15', 200000000, 0, 0, 200000000, 'normal', 'paid', 'transfer', 'Đã nhận tạm ứng qua tài khoản Techcombank'),
    ('pc-01', 'PC-2026-001', 'expense', 'other', 'Nộp lệ phí thẩm duyệt PCCC & Thẩm định thiết kế xây dựng cơ sở', 'Lệ phí nộp cơ quan nhà nước và BQL KCN', 'prj-pnc-da02', 'Thực Hiện Hồ Sơ Xin Phép Xây Dựng - Coherent Vsip 3', 'Cục Cảnh Sát PCCC & CNCH - Kho bạc Nhà nước', 'Kho bạc Nhà nước', 'u-1', 'Trần Anh Minh', 'Chỉ Huy Trưởng', '2026-05-20', 100000000, 0, 0, 100000000, 'high', 'paid', 'transfer', 'Biên lai lệ phí nhà nước'),
    ('pc-02', 'PC-2026-002', 'expense', 'other', 'Chi phí đo đạc trích lục bản đồ địa chính & Khảo sát địa chất hiện trạng', 'Đo vẽ hiện trạng mốc ranh lô đất dự án Coherent', 'prj-pnc-da02', 'Thực Hiện Hồ Sơ Xin Phép Xây Dựng - Coherent Vsip 3', 'Công Ty Đo Đạc Địa Chính Miền Đông', 'Công Ty Đo Đạc Địa Chính Miền Đông', 'u-1', 'Trần Anh Minh', 'Chỉ Huy Trưởng', '2026-06-05', 80000000, 0, 0, 80000000, 'normal', 'paid', 'transfer', 'Đã hoàn tất bàn giao hồ sơ đo đạc')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Clients (Khách Hàng & Chủ Đầu Tư vào cả bảng client và clients)
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
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Bank Accounts (Tài Khoản Ngân Hàng vào cả bảng bank_accounts và bank_account)
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
ON CONFLICT (id) DO NOTHING;

