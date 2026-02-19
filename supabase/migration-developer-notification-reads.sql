-- ============================================================
-- Notificações do developer: tabela para marcar como lidas (persistido na BD).
-- Cada linha = um developer marcou uma solicitação (registration_request) como lida.
-- Execute após migration-developer-emails-registration-read.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.developer_notification_reads (
  developer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_request_id uuid NOT NULL REFERENCES public.registration_requests(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (developer_id, registration_request_id)
);

CREATE INDEX IF NOT EXISTS idx_developer_notification_reads_developer
  ON public.developer_notification_reads(developer_id);

ALTER TABLE public.developer_notification_reads ENABLE ROW LEVEL SECURITY;

-- Developer só vê/insere os seus próprios registos (é developer por role ou email)
CREATE POLICY "Developer can manage own notification reads"
  ON public.developer_notification_reads FOR ALL
  USING (developer_id = auth.uid() AND (public.is_developer_by_email() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'))
  WITH CHECK (developer_id = auth.uid());

-- Marcar uma notificação como lida (id = registration_request_id)
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer_by_email() THEN RETURN; END IF;
  INSERT INTO public.developer_notification_reads (developer_id, registration_request_id)
  VALUES (auth.uid(), p_request_id)
  ON CONFLICT (developer_id, registration_request_id) DO NOTHING;
END;
$$;

-- Marcar todas as notificações (registration_requests) como lidas para o developer atual
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer_by_email() THEN RETURN; END IF;
  INSERT INTO public.developer_notification_reads (developer_id, registration_request_id)
  SELECT auth.uid(), id FROM public.registration_requests
  ON CONFLICT (developer_id, registration_request_id) DO NOTHING;
END;
$$;
