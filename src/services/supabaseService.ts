import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { ExpenseItem, Project, Supplier, User, MaterialItem } from '../types';

// ==============================================================
// EXPENSES SERVICE
// ==============================================================
// Row mapper
export function mapRowToExpense(row: any): ExpenseItem {
  let hasContract = Boolean(row.has_contract || row.hasContract || row.contract_number || row.contractNumber);
  let contractNumber = row.contract_number || row.contractNumber;
  let contractDate = row.contract_date || row.contractDate;
  let contractAdvanceAmount = typeof row.contract_advance_amount === 'number' ? row.contract_advance_amount : (typeof row.contractAdvanceAmount === 'number' ? row.contractAdvanceAmount : undefined);
  let contractAdvancePercentage = typeof row.contract_advance_percentage === 'number' ? row.contract_advance_percentage : (typeof row.contractAdvancePercentage === 'number' ? row.contractAdvancePercentage : undefined);
  let contractPaymentStages = row.contract_payment_stages || row.contractPaymentStages;
  let contractNotes = row.contract_notes || row.contractNotes;
  let contractFileUrl = row.contract_file_url || row.contractFileUrl;
  let cleanNotes = row.notes;

  // Extract embedded contract JSON comment from notes if available
  if (row.notes && typeof row.notes === 'string' && row.notes.includes('<!--CONTRACT_META:')) {
    try {
      const match = row.notes.match(/<!--CONTRACT_META:(.*?)-->/s);
      if (match && match[1]) {
        const meta = JSON.parse(match[1]);
        if (meta.hasContract !== undefined) hasContract = Boolean(meta.hasContract);
        if (meta.contractNumber) contractNumber = meta.contractNumber;
        if (meta.contractDate) contractDate = meta.contractDate;
        if (meta.contractFileUrl) contractFileUrl = meta.contractFileUrl;
        if (meta.contractAdvanceAmount !== undefined) contractAdvanceAmount = meta.contractAdvanceAmount;
        if (meta.contractAdvancePercentage !== undefined) contractAdvancePercentage = meta.contractAdvancePercentage;
        if (meta.contractPaymentStages) contractPaymentStages = meta.contractPaymentStages;
        if (meta.contractNotes) contractNotes = meta.contractNotes;
        cleanNotes = row.notes.replace(/<!--CONTRACT_META:.*?-->/s, '').trim();
      }
    } catch (e) {
      // ignore JSON parse error
    }
  }

  return {
    id: row.id,
    code: row.code,
    type: row.type,
    category: row.category,
    title: row.title,
    subDescription: row.sub_description || undefined,
    projectId: row.project_id || '',
    projectName: row.project_name || '',
    supplier: row.supplier || '',
    createdById: row.created_by_id || '',
    createdByName: row.created_by_name || '',
    createdByRole: row.created_by_role || '',
    date: row.date,
    amount: Number(row.amount || 0),
    vatRate: Number(row.vat_rate || 0),
    vatAmount: Number(row.vat_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    priority: row.priority || 'normal',
    status: row.status || 'pending',
    paymentMethod: row.payment_method || 'advance_fund',
    receiptImage: row.receipt_image || undefined,
    notes: cleanNotes || undefined,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,

    // Hợp đồng kinh tế
    hasContract: hasContract || Boolean(contractNumber),
    contractNumber: contractNumber || undefined,
    contractDate: contractDate || undefined,
    contractFileUrl: contractFileUrl || undefined,
    contractAdvanceAmount: contractAdvanceAmount,
    contractAdvancePercentage: contractAdvancePercentage,
    contractPaymentStages: Array.isArray(contractPaymentStages) ? contractPaymentStages : undefined,
    contractNotes: contractNotes || undefined,
  };
}

export async function fetchExpensesFromSupabase(): Promise<ExpenseItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch expenses error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map(mapRowToExpense);
  } catch (err) {
    console.error('Failed to load expenses from Supabase:', err);
    return null;
  }
}

