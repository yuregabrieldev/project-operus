-- Garante que o utilizador developer consegue ler o próprio perfil e que a app
-- pode obter o role mesmo em edge cases. Executar no Supabase SQL Editor.

-- 1) Garantir política de leitura do próprio perfil (caso não exista ou tenha sido removida)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- 2) Função para a app obter o role do utilizador atual (fallback; RLS não bloqueia)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Dar permissão ao role anon/authenticated para chamar a função
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;
