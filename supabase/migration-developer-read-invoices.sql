-- Developer can read all invoices and user_brands (for DevFinance and DevUsers).
-- Run in Supabase SQL Editor if not already applied.

CREATE POLICY "Developer can read all invoices"
  ON invoices FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

CREATE POLICY "Developer can read all user_brands"
  ON user_brands FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');
