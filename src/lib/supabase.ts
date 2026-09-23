import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_SUPABASE_KEY = 'phuc_nguyen_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Get config from localStorage or env vars
export function getSupabaseConfig(): SupabaseConfig {
  const localSaved = localStorage.getItem(STORAGE_SUPABASE_KEY);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(STORAGE_SUPABASE_KEY, JSON.stringify(config));
  cachedClient = null; // reset client
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.includes('supabase.co'));
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const { url, anonKey } = getSupabaseConfig();
  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// Quick health check / ping to Supabase
export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const targetConfig = config || getSupabaseConfig();
    if (!targetConfig.url || !targetConfig.anonKey) {
      return { success: false, message: 'Chưa nhập URL hoặc Anon Key của Supabase.' };
    }

    const testClient = createClient(targetConfig.url, targetConfig.anonKey);
    const { error } = await testClient.from('projects').select('count', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, but connection reached Supabase
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Kết nối Supabase thành công! Tuy nhiên các bảng dữ liệu chưa được tạo. Hãy chạy file supabase/schema.sql.' 
        };
      }
      return { success: false, message: `Lỗi kết nối: ${error.message} (${error.code || ''})` };
    }

    return { success: true, message: 'Kết nối Supabase PostgreSQL thành công 100%! Bảng dữ liệu sẵn sàng.' };
  } catch (err: any) {
    return { success: false, message: `Không thể kết nối tới Supabase: ${err?.message || err}` };
  }
}
