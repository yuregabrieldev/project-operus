-- Store full closing form data (espécie, cartão, delivery, apuração, extras, etc.)
ALTER TABLE cash_registers
  ADD COLUMN IF NOT EXISTS closure_details jsonb;

COMMENT ON COLUMN cash_registers.closure_details IS 'Full closing form: closingEspecie, closingCartao, closingDelivery, cartaoItems, deliveryItems, apuracao*, extras, comments, etc.';
