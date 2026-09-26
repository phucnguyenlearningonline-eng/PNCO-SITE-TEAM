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
    if (item.hasContract || item.contractNumber) {
      const contractMeta = {
        hasContract: Boolean(item.hasContract),
        contractNumber: item.contractNumber,
        contractDate: item.contractDate,
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
      .channel('public-expenses-realtime')
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
// MIGRATE ALL LOCAL DATA TO SUPABASE (1-CLICK SYNC)
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

    // 4. Expenses
    for (const e of data.expenses) {
      const ok = await upsertExpenseToSupabase(e);
      if (!ok) failedCount++;
    }

    // 5. Materials (Vật tư thi công & sản phẩm)
    if (data.materials && data.materials.length > 0) {
      for (const m of data.materials) {
        const ok = await upsertMaterialToSupabase(m);
        if (!ok) failedCount++;
      }
    }

    if (failedCount > 0) {
      return {
        success: false,
        message: `Có ${failedCount} bản ghi không thể ghi vào Supabase. Vui lòng kiểm tra xem bạn đã tạo bảng 'materials' và cấp quyền RLS chưa.`,
        count: (data.expenses.length + (data.materials?.length || 0)) - failedCount,
      };
    }

    const matMsg = data.materials?.length ? `, ${data.materials.length} vật tư` : '';
    return {
      success: true,
      message: `Đồng bộ thành công ${data.expenses.length} khoản chi, ${data.projects.length} dự án, ${data.suppliers.length} đối tác${matMsg} lên Supabase!`,
      count: data.expenses.length + (data.materials?.length || 0),
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi đồng bộ dữ liệu: ${err?.message || err}`,
      count: 0,
    };
  }
}
