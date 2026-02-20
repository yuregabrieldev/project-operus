-- ============================================================
-- Developer RPC Functions (SECURITY DEFINER — bypass RLS)
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Add store_id column to user_brands (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_brands' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE user_brands ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;


-- 1. Full user update for developer
CREATE OR REPLACE FUNCTION update_user_for_developer(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_role text,
  p_is_active boolean,
  p_brand_id uuid DEFAULT NULL,
  p_store_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Permission denied: not a developer';
  END IF;

  -- Update profile
  UPDATE profiles
  SET name = p_name, email = p_email, role = p_role, is_active = p_is_active, updated_at = now()
  WHERE id = p_user_id;

  -- Update brand + store association if brand provided
  IF p_brand_id IS NOT NULL THEN
    DELETE FROM user_brands WHERE user_id = p_user_id;
    INSERT INTO user_brands (user_id, brand_id, role, store_id)
    VALUES (p_user_id, p_brand_id, p_role, p_store_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Full user delete for developer (profiles + user_brands + registration_requests)
CREATE OR REPLACE FUNCTION delete_user_for_developer(
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Permission denied: not a developer';
  END IF;

  SELECT email INTO v_email FROM profiles WHERE id = p_user_id;

  DELETE FROM user_brands WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE id = p_user_id;

  IF v_email IS NOT NULL THEN
    DELETE FROM registration_requests WHERE lower(email) = lower(v_email);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Delete interessado AND associated account for developer
CREATE OR REPLACE FUNCTION delete_interessado_for_developer(
  p_request_id uuid
)
RETURNS void AS $$
DECLARE
  v_email text;
  v_user_id uuid;
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Permission denied: not a developer';
  END IF;

  SELECT email INTO v_email FROM registration_requests WHERE id = p_request_id;

  IF v_email IS NOT NULL THEN
    SELECT id INTO v_user_id FROM profiles WHERE lower(email) = lower(v_email);

    IF v_user_id IS NOT NULL THEN
      DELETE FROM user_brands WHERE user_id = v_user_id;
      DELETE FROM profiles WHERE id = v_user_id;
    END IF;
  END IF;

  DELETE FROM registration_requests WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