export async function upsertExpenseToSupabase(item: ExpenseItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // Encode contract info into notes so it's guaranteed to persist across all database schemas
    let serializedNotes = item.notes ? item.notes.replace(/<!--CONTRACT_META:.*?-->/s, '').trim() : '';
    if (item.hasContract || item.contractNumber || item.contractFileUrl) {
      const contractMeta = {
        hasContract: Boolean(item.hasContract),
        contractNumber: item.contractNumber,
        contractDate: item.contractDate,
        contractFileUrl: item.contractFileUrl,
        contractAdvanceAmount: item.contractAdvanceAmount,
        contractAdvancePercentage: item.contractAdvancePercentage,
        contractPaymentStages: item.contractPaymentStages,
        contractNotes: item.contractNotes,
      };
      const metaComment = `<!--CONTRACT_META:${JSON.stringify(contractMeta)}-->`;
      serializedNotes = serializedNotes ? `${serializedNotes}\n${metaComment}` : metaComment;
    }

    const payload = {
      id: item.id,
      code: item.code,
      type: item.type,
      category: item.category,
      title: item.title,
      sub_description: item.subDescription || null,
      project_id: item.projectId || null,
      project_name: item.projectName,
      supplier: item.supplier,
      created_by_id: item.createdById,
      created_by_name: item.createdByName,
      created_by_role: item.createdByRole,
      date: item.date,
      amount: item.amount,
      vat_rate: item.vatRate,
      vat_amount: item.vatAmount,
      total_amount: item.totalAmount,
      priority: item.priority,
      status: item.status,
      payment_method: item.paymentMethod,
      receipt_image: item.receiptImage || null,
      notes: serializedNotes || null,
      approved_by: item.approvedBy || null,
      approved_at: item.approvedAt || null,
    };

    const { error } = await supabase.from('expenses').upsert(payload);
    if (error) {
      console.error('Supabase upsert expense error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to upsert expense:', err);
    return false;
  }
}

export async function deleteExpenseFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete expense error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete expense from Supabase:', err);
    return false;
  }
}

// ==============================================================
// REALTIME SUBSCRIPTION (ĐỒNG BỘ TỨC THỜI GIỮA CÁC MÁY TÍNH)
// ==============================================================
export function subscribeToExpensesRealtime(
  onInsert: (item: ExpenseItem) => void,
  onUpdate: (item: ExpenseItem) => void,
  onDelete: (id: string) => void
) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public-finance-realtime')
      // Lắng nghe bảng expenses (Đơn hàng PO)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.new) {
            onInsert(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.new) {
            onUpdate(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      // Lắng nghe bảng transactions (Phiếu Thu & Phiếu Chi tách biệt)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.new) {
            onInsert(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.new) {
            onUpdate(mapRowToExpense(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to start Realtime subscription:', err);
    return () => {};
  }
}

// ==============================================================
// PROJECTS SERVICE
// ==============================================================
export async function fetchProjectsFromSupabase(): Promise<Project[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase fetch projects error:', error.message);
      return null;
    }

    return (data || []).map((row: any): Project => ({
      id: row.id,
      code: row.code,
      name: row.name,
      client: row.client || '',
      totalBudget: Number(row.total_budget || 0),
      totalRevenue: Number(row.total_revenue || 0),
      currentAdvance: Number(row.current_advance || 0),
      status: row.status || 'active',
      location: row.location || '',
      manager: row.manager || '',
    }));
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    return null;
  }
}

export async function upsertProjectToSupabase(project: Project): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: project.id,
      code: project.code,
      name: project.name,
      client: project.client,
      total_budget: project.totalBudget,
      total_revenue: project.totalRevenue,
      current_advance: project.currentAdvance,
      status: project.status,
      location: project.location,
      manager: project.manager,
    };

    const { error } = await supabase.from('projects').upsert(payload);
    return !error;
  } catch (err) {
    console.error('Failed to upsert project:', err);
    return false;
  }
}

export async function deleteProjectFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete project error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete project:', err);
    return false;
  }
}

// ==============================================================
// SUPPLIERS SERVICE
// ==============================================================
export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) {
      console.warn('Supabase fetch suppliers error:', error.message);
      return null;
    }

    return (data || []).map((row: any): Supplier => ({
      id: row.id,
      name: row.name,
      type: row.type || 'material',
      phone: row.phone || '',
      contactPerson: row.contact_person || '',
      address: row.address || '',
      unpaidBalance: Number(row.unpaid_balance || 0),
    }));
  } catch (err) {
    console.error('Failed to fetch suppliers:', err);
    return null;
  }
}

export async function upsertSupplierToSupabase(supplier: Supplier): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: supplier.id,
      name: supplier.name,
      type: supplier.type,
      phone: supplier.phone,
      contact_person: supplier.contactPerson,
      address: supplier.address,
      unpaid_balance: supplier.unpaidBalance,
    };

    const { error } = await supabase.from('suppliers').upsert(payload);
    return !error;
  } catch (err) {
    console.error('Failed to upsert supplier:', err);
    return false;
  }
}

