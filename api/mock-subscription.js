
import { createClient } from '@supabase/supabase-js';

// Configuration
const PROJECT_URL = 'https://lrnvtsnacrmnnsitdubz.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybnZ0c25hY3Jtbm5zaXRkdWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODYyMTgsImV4cCI6MjA4MDY2MjIxOH0.BUdC_qXw5iPDnObA5SGAHgOfydzxSP2xro618o6wn0g';

const supabaseUrl = process.env.VITE_SUPABASE_URL || PROJECT_URL;
// Use SERVICE_ROLE_KEY if available (Production), otherwise fallback keys for testing
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export default async function handler(request, response) {
  // 1. CORS Headers
  // ⚠️ FIXED: Dynamically set Access-Control-Allow-Origin to request.headers.origin
  const origin = request.headers.origin;

  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', origin || '*'); 
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabaseServiceKey) {
    console.error("Missing Supabase Keys");
    return response.status(500).json({ error: 'Server Misconfiguration: Missing Service Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, plan } = request.body;

    if (!userId) {
      return response.status(400).json({ error: 'Missing userId' });
    }

    // 1. Update user to premium securely on the backend
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({ 
        id: userId, 
        is_premium: true,
        // Reset scan count on upgrade if you want, or keep tracking
      }, { onConflict: 'id' })
      .select();

    if (error) throw error;

    return response.status(200).json({ success: true, message: 'Upgraded successfully', data });

  } catch (error) {
    console.error("Subscription Error:", error);
    return response.status(500).json({ error: 'Upgrade Failed', details: error.message });
  }
}
