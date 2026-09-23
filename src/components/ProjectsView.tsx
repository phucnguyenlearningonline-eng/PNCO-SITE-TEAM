import React, { useState } from 'react';
import { Building, DollarSign, PlusCircle, TrendingUp, MapPin, User, Calendar, CheckCircle } from 'lucide-react';
import { ExpenseItem, Project } from '../types';
import { formatVND } from '../utils/formatters';

interface ProjectsViewProps {
  projects: Project[];
  expenses: ExpenseItem[];
  onAddProject: (project: Project) => void;
  onSelectProjectFilter: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  expenses,
  onAddProject,
  onSelectProjectFilter,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [manager, setManager] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(25000000000);
  const [totalBudget, setTotalBudget] = useState(20000000000);
  const [currentAdvance, setCurrentAdvance] = useState(1500000000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      code: code.trim() || `PN-PJ-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      client: client.trim() || 'Chủ đầu tư M&E',
      location: location.trim() || 'TP. Hồ Chí Minh',
      manager: manager.trim() || 'Trần Anh Minh',
      totalRevenue,
      totalBudget,
      currentAdvance,
      status: 'active',
    };

    onAddProject(newProject);
    setShowAddModal(false);
    setName('');
    setCode('');
    setClient('');
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-sky-600" />
            <span>DANH MỤC CÔNG TRÌNH & DỰ ÁN THI CÔNG M&E</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi doanh thu, ngân sách dự toán, dòng tiền tạm ứng và chi phí thực tế tại từng công trường.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Thêm Dự Án Mới</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const projectExpenses = expenses.filter((e) => e.projectId === project.id);
          const totalSpent = projectExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
          const spentPercent = project.totalBudget > 0 ? (totalSpent / project.totalBudget) * 100 : 0;
          const remaining = Math.max(0, project.totalBudget - totalSpent);

          const materialsCost = projectExpenses
            .filter((e) => e.category === 'material')
            .reduce((sum, e) => sum + e.totalAmount, 0);
          const transportCost = projectExpenses
            .filter((e) => e.category === 'transport')
            .reduce((sum, e) => sum + e.totalAmount, 0);
          const mealCost = projectExpenses
            .filter((e) => e.category === 'overtime_meal')
            .reduce((sum, e) => sum + e.totalAmount, 0);

          return (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                    {project.code}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Đang thi công
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2.5 line-clamp-1" title={project.name}>
                  {project.name}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Chủ đầu tư:</span>
                  <strong className="text-slate-700">{project.client}</strong>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{project.location}</span>
                </div>

                {/* Financial overview */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doanh thu hợp đồng:</span>
                    <span className="font-bold text-sky-700 font-mono">{formatVND(project.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngân sách dự toán:</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatVND(project.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đã chi tại site:</span>
                    <span className="font-bold text-rose-600 font-mono">{formatVND(totalSpent)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-semibold mb-1 text-slate-600">
                    <span>Tiến độ ngân sách</span>
                    <span>{spentPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, spentPercent)}%` }}
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Category tags */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-[10.5px]">
                  <div className="bg-blue-50 p-1.5 rounded">
                    <div className="text-blue-600 font-medium">Vật tư</div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">{formatVND(materialsCost)}</div>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded">
                    <div className="text-amber-600 font-medium">Xe cẩu/tải</div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">{formatVND(transportCost)}</div>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded">
                    <div className="text-emerald-600 font-medium">Cơm ca</div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">{formatVND(mealCost)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Chỉ huy: <strong className="text-slate-800">{project.manager}</strong>
                </span>
                <button
                  onClick={() => onSelectProjectFilter(project.id)}
                  className="text-xs text-sky-700 hover:text-sky-900 font-bold hover:underline"
                >
                  Xem chi tiêu & PO →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Thêm Dự Án Thi Công M&E Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Tên Dự Án Thi Công</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Khách sạn 5 sao Grand Marina Saigon"
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Mã Dự Án</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PN-GMS-2026"
                    className="w-full py-2 px-3 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chủ Đầu Tư</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Tập đoàn Masterise Homes"
                    className="w-full py-2 px-3 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Địa Điểm Công Trường</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Số 2 Tôn Đức Thắng, Q.1"
                    className="w-full py-2 px-3 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chỉ Huy Trưởng Site</label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="Trần Anh Minh"
                    className="w-full py-2 px-3 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Doanh Thu Dự Kiến (VNĐ)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={totalRevenue}
                    onChange={(e) => setTotalRevenue(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ngân Sách Dự Toán (VNĐ)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-300 rounded font-mono"
                  />
                </div>
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
                  Thêm Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
