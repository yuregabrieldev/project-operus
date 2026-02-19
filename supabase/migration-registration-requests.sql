-- ============================================================
-- OPERUS - Registration requests (solicitações de cadastro)
-- Execute no SQL Editor do Supabase para criar a tabela.
-- Permite que visitantes enviem solicitação; só developer pode ler.
-- ============================================================

CREATE TABLE IF NOT EXISTS registration_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  brand_name text DEFAULT '',
  stores_range text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (incl. anônima) pode inserir uma solicitação
CREATE POLICY "Allow insert registration requests"
  ON registration_requests FOR INSERT
  WITH CHECK (true);

-- Apenas usuários com role developer podem ver as solicitações
CREATE POLICY "Developer can read registration requests"
  ON registration_requests FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'
  );

-- Ninguém pode atualizar ou apagar (só developer via dashboard se quiser)
-- Para permitir que developer apague: adicione uma policy FOR DELETE com role = 'developer'
