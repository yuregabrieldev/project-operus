-- Tabela para configurações do desenvolvedor (DevSettings). Apenas developers podem ler/escrever.
-- Executar no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS developer_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE developer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developer can manage developer_settings"
  ON developer_settings FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');
