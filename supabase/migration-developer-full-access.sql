-- Migration: Allow developer to fully manage user_brands (insert, update, delete)
-- Run this in the Supabase SQL Editor.

-- Developer can delete user_brands (for removing user from brand when deleting/editing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete user_brands'
  ) THEN
    CREATE POLICY "Developer can delete user_brands"
      ON user_brands FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can insert user_brands (for assigning users to brands)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can insert user_brands'
  ) THEN
    CREATE POLICY "Developer can insert user_brands"
      ON user_brands FOR INSERT
      WITH CHECK (public.is_developer());
  END IF;
END $$;

-- Developer can update user_brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update user_brands'
  ) THEN
    CREATE POLICY "Developer can update user_brands"
      ON user_brands FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can delete brands (if not already allowed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete brands'
  ) THEN
    CREATE POLICY "Developer can delete brands"
      ON brands FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can delete stores (if not already allowed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete stores'
  ) THEN
    CREATE POLICY "Developer can delete stores"
      ON stores FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can read all stores (for DevBrands store listing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can read all stores'
  ) THEN
    CREATE POLICY "Developer can read all stores"
      ON stores FOR SELECT
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can update all stores
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update all stores'
  ) THEN
    CREATE POLICY "Developer can update all stores"
      ON stores FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can insert stores
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can insert stores'
  ) THEN
    CREATE POLICY "Developer can insert stores"
      ON stores FOR INSERT
      WITH CHECK (public.is_developer());
  END IF;
END $$;

-- Developer can read all brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can read all brands'
  ) THEN
    CREATE POLICY "Developer can read all brands"
      ON brands FOR SELECT
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can update all brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update all brands'
  ) THEN
    CREATE POLICY "Developer can update all brands"
      ON brands FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can insert brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can insert brands'
  ) THEN
    CREATE POLICY "Developer can insert brands"
      ON brands FOR INSERT
      WITH CHECK (public.is_developer());
  END IF;
END $$;

-- Developer can delete registration_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete registration_requests'
  ) THEN
    CREATE POLICY "Developer can delete registration_requests"
      ON registration_requests FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can update registration_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update registration_requests'
  ) THEN
    CREATE POLICY "Developer can update registration_requests"
      ON registration_requests FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;
