-- Adiciona campos "nome da marca" e "quantidade de lojas" à tabela existente.
-- Execute no SQL Editor do Supabase se a tabela registration_requests já existir.

ALTER TABLE registration_requests
  ADD COLUMN IF NOT EXISTS brand_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stores_range text DEFAULT '';
