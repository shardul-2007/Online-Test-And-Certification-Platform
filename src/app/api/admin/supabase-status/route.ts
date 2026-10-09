import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.email.toLowerCase() !== 'shardulparihar2007@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('fdp_store')
      .select('id, updated_at')
      .eq('id', 'master')
      .maybeSingle();

    if (error && error.code === 'PGRST205') {
      return NextResponse.json({
        success: true,
        connected: false,
        tableExists: false,
        message: "Supabase credentials connected, but table 'fdp_store' does not exist yet. Please run the SQL migration in Supabase SQL editor.",
        sql: `CREATE TABLE IF NOT EXISTS public.fdp_store (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.fdp_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on fdp_store" 
ON public.fdp_store 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);`,
      });
    }

    if (error) {
      return NextResponse.json({
        success: true,
        connected: true,
        tableExists: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      tableExists: true,
      lastSync: data?.updated_at || null,
      message: 'Supabase PostgreSQL database is fully connected and active!',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
