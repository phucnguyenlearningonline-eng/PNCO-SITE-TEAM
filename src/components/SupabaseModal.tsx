import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  CloudUpload, 
  RefreshCw,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  isSupabaseConfigured, 
  testSupabaseConnection, 
  SupabaseConfig 
} from '../lib/supabase';
import { syncAllLocalDataToSupabase } from '../services/supabaseService';
import { ExpenseItem, Project, Supplier, User } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  projects: Project[];
  suppliers: Supplier[];
  users: User[];
  onRefreshDataFromSupabase: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  expenses,
  projects,
  suppliers,
  users,
  onRefreshDataFromSupabase,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const FIX_SQL = `-- CẤP TOÀN QUYỀN ĐỌC, GHI, SỬA, XÓA & KÍCH HOẠT REALTIME ĐA THIẾT BỊ
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public Insert/Update Expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow All Expenses" ON public.expenses;
CREATE POLICY "Allow All Expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'suppliers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'site_users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_users;
  END IF;
END $$;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(FIX_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url || '');
      setAnonKey(cfg.anonKey || '');
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();

  const handleSave = () => {
    saveSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
    });
    setTestResult({
      success: true,
      message: 'Đã lưu cấu hình Supabase vào bộ nhớ ứng dụng.',
    });
    onRefreshDataFromSupabase();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const cfg: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
    };
    saveSupabaseConfig(cfg);
    const res = await testSupabaseConnection(cfg);
    setTestResult(res);
    setIsTesting(false);
    if (res.success) {
      onRefreshDataFromSupabase();
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await syncAllLocalDataToSupabase({
      expenses,
      projects,
      suppliers,
      users,
    });
    setSyncResult(res);
    setIsSyncing(false);
  };

  const handleCopyEnvVars = () => {
    const text = `VITE_SUPABASE_URL=${url.trim() || 'https://your-project.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${anonKey.trim() || 'your-anon-public-key'}`;
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Cấu Hình Supabase & Triển Khai Vercel</span>
                {isConnected ? (
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã kết nối Cloud
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Đang dùng Offline/Local
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Đồng bộ dữ liệu thời gian thực giữa công trường và phòng kế toán lên nền tảng PostgreSQL Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Step Guidance */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-900 space-y-2">
            <div className="font-bold flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>3 BƯỚC ĐỂ TRIỂN KHAI HOÀN CHỈNH LÊN VERCEL & SUPABASE:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 font-medium pl-1 leading-relaxed">
              <li>
                Tạo Project mới trên <strong>Supabase.com</strong> & vào mục <strong>SQL Editor</strong> chạy nội dung tệp <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 text-sky-800 font-mono">supabase/schema.sql</code>.
              </li>
              <li>
                Vào <strong>Project Settings → API</strong> trên Supabase, sao chép <strong>Project URL</strong> và <strong>anon public API key</strong> dán vào 2 ô bên dưới.
              </li>
              <li>
                Khi deploy lên <strong>Vercel</strong>, vào <strong>Settings → Environment Variables</strong> và thêm 2 biến môi trường tương ứng: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 text-sky-800 font-mono">VITE_SUPABASE_URL</code> và <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 text-sky-800 font-mono">VITE_SUPABASE_ANON_KEY</code>.
              </li>
            </ol>
            <div className="pt-2 border-t border-sky-200/80 flex items-center justify-between">
              <span className="text-[11px] text-sky-800 font-medium">
                💡 Cần kích hoạt đồng bộ tức thời (Realtime) & cấp quyền Xóa trên Supabase?
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Đã sao chép SQL Cấp Quyền & Realtime' : 'Sao Chép SQL Cấp Quyền & Realtime'}</span>
              </button>
            </div>
          </div>

          {/* Form Credentials */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-600" />
                Thông Tin Kết Nối Supabase
              </span>
              <a
                href="https://supabase.com/dashboard/project/awofonpspmerjxzryzcv/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 text-[11px] underline bg-sky-50 px-2 py-1 rounded border border-sky-200"
              >
                Mở Trang Lấy Anon Key Trên Supabase <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project URL (VITE_SUPABASE_URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                className="w-full py-2 px-3 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Lấy từ: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Anon Public Key (VITE_SUPABASE_ANON_KEY) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full py-2 px-3 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Lấy từ: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys &gt; `anon` `public`
              </span>
            </div>

            {/* Test connection alert */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold">{testResult.success ? 'Thành công!' : 'Lỗi kết nối:'}</div>
                  <div className="mt-0.5 text-xs">{testResult.message}</div>
                </div>
              </div>
            )}

            {/* Buttons for testing & saving */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCopyEnvVars}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Đã sao chép Env' : 'Sao chép biến Env'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !url || !anonKey}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối (Ping)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>

          {/* Sync Local data to Supabase */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <CloudUpload className="w-4 h-4 text-amber-600" />
                  <span>Đồng Bộ Dữ Liệu Hiện Tại Lên Supabase (1-Click Sync)</span>
                </h4>
                <p className="text-slate-600 text-xs mt-0.5">
                  Đẩy toàn bộ {expenses.length} khoản chi, {projects.length} công trình và {users.length} nhân viên hiện có lên cơ sở dữ liệu Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncing || !url || !anonKey}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{isSyncing ? 'Đang đẩy dữ liệu...' : 'Đẩy Sổ Sách Lên Cloud'}</span>
              </button>
            </div>

            {syncResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  syncResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <strong>{syncResult.success ? '✓ Hoàn tất: ' : '✕ Thất bại: '}</strong>
                {syncResult.message}
              </div>
            )}
          </div>

          {/* Vercel Deployment Checklist */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Cấu Hình Vercel Sẵn Sàng Trong Dự Án</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Tệp cấu hình <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">vercel.json</code> đã được tạo sẵn trong thư mục gốc của dự án với quy tắc định tuyến SPA. Khi kết nối GitHub repository với Vercel:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 pl-2">
              <li>Framework Preset: <strong>Vite</strong> (Vercel tự động nhận diện)</li>
              <li>Build Command: <code className="font-mono bg-slate-100 px-1 rounded">npm run build</code></li>
              <li>Output Directory: <code className="font-mono bg-slate-100 px-1 rounded">dist</code></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[11px] text-slate-500">
            Hệ thống hỗ trợ Hybrid Mode: luôn hoạt động trơn tru cả khi có mạng lẫn offline.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
