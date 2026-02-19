-- ============================================================
-- OPERUS - Full Database Schema for Supabase
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STEP 1: Create core tables FIRST (no RLS yet)
-- ============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'assistant' CHECK (role IN ('developer', 'admin', 'manager', 'assistant')),
  permissions jsonb DEFAULT '[]'::jsonb,
  pin text,
  image_url text,
  is_active boolean DEFAULT true,
  needs_password_change boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. BRANDS
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text DEFAULT '',
  primary_color text DEFAULT '#2563EB',
  stores_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. USER_BRANDS (many-to-many)
CREATE TABLE user_brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'operator')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, brand_id)
);

-- 4. REGISTRATION_REQUESTS (solicitações de cadastro na landing; só developer lê)
CREATE TABLE registration_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  brand_name text DEFAULT '',
  stores_range text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 2: Helper functions (now user_brands exists)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_brand_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(array_agg(brand_id), '{}')
  FROM user_brands
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_brand_role(p_brand_id uuid)
RETURNS text AS $$
  SELECT role FROM user_brands
  WHERE user_id = auth.uid() AND brand_id = p_brand_id
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
-- STEP 3: RLS policies for profiles, brands, user_brands
-- ============================================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own safe fields"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    AND is_active = (SELECT p.is_active FROM profiles p WHERE p.id = auth.uid())
    AND permissions = (SELECT p.permissions FROM profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Admins can read profiles in their brands"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT ub.user_id FROM user_brands ub
      WHERE ub.brand_id = ANY(get_user_brand_ids())
    )
  );

CREATE POLICY "Trigger can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update profiles in their brands"
  ON profiles FOR UPDATE
  USING (
    id IN (
      SELECT ub.user_id FROM user_brands ub
      WHERE ub.brand_id = ANY(get_user_brand_ids())
    )
  );

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'assistant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Brands RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their brands"
  ON brands FOR SELECT
  USING (id = ANY(get_user_brand_ids()));

CREATE POLICY "Users can create first brand"
  ON brands FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their brands"
  ON brands FOR UPDATE
  USING (id = ANY(get_user_brand_ids()));

-- User_brands RLS
ALTER TABLE user_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand associations"
  ON user_brands FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view brand members"
  ON user_brands FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admins can manage brand associations"
  ON user_brands FOR ALL
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Users can insert own first brand association"
  ON user_brands FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_brands WHERE user_id = auth.uid()
    )
  );

-- Registration_requests RLS (landing: anon insert; só developer lê)
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert registration requests"
  ON registration_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Developer can read registration requests"
  ON registration_requests FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- ============================================================
-- 4. STORES
-- ============================================================
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text DEFAULT '',
  contact text DEFAULT '',
  manager text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stores of their brands"
  ON stores FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert stores"
  ON stores FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update stores"
  ON stores FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete stores"
  ON stores FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 5. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view categories"
  ON categories FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert categories"
  ON categories FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update categories"
  ON categories FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete categories"
  ON categories FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 6. SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text DEFAULT '',
  email text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view suppliers"
  ON suppliers FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update suppliers"
  ON suppliers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete suppliers"
  ON suppliers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 7. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text DEFAULT '',
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  cost_price numeric(12,2) DEFAULT 0,
  selling_price numeric(12,2) DEFAULT 0,
  barcode text DEFAULT '',
  image_url text,
  unit text DEFAULT 'UN.',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view products"
  ON products FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert products"
  ON products FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update products"
  ON products FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete products"
  ON products FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 8. INVENTORY_ITEMS
-- ============================================================
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_quantity numeric(12,2) DEFAULT 0,
  min_quantity numeric(12,2) DEFAULT 0,
  alert_warning numeric(12,2),
  alert_critical numeric(12,2),
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view inventory"
  ON inventory_items FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

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
-- 9. COST_CENTERS
-- ============================================================
CREATE TABLE cost_centers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view cost centers"
  ON cost_centers FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert cost centers"
  ON cost_centers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update cost centers"
  ON cost_centers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete cost centers"
  ON cost_centers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 10. CASH_REGISTERS
