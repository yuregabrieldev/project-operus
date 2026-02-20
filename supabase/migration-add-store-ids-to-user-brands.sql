-- Migration: Add store_ids to user_brands
-- Tracks which specific stores a user has access to within a brand.
-- An empty array means access to all stores of that brand.
ALTER TABLE public.user_brands
  ADD COLUMN IF NOT EXISTS store_ids jsonb DEFAULT '[]'::jsonb;
