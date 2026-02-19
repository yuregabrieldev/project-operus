-- ============================================================
-- Interessados: guardar senha temporária (ver novamente) e permitir excluir.
-- Developer por email pode ler profiles (lista de usuários).
-- Execute após migration-developer-emails-registration-read.sql
-- ============================================================

-- Senha temporária guardada ao aprovar (apenas developer pode ler)
ALTER TABLE public.registration_requests
  ADD COLUMN IF NOT EXISTS temp_password text;

-- Developer por email pode apagar solicitações
CREATE POLICY "Developer by email can delete registration_requests"
  ON public.registration_requests FOR DELETE
  USING (public.is_developer_by_email());

-- Developer por email pode ler todos os profiles (lista Usuários no DevUsers)
CREATE POLICY "Developer by email can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_developer_by_email());
