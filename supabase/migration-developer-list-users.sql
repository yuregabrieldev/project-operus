-- ============================================================
-- RPC function to let developers list all profiles (bypasses RLS).
-- Run in the Supabase SQL Editor.
-- ============================================================

-- Returns all non-developer profiles for the DevUsers page.
-- Only developers (by role or allowlisted email) can call it.
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_developer()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id, p.name, p.email, p.role, p.is_active, p.created_at
  FROM profiles p
  WHERE (
    (SELECT pr.role FROM profiles pr WHERE pr.id = auth.uid()) = 'developer'
    OR public.is_developer_by_email()
  )
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_developer() TO authenticated;