export async function deleteSupplierFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete supplier error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete supplier:', err);
    return false;
  }
}

// ==============================================================
// USERS SERVICE
// ==============================================================
export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('site_users').select('*');
    if (error) {
      console.warn('Supabase fetch users error:', error.message);
      return null;
    }

    return (data || []).map((row: any): User => {
      const isMinh = row.id === 'u-1' || (row.name && row.name.toLowerCase().includes('trần anh minh')) || row.username === 'Pncons';
      return {
        id: row.id,
        name: row.name,
        email: row.email || '',
        username: row.username || (isMinh ? 'Pncons' : ''),
        password: row.password || (isMinh ? 'Minhatea1987@' : ''),
        role: row.role || 'site_engineer',
        roleTitle: row.role_title || '',
        siteName: row.site_name || '',
        monthlyLimit: Number(row.monthly_limit || 50000000),
        pin: row.pin || '1234',
        phone: row.phone || '',
        avatarColor: row.avatar_color || 'bg-sky-600',
        isAuthorized: row.is_authorized !== undefined ? Boolean(row.is_authorized) : isMinh,
        permissions: row.permissions || undefined,
      };
    });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return null;
  }
}

export async function upsertUserToSupabase(user: User): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      role_title: user.roleTitle,
      site_name: user.siteName,
      monthly_limit: user.monthlyLimit,
      pin: user.pin,
      phone: user.phone,
      avatar_color: user.avatarColor,
      is_authorized: user.isAuthorized,
      username: user.username,
      password: user.password,
      permissions: user.permissions,
    };

    const { error } = await supabase.from('site_users').upsert(payload);
    return !error;
  } catch (err) {
    console.error('Failed to upsert user:', err);
    return false;
  }
}

// ==============================================================
// MATERIALS SERVICE
// ==============================================================
export function mapRowToMaterial(row: any): MaterialItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category || 'fire_protection',
    subCategory: row.sub_category || undefined,
    unit: row.unit || 'Cái',
    unitPrice: row.unit_price !== null && row.unit_price !== undefined ? Number(row.unit_price) : undefined,
    vatRate: row.vat_rate !== null && row.vat_rate !== undefined ? Number(row.vat_rate) : 10,
    stockQuantity: Number(row.stock_quantity || 0),
    minStock: Number(row.min_stock || 10),
    warehouseLocation: row.warehouse_location || 'Kho Tổng Dĩ An (Bình Dương)',
    shelfLocation: row.shelf_location || undefined,
    brand: row.brand || undefined,
    supplier: row.supplier || undefined,
    catalogueUrl: row.catalogue_url || undefined,
    specifications: row.specifications || undefined,
    imageUrl: row.image_url || undefined,
  };
}

export async function fetchMaterialsFromSupabase(): Promise<MaterialItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.warn('Supabase fetch materials warning (có thể bảng materials chưa được tạo):', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(mapRowToMaterial);
  } catch (err) {
    console.error('Failed to load materials from Supabase:', err);
    return null;
  }
}

export async function upsertMaterialToSupabase(item: MaterialItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category || 'fire_protection',
      sub_category: item.subCategory || null,
      unit: item.unit,
      unit_price: item.unitPrice !== undefined ? item.unitPrice : null,
      vat_rate: item.vatRate !== undefined ? item.vatRate : 10,
      stock_quantity: item.stockQuantity,
      min_stock: item.minStock !== undefined ? item.minStock : 10,
      warehouse_location: item.warehouseLocation || 'Kho Tổng Dĩ An (Bình Dương)',
      shelf_location: item.shelfLocation || null,
      brand: item.brand || null,
      supplier: item.supplier || null,
      catalogue_url: item.catalogueUrl || null,
      specifications: item.specifications || null,
      image_url: item.imageUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('materials').upsert(payload);
    if (error) {
      console.error('Supabase upsert material error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to upsert material:', err);
    return false;
  }
}

export async function deleteMaterialFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete material error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete material:', err);
    return false;
  }
}

// ==============================================================
// TRANSACTIONS SERVICE (BẢNG QUẢN LÝ THU - CHI)
// ==============================================================
export async function fetchTransactionsFromSupabase(): Promise<ExpenseItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch transactions error:', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(mapRowToExpense);
  } catch (err) {
    console.error('Failed to load transactions from Supabase:', err);
    return null;
  }
}

