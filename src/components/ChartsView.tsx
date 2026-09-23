import React, { useState } from 'react';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Package, 
  Truck, 
  Utensils, 
  Calendar,
  Layers,
  Building,
  UserCheck
} from 'lucide-react';
import { ExpenseItem, Project, User } from '../types';
import { formatVND, formatNumber, getCategoryLabel } from '../utils/formatters';

interface ChartsViewProps {
  expenses: ExpenseItem[];
  projects: Project[];
  users: User[];
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  expenses,
  projects,
  users,
}) => {
  const [selectedYear] = useState('2026');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Group expenses by Month (1 to 12)
  const monthData = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
    const yearMonth = `${selectedYear}-${monthStr}`;

    const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));
    const totalExpense = monthExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

    // Realistic monthly advance / revenue cash flow for M&E contractor
    const advanceReceived = [
      800000000,   // T1
      650000000,   // T2
      1200000000,  // T3
      1400000000,  // T4
      1800000000,  // T5
      2100000000,  // T6
      1900000000,  // T7
      2200000000,  // T8
      2500000000,  // T9 (peak execution month)
      1800000000,  // T10
      1500000000,  // T11
      1100000000,  // T12
    ][i];

    return {
      month: `Tháng ${monthNum}`,
      monthNum,
      totalExpense,
      advanceReceived,
      variance: advanceReceived - totalExpense,
      itemCount: monthExpenses.length,
    };
  });

  const maxChartValue = Math.max(
    ...monthData.map((d) => Math.max(d.totalExpense, d.advanceReceived)),
    3000000000
  );

  // Category breakdown calculations
  const totalAllExpenses = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  const materialCost = expenses
    .filter((e) => e.category === 'material')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const transportCost = expenses
    .filter((e) => e.category === 'transport')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const mealCost = expenses
    .filter((e) => e.category === 'overtime_meal')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const otherCost = expenses
    .filter((e) => e.category === 'labor_sub' || e.category === 'other')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const materialPct = totalAllExpenses > 0 ? (materialCost / totalAllExpenses) * 100 : 0;
  const transportPct = totalAllExpenses > 0 ? (transportCost / totalAllExpenses) * 100 : 0;
  const mealPct = totalAllExpenses > 0 ? (mealCost / totalAllExpenses) * 100 : 0;
  const otherPct = totalAllExpenses > 0 ? (otherCost / totalAllExpenses) * 100 : 0;

  // Breakdown by Project
  const projectStats = projects.map((prj) => {
    const prjExpenses = expenses.filter((e) => e.projectId === prj.id);
    const spent = prjExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const pct = prj.totalBudget > 0 ? (spent / prj.totalBudget) * 100 : 0;
    return {
      ...prj,
      spent,
      pctSpent: pct.toFixed(1),
      count: prjExpenses.length,
      remaining: Math.max(0, prj.totalBudget - spent),
    };
  });

  // User expenses stats
  const userStats = users.map((user) => {
    const userExpenses = expenses.filter((e) => e.createdById === user.id);
    const total = userExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const pending = userExpenses.filter((e) => e.status === 'pending').length;
    return {
      user,
      total,
      count: userExpenses.length,
      pending,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & KPI Summary */}
      <div className="bg-[#102742] text-white p-5 rounded-xl shadow-md border border-[#1b3d63] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>TRUNG TÂM PHÂN TÍCH TÀI CHÍNH & DÒNG TIỀN SITE — NĂM {selectedYear}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Báo Cáo Biểu Đồ Thu - Chi & Cơ Cấu Chi Phí Công Trường
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Theo dõi chi tiết 3 nhóm chi tiêu trọng điểm: Vật tư thi công M&E, Chi phí vận chuyển & cẩu kéo, Chi phí đồ ăn tăng ca.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#0a1829] px-4 py-2.5 rounded-lg border border-[#1d3d63]">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tổng chi lũy kế</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
              {formatVND(totalAllExpenses)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar Chart: THU - CHI QUA CÁC THÁNG */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <span>Biểu Đồ So Sánh Thu Nhập (Tạm Ứng) & Chi Tiêu Thực Tế Từng Tháng</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cân đối dòng tiền tại site: Cột xanh là Tạm ứng/Doanh thu nhận về, cột đỏ là Chi phí thực chi tại site.
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-sky-500 inline-block"></span>
              <span className="text-slate-700">Tạm ứng / Dòng tiền thu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 inline-block"></span>
              <span className="text-slate-700">Tổng chi tiêu tại site</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-6 pb-2">
          <div className="h-64 flex items-end justify-between gap-1 sm:gap-3 px-2 sm:px-6 relative">
            {/* Horizontal guideline markers */}
            <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-200 pointer-events-none text-[10px] text-slate-400 pl-2">
              {formatNumber(maxChartValue)} đ
            </div>
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200 pointer-events-none text-[10px] text-slate-400 pl-2">
              {formatNumber(maxChartValue / 2)} đ
            </div>

            {monthData.map((d, index) => {
              const advanceHeight = Math.max(6, (d.advanceReceived / maxChartValue) * 100);
              const expenseHeight = Math.max(6, (d.totalExpense / maxChartValue) * 100);
              const isHovered = hoveredMonth === index;

              return (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  onMouseEnter={() => setHoveredMonth(index)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 bg-[#0e1d2f] text-white p-2.5 rounded-lg shadow-xl text-xs z-30 pointer-events-none min-w-[180px] border border-slate-700 animate-in fade-in duration-100">
                      <div className="font-bold text-cyan-400 border-b border-slate-700 pb-1 mb-1">
                        {d.month} / {selectedYear}
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Thu / Tạm ứng:</span>
                        <span className="font-bold text-sky-400">{formatVND(d.advanceReceived)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Thực chi site:</span>
                        <span className="font-bold text-rose-400">{formatVND(d.totalExpense)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 mt-1 border-t border-slate-800">
                        <span>Chênh lệch dư:</span>
                        <span className={`font-bold ${d.variance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {formatVND(d.variance)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Số lượng phiếu chi: {d.itemCount} phiếu
                      </div>
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1">
                    {/* Advance Bar (Thu) */}
                    <div
                      style={{ height: `${advanceHeight}%` }}
                      className={`w-3 sm:w-5 rounded-t-sm transition-all duration-300 ${
                        isHovered ? 'bg-sky-400 shadow-md' : 'bg-sky-500'
                      }`}
                    />
                    {/* Expense Bar (Chi) */}
                    <div
                      style={{ height: `${expenseHeight}%` }}
                      className={`w-3 sm:w-5 rounded-t-sm transition-all duration-300 ${
                        isHovered ? 'bg-rose-400 shadow-md' : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <div className="mt-2 text-[10px] sm:text-xs font-semibold text-slate-600 text-center truncate w-full">
                    T{d.monthNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row of 2 Columns: Cơ Cấu Chi Phí 3 Nhóm & Chi Tiêu Theo Dự Án */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: CƠ CẤU CHI PHÍ SITE (Vật tư - Vận chuyển - Đồ ăn tăng ca) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
              <span>Cơ Cấu Chi Phí Trọng Điểm Tại Site</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Lũy kế 2026
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {/* Visual breakdown bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
              <div
                style={{ width: `${materialPct}%` }}
                className="bg-blue-600 hover:opacity-90 transition-all"
                title={`Vật tư thi công: ${materialPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${transportPct}%` }}
                className="bg-amber-500 hover:opacity-90 transition-all"
                title={`Vận chuyển: ${transportPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${mealPct}%` }}
                className="bg-emerald-500 hover:opacity-90 transition-all"
                title={`Đồ ăn tăng ca: ${mealPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${otherPct}%` }}
                className="bg-purple-500 hover:opacity-90 transition-all"
                title={`Khác: ${otherPct.toFixed(1)}%`}
              />
            </div>

            {/* Category 1: Vật Tư */}
            <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Chi Phí Vật Tư Thi Công M&E
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Cáp điện CADIVI, Sprinkler, Ống luồn thép, Tủ điện ACB Schneider...
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-900 font-mono text-sm sm:text-base">
                  {formatVND(materialCost)}
                </div>
                <div className="text-xs font-semibold text-blue-700">{materialPct.toFixed(1)}% tổng chi</div>
              </div>
            </div>

            {/* Category 2: Vận Chuyển */}
            <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Chi Phí Vận Chuyển & Cẩu Kéo
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Xe cẩu 15T - 25T bốc dỡ máy biến áp, xe tải giao vật tư gấp, ba gác...
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-amber-900 font-mono text-sm sm:text-base">
                  {formatVND(transportCost)}
                </div>
                <div className="text-xs font-semibold text-amber-700">{transportPct.toFixed(1)}% tổng chi</div>
              </div>
            </div>

            {/* Category 3: Đồ Ăn Tăng Ca */}
            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Chi Phí Đồ Ăn Tăng Ca & Bồi Dưỡng
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Cơm hộp thợ làm đêm, bánh mì, sữa tươi, nước sâm, cà phê tăng ca...
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-900 font-mono text-sm sm:text-base">
                  {formatVND(mealCost)}
                </div>
                <div className="text-xs font-semibold text-emerald-700">{mealPct.toFixed(1)}% tổng chi</div>
              </div>
            </div>

            {/* Category 4: Khác */}
            {otherCost > 0 && (
              <div className="p-3 rounded-lg border border-purple-100 bg-purple-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      Nhân Công Phụ & Chi Phí Khác
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Thuê thợ hỗ trợ rải dây cáp ngầm, phụ phí phát sinh tại hiện trường
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-900 font-mono text-sm sm:text-base">
                    {formatVND(otherCost)}
                  </div>
                  <div className="text-xs font-semibold text-purple-700">{otherPct.toFixed(1)}% tổng chi</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: CHI PHÍ THEO DỰ ÁN THI CÔNG */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-600" />
                <span>Tiến Độ Giải Ngân Theo Công Trình</span>
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {projects.length} Dự Án
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {projectStats.map((prj) => (
                <div key={prj.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{prj.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Chủ đầu tư: {prj.client} • Quản lý: {prj.manager}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {prj.count} khoản chi
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Đã chi: {formatVND(prj.spent)}</span>
                      <span className="text-sky-700">{prj.pctSpent}% dự toán</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Number(prj.pctSpent))}%` }}
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span>Dự toán: {formatVND(prj.totalBudget)}</span>
                      <span className="text-emerald-600 font-medium">
                        Còn lại: {formatVND(prj.remaining)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Thống kê chi tiêu theo từng Nhân Viên / Kỹ Sư Site */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>Bảng Thống Kê Chi Tiêu Từng Nhân Viên / Kỹ Sư Site</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân quyền và theo dõi số lượng phiếu chi đã lập, tổng tiền tạm ứng của từng cá nhân tại công trường.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                <th className="py-2.5 px-3">Nhân Viên</th>
                <th className="py-2.5 px-3">Chức Danh / Quyền Hạn</th>
                <th className="py-2.5 px-3">Công Trường Phụ Trách</th>
                <th className="py-2.5 px-3 text-center">Số Phiếu Đã Lập</th>
                <th className="py-2.5 px-3 text-center">Chờ Duyệt</th>
                <th className="py-2.5 px-3 text-right">Tổng Tiền Chi (VNĐ)</th>
                <th className="py-2.5 px-3 text-right">Hạn Mức Tháng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {userStats.map(({ user, total, count, pending }) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${user.avatarColor} text-white font-bold flex items-center justify-center text-xs`}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{user.roleTitle}</td>
                  <td className="py-3 px-3 text-slate-700">{user.siteName}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">{count}</td>
                  <td className="py-3 px-3 text-center">
                    {pending > 0 ? (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {pending} chờ
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatVND(total)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {formatVND(user.monthlyLimit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
