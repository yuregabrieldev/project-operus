-- ============================================================
-- FIX: Restaurar acesso de developer para ver usuários
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Garantir tabela developer_emails
CREATE TABLE IF NOT EXISTS public.developer_emails (
  email text PRIMARY KEY
);

INSERT INTO public.developer_emails (email) VALUES
  ('developer.yuregabriel@gmail.com'),
  ('yuhgamestv@gmail.com'),
  ('yuhsantostv@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 2. Função is_developer_by_email
CREATE OR REPLACE FUNCTION public.is_developer_by_email()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_emails
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- 3. Função is_developer
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT 
    public.is_developer_by_email()
    OR COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), '') = 'developer';
$$;

-- 4. Policy para developer ver todos os profiles
DROP POLICY IF EXISTS "profiles_select_developer" ON public.profiles;
CREATE POLICY "profiles_select_developer" ON public.profiles FOR SELECT
  USING (public.is_developer());

-- 5. RPC para listar profiles (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_developer()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.role, p.is_active, p.created_at
  FROM public.profiles p
  WHERE p.role != 'developer'
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_developer() TO authenticated;

-- 6. Policies para brands, stores, user_brands
DROP POLICY IF EXISTS "brands_select_developer" ON public.brands;
CREATE POLICY "brands_select_developer" ON public.brands FOR SELECT
  USING (public.is_developer());

DROP POLICY IF EXISTS "stores_select_developer" ON public.stores;
CREATE POLICY "stores_select_developer" ON public.stores FOR SELECT
  USING (public.is_developer());

DROP POLICY IF EXISTS "user_brands_select_developer" ON public.user_brands;
CREATE POLICY "user_brands_select_developer" ON public.user_brands FOR SELECT
  USING (public.is_developer());

-- 7. Garantir que seus profiles têm role developer
UPDATE public.profiles 
SET role = 'developer' 
WHERE lower(email) IN (SELECT lower(email) FROM public.developer_emails);

SELECT 'Acesso restaurado!' as status;
