-- ========================================================
-- Supabase Setup Script for NMIET & ISTE Assessment Platform
-- Project: https://oktfhfhtcklnknahfyla.supabase.co
-- ========================================================
-- Run this in your Supabase Dashboard:
-- 1. Open: https://supabase.com/dashboard/project/oktfhfhtcklnknahfyla/sql/new
-- 2. Paste this entire script into the SQL Editor.
-- 3. Click "Run" (or Ctrl + Enter).
-- ========================================================

-- 1. Create the persistent key-value store table
CREATE TABLE IF NOT EXISTS public.fdp_store (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.fdp_store ENABLE ROW LEVEL SECURITY;

-- 3. Create public policy allowing the application's publishable key to read, insert, and update
DROP POLICY IF EXISTS "Allow anon all on fdp_store" ON public.fdp_store;
CREATE POLICY "Allow anon all on fdp_store" 
ON public.fdp_store 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Insert initial master registry record if not exists
INSERT INTO public.fdp_store (id, data, updated_at)
VALUES ('master', '{"version": 1, "users": [], "attempts": [], "certificates": [], "answers": []}'::jsonb, now())
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT * FROM public.fdp_store WHERE id = 'master';
