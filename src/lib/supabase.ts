import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if URL is valid to prevent crash on startup
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Helper to check if supabase is configured
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;
