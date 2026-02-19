-- Status 'conta_criada': conta criada, aguardando confirmação por email.
-- Quando o utilizador confirmar o email, atualizar para 'aprovado' (ex.: via Auth Hook ou função).
-- Developer (por email ou profile) pode fazer UPDATE.

-- Alargar o CHECK de status para incluir 'conta_criada'
ALTER TABLE registration_requests
  DROP CONSTRAINT IF EXISTS registration_requests_status_check;
ALTER TABLE registration_requests
  ADD CONSTRAINT registration_requests_status_check
  CHECK (status IN ('pendente', 'conta_criada', 'aprovado'));

-- Developer por email pode atualizar registration_requests (ex.: status = 'conta_criada' ou 'aprovado')
CREATE POLICY "Developer by email can update registration_requests"
  ON public.registration_requests FOR UPDATE
  USING (public.is_developer_by_email())
  WITH CHECK (public.is_developer_by_email());

-- Marcar solicitação como confirmada (chamar quando o utilizador confirmar o email, ex.: Auth Hook / Edge Function)
-- Exemplo: SELECT public.mark_registration_confirmed_by_email('user@example.com');
CREATE OR REPLACE FUNCTION public.mark_registration_confirmed_by_email(user_email text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE registration_requests SET status = 'aprovado' WHERE email = user_email AND (status = 'conta_criada' OR status IS NULL);
$$;
