
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
const supabaseKey = (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

if (!supabaseUrl || !supabaseKey || supabaseKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('CRITICAL: Supabase URL or Service Role Key is missing or invalid!');
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);
