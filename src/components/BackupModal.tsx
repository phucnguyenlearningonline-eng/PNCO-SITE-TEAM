import React, { useRef } from 'react';
import { X, Download, Upload, RefreshCw, Database, Check } from 'lucide-react';
import { ExpenseItem, Project, Supplier, User } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  projects: Project[];
  suppliers: Supplier[];
  users: User[];
  onRestoreData: (data: {
    expenses: ExpenseItem[];
    projects: Project[];
    suppliers: Supplier[];
    users: User[];
  }) => void;
  onResetDefaults: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  expenses,
  projects,
  suppliers,
  users,
  onRestoreData,
  onResetDefaults,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      company: 'CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN',
      expenses,
      projects,
      suppliers,
      users,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PhucNguyen_ME_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.expenses && Array.isArray(parsed.expenses)) {
          onRestoreData({
            expenses: parsed.expenses,
            projects: parsed.projects || projects,
            suppliers: parsed.suppliers || suppliers,
            users: parsed.users || users,
          });
          alert('Khôi phục dữ liệu từ tệp sao lưu thành công!');
          onClose();
        } else {
          alert('Tệp dữ liệu không hợp lệ. Vui lòng chọn tệp JSON chuẩn của hệ thống.');
        }
      } catch (err) {
        alert('Lỗi đọc tệp JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Sao Lưu & Khôi Phục Dữ Liệu Hệ Thống</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600">
            Dữ liệu tài chính, chi phí vật tư, vận chuyển và đồ ăn tăng ca được lưu trữ bảo mật trên trình duyệt của bạn. Bạn có thể xuất tệp JSON dự phòng hoặc đồng bộ sang máy khác bất cứ lúc nào.
          </p>

          <div className="space-y-3">
            {/* Tải về JSON */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Xuất Tệp Sao Lưu (JSON)</div>
                <div className="text-slate-500 mt-0.5">
                  Bao gồm {expenses.length} giao dịch, {projects.length} dự án, {users.length} nhân viên.
                </div>
              </div>
              <button
                onClick={handleExportJSON}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Tệp JSON</span>
              </button>
            </div>

            {/* Khôi phục JSON */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Khôi Phục Từ Tệp JSON</div>
                <div className="text-slate-500 mt-0.5">
                  Tải lên tệp đã sao lưu trước đó để phục hồi toàn bộ sổ sách.
                </div>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJSON}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn Tệp</span>
                </button>
              </div>
            </div>

            {/* Đặt lại ban đầu */}
            <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-rose-900 text-sm">Khôi Phục Dữ Liệu Gốc Phúc Nguyên M&E</div>
                <div className="text-rose-600 mt-0.5">
                  Đặt lại dữ liệu mẫu chuẩn theo hợp đồng và PO mẫu ban đầu.
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu về cấu hình mẫu ban đầu?')) {
                    onResetDefaults();
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đặt Lại Gốc</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
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
