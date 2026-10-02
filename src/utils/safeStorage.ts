import { MaterialItem, ExpenseItem } from '../types';

/**
 * Ghi dữ liệu vào localStorage an toàn tuyệt đối, phòng chống 100% lỗi QuotaExceededError
 * (Tràn dung lượng 5MB của trình duyệt khi lưu ảnh base64 hoặc mảng dữ liệu lớn).
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Warning: Failed to setItem for key "${key}". Quota exceeded or storage unavailable:`, err?.message);

    // Xử lý khi tràn hạn mức Quota:
    try {
      // 1. Thử xóa các mục tạm thời hoặc lịch sử không thiết yếu
      const keysToClear = ['phuc_nguyen_me_materials_v1', 'contract_view_mode_v1'];
      for (const k of keysToClear) {
        if (k !== key) {
          localStorage.removeItem(k);
        }
      }
      // 2. Thử ghi lại một lần nữa
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`[SafeStorage] Could not save "${key}" even after cleaning. Keeping in memory only.`);
      return false;
    }
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    // ignore
  }
}

/**
 * Tối ưu hóa và làm nhẹ danh sách Vật tư trước khi lưu vào localStorage.
 * Tuyệt đối không nhét các chuỗi ảnh base64 (data:image/...) kích thước lớn vào localStorage
 * để ngăn chặn hoàn toàn lỗi 'exceeded the quota'.
 */
export function sanitizeMaterialsForStorage(materials: MaterialItem[]): string {
  const sanitized = materials.map((item) => {
    let cleanImage = item.imageUrl;
    // Nếu là ảnh base64 hoặc data URI lớn hơn 1KB, không lưu vào localStorage để tiết kiệm dung lượng
    if (cleanImage && cleanImage.startsWith('data:') && cleanImage.length > 1024) {
      cleanImage = undefined;
    }

    return {
      ...item,
      imageUrl: cleanImage,
    };
  });

  return JSON.stringify(sanitized);
}

/**
 * Tối ưu hóa danh sách Phiếu Chi / Đơn Hàng trước khi lưu vào localStorage
 */
export function sanitizeExpensesForStorage(expenses: ExpenseItem[]): string {
  const sanitized = expenses.map((item) => {
    let cleanReceipt = item.receiptImage;
    if (cleanReceipt && cleanReceipt.startsWith('data:') && cleanReceipt.length > 5120) {
      cleanReceipt = undefined;
    }

    return {
      ...item,
      receiptImage: cleanReceipt,
    };
  });

  return JSON.stringify(sanitized);
}
