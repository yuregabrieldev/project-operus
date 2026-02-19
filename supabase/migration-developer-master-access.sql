-- ============================================================
-- Developer: acesso total (SELECT, INSERT, UPDATE, DELETE) a todas
-- as tabelas do projeto. Utiliza role = 'developer' em profiles
-- OU email em developer_emails (função is_developer_by_email).
-- Assim a lista "Usuários" (profiles) e todas as outras listas/dados carregam.
-- Execute após migration-developer-emails-registration-read.sql
-- ============================================================

-- Função única para "é developer?" (profile.role OU email na allowlist)
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'
     OR public.is_developer_by_email();
$$;

-- Tabelas que o developer pode aceder por completo (todas as que existirem)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles', 'brands', 'user_brands', 'registration_requests', 'stores',
    'categories', 'suppliers', 'products', 'inventory_items', 'cost_centers',
    'cash_registers', 'invoices', 'inventory_movements', 'operation_logs',
    'purchase_orders', 'recipes', 'production_records', 'waste_variants',
    'waste_reasons', 'waste_records', 'checklist_templates', 'checklist_executions',
    'checklist_history', 'licenses', 'checklists', 'developer_settings',
    'developer_notification_reads'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "Developer full access" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "Developer full access" ON public.%I FOR ALL USING (public.is_developer()) WITH CHECK (public.is_developer())',
        t
      );
    END IF;
  END LOOP;
END $$;
