-- Adiciona status às solicitações de cadastro (Interessados): pendente | aprovado
-- Developer pode atualizar para marcar como aprovado.
-- Execute no SQL Editor do Supabase.
--
-- Para notificações em tempo real: no Dashboard Supabase, Database -> Replication,
-- ative a replicação para a tabela registration_requests.

ALTER TABLE registration_requests
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado'));

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);

-- Developer pode atualizar registration_requests (ex.: status = 'aprovado')
CREATE POLICY "Developer can update registration requests"
  ON registration_requests FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');
