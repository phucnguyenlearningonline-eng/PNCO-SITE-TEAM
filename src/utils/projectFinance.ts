import { Project, ExpenseItem } from '../types';
import { isReceiptVoucher, isPaymentVoucher } from './voucherCode';

/**
 * Khớp nối một khoản thu/chi với dự án một cách an toàn và chính xác
 */
export function isExpenseMatchProject(e?: ExpenseItem | null, p?: Project | null): boolean {
  if (!e || !p) return false;

  // 1. Khớp chính xác ID hoặc Code dự án
  if (e.projectId) {
    const eid = String(e.projectId).trim().toLowerCase();
    const pid = String(p.id).trim().toLowerCase();
    const pcode = String(p.code || '').trim().toLowerCase();
    if (eid === pid || eid === pcode) return true;

    // Chuẩn hóa bỏ dấu gạch nối (vd: prj-pnc-da01 vs pnc-da01, pn-vsip-2026 vs vsip-2026)
    const eidClean = eid.replace(/^(prj[-_]|project[-_])/, '').replace(/[-_]/g, '');
    const pcodeClean = pcode.replace(/[-_]/g, '');
    if (eidClean && pcodeClean && (eidClean === pcodeClean || eidClean.includes(pcodeClean) || pcodeClean.includes(eidClean))) {
      return true;
    }
  }

  // 2. Khớp Tên công trình (chính xác hoặc loại bỏ khoảng trắng dư thừa)
  if (e.projectName && p.name) {
    const eName = e.projectName.trim().toLowerCase();
    const pName = p.name.trim().toLowerCase();
    if (eName === pName) return true;

    // Khớp tên phụ trợ nếu chứa mã dự án
    if (p.code) {
      const pCodeUpper = p.code.trim().toUpperCase();
      if (e.projectName.toUpperCase().includes(pCodeUpper)) return true;
      if (e.subDescription && e.subDescription.toUpperCase().includes(pCodeUpper)) return true;
      if (e.title && e.title.toUpperCase().includes(pCodeUpper)) return true;
    }
  }

  return false;
}

/**
 * Lấy danh sách tất cả Phiếu Thu (revenue) hợp lệ của một dự án
 */
