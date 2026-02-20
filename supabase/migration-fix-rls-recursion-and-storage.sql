-- ============================================================
-- FIX: Infinite recursion on profiles + brand-images bucket
-- Run in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. Fix is_developer() to NOT query profiles (which causes
--    infinite recursion when a Developer-full-access policy
--    on profiles itself calls is_developer()).
--    Uses auth.jwt() metadata instead.
-- ============================================================
-- Helper: check profiles.role directly, bypassing RLS
CREATE OR REPLACE FUNCTION public.is_developer_by_profile()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT
    -- Check JWT metadata first (fast, no table query)
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'developer',
      false
    )
    OR
    -- Check profiles.role via SECURITY DEFINER (bypasses RLS, no recursion)
    public.is_developer_by_profile()
    OR
    -- Fallback: check developer_emails allowlist
    public.is_developer_by_email();
$$;

-- ============================================================
-- 2. Drop ALL existing policies on profiles to start clean
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- ============================================================
-- 3. Create simple, non-recursive profiles policies
-- ============================================================

-- Everyone can read own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Developers can read ALL profiles
CREATE POLICY "profiles_select_developer"
  ON profiles FOR SELECT
  USING (public.is_developer());

-- Users can update their own safe fields (role/permissions protected by trigger)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Developers can update any profile
CREATE POLICY "profiles_update_developer"
  ON profiles FOR UPDATE
  USING (public.is_developer());

-- Insert: allow trigger-based profile creation on signup
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Developers can insert profiles
CREATE POLICY "profiles_insert_developer"
  ON profiles FOR INSERT
  WITH CHECK (public.is_developer());

-- Developers can delete profiles
CREATE POLICY "profiles_delete_developer"
  ON profiles FOR DELETE
  USING (public.is_developer());

-- ============================================================
-- 4. Create brand-images storage bucket (if not exists)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-images',
  'brand-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to brand-images
CREATE POLICY "Authenticated can upload brand images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-images');

-- Allow public read access to brand-images
CREATE POLICY "Public can read brand images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'brand-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated can update brand images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brand-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated can delete brand images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-images');
