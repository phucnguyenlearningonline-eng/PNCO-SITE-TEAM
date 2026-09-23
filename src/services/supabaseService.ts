import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { ExpenseItem, Project, Supplier, User } from '../types';

// ==============================================================
// EXPENSES SERVICE
// ==============================================================
// Row mapper
export function mapRowToExpense(row: any): ExpenseItem {
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
    notes: row.notes || undefined,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
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
      notes: item.notes || null,
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

    return (data || []).map((row: any): User => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      role: row.role || 'site_engineer',
      roleTitle: row.role_title || '',
      siteName: row.site_name || '',
      monthlyLimit: Number(row.monthly_limit || 50000000),
      pin: row.pin || '1234',
      phone: row.phone || '',
      avatarColor: row.avatar_color || 'bg-sky-600',
    }));
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return null;
  }
}

export async function upsertUserToSupabase(user: User): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
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
    };

    const { error } = await supabase.from('site_users').upsert(payload);
    return !error;
  } catch (err) {
    console.error('Failed to upsert user:', err);
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
}): Promise<{ success: boolean; message: string; count: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình thông tin Supabase.', count: 0 };
  }

  try {
    // 1. Projects
    for (const p of data.projects) {
      await upsertProjectToSupabase(p);
    }

    // 2. Suppliers
    for (const s of data.suppliers) {
      await upsertSupplierToSupabase(s);
    }

    // 3. Users
    for (const u of data.users) {
      await upsertUserToSupabase(u);
    }

    // 4. Expenses
    for (const e of data.expenses) {
      await upsertExpenseToSupabase(e);
    }

    return {
      success: true,
      message: `Đồng bộ thành công ${data.expenses.length} khoản chi, ${data.projects.length} dự án, ${data.suppliers.length} đối tác lên Supabase!`,
      count: data.expenses.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi đồng bộ dữ liệu: ${err?.message || err}`,
      count: 0,
    };
  }
}
