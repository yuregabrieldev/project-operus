-- ============================================================
-- Migration: Create RPC functions for user management
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Drop existing functions first (return type may have changed)
DROP FUNCTION IF EXISTS public.create_user_for_developer(TEXT, TEXT, TEXT, TEXT, UUID, UUID[]);
DROP FUNCTION IF EXISTS public.update_user_for_developer(UUID, TEXT, TEXT, TEXT, BOOLEAN, UUID, UUID);

-- ============================================================
-- 1. create_user_for_developer
--    Creates auth user + profile + user_brands in one call.
--    Callable by: admin, manager, developer
--    Cannot create users with role 'developer'
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_user_for_developer(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'assistant',
  p_brand_id UUID DEFAULT NULL,
  p_store_ids UUID[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_role TEXT;
  v_user_id UUID;
  v_encrypted_pw TEXT;
  v_brand_role TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Check caller permissions
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'manager', 'developer') THEN
    RETURN json_build_object('error', 'Sem permissão para criar usuários. Role: ' || COALESCE(v_caller_role, 'desconhecida'));
  END IF;

  -- 2. Validate target role (developer NOT allowed)
  IF p_role NOT IN ('assistant', 'manager', 'admin') THEN
    RETURN json_build_object('error', 'Role inválida: ' || p_role || '. Use: assistant, manager ou admin.');
  END IF;

  -- 3. Required fields
  IF p_email IS NULL OR length(trim(p_email)) = 0
     OR p_password IS NULL OR length(p_password) < 6
     OR p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RETURN json_build_object('error', 'Campos obrigatórios: email, senha (mín. 6 caracteres) e nome.');
  END IF;

  -- 4. Duplicate check
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
    RETURN json_build_object('error', 'Este email já está registado.');
  END IF;

  -- 5. Create auth user
  v_user_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone, phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data,
    is_sso_user, is_super_admin,
    created_at, updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    v_encrypted_pw,
    v_now, '', '',
    '', '', '',
    NULL, '', '',
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('name', p_name, 'role', p_role),
    false, false,
    v_now, v_now
  );

  -- 6. Create email identity
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', lower(trim(p_email)),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_user_id::text,
    v_now, v_now, v_now
  );

  -- 7. Upsert profile
  INSERT INTO public.profiles (id, email, name, role, is_active, needs_password_change, updated_at)
  VALUES (v_user_id, lower(trim(p_email)), p_name, p_role, true, true, v_now)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    needs_password_change = EXCLUDED.needs_password_change,
    updated_at = EXCLUDED.updated_at;

  -- 8. Link to brand
  IF p_brand_id IS NOT NULL THEN
    v_brand_role := CASE WHEN p_role = 'assistant' THEN 'operator' ELSE p_role END;
    BEGIN
      INSERT INTO public.user_brands (user_id, brand_id, role, store_ids)
      VALUES (v_user_id, p_brand_id, v_brand_role, to_jsonb(COALESCE(p_store_ids, '{}')));
    EXCEPTION WHEN undefined_column THEN
      -- store_ids column may not exist yet
      INSERT INTO public.user_brands (user_id, brand_id, role)
      VALUES (v_user_id, p_brand_id, v_brand_role);
    END;
  END IF;

  RETURN json_build_object('userId', v_user_id);
END;
$$;


-- ============================================================
-- 2. update_user_for_developer
--    Updates profile + user_brands link.
--    Callable by: admin, manager, developer
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_user_for_developer(
  p_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_role TEXT,
  p_is_active BOOLEAN,
  p_brand_id UUID DEFAULT NULL,
  p_store_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_brand_role TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Check caller permissions
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'manager', 'developer') THEN
    RETURN json_build_object('error', 'Sem permissão para editar usuários.');
  END IF;

  -- 2. Validate target role
  IF p_role NOT IN ('assistant', 'manager', 'admin') THEN
    RETURN json_build_object('error', 'Role inválida: ' || p_role);
  END IF;

  -- 3. Required fields
  IF p_user_id IS NULL OR p_name IS NULL OR p_email IS NULL THEN
    RETURN json_build_object('error', 'Campos obrigatórios: userId, name, email.');
  END IF;

  -- 4. Update profile
  UPDATE public.profiles SET
    name = p_name,
    email = lower(trim(p_email)),
    role = p_role,
    is_active = p_is_active,
    updated_at = v_now
  WHERE id = p_user_id;

  -- 5. Update brand link (if provided)
  IF p_brand_id IS NOT NULL THEN
    v_brand_role := CASE WHEN p_role = 'assistant' THEN 'operator' ELSE p_role END;

    DELETE FROM public.user_brands WHERE user_id = p_user_id;

    BEGIN
      IF p_store_id IS NOT NULL THEN
        INSERT INTO public.user_brands (user_id, brand_id, role, store_id)
        VALUES (p_user_id, p_brand_id, v_brand_role, p_store_id);
      ELSE
        INSERT INTO public.user_brands (user_id, brand_id, role)
        VALUES (p_user_id, p_brand_id, v_brand_role);
      END IF;
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO public.user_brands (user_id, brand_id, role)
      VALUES (p_user_id, p_brand_id, v_brand_role);
    END;
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;


-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_for_developer TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_for_developer TO authenticated;
