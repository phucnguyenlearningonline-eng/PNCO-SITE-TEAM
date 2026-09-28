import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  FileText, 
  Calendar, 
  Percent, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3 
} from 'lucide-react';
import { Project, ProjectAddendum } from '../../types';
import { formatVND, formatDateVN, formatTy } from '../../utils/formatters';

interface ProjectAddendumsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

export const ProjectAddendumsModal: React.FC<ProjectAddendumsModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject,
}) => {
  const addendums = project.addendums || [];

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [signingDate, setSigningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(100000000);
  const [vatRate, setVatRate] = useState<number>(project.vatRate ?? 0);
  const [scope, setScope] = useState('');
  const [status, setStatus] = useState<ProjectAddendum['status']>('signed');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Tính toán tổng phát sinh từ PLHĐ
  const totalAddendumAmount = addendums.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const originalValue = project.originalContractValue || project.totalRevenue || 0;
  const finalTotalRevenue = originalValue + totalAddendumAmount;

  const openAddForm = () => {
    const nextIndex = addendums.length + 1;
    setCode(`PLHĐ-${String(nextIndex).padStart(2, '0')}/${project.code}`);
    setTitle('');
    setSigningDate(new Date().toISOString().split('T')[0]);
    setAmount(150000000);
    setVatRate(project.vatRate ?? 0);
    setScope('');
    setStatus('signed');
    setNotes('');
    setEditingId(null);
    setIsAdding(true);
  };

  const openEditForm = (item: ProjectAddendum) => {
    setCode(item.code);
    setTitle(item.title);
    setSigningDate(item.signingDate || '');
    setAmount(item.amount || 0);
    setVatRate(item.vatRate ?? 0);
    setScope(item.scope || '');
    setStatus(item.status || 'signed');
    setNotes(item.notes || '');
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount === 0) return;

    const totalAmount = Math.round(amount * (1 + (vatRate || 0) / 100));

    let updatedList: ProjectAddendum[];
    if (editingId) {
      updatedList = addendums.map((item) =>
        item.id === editingId
          ? {
              ...item,
              code: code.trim() || item.code,
              title: title.trim(),
              signingDate,
              amount,
              vatRate,
              totalAmount,
              scope: scope.trim(),
              status,
              notes: notes.trim(),
            }
          : item
      );
    } else {
      const newItem: ProjectAddendum = {
        id: `pl-${Date.now()}`,
        code: code.trim() || `PLHĐ-${String(addendums.length + 1).padStart(2, '0')}/${project.code}`,
        title: title.trim(),
        signingDate,
        amount,
        vatRate,
        totalAmount,
        scope: scope.trim(),
        status,
        notes: notes.trim(),
      };
      updatedList = [...addendums, newItem];
    }

    const newAddendumTotal = updatedList.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const newTotalRevenue = (project.originalContractValue || project.totalRevenue || 0) + newAddendumTotal;

    onUpdateProject({
      ...project,
      addendums: updatedList,
      totalRevenue: newTotalRevenue,
    });

    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phụ lục hợp đồng này?')) return;
    const updatedList = addendums.filter((item) => item.id !== id);
    const newAddendumTotal = updatedList.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const newTotalRevenue = (project.originalContractValue || project.totalRevenue || 0) + newAddendumTotal;

    onUpdateProject({
      ...project,
      addendums: updatedList,
      totalRevenue: newTotalRevenue,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-sky-600 px-2 py-0.5 rounded text-white">
                {project.code}
              </span>
              <h3 className="font-bold text-base text-white">
                Hồ Sơ &amp; Phụ Lục Hợp Đồng (PLHĐ)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">
              {project.name} • CĐT: <strong className="text-white">{project.client}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500">Hợp đồng gốc:</span>
            <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
              {formatVND(originalValue)}
            </div>
            <div className="text-[10.5px] text-slate-400">VAT {project.vatRate ?? 0}%</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-sky-600">Phát sinh từ ({addendums.length}) PLHĐ:</span>
            <div className={`font-mono font-bold text-sm mt-0.5 ${totalAddendumAmount >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
              {totalAddendumAmount >= 0 ? '+' : ''}{formatVND(totalAddendumAmount)}
            </div>
            <div className="text-[10.5px] text-slate-400">{formatTy(totalAddendumAmount)}</div>
          </div>

          <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Tổng quyết toán sau PLHĐ:</span>
            <div className="font-mono font-black text-emerald-800 text-base mt-0.5">
              {formatVND(finalTotalRevenue)}
            </div>
            <div className="text-[10.5px] font-bold text-emerald-700">{formatTy(finalTotalRevenue)}</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Danh Sách Các Phụ Lục Hợp Đồng Đã Phát Sinh ({addendums.length})</span>
            </h4>

            {!isAdding && (
              <button
                type="button"
                onClick={openAddForm}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Phụ Lục HĐ Mới</span>
              </button>
            )}
          </div>

          {/* Form thêm / sửa phụ lục */}
          {isAdding && (
            <form onSubmit={handleSave} className="bg-sky-50/60 p-4 rounded-xl border border-sky-200 space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                <span className="font-bold text-sky-950 text-sm">
                  {editingId ? 'Chỉnh Sửa Phụ Lục Hợp Đồng' : 'Thêm Phụ Lục Hợp Đồng Phát Sinh Mới'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Phụ Lục HĐ <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PLHĐ-01/PNC-DA01"
                    required
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nội Dung / Tên Phụ Lục HĐ <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Bổ sung hệ thống chữa cháy khí FM200 phòng máy chủ"
                    required
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Ký Phụ Lục</label>
                  <input
                    type="date"
                    value={signingDate}
                    onChange={(e) => setSigningDate(e.target.value)}
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá Trị Trước Thuế (VNĐ)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thuế Suất VAT</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value={0}>VAT 0% (Không thuế)</option>
                    <option value={8}>VAT 8%</option>
                    <option value={10}>VAT 10%</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá Sau Thuế (Tự tính)</label>
                  <div className="py-1.5 px-2.5 border border-emerald-300 bg-emerald-50 rounded font-mono font-bold text-emerald-800 text-xs">
                    {formatVND(Math.round(amount * (1 + (vatRate || 0) / 100)))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Phạm Vi Công Việc / Diễn Giải Kỹ Thuật</label>
                  <input
                    type="text"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Chi tiết vật tư, thiết bị, khối lượng thi công bổ sung..."
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng Thái Phụ Lục</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="signed">Đã ký chính thức</option>
                    <option value="approved">Đã duyệt chờ ký</option>
                    <option value="draft">Dự thảo đang thương thảo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-200">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-white bg-sky-600 hover:bg-sky-500 font-bold shadow-xs cursor-pointer"
                >
                  {editingId ? 'Lưu Phụ Lục' : 'Tạo Phụ Lục'}
                </button>
              </div>
            </form>
          )}

          {/* Bảng danh sách phụ lục */}
          {addendums.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-xs">Dự án này chưa phát sinh phụ lục hợp đồng nào</p>
              <p className="text-[11px] text-slate-400">
                Giá trị quyết toán hiện tại bằng giá trị hợp đồng gốc: <strong className="text-slate-700">{formatVND(originalValue)}</strong>
              </p>
              <button
                type="button"
                onClick={openAddForm}
                className="mt-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Phụ Lục HĐ Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3 w-36">Mã PLHĐ</th>
                    <th className="py-2.5 px-3">Nội Dung Phát Sinh</th>
                    <th className="py-2.5 px-3 text-right w-32">Giá Trị Sau VAT</th>
                    <th className="py-2.5 px-3 text-center w-28">Ngày Ký</th>
                    <th className="py-2.5 px-3 text-center w-28">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-center w-20">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {addendums.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[11px]">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        {item.scope && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.scope}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-mono font-bold text-emerald-800">
                          {formatVND(item.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">VAT {item.vatRate ?? 0}%</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                        {formatDateVN(item.signingDate)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          item.status === 'signed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.status === 'approved'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {item.status === 'signed' ? 'Đã ký' : item.status === 'approved' ? 'Đã duyệt' : 'Dự thảo'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                            title="Sửa phụ lục"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Xóa phụ lục"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center shrink-0 text-xs">
          <span className="text-slate-500">
            Tổng cộng: <strong>{addendums.length}</strong> phụ lục phát sinh
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
