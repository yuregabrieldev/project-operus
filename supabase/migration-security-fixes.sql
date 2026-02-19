-- ============================================================
-- OPERUS Security Migration
-- Run this in the Supabase SQL Editor to apply security fixes
-- to an EXISTING database. Do NOT run schema.sql again.
-- ============================================================

-- ============================================================
-- 1. Helper function: get user's role within a brand
-- ============================================================
CREATE OR REPLACE FUNCTION user_brand_role(p_brand_id uuid)
RETURNS text AS $$
  SELECT role FROM user_brands
  WHERE user_id = auth.uid() AND brand_id = p_brand_id
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is admin or manager in the given brand
CREATE OR REPLACE FUNCTION is_brand_admin_or_manager(p_brand_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_brands
    WHERE user_id = auth.uid()
      AND brand_id = p_brand_id
      AND role IN ('admin', 'manager')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. PROFILES: prevent role escalation
-- ============================================================
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own safe fields"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    AND is_active = (SELECT p.is_active FROM profiles p WHERE p.id = auth.uid())
    AND permissions = (SELECT p.permissions FROM profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Trigger can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 3. BRANDS: restrict creation
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert brands" ON brands;
CREATE POLICY "Authenticated users can create first brand"
  ON brands FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_brands WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. USER_BRANDS: restrict self-association
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own brand associations" ON user_brands;
CREATE POLICY "Users can insert own first brand association"
  ON user_brands FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_brands WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. STORES: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
CREATE POLICY "Admin/Manager can manage stores"
  ON stores FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update stores"
  ON stores FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete stores"
  ON stores FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 6. CATEGORIES: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage categories" ON categories;
CREATE POLICY "Admin/Manager can manage categories"
  ON categories FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update categories"
  ON categories FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete categories"
  ON categories FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 7. SUPPLIERS: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage suppliers" ON suppliers;
CREATE POLICY "Admin/Manager can manage suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update suppliers"
  ON suppliers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete suppliers"
  ON suppliers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 8. PRODUCTS: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage products" ON products;
CREATE POLICY "Admin/Manager can manage products"
  ON products FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update products"
  ON products FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete products"
  ON products FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 9. INVENTORY_ITEMS: members can insert/update (operations), admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage inventory" ON inventory_items;
CREATE POLICY "Members can insert inventory"
  ON inventory_items FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Members can update inventory"
  ON inventory_items FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete inventory"
  ON inventory_items FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 10. COST_CENTERS: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage cost centers" ON cost_centers;
CREATE POLICY "Admin/Manager can manage cost centers"
  ON cost_centers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update cost centers"
  ON cost_centers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete cost centers"
  ON cost_centers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 11. CASH_REGISTERS: members can open/close, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage cash registers" ON cash_registers;
CREATE POLICY "Members can insert cash registers"
  ON cash_registers FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Members can update cash registers"
  ON cash_registers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete cash registers"
  ON cash_registers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 12. INVOICES: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage invoices" ON invoices;
CREATE POLICY "Admin/Manager can manage invoices"
  ON invoices FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update invoices"
  ON invoices FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete invoices"
  ON invoices FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 13. INVENTORY_MOVEMENTS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage movements" ON inventory_movements;
CREATE POLICY "Members can insert movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Members can update movements"
  ON inventory_movements FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete movements"
  ON inventory_movements FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 14. OPERATION_LOGS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage operation logs" ON operation_logs;
CREATE POLICY "Members can insert operation logs"
  ON operation_logs FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete operation logs"
  ON operation_logs FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 15. PURCHASE_ORDERS: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage purchase orders" ON purchase_orders;
CREATE POLICY "Admin/Manager can manage purchase orders"
  ON purchase_orders FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update purchase orders"
  ON purchase_orders FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete purchase orders"
  ON purchase_orders FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 16. RECIPES: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage recipes" ON recipes;
CREATE POLICY "Admin/Manager can manage recipes"
  ON recipes FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update recipes"
  ON recipes FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete recipes"
  ON recipes FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 17. PRODUCTION_RECORDS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage production records" ON production_records;
CREATE POLICY "Members can insert production records"
  ON production_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete production records"
  ON production_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 18. WASTE_VARIANTS: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage waste variants" ON waste_variants;
CREATE POLICY "Admin/Manager can manage waste variants"
  ON waste_variants FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update waste variants"
  ON waste_variants FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete waste variants"
  ON waste_variants FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 19. WASTE_REASONS: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage waste reasons" ON waste_reasons;
CREATE POLICY "Admin/Manager can manage waste reasons"
  ON waste_reasons FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update waste reasons"
  ON waste_reasons FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete waste reasons"
  ON waste_reasons FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 20. WASTE_RECORDS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage waste records" ON waste_records;
CREATE POLICY "Members can insert waste records"
  ON waste_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete waste records"
  ON waste_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 21. CHECKLIST_TEMPLATES: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklist templates" ON checklist_templates;
CREATE POLICY "Admin/Manager can manage checklist templates"
  ON checklist_templates FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update checklist templates"
  ON checklist_templates FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete checklist templates"
  ON checklist_templates FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 22. CHECKLIST_EXECUTIONS: members can create/update, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklist executions" ON checklist_executions;
CREATE POLICY "Members can insert checklist executions"
  ON checklist_executions FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Members can update checklist executions"
  ON checklist_executions FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete checklist executions"
  ON checklist_executions FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 23. CHECKLIST_HISTORY: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklist history" ON checklist_history;
CREATE POLICY "Members can insert checklist history"
  ON checklist_history FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete checklist history"
  ON checklist_history FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 24. LICENSES: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage licenses" ON licenses;
CREATE POLICY "Admin/Manager can manage licenses"
  ON licenses FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update licenses"
  ON licenses FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete licenses"
  ON licenses FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 25. CHECKLISTS (simple): members can create/update, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklists" ON checklists;
CREATE POLICY "Members can insert checklists"
  ON checklists FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Members can update checklists"
  ON checklists FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete checklists"
  ON checklists FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 26. Protect role column with trigger
-- ============================================================
CREATE OR REPLACE FUNCTION protect_profile_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.id = auth.uid() THEN
    NEW.role := OLD.role;
    NEW.permissions := OLD.permissions;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_role_on_update ON profiles;
CREATE TRIGGER protect_role_on_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_role();
