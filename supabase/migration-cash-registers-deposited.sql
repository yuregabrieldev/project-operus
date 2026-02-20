-- Add deposited flag to cash_registers so "Fechamento Anterior" can zero after deposit
ALTER TABLE cash_registers
ADD COLUMN IF NOT EXISTS deposited boolean DEFAULT false;

COMMENT ON COLUMN cash_registers.deposited IS 'When true, the next opening should use 0 as previous closing (value was deposited).';
