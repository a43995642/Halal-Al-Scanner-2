
import { createClient } from '@supabase/supabase-js';

// Configuration
// We use the provided Project URL as a fallback to ensure connection works immediately.
// The ANON_KEY must still be provided via environment variables for security.
const PROJECT_URL = 'https://lrnvtsnacrmnnsitdubz.supabase.co';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('⚠️ Supabase Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