export async function upsertTransactionToSupabase(item: ExpenseItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: item.id,
      code: item.code,
      type: item.type === 'revenue' ? 'revenue' : 'expense',
      category: item.category || 'other',
      title: item.title,
      sub_description: item.subDescription || null,
      project_id: item.projectId || null,
      project_name: item.projectName || '',
      supplier: item.supplier || '',
      receiver_or_payer: item.receiverOrPayer || item.supplier || '',
      created_by_id: item.createdById || null,
      created_by_name: item.createdByName || '',
      created_by_role: item.createdByRole || '',
      date: item.date,
      amount: item.amount || item.totalAmount || 0,
      vat_rate: item.vatRate || 0,
      vat_amount: item.vatAmount || 0,
      total_amount: item.totalAmount || 0,
      priority: item.priority || 'normal',
      status: item.status || 'paid',
      payment_method: item.paymentMethod || 'transfer',
      bank_account: item.bankAccount || null,
      receipt_image: item.receiptImage || null,
      notes: item.notes || null,
      linked_po_id: item.linkedPoId || null,
      linked_po_code: item.linkedPoCode || null,
      approved_by: item.approvedBy || null,
      approved_at: item.approvedAt || null,
    };

    const { error } = await supabase.from('transactions').upsert(payload);
    if (error) {
      console.error('Supabase upsert transaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to upsert transaction:', err);
    return false;
  }
}

export async function deleteTransactionFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete transaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete transaction:', err);
    return false;
  }
}

// Helper xác định một bản ghi là Phiếu Thu / Phiếu Chi hay Đơn Hàng PO
export function isTransactionRecord(item: { type?: string; code?: string; id?: string }): boolean {
  if (!item) return false;
  if (item.type === 'revenue') return true;
  if (item.code && (item.code.startsWith('PT-') || item.code.startsWith('PC-'))) return true;
  if (item.id && (item.id.startsWith('pay-') || item.id.startsWith('rcp-') || item.id.startsWith('pt-') || item.id.startsWith('pc-'))) return true;
  return false;
}

// Lưu thông minh vào đúng bảng chuyên biệt: Phiếu thu chi -> transactions | Đơn hàng PO -> expenses
export async function saveRecordToAppropriateTable(item: ExpenseItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  if (isTransactionRecord(item)) {
    // 1. Lưu vào bảng transactions
    const ok = await upsertTransactionToSupabase(item);
    // 2. Tách sạch: Xóa khỏi bảng expenses nếu trước đây bị lưu nhầm vào expenses
    try {
      await supabase.from('expenses').delete().eq('id', item.id);
    } catch (e) {
      // ignore
    }
    return ok;
  } else {
    // 1. Lưu vào bảng expenses (Đơn hàng mua sắm vật tư PO)
    const ok = await upsertExpenseToSupabase(item);
    // 2. Xóa khỏi bảng transactions nếu có
    try {
      await supabase.from('transactions').delete().eq('id', item.id);
    } catch (e) {
      // ignore
    }
    return ok;
  }
}

// Xóa bản ghi ở đúng bảng chuyên biệt
export async function deleteRecordFromAppropriateTable(id: string, code?: string, type?: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const isTx = isTransactionRecord({ id, code, type });
  if (isTx) {
    const ok = await deleteTransactionFromSupabase(id);
    await deleteExpenseFromSupabase(id); // đảm bảo sạch cả 2 bảng
    return ok;
  } else {
    const ok = await deleteExpenseFromSupabase(id);
    await deleteTransactionFromSupabase(id);
    return ok;
  }
}

