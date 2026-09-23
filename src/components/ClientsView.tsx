import React, { useState } from 'react';
import { Building2, Edit3, Trash2, PlusCircle, CheckCircle, MapPin, DollarSign, X } from 'lucide-react';
import { Project } from '../types';
import { formatVND } from '../utils/formatters';

interface ClientsViewProps {
  projects: Project[];
  onUpdateClient: (oldClientName: string, newClientName: string, newRevenue?: number) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  projects,
  onUpdateClient,
  onEditProject,
  onDeleteProject,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [clientName, setClientName] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  const openEditModal = (p: Project) => {
    setSelectedProject(p);
    setClientName(p.client);
    setTotalRevenue(p.totalRevenue);
    setShowEditModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !selectedProject) return;

    if (onEditProject) {
      const updated: Project = {
        ...selectedProject,
        client: clientName.trim(),
        totalRevenue: totalRevenue || selectedProject.totalRevenue,
      };
      onEditProject(updated);
    } else {
      onUpdateClient(selectedProject.client, clientName.trim(), totalRevenue);
    }

    setShowEditModal(false);
    setSelectedProject(null);
  };

  const handleDelete = (p: Project) => {
    if (!onDeleteProject) return;
    if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ Chủ đầu tư / Khách hàng "${p.client}" của dự án "${p.name}"?`)) {
      onDeleteProject(p.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <span>DANH SÁCH CHỦ ĐẦU TƯ & KHÁCH HÀNG DỰ ÁN M&E</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tên khách hàng, thông tin chủ đầu tư, giá trị hợp đồng xây dựng cơ điện và đồng bộ Supabase.
          </p>
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Chủ Đầu Tư / Khách Hàng
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Chỉnh sửa tên khách hàng & hợp đồng"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteProject && (
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa dự án / khách hàng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-lg mt-2.5 line-clamp-1" title={p.client}>
                {p.client}
              </h4>

              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div>
                  Dự án phụ trách: <strong className="text-slate-800">{p.name}</strong> ({p.code})
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>
                <div className="text-slate-500">
                  Chỉ huy trưởng site: <strong className="text-slate-700">{p.manager}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Giá trị hợp đồng:</span>
              <span className="font-mono font-bold text-sky-800 text-sm">
                {formatVND(p.totalRevenue)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Client Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Chỉnh Sửa Tên Khách Hàng / Chủ Đầu Tư</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên Khách Hàng / Chủ Đầu Tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="VD: Tập đoàn Novaland / Masterise Homes..."
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Dự Án Đang Gắn Liền
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedProject.name} (${selectedProject.code})`}
                  className="w-full py-2 px-3 border border-slate-200 bg-slate-100 rounded text-slate-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Giá Trị Hợp Đồng Ký Kết (VNĐ)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={totalRevenue}
                  onChange={(e) => setTotalRevenue(Number(e.target.value))}
                  className="w-full py-2 px-3 border border-slate-300 rounded font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded shadow-sm"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
