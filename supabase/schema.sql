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

-- TẠO CHỈ MỤC TĂNG TỐC ĐỘ TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);

-- CẤU HÌNH ROW LEVEL SECURITY (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- CHO PHÉP ĐỌC VÀ GHI CHO CLIENT ĐƯỢC ỦY QUYỀN (ANON KEY / AUTHENTICATED)
CREATE POLICY "Public Read Projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Projects" ON public.projects FOR ALL USING (true);

CREATE POLICY "Public Read Suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Suppliers" ON public.suppliers FOR ALL USING (true);

CREATE POLICY "Public Read Users" ON public.site_users FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Users" ON public.site_users FOR ALL USING (true);

CREATE POLICY "Public Read Expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Expenses" ON public.expenses FOR ALL USING (true);

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