// Hàm tự động tách & dọn dẹp Phiếu Thu Chi ra khỏi bảng expenses trên Supabase
export async function separateAndCleanTransactionsOnSupabase(): Promise<{
  success: boolean;
  message: string;
  transferredCount: number;
  remainingOrdersCount: number;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình Supabase.', transferredCount: 0, remainingOrdersCount: 0 };
  }

  try {
    // 1. Đọc toàn bộ bản ghi hiện có trong bảng expenses
    const { data: allExpenses, error: fetchErr } = await supabase.from('expenses').select('*');
    if (fetchErr) {
      return { success: false, message: `Lỗi đọc bảng expenses: ${fetchErr.message}`, transferredCount: 0, remainingOrdersCount: 0 };
    }

    if (!allExpenses || allExpenses.length === 0) {
      return { success: true, message: 'Bảng expenses hiện tại chưa có dữ liệu.', transferredCount: 0, remainingOrdersCount: 0 };
    }

    // 2. Phân loại: Phiếu Thu/Chi vs Đơn Hàng PO
    const transactionRows = allExpenses.filter((row: any) => isTransactionRecord(row));
    const orderRows = allExpenses.filter((row: any) => !isTransactionRecord(row));

    // 3. Đẩy toàn bộ Phiếu Thu / Chi vào bảng transactions
    let transferred = 0;
    for (const row of transactionRows) {
      const item = mapRowToExpense(row);
      const ok = await upsertTransactionToSupabase(item);
      if (ok) transferred++;
    }

    // 4. Xóa toàn bộ Phiếu Thu / Chi ra khỏi bảng expenses để bảng expenses CHỈ CÒN ĐƠN HÀNG PO
    if (transactionRows.length > 0) {
      const idsToDelete = transactionRows.map((r: any) => r.id);
      for (let i = 0; i < idsToDelete.length; i += 40) {
        const chunk = idsToDelete.slice(i, i + 40);
        await supabase.from('expenses').delete().in('id', chunk);
      }
    }

    return {
      success: true,
      message: `Đã tách thành công ${transferred} phiếu thu & chi sang bảng 'transactions' và xóa sạch khỏi bảng 'expenses'. Bảng 'expenses' hiện chỉ còn ${orderRows.length} đơn hàng PO.`,
      transferredCount: transferred,
      remainingOrdersCount: orderRows.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi tách dữ liệu: ${err?.message || err}`,
      transferredCount: 0,
      remainingOrdersCount: 0,
    };
  }
}

// ==============================================================
// MIGRATE ALL LOCAL DATA TO SUPABASE (1-CLICK SYNC ĐÃ TÁCH BIỆT)
// ==============================================================
export async function syncAllLocalDataToSupabase(data: {
  projects: Project[];
  suppliers: Supplier[];
  users: User[];
  expenses: ExpenseItem[];
  materials?: MaterialItem[];
}): Promise<{ success: boolean; message: string; count: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình thông tin Supabase.', count: 0 };
  }

  try {
    let failedCount = 0;

    // 1. Projects
    for (const p of data.projects) {
      const ok = await upsertProjectToSupabase(p);
      if (!ok) failedCount++;
    }

    // 2. Suppliers
    for (const s of data.suppliers) {
      const ok = await upsertSupplierToSupabase(s);
      if (!ok) failedCount++;
    }

    // 3. Users
    for (const u of data.users) {
      const ok = await upsertUserToSupabase(u);
      if (!ok) failedCount++;
    }

    // 4. Đơn hàng PO -> CHỈ LƯU VÀO BẢNG EXPENSES
    const orderList = data.expenses.filter((e) => !isTransactionRecord(e));
    for (const order of orderList) {
      const ok = await upsertExpenseToSupabase(order);
      if (!ok) failedCount++;
    }

    // 5. Phiếu Thu & Phiếu Chi -> CHỈ LƯU VÀO BẢNG TRANSACTIONS (VÀ XÓA KHỎI EXPENSES NẾU CÓ)
    const transactionList = data.expenses.filter((e) => isTransactionRecord(e));
    for (const tx of transactionList) {
      const ok = await upsertTransactionToSupabase(tx);
      if (!ok) console.warn('Could not sync to transactions table (may need schema update)');
      // Xóa khỏi bảng expenses để không bị combine
      try {
        await supabase.from('expenses').delete().eq('id', tx.id);
      } catch (e) {
        // ignore
      }
    }

    // 6. Materials (Vật tư thi công & sản phẩm)
    if (data.materials && data.materials.length > 0) {
      for (const m of data.materials) {
        const ok = await upsertMaterialToSupabase(m);
        if (!ok) failedCount++;
      }
    }

    if (failedCount > 0) {
      return {
        success: false,
        message: `Có ${failedCount} bản ghi không thể ghi vào Supabase. Vui lòng kiểm tra quyền RLS các bảng.`,
        count: (orderList.length + transactionList.length + (data.materials?.length || 0)) - failedCount,
      };
    }

    const matMsg = data.materials?.length ? `, ${data.materials.length} vật tư` : '';
    const txMsg = transactionList.length ? `, ${transactionList.length} phiếu thu chi (bảng transactions)` : '';
    return {
      success: true,
      message: `Đã đồng bộ tách biệt thành công: ${orderList.length} đơn hàng PO (bảng expenses)${txMsg}, ${data.projects.length} dự án${matMsg} lên Supabase!`,
      count: orderList.length + transactionList.length + (data.materials?.length || 0),
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi đồng bộ dữ liệu: ${err?.message || err}`,
      count: 0,
    };
  }
}
