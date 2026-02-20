-- Migration: Add missing columns to stores table
-- Required by the expanded Edit Store dialog (image_url, plan, plan_value)

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Starter';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan_value numeric DEFAULT 0;
