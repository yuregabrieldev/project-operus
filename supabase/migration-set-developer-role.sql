-- Set a user's application role to 'developer' (run in Supabase SQL Editor).
-- The app reads role from public.profiles, not from Auth's "authenticated" role.
-- Replace the email below if needed.

-- Temporarily allow updating role (trigger normally blocks self-updates)
DROP TRIGGER IF EXISTS protect_role_on_update ON profiles;

UPDATE profiles
SET role = 'developer'
WHERE email = 'developer.yuregabriel@gmail.com';
-- Adicione mais linhas se precisar (ex.: WHERE email = 'teu-email@gmail.com');

-- Recreate the trigger
CREATE TRIGGER protect_role_on_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_role();
