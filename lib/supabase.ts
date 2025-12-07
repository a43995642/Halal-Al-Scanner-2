
import { createClient } from '@supabase/supabase-js';

// These environment variables will be exposed by Vite
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file or Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
