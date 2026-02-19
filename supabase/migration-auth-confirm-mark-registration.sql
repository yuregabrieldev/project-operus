-- ============================================================
-- Quando o utilizador confirmar o email (auth.users.email_confirmed_at),
-- marcar a solicitação em registration_requests como 'aprovado'.
-- Assim o interessado sai da lista Interessados e pode ser tratado como
-- utilizador ativo (já aparece em Usuários se tiver perfil).
-- Execute no SQL Editor do Supabase.
-- ============================================================

CREATE OR REPLACE FUNCTION public.on_auth_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.mark_registration_confirmed_by_email(NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger em auth.users (criar no SQL Editor do Supabase).
-- Pré-requisito: executar antes migration-registration-requests-conta-criada.sql
-- (função mark_registration_confirmed_by_email).
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.on_auth_user_email_confirmed();
