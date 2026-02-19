-- ============================================================
-- Permite que developers vejam registration_requests por EMAIL (JWT),
-- mesmo que profiles.role ainda não esteja 'developer'.
-- Assim a lista "Interessados" aparece assim que o teu email estiver aqui.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- Tabela de emails considerados developer (não exposta ao cliente; usada pela função)
CREATE TABLE IF NOT EXISTS public.developer_emails (
  email text PRIMARY KEY
);

ALTER TABLE public.developer_emails ENABLE ROW LEVEL SECURITY;

-- Nenhum acesso direto ao cliente (a leitura é feita só na função com SECURITY DEFINER)
CREATE POLICY "No direct client access"
  ON public.developer_emails FOR ALL
  USING (false)
  WITH CHECK (false);

-- Inserir emails que devem ter acesso à lista Interessados (troca pelos teus)
INSERT INTO public.developer_emails (email) VALUES
  ('developer.yuregabriel@gmail.com'),
  ('yuhgamestv@gmail.com'),
  ('yuhsantostv@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Função que verifica se o email do JWT está em developer_emails (corre com dono da BD)
CREATE OR REPLACE FUNCTION public.is_developer_by_email()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_emails
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- Policy: permite SELECT em registration_requests se profile.role = 'developer' OU email no allowlist
CREATE POLICY "Developer by email can read registration_requests"
  ON public.registration_requests FOR SELECT
  USING (public.is_developer_by_email());

-- RPC de fallback: devolve registration_requests só se o caller for developer por email
-- (o frontend filtra por status; assim funciona mesmo sem coluna status)
CREATE OR REPLACE FUNCTION public.get_registration_requests()
RETURNS SETOF public.registration_requests
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT r.* FROM public.registration_requests r
  WHERE public.is_developer_by_email()
  ORDER BY r.created_at DESC;
$$;
