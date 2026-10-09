import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oktfhfhtcklnknahfyla.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MLkJN7mEuIjjuMU0M3eCXA_rEuD2dqY';

export const supabase = createClient(supabaseUrl, supabaseKey);
