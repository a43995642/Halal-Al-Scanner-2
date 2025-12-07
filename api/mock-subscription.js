
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key (Admin Access)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
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
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return response.status(500).json({ error: 'Server Misconfiguration' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, plan } = request.body;

    if (!userId) {
      return response.status(400).json({ error: 'Missing userId' });
    }

    // In a real app, you would verify a Stripe/Payment signature here.
    // For this demo, we simply upgrade the user in the database.

    // 1. Update user to premium
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({ 
        id: userId, 
        is_premium: true,
        // Optional: track plan type if you added that column
      }, { onConflict: 'id' })
      .select();

    if (error) throw error;

    return response.status(200).json({ success: true, message: 'Upgraded successfully', data });

  } catch (error) {
    console.error("Subscription Error:", error);
    return response.status(500).json({ error: 'Upgrade Failed', details: error.message });
  }
}
