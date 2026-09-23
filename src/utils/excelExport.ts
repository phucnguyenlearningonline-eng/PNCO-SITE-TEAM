import * as XLSX from 'xlsx';
import { ExpenseItem } from '../types';
import { formatDateVN, getCategoryLabel, getPriorityLabel, getStatusLabel } from './formatters';

interface ExportOptions {
  items: ExpenseItem[];
  reportTitle?: string;
  periodLabel?: string;
  projectName?: string;
  exportedBy?: string;
}

export function exportExpensesToExcel({
  items,
  reportTitle = 'BẢNG KÊ QUẢN LÝ CHI TIÊU & MUA HÀNG TẠI SITE',
  periodLabel = 'Kỳ Tháng 09/2026',
  projectName = 'Tất cả công trình',
  exportedBy = 'Hệ Thống Kế Toán Phúc Nguyên M&E',
}: ExportOptions) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // 1. Detailed Expenses Sheet Data
  const sheetRows: (string | number)[][] = [];

  // Header banner info
  sheetRows.push(['CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN']);
  sheetRows.push(['HỆ THỐNG QUẢN LÝ TÀI CHÍNH & CHI TIÊU CÔNG TRƯỜNG (M&E EPC CONTRACTOR)']);
  sheetRows.push([reportTitle.toUpperCase()]);
  sheetRows.push([`Kỳ xem: ${periodLabel} | Dự án: ${projectName}`]);
  sheetRows.push([`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')} | Người xuất: ${exportedBy}`]);
  sheetRows.push([]); // blank line

  // Column Headers
  const headers = [
    'STT',
    'Mã Phiếu / PO',
    'Ngày Chi',
    'Tên Hạng Mục / Khoản Chi / Tên Vật Tư',
    'Quy Cách / Mô Tả',
    'Phân Loại Chi Tiêu',
    'Dự Án Thi Công',
    'Nhà Cung Cấp / Nhà Xe / Quán Ăn',
    'Người Lập Phiếu',
    'Tiền Hàng Trước Thuế (VNĐ)',
    'Thuế VAT (VNĐ)',
    'Tổng Thanh Toán (VNĐ)',
    'Hình Thức Chi',
    'Mức Ưu Tiên',
    'Trạng Thái',
    'Ghi Chú',
  ];
  sheetRows.push(headers);

  let totalAmountSum = 0;
  let totalVatSum = 0;
  let totalPaySum = 0;

  // Data rows
  items.forEach((item, index) => {
    totalAmountSum += item.amount;
    totalVatSum += item.vatAmount;
    totalPaySum += item.totalAmount;

    let paymentMethodText = 'Tiền mặt';
    if (item.paymentMethod === 'transfer') paymentMethodText = 'Chuyển khoản';
    if (item.paymentMethod === 'advance_fund') paymentMethodText = 'Tạm ứng quỹ site';

    sheetRows.push([
      index + 1,
      item.code,
      formatDateVN(item.date),
      item.title,
      item.subDescription || '',
      getCategoryLabel(item.category),
      item.projectName,
      item.supplier,
      `${item.createdByName} (${item.createdByRole})`,
      item.amount,
      item.vatAmount,
      item.totalAmount,
      paymentMethodText,
      getPriorityLabel(item.priority),
      getStatusLabel(item.status),
      item.notes || '',
    ]);
  });

  // Summary Row
  sheetRows.push([
    '',
    'TỔNG CỘNG',
    '',
    `Tổng số lượng: ${items.length} khoản chi`,
    '',
    '',
    '',
    '',
    '',
    totalAmountSum,
    totalVatSum,
    totalPaySum,
    '',
    '',
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 16 }, // Mã PO
    { wch: 13 }, // Ngày
    { wch: 38 }, // Tên Hạng Mục
    { wch: 32 }, // Mô tả
    { wch: 22 }, // Phân loại
    { wch: 30 }, // Dự Án
    { wch: 30 }, // Nhà cung cấp
    { wch: 25 }, // Người Lập
    { wch: 18 }, // Tiền hàng
    { wch: 15 }, // Thuế VAT
    { wch: 20 }, // Tổng Thanh Toán
    { wch: 16 }, // Hình Thức
    { wch: 12 }, // Mức Ưu Tiên
    { wch: 16 }, // Trạng Thái
    { wch: 30 }, // Ghi Chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'So_Chi_Tiet_Chi_Tieu_Site');

  // 2. Summary by Category Sheet (Báo cáo theo phân loại: Vật tư, Vận chuyển, Cơm tăng ca)
  const categorySummaryMap: Record<string, { count: number; total: number; vat: number; pay: number }> = {};
  items.forEach(item => {
    const catLabel = getCategoryLabel(item.category);
    if (!categorySummaryMap[catLabel]) {
      categorySummaryMap[catLabel] = { count: 0, total: 0, vat: 0, pay: 0 };
    }
    categorySummaryMap[catLabel].count += 1;
    categorySummaryMap[catLabel].total += item.amount;
    categorySummaryMap[catLabel].vat += item.vatAmount;
    categorySummaryMap[catLabel].pay += item.totalAmount;
  });

  const catRows: (string | number)[][] = [
    ['CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN'],
    ['BẢNG TỔNG HỢP CHI PHÍ SITE THEO PHÂN LOẠI HẠNG MỤC'],
    [`Kỳ xem: ${periodLabel}`],
    [],
    ['STT', 'Phân Loại Khoản Chi', 'Số Phiếu', 'Tiền Hàng (VNĐ)', 'Thuế VAT (VNĐ)', 'Tổng Tiền (VNĐ)', 'Tỷ Trọng (%)'],
  ];

  let catIdx = 1;
  Object.entries(categorySummaryMap).forEach(([catName, data]) => {
    const percentage = totalPaySum > 0 ? ((data.pay / totalPaySum) * 100).toFixed(1) + '%' : '0%';
    catRows.push([
      catIdx++,
      catName,
      data.count,
      data.total,
      data.vat,
      data.pay,
      percentage,
    ]);
  });
  catRows.push(['', 'TỔNG CỘNG', items.length, totalAmountSum, totalVatSum, totalPaySum, '100%']);

  const wsCat = XLSX.utils.aoa_to_sheet(catRows);
  wsCat['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCat, 'Tong_Hop_Theo_Loai_Chi');

  // 3. Summary by Project Sheet
  const projectSummaryMap: Record<string, { count: number; pay: number }> = {};
  items.forEach(item => {
    const pName = item.projectName;
    if (!projectSummaryMap[pName]) {
      projectSummaryMap[pName] = { count: 0, pay: 0 };
    }
    projectSummaryMap[pName].count += 1;
    projectSummaryMap[pName].pay += item.totalAmount;
  });

  const prjRows: (string | number)[][] = [
    ['CÔNG TY TNHH XÂY DỰNG - CƠ ĐIỆN PHÚC NGUYÊN'],
    ['BẢNG TỔNG HỢP CHI TIÊU THEO CÔNG TRÌNH / DỰ ÁN'],
    [`Kỳ xem: ${periodLabel}`],
    [],
    ['STT', 'Tên Dự Án Thi Công', 'Số Lượng Giao Dịch', 'Tổng Chi Phí (VNĐ)', 'Tỷ Trọng (%)'],
  ];

  let prjIdx = 1;
  Object.entries(projectSummaryMap).forEach(([pName, data]) => {
    const percentage = totalPaySum > 0 ? ((data.pay / totalPaySum) * 100).toFixed(1) + '%' : '0%';
    prjRows.push([
      prjIdx++,
      pName,
      data.count,
      data.pay,
      percentage,
    ]);
  });
  prjRows.push(['', 'TỔNG CỘNG', items.length, totalPaySum, '100%']);

  const wsPrj = XLSX.utils.aoa_to_sheet(prjRows);
  wsPrj['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPrj, 'Tong_Hop_Theo_Du_An');

  // Generate file name
  const safePeriod = periodLabel.replace(/[\/\s:]/g, '_');
  const fileName = `PhucNguyen_BaoCao_ChiTieuSite_${safePeriod}_${Date.now()}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, fileName);
}
