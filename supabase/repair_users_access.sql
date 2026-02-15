-- ============================================================
-- Repair users table access (fixes 403 on /rest/v1/users)
-- Run this in Supabase SQL Editor if frontend sees 403 on users
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all users" ON public.users;
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.users;
CREATE POLICY "Users can update their own profile (except role)" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role = 'user'
  );

DROP POLICY IF EXISTS "Service role can create users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT TO service_role
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;

-- Ensure enum type usage is allowed for selecting/updating enum-backed columns
GRANT USAGE ON TYPE public.user_role TO anon, authenticated;

-- Safety grants after schema resets
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