-- ============================================================
CREATE TABLE cash_registers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  opening_balance numeric(12,2) DEFAULT 0,
  closing_balance numeric(12,2),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  opened_by uuid REFERENCES auth.users(id),
  closed_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view cash registers"
  ON cash_registers FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

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
-- 11. INVOICES
-- ============================================================
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_number text DEFAULT '',
  amount numeric(12,2) DEFAULT 0,
  status text DEFAULT 'pedido_realizado' CHECK (status IN (
    'pedido_realizado', 'mercadoria_recebida', 'contas_a_pagar',
    'finalizado_pago', 'cancelado', 'finalizado_outros'
  )),
  issue_date timestamptz DEFAULT now(),
  due_date timestamptz,
  paid_date timestamptz,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  description text,
  order_number text,
  cost_center text,
  currency text DEFAULT 'EUR',
  direct_debit boolean DEFAULT false,
  payment_method text,
  financial_institution text,
  observations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view invoices"
  ON invoices FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update invoices"
  ON invoices FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete invoices"
  ON invoices FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 12. INVENTORY_MOVEMENTS
-- ============================================================
CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  to_store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  quantity numeric(12,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered')),
  user_id uuid REFERENCES auth.users(id),
  type text DEFAULT 'transfer' CHECK (type IN ('in', 'out', 'transfer')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view movements"
  ON inventory_movements FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

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
-- 13. OPERATION_LOGS
-- ============================================================
CREATE TABLE operation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  quantity numeric(12,2) DEFAULT 0,
  action_type text NOT NULL CHECK (action_type IN ('withdrawal', 'entry')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view operation logs"
  ON operation_logs FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Members can insert operation logs"
  ON operation_logs FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete operation logs"
  ON operation_logs FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 14. PURCHASE_ORDERS
-- ============================================================
CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id),
  store_ids jsonb DEFAULT '[]'::jsonb,
  items jsonb DEFAULT '[]'::jsonb,
  has_invoice_management boolean DEFAULT false,
  has_transit_generated boolean DEFAULT false,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  observation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view purchase orders"
  ON purchase_orders FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert purchase orders"
  ON purchase_orders FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update purchase orders"
  ON purchase_orders FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete purchase orders"
  ON purchase_orders FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 15. RECIPES
-- ============================================================
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  final_product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  ingredients jsonb DEFAULT '[]'::jsonb,
  expected_yield numeric(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view recipes"
  ON recipes FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update recipes"
  ON recipes FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete recipes"
  ON recipes FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 16. PRODUCTION_RECORDS
-- ============================================================
CREATE TABLE production_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  actual_yield numeric(12,2) DEFAULT 0,
  ingredients_used jsonb DEFAULT '[]'::jsonb,
  leftovers jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view production records"
  ON production_records FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Members can insert production records"
  ON production_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete production records"
  ON production_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 17. WASTE_VARIANTS
-- ============================================================
CREATE TABLE waste_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  product_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view waste variants"
  ON waste_variants FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert waste variants"
  ON waste_variants FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update waste variants"
  ON waste_variants FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete waste variants"
  ON waste_variants FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 18. WASTE_REASONS
-- ============================================================
CREATE TABLE waste_reasons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view waste reasons"
  ON waste_reasons FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert waste reasons"
  ON waste_reasons FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update waste reasons"
  ON waste_reasons FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete waste reasons"
  ON waste_reasons FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 19. WASTE_RECORDS
-- ============================================================
CREATE TABLE waste_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES waste_variants(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_name text DEFAULT '',
  quantity numeric(12,2) DEFAULT 0,
  reason_id uuid REFERENCES waste_reasons(id) ON DELETE SET NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view waste records"
  ON waste_records FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Members can insert waste records"
  ON waste_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete waste records"
  ON waste_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 20. CHECKLIST_TEMPLATES
-- ============================================================
CREATE TABLE checklist_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  type text DEFAULT 'quality' CHECK (type IN ('opening', 'closing', 'quality', 'maintenance')),
  items jsonb DEFAULT '[]'::jsonb,
  associated_stores jsonb DEFAULT '["all"]'::jsonb,
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_edited_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view checklist templates"
  ON checklist_templates FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert checklist templates"
  ON checklist_templates FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update checklist templates"
  ON checklist_templates FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete checklist templates"
  ON checklist_templates FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 21. CHECKLIST_EXECUTIONS
-- ============================================================
CREATE TABLE checklist_executions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  template_id uuid REFERENCES checklist_templates(id) ON DELETE SET NULL,
  template_name text DEFAULT '',
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  responses jsonb DEFAULT '[]'::jsonb,
  current_item_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view checklist executions"
  ON checklist_executions FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

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
-- 22. CHECKLIST_HISTORY
-- ============================================================
CREATE TABLE checklist_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  template_name text DEFAULT '',
  type text DEFAULT 'quality',
  store_name text DEFAULT '',
  user_name text DEFAULT '',
  start_time timestamptz,
  end_time timestamptz,
  duration integer DEFAULT 0,
  total_items integer DEFAULT 0,
  completed_items integer DEFAULT 0,
  responses jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view checklist history"
  ON checklist_history FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Members can insert checklist history"
  ON checklist_history FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
CREATE POLICY "Admin/Manager can delete checklist history"
  ON checklist_history FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 23. LICENSES
-- ============================================================
CREATE TABLE licenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  store_ids jsonb DEFAULT '[]'::jsonb,
  description text,
  periodicity text DEFAULT 'anual' CHECK (periodicity IN ('mensal', 'trimestral', 'semestral', 'anual')),
  alert_days integer DEFAULT 10,
  status text DEFAULT 'pendente' CHECK (status IN ('ativa', 'expirada', 'cancelada', 'pendente')),
  renewals jsonb DEFAULT '[]'::jsonb,
  contacts jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  observations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view licenses"
  ON licenses FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

CREATE POLICY "Admin/Manager can insert licenses"
  ON licenses FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can update licenses"
  ON licenses FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
CREATE POLICY "Admin/Manager can delete licenses"
  ON licenses FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 24. CHECKLISTS (simple, from DataContext)
-- ============================================================
CREATE TABLE checklists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type text DEFAULT 'quality' CHECK (type IN ('opening', 'closing', 'quality')),
  tasks jsonb DEFAULT '[]'::jsonb,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can view checklists"
  ON checklists FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

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
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_user_brands_user_id ON user_brands(user_id);
CREATE INDEX idx_user_brands_brand_id ON user_brands(brand_id);
CREATE INDEX idx_stores_brand_id ON stores(brand_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_inventory_items_brand_id ON inventory_items(brand_id);
CREATE INDEX idx_inventory_items_store_id ON inventory_items(store_id);
CREATE INDEX idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX idx_cash_registers_brand_id ON cash_registers(brand_id);
CREATE INDEX idx_cash_registers_store_id ON cash_registers(store_id);
CREATE INDEX idx_invoices_brand_id ON invoices(brand_id);
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_inventory_movements_brand_id ON inventory_movements(brand_id);
CREATE INDEX idx_operation_logs_brand_id ON operation_logs(brand_id);
CREATE INDEX idx_operation_logs_product_id ON operation_logs(product_id);
CREATE INDEX idx_purchase_orders_brand_id ON purchase_orders(brand_id);
CREATE INDEX idx_recipes_brand_id ON recipes(brand_id);
CREATE INDEX idx_production_records_brand_id ON production_records(brand_id);
CREATE INDEX idx_waste_records_brand_id ON waste_records(brand_id);
CREATE INDEX idx_checklist_templates_brand_id ON checklist_templates(brand_id);
CREATE INDEX idx_checklist_executions_brand_id ON checklist_executions(brand_id);
CREATE INDEX idx_checklist_history_brand_id ON checklist_history(brand_id);
CREATE INDEX idx_licenses_brand_id ON licenses(brand_id);
CREATE INDEX idx_checklists_brand_id ON checklists(brand_id);

-- ============================================================
-- Update stores_count trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_brand_stores_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE brands SET stores_count = (
      SELECT count(*) FROM stores WHERE brand_id = NEW.brand_id
    ) WHERE id = NEW.brand_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE brands SET stores_count = (
      SELECT count(*) FROM stores WHERE brand_id = OLD.brand_id
    ) WHERE id = OLD.brand_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_store_change
  AFTER INSERT OR DELETE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_brand_stores_count();

-- ============================================================
-- Protect role/permissions columns from self-escalation
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