export function getProjectReceipts(p: Project, expenses: ExpenseItem[]): ExpenseItem[] {
  if (!p || !Array.isArray(expenses)) return [];

  return expenses.filter(
    (e) => isExpenseMatchProject(e, p) && isReceiptVoucher(e) && e.status !== 'rejected'
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export interface ProjectFinanceCalculation {
  // Hợp đồng & Giá trị
  originalValue: number;
  vatRate: number;
  vatAmount: number;
  contractValueWithVat: number;
  addendumsCount: number;
  addendumTotal: number;
  totalAfterPLHD: number;

  // Phiếu Thu & Đã Thu CĐT (Chỉ số kiểm tra chặt chẽ)
  receipts: ExpenseItem[];
  receiptsCount: number;
  receiptsTotal: number;
  collected: number; // Số tiền đã thu thực tế từ Phiếu Thu
  remainingToCollect: number; // Còn phải thu
  collectedPercentage: number; // % Đã thu / Tổng sau PLHĐ

  // Chi phí & Nhân công
  expensesCount: number;
  laborExpenses: ExpenseItem[];
  labor: number;
  materialExpenses: ExpenseItem[];
  material: number;
  transportExpenses: ExpenseItem[];
  transport: number;
  mealAndOtherExpenses: ExpenseItem[];
  mealAndOther: number;
  totalSpent: number; // Tổng chi phí thực tế đã thanh toán/phát sinh

  // Lợi nhuận & Dòng tiền
  grossProfit: number; // Lợi nhuận gộp theo hợp đồng: Tổng sau PLHĐ - Tổng chi
  profitMargin: number; // Tỷ suất LN gộp (%)
  cashBalance: number; // Dòng tiền ròng thực tế tại dự án: Đã thu CĐT - Tổng chi
}

/**
 * Tính toán tài chính dự án chuẩn xác, loại trừ hoàn toàn các giá trị rác hoặc hardcoded
 */
export function calculateProjectFinances(p: Project, expenses: ExpenseItem[]): ProjectFinanceCalculation {
  const safeExpenses = Array.isArray(expenses) ? expenses.filter(Boolean) : [];

  // 1. Hợp đồng & Phụ lục
  const addendums = p.addendums || [];
  const addendumTotal = addendums.reduce((sum, item) => sum + (Number(item?.totalAmount) || 0), 0);
  const originalValue = Number(p.originalContractValue) || Number(p.totalRevenue) || 0;
  const vatRate = Number(p.vatRate) || 0;
  const vatAmount = p.vatAmount !== undefined ? Number(p.vatAmount) : Math.round(originalValue * (vatRate / 100));
  const contractValueWithVat = Number(p.totalContractValueWithVat) || (originalValue + vatAmount);
  const totalAfterPLHD = contractValueWithVat + addendumTotal;

  // 2. Thu tiền CĐT (Kiểm tra thật kỹ từ danh sách Phiếu Thu của dự án)
  const receipts = getProjectReceipts(p, safeExpenses);
  const receiptsCount = receipts.length;
  const receiptsTotal = receipts.reduce(
    (sum, r) => sum + (Number(r.totalAmount) || Number(r.amount) || 0),
    0
  );

  let collected = 0;
  if (receiptsCount > 0) {
    // Ưu tiên tuyệt đối: Tính tổng thực tế các Phiếu Thu đã lập cho dự án
    collected = receiptsTotal;
  } else {
    // Dự án chưa có Phiếu Thu:
    // Kiểm tra currentAdvance đã lưu của dự án. Nếu currentAdvance lớn bất thường
    // (do lỗi hardcoded 4.5 tỷ trước đó vượt quá tổng hợp đồng), TUYỆT ĐỐI KHÔNG DÙNG và đưa về 0.
    const advance = Number(p.currentAdvance) || 0;
    if (advance > 0 && totalAfterPLHD > 0 && advance <= totalAfterPLHD) {
      collected = advance;
    } else {
      collected = 0;
    }
  }

  const remainingToCollect = Math.max(0, totalAfterPLHD - collected);
  const collectedPercentage = totalAfterPLHD > 0 ? (collected / totalAfterPLHD) * 100 : 0;

  // 3. Chi phí thực tế của dự án (Loại trừ phiếu thu revenue và các khoản bị từ chối)
  const prjExpenses = safeExpenses.filter(
    (e) => isExpenseMatchProject(e, p) && !isReceiptVoucher(e) && e.type !== 'revenue' && e.status !== 'rejected'
  );

  const laborExpenses = prjExpenses.filter(
    (e) => e.category === 'labor_sub' || (e.title && /nhân công|lương|thợ/i.test(e.title))
  );
  const labor = laborExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);

  const materialExpenses = prjExpenses.filter(
    (e) => (e.category === 'material' || e.type === 'po') && !laborExpenses.includes(e)
  );
  const material = materialExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);

  const transportExpenses = prjExpenses.filter((e) => e.category === 'transport');
  const transport = transportExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);

  const mealAndOtherExpenses = prjExpenses.filter(
    (e) => !laborExpenses.includes(e) && !materialExpenses.includes(e) && !transportExpenses.includes(e)
  );
  const mealAndOther = mealAndOtherExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);

  const totalSpent = prjExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);
  const expensesCount = prjExpenses.length;

  // 4. Lợi nhuận và Dòng tiền
  const grossProfit = totalAfterPLHD - totalSpent;
  const profitMargin = totalAfterPLHD > 0 ? (grossProfit / totalAfterPLHD) * 100 : 0;
  const cashBalance = collected - totalSpent;

  return {
    originalValue,
    vatRate,
    vatAmount,
    contractValueWithVat,
    addendumsCount: addendums.length,
    addendumTotal,
    totalAfterPLHD,

    receipts,
    receiptsCount,
    receiptsTotal,
    collected,
    remainingToCollect,
    collectedPercentage,

    expensesCount,
    laborExpenses,
    labor,
    materialExpenses,
    material,
    transportExpenses,
    transport,
    mealAndOtherExpenses,
    mealAndOther,
    totalSpent,

    grossProfit,
    profitMargin,
    cashBalance,
  };
}
