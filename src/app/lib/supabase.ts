import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl) {
  throw new Error('Falta VITE_SUPABASE_URL en .env.local');
}

if (!supabaseAnonKey) {
  throw new Error('Falta VITE_SUPABASE_ANON_KEY en .env.local');
}

const cleanSupabaseUrl = supabaseUrl
  .replace('/rest/v1/', '')
  .replace('/rest/v1', '')
  .replace(/\/$/, '');

export const supabase = createClient(cleanSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});