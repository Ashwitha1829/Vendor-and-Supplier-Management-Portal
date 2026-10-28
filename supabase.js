const { createClient } = require('@supabase/supabase-js');

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!process.env.SUPABASE_URL || !serviceKey) {
  console.warn('Supabase credentials are missing. Add them to backend/.env before using database features.');
}

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://aptyhgingiemgcxrvwpt.supabase.co',
  serviceKey || 'missing-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = supabase;
