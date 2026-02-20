-- ============================================================
-- OPERUS - FULL SETUP SCRIPT (idempotent)
-- Run this in the SQL Editor of your NEW Supabase project
-- Safe to run multiple times. Generated: 2026-02-20 12:52
-- ============================================================


-- ============================================================
-- FILE: schema.sql
-- ============================================================
-- ============================================================
-- OPERUS - Full Database Schema for Supabase
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bootstrap helper so policies/functions can reference it
-- before developer_emails migration creates the real implementation.
CREATE OR REPLACE FUNCTION public.is_developer_by_email()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT false;
$$;

-- ============================================================
-- STEP 1: Create core tables FIRST (no RLS yet)
-- ============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text DEFAULT '',
  primary_color text DEFAULT '#2563EB',
  stores_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. USER_BRANDS (many-to-many)
CREATE TABLE IF NOT EXISTS user_brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'operator')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, brand_id)
);

-- 4. REGISTRATION_REQUESTS (solicitaÃ§Ãµes de cadastro na landing; sÃ³ developer lÃª)
CREATE TABLE IF NOT EXISTS registration_requests (
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

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own safe fields" ON profiles;
CREATE POLICY "Users can update own safe fields"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    AND is_active = (SELECT p.is_active FROM profiles p WHERE p.id = auth.uid())
    AND permissions = (SELECT p.permissions FROM profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can read profiles in their brands" ON profiles;
CREATE POLICY "Admins can read profiles in their brands"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT ub.user_id FROM user_brands ub
      WHERE ub.brand_id = ANY(get_user_brand_ids())
    )
  );

DROP POLICY IF EXISTS "Trigger can insert profiles" ON profiles;
CREATE POLICY "Trigger can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update profiles in their brands" ON profiles;
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

DROP POLICY IF EXISTS "Users can view their brands" ON brands;
CREATE POLICY "Users can view their brands"
  ON brands FOR SELECT
  USING (id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Users can create first brand" ON brands;
CREATE POLICY "Users can create first brand"
  ON brands FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_brands WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update their brands" ON brands;
CREATE POLICY "Admins can update their brands"
  ON brands FOR UPDATE
  USING (id = ANY(get_user_brand_ids()));

-- User_brands RLS
ALTER TABLE user_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own brand associations" ON user_brands;
CREATE POLICY "Users can view own brand associations"
  ON user_brands FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view brand members" ON user_brands;
CREATE POLICY "Users can view brand members"
  ON user_brands FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admins can manage brand associations" ON user_brands;
CREATE POLICY "Admins can manage brand associations"
  ON user_brands FOR ALL
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Users can insert own first brand association" ON user_brands;
CREATE POLICY "Users can insert own first brand association"
  ON user_brands FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_brands WHERE user_id = auth.uid()
    )
  );

-- Registration_requests RLS (landing: anon insert; sÃ³ developer lÃª)
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert registration requests" ON registration_requests;
CREATE POLICY "Allow insert registration requests"
  ON registration_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Developer can read registration requests" ON registration_requests;
CREATE POLICY "Developer can read registration requests"
  ON registration_requests FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- ============================================================
-- 4. STORES
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
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

DROP POLICY IF EXISTS "Users can view stores of their brands" ON stores;
CREATE POLICY "Users can view stores of their brands"
  ON stores FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert stores" ON stores;
CREATE POLICY "Admin/Manager can insert stores"
  ON stores FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update stores" ON stores;
CREATE POLICY "Admin/Manager can update stores"
  ON stores FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete stores" ON stores;
CREATE POLICY "Admin/Manager can delete stores"
  ON stores FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 5. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand members can view categories" ON categories;
CREATE POLICY "Brand members can view categories"
  ON categories FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert categories" ON categories;
CREATE POLICY "Admin/Manager can insert categories"
  ON categories FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update categories" ON categories;
CREATE POLICY "Admin/Manager can update categories"
  ON categories FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete categories" ON categories;
CREATE POLICY "Admin/Manager can delete categories"
  ON categories FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 6. SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text DEFAULT '',
  email text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand members can view suppliers" ON suppliers;
CREATE POLICY "Brand members can view suppliers"
  ON suppliers FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert suppliers" ON suppliers;
CREATE POLICY "Admin/Manager can insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update suppliers" ON suppliers;
CREATE POLICY "Admin/Manager can update suppliers"
  ON suppliers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete suppliers" ON suppliers;
CREATE POLICY "Admin/Manager can delete suppliers"
  ON suppliers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 7. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
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

DROP POLICY IF EXISTS "Brand members can view products" ON products;
CREATE POLICY "Brand members can view products"
  ON products FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert products" ON products;
CREATE POLICY "Admin/Manager can insert products"
  ON products FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update products" ON products;
CREATE POLICY "Admin/Manager can update products"
  ON products FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete products" ON products;
CREATE POLICY "Admin/Manager can delete products"
  ON products FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 8. INVENTORY_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
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

DROP POLICY IF EXISTS "Brand members can view inventory" ON inventory_items;
CREATE POLICY "Brand members can view inventory"
  ON inventory_items FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert inventory" ON inventory_items;
CREATE POLICY "Members can insert inventory"
  ON inventory_items FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update inventory" ON inventory_items;
CREATE POLICY "Members can update inventory"
  ON inventory_items FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete inventory" ON inventory_items;
CREATE POLICY "Admin/Manager can delete inventory"
  ON inventory_items FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 9. COST_CENTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand members can view cost centers" ON cost_centers;
CREATE POLICY "Brand members can view cost centers"
  ON cost_centers FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert cost centers" ON cost_centers;
CREATE POLICY "Admin/Manager can insert cost centers"
  ON cost_centers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update cost centers" ON cost_centers;
CREATE POLICY "Admin/Manager can update cost centers"
  ON cost_centers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete cost centers" ON cost_centers;
CREATE POLICY "Admin/Manager can delete cost centers"
  ON cost_centers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 10. CASH_REGISTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_registers (
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

DROP POLICY IF EXISTS "Brand members can view cash registers" ON cash_registers;
CREATE POLICY "Brand members can view cash registers"
  ON cash_registers FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert cash registers" ON cash_registers;
CREATE POLICY "Members can insert cash registers"
  ON cash_registers FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update cash registers" ON cash_registers;
CREATE POLICY "Members can update cash registers"
  ON cash_registers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete cash registers" ON cash_registers;
CREATE POLICY "Admin/Manager can delete cash registers"
  ON cash_registers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 11. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
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

DROP POLICY IF EXISTS "Brand members can view invoices" ON invoices;
CREATE POLICY "Brand members can view invoices"
  ON invoices FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert invoices" ON invoices;
CREATE POLICY "Admin/Manager can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update invoices" ON invoices;
CREATE POLICY "Admin/Manager can update invoices"
  ON invoices FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete invoices" ON invoices;
CREATE POLICY "Admin/Manager can delete invoices"
  ON invoices FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 12. INVENTORY_MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
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

DROP POLICY IF EXISTS "Brand members can view movements" ON inventory_movements;
CREATE POLICY "Brand members can view movements"
  ON inventory_movements FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert movements" ON inventory_movements;
CREATE POLICY "Members can insert movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update movements" ON inventory_movements;
CREATE POLICY "Members can update movements"
  ON inventory_movements FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete movements" ON inventory_movements;
CREATE POLICY "Admin/Manager can delete movements"
  ON inventory_movements FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 13. OPERATION_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS operation_logs (
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

DROP POLICY IF EXISTS "Brand members can view operation logs" ON operation_logs;
CREATE POLICY "Brand members can view operation logs"
  ON operation_logs FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert operation logs" ON operation_logs;
CREATE POLICY "Members can insert operation logs"
  ON operation_logs FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete operation logs" ON operation_logs;
CREATE POLICY "Admin/Manager can delete operation logs"
  ON operation_logs FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 14. PURCHASE_ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
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

DROP POLICY IF EXISTS "Brand members can view purchase orders" ON purchase_orders;
CREATE POLICY "Brand members can view purchase orders"
  ON purchase_orders FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert purchase orders" ON purchase_orders;
CREATE POLICY "Admin/Manager can insert purchase orders"
  ON purchase_orders FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update purchase orders" ON purchase_orders;
CREATE POLICY "Admin/Manager can update purchase orders"
  ON purchase_orders FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete purchase orders" ON purchase_orders;
CREATE POLICY "Admin/Manager can delete purchase orders"
  ON purchase_orders FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 15. RECIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
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

DROP POLICY IF EXISTS "Brand members can view recipes" ON recipes;
CREATE POLICY "Brand members can view recipes"
  ON recipes FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert recipes" ON recipes;
CREATE POLICY "Admin/Manager can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update recipes" ON recipes;
CREATE POLICY "Admin/Manager can update recipes"
  ON recipes FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete recipes" ON recipes;
CREATE POLICY "Admin/Manager can delete recipes"
  ON recipes FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 16. PRODUCTION_RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS production_records (
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

DROP POLICY IF EXISTS "Brand members can view production records" ON production_records;
CREATE POLICY "Brand members can view production records"
  ON production_records FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert production records" ON production_records;
CREATE POLICY "Members can insert production records"
  ON production_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete production records" ON production_records;
CREATE POLICY "Admin/Manager can delete production records"
  ON production_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 17. WASTE_VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  product_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand members can view waste variants" ON waste_variants;
CREATE POLICY "Brand members can view waste variants"
  ON waste_variants FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert waste variants" ON waste_variants;
CREATE POLICY "Admin/Manager can insert waste variants"
  ON waste_variants FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update waste variants" ON waste_variants;
CREATE POLICY "Admin/Manager can update waste variants"
  ON waste_variants FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete waste variants" ON waste_variants;
CREATE POLICY "Admin/Manager can delete waste variants"
  ON waste_variants FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 18. WASTE_REASONS
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_reasons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand members can view waste reasons" ON waste_reasons;
CREATE POLICY "Brand members can view waste reasons"
  ON waste_reasons FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert waste reasons" ON waste_reasons;
CREATE POLICY "Admin/Manager can insert waste reasons"
  ON waste_reasons FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update waste reasons" ON waste_reasons;
CREATE POLICY "Admin/Manager can update waste reasons"
  ON waste_reasons FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete waste reasons" ON waste_reasons;
CREATE POLICY "Admin/Manager can delete waste reasons"
  ON waste_reasons FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 19. WASTE_RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_records (
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

DROP POLICY IF EXISTS "Brand members can view waste records" ON waste_records;
CREATE POLICY "Brand members can view waste records"
  ON waste_records FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert waste records" ON waste_records;
CREATE POLICY "Members can insert waste records"
  ON waste_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete waste records" ON waste_records;
CREATE POLICY "Admin/Manager can delete waste records"
  ON waste_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 20. CHECKLIST_TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_templates (
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

DROP POLICY IF EXISTS "Brand members can view checklist templates" ON checklist_templates;
CREATE POLICY "Brand members can view checklist templates"
  ON checklist_templates FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert checklist templates" ON checklist_templates;
CREATE POLICY "Admin/Manager can insert checklist templates"
  ON checklist_templates FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update checklist templates" ON checklist_templates;
CREATE POLICY "Admin/Manager can update checklist templates"
  ON checklist_templates FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete checklist templates" ON checklist_templates;
CREATE POLICY "Admin/Manager can delete checklist templates"
  ON checklist_templates FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 21. CHECKLIST_EXECUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_executions (
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

DROP POLICY IF EXISTS "Brand members can view checklist executions" ON checklist_executions;
CREATE POLICY "Brand members can view checklist executions"
  ON checklist_executions FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert checklist executions" ON checklist_executions;
CREATE POLICY "Members can insert checklist executions"
  ON checklist_executions FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update checklist executions" ON checklist_executions;
CREATE POLICY "Members can update checklist executions"
  ON checklist_executions FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete checklist executions" ON checklist_executions;
CREATE POLICY "Admin/Manager can delete checklist executions"
  ON checklist_executions FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 22. CHECKLIST_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_history (
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

DROP POLICY IF EXISTS "Brand members can view checklist history" ON checklist_history;
CREATE POLICY "Brand members can view checklist history"
  ON checklist_history FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert checklist history" ON checklist_history;
CREATE POLICY "Members can insert checklist history"
  ON checklist_history FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete checklist history" ON checklist_history;
CREATE POLICY "Admin/Manager can delete checklist history"
  ON checklist_history FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 23. LICENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS licenses (
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

DROP POLICY IF EXISTS "Brand members can view licenses" ON licenses;
CREATE POLICY "Brand members can view licenses"
  ON licenses FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Admin/Manager can insert licenses" ON licenses;
CREATE POLICY "Admin/Manager can insert licenses"
  ON licenses FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update licenses" ON licenses;
CREATE POLICY "Admin/Manager can update licenses"
  ON licenses FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete licenses" ON licenses;
CREATE POLICY "Admin/Manager can delete licenses"
  ON licenses FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 24. CHECKLISTS (simple, from DataContext)
-- ============================================================
CREATE TABLE IF NOT EXISTS checklists (
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

DROP POLICY IF EXISTS "Brand members can view checklists" ON checklists;
CREATE POLICY "Brand members can view checklists"
  ON checklists FOR SELECT
  USING (brand_id = ANY(get_user_brand_ids()));

DROP POLICY IF EXISTS "Members can insert checklists" ON checklists;
CREATE POLICY "Members can insert checklists"
  ON checklists FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update checklists" ON checklists;
CREATE POLICY "Members can update checklists"
  ON checklists FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete checklists" ON checklists;
CREATE POLICY "Admin/Manager can delete checklists"
  ON checklists FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_brands_user_id ON user_brands(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brands_brand_id ON user_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_stores_brand_id ON stores(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_brand_id ON inventory_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_store_id ON inventory_items(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_brand_id ON cash_registers(brand_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_store_id ON cash_registers(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_brand_id ON invoices(brand_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_brand_id ON inventory_movements(brand_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_brand_id ON operation_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_product_id ON operation_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_brand_id ON purchase_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_recipes_brand_id ON recipes(brand_id);
CREATE INDEX IF NOT EXISTS idx_production_records_brand_id ON production_records(brand_id);
CREATE INDEX IF NOT EXISTS idx_waste_records_brand_id ON waste_records(brand_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_brand_id ON checklist_templates(brand_id);
CREATE INDEX IF NOT EXISTS idx_checklist_executions_brand_id ON checklist_executions(brand_id);
CREATE INDEX IF NOT EXISTS idx_checklist_history_brand_id ON checklist_history(brand_id);
CREATE INDEX IF NOT EXISTS idx_licenses_brand_id ON licenses(brand_id);
CREATE INDEX IF NOT EXISTS idx_checklists_brand_id ON checklists(brand_id);

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


-- ============================================================
-- FILE: migration-security-fixes.sql
-- ============================================================
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
DROP POLICY IF EXISTS "Users can update own safe fields" ON profiles;
CREATE POLICY "Users can update own safe fields"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    AND is_active = (SELECT p.is_active FROM profiles p WHERE p.id = auth.uid())
    AND permissions = (SELECT p.permissions FROM profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Trigger can insert profiles" ON profiles;
CREATE POLICY "Trigger can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 3. BRANDS: restrict creation
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert brands" ON brands;
DROP POLICY IF EXISTS "Authenticated users can create first brand" ON brands;
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
DROP POLICY IF EXISTS "Users can insert own first brand association" ON user_brands;
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
DROP POLICY IF EXISTS "Admin/Manager can manage stores" ON stores;
CREATE POLICY "Admin/Manager can manage stores"
  ON stores FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update stores" ON stores;
CREATE POLICY "Admin/Manager can update stores"
  ON stores FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete stores" ON stores;
CREATE POLICY "Admin/Manager can delete stores"
  ON stores FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 6. CATEGORIES: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage categories" ON categories;
DROP POLICY IF EXISTS "Admin/Manager can manage categories" ON categories;
CREATE POLICY "Admin/Manager can manage categories"
  ON categories FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update categories" ON categories;
CREATE POLICY "Admin/Manager can update categories"
  ON categories FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete categories" ON categories;
CREATE POLICY "Admin/Manager can delete categories"
  ON categories FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 7. SUPPLIERS: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admin/Manager can manage suppliers" ON suppliers;
CREATE POLICY "Admin/Manager can manage suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update suppliers" ON suppliers;
CREATE POLICY "Admin/Manager can update suppliers"
  ON suppliers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete suppliers" ON suppliers;
CREATE POLICY "Admin/Manager can delete suppliers"
  ON suppliers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 8. PRODUCTS: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage products" ON products;
DROP POLICY IF EXISTS "Admin/Manager can manage products" ON products;
CREATE POLICY "Admin/Manager can manage products"
  ON products FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update products" ON products;
CREATE POLICY "Admin/Manager can update products"
  ON products FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete products" ON products;
CREATE POLICY "Admin/Manager can delete products"
  ON products FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 9. INVENTORY_ITEMS: members can insert/update (operations), admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage inventory" ON inventory_items;
DROP POLICY IF EXISTS "Members can insert inventory" ON inventory_items;
CREATE POLICY "Members can insert inventory"
  ON inventory_items FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update inventory" ON inventory_items;
CREATE POLICY "Members can update inventory"
  ON inventory_items FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete inventory" ON inventory_items;
CREATE POLICY "Admin/Manager can delete inventory"
  ON inventory_items FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 10. COST_CENTERS: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage cost centers" ON cost_centers;
DROP POLICY IF EXISTS "Admin/Manager can manage cost centers" ON cost_centers;
CREATE POLICY "Admin/Manager can manage cost centers"
  ON cost_centers FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update cost centers" ON cost_centers;
CREATE POLICY "Admin/Manager can update cost centers"
  ON cost_centers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete cost centers" ON cost_centers;
CREATE POLICY "Admin/Manager can delete cost centers"
  ON cost_centers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 11. CASH_REGISTERS: members can open/close, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage cash registers" ON cash_registers;
DROP POLICY IF EXISTS "Members can insert cash registers" ON cash_registers;
CREATE POLICY "Members can insert cash registers"
  ON cash_registers FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update cash registers" ON cash_registers;
CREATE POLICY "Members can update cash registers"
  ON cash_registers FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete cash registers" ON cash_registers;
CREATE POLICY "Admin/Manager can delete cash registers"
  ON cash_registers FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 12. INVOICES: admin/manager only for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Admin/Manager can manage invoices" ON invoices;
CREATE POLICY "Admin/Manager can manage invoices"
  ON invoices FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update invoices" ON invoices;
CREATE POLICY "Admin/Manager can update invoices"
  ON invoices FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete invoices" ON invoices;
CREATE POLICY "Admin/Manager can delete invoices"
  ON invoices FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 13. INVENTORY_MOVEMENTS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage movements" ON inventory_movements;
DROP POLICY IF EXISTS "Members can insert movements" ON inventory_movements;
CREATE POLICY "Members can insert movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update movements" ON inventory_movements;
CREATE POLICY "Members can update movements"
  ON inventory_movements FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete movements" ON inventory_movements;
CREATE POLICY "Admin/Manager can delete movements"
  ON inventory_movements FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 14. OPERATION_LOGS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage operation logs" ON operation_logs;
DROP POLICY IF EXISTS "Members can insert operation logs" ON operation_logs;
CREATE POLICY "Members can insert operation logs"
  ON operation_logs FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete operation logs" ON operation_logs;
CREATE POLICY "Admin/Manager can delete operation logs"
  ON operation_logs FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 15. PURCHASE_ORDERS: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Admin/Manager can manage purchase orders" ON purchase_orders;
CREATE POLICY "Admin/Manager can manage purchase orders"
  ON purchase_orders FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update purchase orders" ON purchase_orders;
CREATE POLICY "Admin/Manager can update purchase orders"
  ON purchase_orders FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete purchase orders" ON purchase_orders;
CREATE POLICY "Admin/Manager can delete purchase orders"
  ON purchase_orders FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 16. RECIPES: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage recipes" ON recipes;
DROP POLICY IF EXISTS "Admin/Manager can manage recipes" ON recipes;
CREATE POLICY "Admin/Manager can manage recipes"
  ON recipes FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update recipes" ON recipes;
CREATE POLICY "Admin/Manager can update recipes"
  ON recipes FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete recipes" ON recipes;
CREATE POLICY "Admin/Manager can delete recipes"
  ON recipes FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 17. PRODUCTION_RECORDS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage production records" ON production_records;
DROP POLICY IF EXISTS "Members can insert production records" ON production_records;
CREATE POLICY "Members can insert production records"
  ON production_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete production records" ON production_records;
CREATE POLICY "Admin/Manager can delete production records"
  ON production_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 18. WASTE_VARIANTS: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage waste variants" ON waste_variants;
DROP POLICY IF EXISTS "Admin/Manager can manage waste variants" ON waste_variants;
CREATE POLICY "Admin/Manager can manage waste variants"
  ON waste_variants FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update waste variants" ON waste_variants;
CREATE POLICY "Admin/Manager can update waste variants"
  ON waste_variants FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete waste variants" ON waste_variants;
CREATE POLICY "Admin/Manager can delete waste variants"
  ON waste_variants FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 19. WASTE_REASONS: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage waste reasons" ON waste_reasons;
DROP POLICY IF EXISTS "Admin/Manager can manage waste reasons" ON waste_reasons;
CREATE POLICY "Admin/Manager can manage waste reasons"
  ON waste_reasons FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update waste reasons" ON waste_reasons;
CREATE POLICY "Admin/Manager can update waste reasons"
  ON waste_reasons FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete waste reasons" ON waste_reasons;
CREATE POLICY "Admin/Manager can delete waste reasons"
  ON waste_reasons FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 20. WASTE_RECORDS: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage waste records" ON waste_records;
DROP POLICY IF EXISTS "Members can insert waste records" ON waste_records;
CREATE POLICY "Members can insert waste records"
  ON waste_records FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete waste records" ON waste_records;
CREATE POLICY "Admin/Manager can delete waste records"
  ON waste_records FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 21. CHECKLIST_TEMPLATES: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklist templates" ON checklist_templates;
DROP POLICY IF EXISTS "Admin/Manager can manage checklist templates" ON checklist_templates;
CREATE POLICY "Admin/Manager can manage checklist templates"
  ON checklist_templates FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update checklist templates" ON checklist_templates;
CREATE POLICY "Admin/Manager can update checklist templates"
  ON checklist_templates FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete checklist templates" ON checklist_templates;
CREATE POLICY "Admin/Manager can delete checklist templates"
  ON checklist_templates FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 22. CHECKLIST_EXECUTIONS: members can create/update, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklist executions" ON checklist_executions;
DROP POLICY IF EXISTS "Members can insert checklist executions" ON checklist_executions;
CREATE POLICY "Members can insert checklist executions"
  ON checklist_executions FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update checklist executions" ON checklist_executions;
CREATE POLICY "Members can update checklist executions"
  ON checklist_executions FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete checklist executions" ON checklist_executions;
CREATE POLICY "Admin/Manager can delete checklist executions"
  ON checklist_executions FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 23. CHECKLIST_HISTORY: members can create, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklist history" ON checklist_history;
DROP POLICY IF EXISTS "Members can insert checklist history" ON checklist_history;
CREATE POLICY "Members can insert checklist history"
  ON checklist_history FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete checklist history" ON checklist_history;
CREATE POLICY "Admin/Manager can delete checklist history"
  ON checklist_history FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 24. LICENSES: admin/manager for write
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage licenses" ON licenses;
DROP POLICY IF EXISTS "Admin/Manager can manage licenses" ON licenses;
CREATE POLICY "Admin/Manager can manage licenses"
  ON licenses FOR INSERT
  WITH CHECK (is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can update licenses" ON licenses;
CREATE POLICY "Admin/Manager can update licenses"
  ON licenses FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));
DROP POLICY IF EXISTS "Admin/Manager can delete licenses" ON licenses;
CREATE POLICY "Admin/Manager can delete licenses"
  ON licenses FOR DELETE
  USING (brand_id = ANY(get_user_brand_ids()) AND is_brand_admin_or_manager(brand_id));

-- ============================================================
-- 25. CHECKLISTS (simple): members can create/update, admin for delete
-- ============================================================
DROP POLICY IF EXISTS "Brand members can manage checklists" ON checklists;
DROP POLICY IF EXISTS "Members can insert checklists" ON checklists;
CREATE POLICY "Members can insert checklists"
  ON checklists FOR INSERT
  WITH CHECK (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Members can update checklists" ON checklists;
CREATE POLICY "Members can update checklists"
  ON checklists FOR UPDATE
  USING (brand_id = ANY(get_user_brand_ids()));
DROP POLICY IF EXISTS "Admin/Manager can delete checklists" ON checklists;
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


-- ============================================================
-- FILE: migration-registration-requests.sql
-- ============================================================
-- ============================================================
-- OPERUS - Registration requests (solicitaÃ§Ãµes de cadastro)
-- Execute no SQL Editor do Supabase para criar a tabela.
-- Permite que visitantes enviem solicitaÃ§Ã£o; sÃ³ developer pode ler.
-- ============================================================

CREATE TABLE IF NOT EXISTS registration_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  brand_name text DEFAULT '',
  stores_range text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (incl. anÃ´nima) pode inserir uma solicitaÃ§Ã£o
DROP POLICY IF EXISTS "Allow insert registration requests" ON registration_requests;
CREATE POLICY "Allow insert registration requests"
  ON registration_requests FOR INSERT
  WITH CHECK (true);

-- Apenas usuÃ¡rios com role developer podem ver as solicitaÃ§Ãµes
DROP POLICY IF EXISTS "Developer can read registration requests" ON registration_requests;
CREATE POLICY "Developer can read registration requests"
  ON registration_requests FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'
  );

-- NinguÃ©m pode atualizar ou apagar (sÃ³ developer via dashboard se quiser)
-- Para permitir que developer apague: adicione uma policy FOR DELETE com role = 'developer'


-- ============================================================
-- FILE: migration-registration-requests-add-fields.sql
-- ============================================================
-- Adiciona campos "nome da marca" e "quantidade de lojas" Ã  tabela existente.
-- Execute no SQL Editor do Supabase se a tabela registration_requests jÃ¡ existir.

ALTER TABLE registration_requests
  ADD COLUMN IF NOT EXISTS brand_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stores_range text DEFAULT '';


-- ============================================================
-- FILE: migration-registration-requests-status.sql
-- ============================================================
-- Adiciona status Ã s solicitaÃ§Ãµes de cadastro (Interessados): pendente | aprovado
-- Developer pode atualizar para marcar como aprovado.
-- Execute no SQL Editor do Supabase.
--
-- Para notificaÃ§Ãµes em tempo real: no Dashboard Supabase, Database -> Replication,
-- ative a replicaÃ§Ã£o para a tabela registration_requests.

ALTER TABLE registration_requests
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado'));

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);

-- Developer pode atualizar registration_requests (ex.: status = 'aprovado')
DROP POLICY IF EXISTS "Developer can update registration requests" ON registration_requests;
CREATE POLICY "Developer can update registration requests"
  ON registration_requests FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');


-- ============================================================
-- FILE: migration-registration-requests-password-and-delete.sql
-- ============================================================
-- ============================================================
-- Interessados: guardar senha temporÃ¡ria (ver novamente) e permitir excluir.
-- Developer por email pode ler profiles (lista de usuÃ¡rios).
-- Execute apÃ³s migration-developer-emails-registration-read.sql
-- ============================================================

-- Senha temporÃ¡ria guardada ao aprovar (apenas developer pode ler)
ALTER TABLE public.registration_requests
  ADD COLUMN IF NOT EXISTS temp_password text;

-- Developer por email pode apagar solicitaÃ§Ãµes
DROP POLICY IF EXISTS "Developer by email can delete registration_requests" ON public.registration_requests;
CREATE POLICY "Developer by email can delete registration_requests"
  ON public.registration_requests FOR DELETE
  USING (public.is_developer_by_email());

-- Developer por email pode ler todos os profiles (lista UsuÃ¡rios no DevUsers)
DROP POLICY IF EXISTS "Developer by email can read all profiles" ON public.profiles;
CREATE POLICY "Developer by email can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_developer_by_email());


-- ============================================================
-- FILE: migration-registration-requests-conta-criada.sql
-- ============================================================
-- Status 'conta_criada': conta criada, aguardando confirmaÃ§Ã£o por email.
-- Quando o utilizador confirmar o email, atualizar para 'aprovado' (ex.: via Auth Hook ou funÃ§Ã£o).
-- Developer (por email ou profile) pode fazer UPDATE.

-- Alargar o CHECK de status para incluir 'conta_criada'
ALTER TABLE registration_requests
  DROP CONSTRAINT IF EXISTS registration_requests_status_check;
ALTER TABLE registration_requests
  ADD CONSTRAINT registration_requests_status_check
  CHECK (status IN ('pendente', 'conta_criada', 'aprovado'));

-- Developer por email pode atualizar registration_requests (ex.: status = 'conta_criada' ou 'aprovado')
DROP POLICY IF EXISTS "Developer by email can update registration_requests" ON public.registration_requests;
CREATE POLICY "Developer by email can update registration_requests"
  ON public.registration_requests FOR UPDATE
  USING (public.is_developer_by_email())
  WITH CHECK (public.is_developer_by_email());

-- Marcar solicitaÃ§Ã£o como confirmada (chamar quando o utilizador confirmar o email, ex.: Auth Hook / Edge Function)
-- Exemplo: SELECT public.mark_registration_confirmed_by_email('user@example.com');
CREATE OR REPLACE FUNCTION public.mark_registration_confirmed_by_email(user_email text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE registration_requests SET status = 'aprovado' WHERE email = user_email AND (status = 'conta_criada' OR status IS NULL);
$$;


-- ============================================================
-- FILE: migration-set-developer-role.sql
-- ============================================================
-- Set a user's application role to 'developer' (run in Supabase SQL Editor).
-- The app reads role from public.profiles, not from Auth's "authenticated" role.
-- Replace the email below if needed.

-- Temporarily allow updating role (trigger normally blocks self-updates)
DROP TRIGGER IF EXISTS protect_role_on_update ON profiles;

UPDATE profiles
SET role = 'developer'
WHERE email = 'developer.yuregabriel@gmail.com';
-- Adicione mais linhas se precisar (ex.: WHERE email = 'teu-email@gmail.com');

-- Recreate the trigger
CREATE TRIGGER protect_role_on_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_role();


-- ============================================================
-- FILE: migration-developer-profile-access.sql
-- ============================================================
-- Garante que o utilizador developer consegue ler o prÃ³prio perfil e que a app
-- pode obter o role mesmo em edge cases. Executar no Supabase SQL Editor.

-- 1) Garantir polÃ­tica de leitura do prÃ³prio perfil (caso nÃ£o exista ou tenha sido removida)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- 2) FunÃ§Ã£o para a app obter o role do utilizador atual (fallback; RLS nÃ£o bloqueia)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Dar permissÃ£o ao role anon/authenticated para chamar a funÃ§Ã£o
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;


-- ============================================================
-- FILE: migration-developer-read-all.sql
-- ============================================================
-- Developer can read all brands, stores, and licenses (for DevDashboard and DevBrands).
-- Run in Supabase SQL Editor.

-- Brands: developer can select all
DROP POLICY IF EXISTS "Developer can read all brands" ON brands;
CREATE POLICY "Developer can read all brands"
  ON brands FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- Stores: developer can select all
DROP POLICY IF EXISTS "Developer can read all stores" ON stores;
CREATE POLICY "Developer can read all stores"
  ON stores FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- Licenses: developer can select all
DROP POLICY IF EXISTS "Developer can read all licenses" ON licenses;
CREATE POLICY "Developer can read all licenses"
  ON licenses FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- Profiles: developer can read all (for user list in DevBrands/DevUsers)
DROP POLICY IF EXISTS "Developer can read all profiles" ON profiles;
CREATE POLICY "Developer can read all profiles"
  ON profiles FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');


-- ============================================================
-- FILE: migration-developer-read-invoices.sql
-- ============================================================
-- Developer can read all invoices and user_brands (for DevFinance and DevUsers).
-- Run in Supabase SQL Editor if not already applied.

DROP POLICY IF EXISTS "Developer can read all invoices" ON invoices;
CREATE POLICY "Developer can read all invoices"
  ON invoices FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

DROP POLICY IF EXISTS "Developer can read all user_brands" ON user_brands;
CREATE POLICY "Developer can read all user_brands"
  ON user_brands FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');


-- ============================================================
-- FILE: migration-developer-settings-table.sql
-- ============================================================
-- Tabela para configuraÃ§Ãµes do desenvolvedor (DevSettings). Apenas developers podem ler/escrever.
-- Executar no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS developer_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE developer_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developer can manage developer_settings" ON developer_settings;
CREATE POLICY "Developer can manage developer_settings"
  ON developer_settings FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');


-- ============================================================
-- FILE: migration-developer-emails-registration-read.sql
-- ============================================================
-- ============================================================
-- Permite que developers vejam registration_requests por EMAIL (JWT),
-- mesmo que profiles.role ainda nÃ£o esteja 'developer'.
-- Assim a lista "Interessados" aparece assim que o teu email estiver aqui.
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- Tabela de emails considerados developer (nÃ£o exposta ao cliente; usada pela funÃ§Ã£o)
CREATE TABLE IF NOT EXISTS public.developer_emails (
  email text PRIMARY KEY
);

ALTER TABLE public.developer_emails ENABLE ROW LEVEL SECURITY;

-- Nenhum acesso direto ao cliente (a leitura Ã© feita sÃ³ na funÃ§Ã£o com SECURITY DEFINER)
DROP POLICY IF EXISTS "No direct client access" ON public.developer_emails;
CREATE POLICY "No direct client access"
  ON public.developer_emails FOR ALL
  USING (false)
  WITH CHECK (false);

-- Inserir emails que devem ter acesso Ã  lista Interessados (troca pelos teus)
INSERT INTO public.developer_emails (email) VALUES
  ('developer.yuregabriel@gmail.com'),
  ('yuhgamestv@gmail.com'),
  ('yuhsantostv@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- FunÃ§Ã£o que verifica se o email do JWT estÃ¡ em developer_emails (corre com dono da BD)
CREATE OR REPLACE FUNCTION public.is_developer_by_email()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_emails
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- Policy: permite SELECT em registration_requests se profile.role = 'developer' OU email no allowlist
DROP POLICY IF EXISTS "Developer by email can read registration_requests" ON public.registration_requests;
CREATE POLICY "Developer by email can read registration_requests"
  ON public.registration_requests FOR SELECT
  USING (public.is_developer_by_email());

-- RPC de fallback: devolve registration_requests sÃ³ se o caller for developer por email
-- (o frontend filtra por status; assim funciona mesmo sem coluna status)
CREATE OR REPLACE FUNCTION public.get_registration_requests()
RETURNS SETOF public.registration_requests
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT r.* FROM public.registration_requests r
  WHERE public.is_developer_by_email()
  ORDER BY r.created_at DESC;
$$;


-- ============================================================
-- FILE: migration-auth-confirm-mark-registration.sql
-- ============================================================
-- ============================================================
-- Quando o utilizador confirmar o email (auth.users.email_confirmed_at),
-- marcar a solicitaÃ§Ã£o em registration_requests como 'aprovado'.
-- Assim o interessado sai da lista Interessados e pode ser tratado como
-- utilizador ativo (jÃ¡ aparece em UsuÃ¡rios se tiver perfil).
-- Execute no SQL Editor do Supabase.
-- ============================================================

CREATE OR REPLACE FUNCTION public.on_auth_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.mark_registration_confirmed_by_email(NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger em auth.users (criar no SQL Editor do Supabase).
-- PrÃ©-requisito: executar antes migration-registration-requests-conta-criada.sql
-- (funÃ§Ã£o mark_registration_confirmed_by_email).
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.on_auth_user_email_confirmed();


-- ============================================================
-- FILE: migration-developer-master-access.sql
-- ============================================================
-- ============================================================
-- Developer: acesso total (SELECT, INSERT, UPDATE, DELETE) a todas
-- as tabelas do projeto. Utiliza role = 'developer' em profiles
-- OU email em developer_emails (funÃ§Ã£o is_developer_by_email).
-- Assim a lista "UsuÃ¡rios" (profiles) e todas as outras listas/dados carregam.
-- Execute apÃ³s migration-developer-emails-registration-read.sql
-- ============================================================

-- FunÃ§Ã£o Ãºnica para "Ã© developer?" (profile.role OU email na allowlist)
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'
     OR public.is_developer_by_email();
$$;

-- Tabelas que o developer pode aceder por completo (todas as que existirem)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles', 'brands', 'user_brands', 'registration_requests', 'stores',
    'categories', 'suppliers', 'products', 'inventory_items', 'cost_centers',
    'cash_registers', 'invoices', 'inventory_movements', 'operation_logs',
    'purchase_orders', 'recipes', 'production_records', 'waste_variants',
    'waste_reasons', 'waste_records', 'checklist_templates', 'checklist_executions',
    'checklist_history', 'licenses', 'checklists', 'developer_settings',
    'developer_notification_reads'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "Developer full access" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "Developer full access" ON public.%I FOR ALL USING (public.is_developer()) WITH CHECK (public.is_developer())',
        t
      );
    END IF;
  END LOOP;
END $$;


-- ============================================================
-- FILE: migration-developer-notification-reads.sql
-- ============================================================
-- ============================================================
-- NotificaÃ§Ãµes do developer: tabela para marcar como lidas (persistido na BD).
-- Cada linha = um developer marcou uma solicitaÃ§Ã£o (registration_request) como lida.
-- Execute apÃ³s migration-developer-emails-registration-read.sql
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

-- Developer sÃ³ vÃª/insere os seus prÃ³prios registos (Ã© developer por role ou email)
DROP POLICY IF EXISTS "Developer can manage own notification reads" ON public.developer_notification_reads;
CREATE POLICY "Developer can manage own notification reads"
  ON public.developer_notification_reads FOR ALL
  USING (developer_id = auth.uid() AND (public.is_developer_by_email() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'))
  WITH CHECK (developer_id = auth.uid());

-- Marcar uma notificaÃ§Ã£o como lida (id = registration_request_id)
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

-- Marcar todas as notificaÃ§Ãµes (registration_requests) como lidas para o developer atual
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


-- ============================================================
-- FILE: migration-developer-full-access.sql
-- ============================================================
-- Migration: Allow developer to fully manage user_brands (insert, update, delete)
-- Run this in the Supabase SQL Editor.

-- Developer can delete user_brands (for removing user from brand when deleting/editing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete user_brands'
  ) THEN
    DROP POLICY IF EXISTS "Developer can delete user_brands" ON user_brands;
CREATE POLICY "Developer can delete user_brands"
      ON user_brands FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can insert user_brands (for assigning users to brands)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can insert user_brands'
  ) THEN
    DROP POLICY IF EXISTS "Developer can insert user_brands" ON user_brands;
CREATE POLICY "Developer can insert user_brands"
      ON user_brands FOR INSERT
      WITH CHECK (public.is_developer());
  END IF;
END $$;

-- Developer can update user_brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update user_brands'
  ) THEN
    DROP POLICY IF EXISTS "Developer can update user_brands" ON user_brands;
CREATE POLICY "Developer can update user_brands"
      ON user_brands FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can delete brands (if not already allowed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete brands'
  ) THEN
    DROP POLICY IF EXISTS "Developer can delete brands" ON brands;
CREATE POLICY "Developer can delete brands"
      ON brands FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can delete stores (if not already allowed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete stores'
  ) THEN
    DROP POLICY IF EXISTS "Developer can delete stores" ON stores;
CREATE POLICY "Developer can delete stores"
      ON stores FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can read all stores (for DevBrands store listing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can read all stores'
  ) THEN
    DROP POLICY IF EXISTS "Developer can read all stores" ON stores;
CREATE POLICY "Developer can read all stores"
      ON stores FOR SELECT
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can update all stores
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update all stores'
  ) THEN
    DROP POLICY IF EXISTS "Developer can update all stores" ON stores;
CREATE POLICY "Developer can update all stores"
      ON stores FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can insert stores
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can insert stores'
  ) THEN
    DROP POLICY IF EXISTS "Developer can insert stores" ON stores;
CREATE POLICY "Developer can insert stores"
      ON stores FOR INSERT
      WITH CHECK (public.is_developer());
  END IF;
END $$;

-- Developer can read all brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can read all brands'
  ) THEN
    DROP POLICY IF EXISTS "Developer can read all brands" ON brands;
CREATE POLICY "Developer can read all brands"
      ON brands FOR SELECT
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can update all brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update all brands'
  ) THEN
    DROP POLICY IF EXISTS "Developer can update all brands" ON brands;
CREATE POLICY "Developer can update all brands"
      ON brands FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can insert brands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can insert brands'
  ) THEN
    DROP POLICY IF EXISTS "Developer can insert brands" ON brands;
CREATE POLICY "Developer can insert brands"
      ON brands FOR INSERT
      WITH CHECK (public.is_developer());
  END IF;
END $$;

-- Developer can delete registration_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can delete registration_requests'
  ) THEN
    DROP POLICY IF EXISTS "Developer can delete registration_requests" ON registration_requests;
CREATE POLICY "Developer can delete registration_requests"
      ON registration_requests FOR DELETE
      USING (public.is_developer());
  END IF;
END $$;

-- Developer can update registration_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Developer can update registration_requests'
  ) THEN
    DROP POLICY IF EXISTS "Developer can update registration_requests" ON registration_requests;
CREATE POLICY "Developer can update registration_requests"
      ON registration_requests FOR UPDATE
      USING (public.is_developer());
  END IF;
END $$;


-- ============================================================
-- FILE: migration-developer-list-users.sql
-- ============================================================
-- ============================================================
-- RPC function to let developers list all profiles (bypasses RLS).
-- Run in the Supabase SQL Editor.
-- ============================================================

-- Returns all non-developer profiles for the DevUsers page.
-- Only developers (by role or allowlisted email) can call it.
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_developer()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id, p.name, p.email, p.role, p.is_active, p.created_at
  FROM profiles p
  WHERE (
    (SELECT pr.role FROM profiles pr WHERE pr.id = auth.uid()) = 'developer'
    OR public.is_developer_by_email()
  )
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_developer() TO authenticated;


-- ============================================================
-- FILE: migration-add-store-columns.sql
-- ============================================================
-- Migration: Add missing columns to stores table
-- Required by the expanded Edit Store dialog (image_url, plan, plan_value)

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Starter';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan_value numeric DEFAULT 0;


-- ============================================================
-- FILE: migration-add-store-ids-to-user-brands.sql
-- ============================================================
-- Migration: Add store_ids to user_brands
-- Tracks which specific stores a user has access to within a brand.
-- An empty array means access to all stores of that brand.
ALTER TABLE public.user_brands
  ADD COLUMN IF NOT EXISTS store_ids jsonb DEFAULT '[]'::jsonb;


-- ============================================================
-- FILE: migration-developer-rpc-functions.sql
-- ============================================================
-- ============================================================
-- Developer RPC Functions (SECURITY DEFINER â€” bypass RLS)
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Add store_id column to user_brands (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_brands' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE user_brands ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;


-- 1. Full user update for developer
CREATE OR REPLACE FUNCTION update_user_for_developer(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_role text,
  p_is_active boolean,
  p_brand_id uuid DEFAULT NULL,
  p_store_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Permission denied: not a developer';
  END IF;

  -- Update profile
  UPDATE profiles
  SET name = p_name, email = p_email, role = p_role, is_active = p_is_active, updated_at = now()
  WHERE id = p_user_id;

  -- Update brand + store association if brand provided
  IF p_brand_id IS NOT NULL THEN
    DELETE FROM user_brands WHERE user_id = p_user_id;
    INSERT INTO user_brands (user_id, brand_id, role, store_id)
    VALUES (p_user_id, p_brand_id, p_role, p_store_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Full user delete for developer (profiles + user_brands + registration_requests)
CREATE OR REPLACE FUNCTION delete_user_for_developer(
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Permission denied: not a developer';
  END IF;

  SELECT email INTO v_email FROM profiles WHERE id = p_user_id;

  DELETE FROM user_brands WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE id = p_user_id;

  IF v_email IS NOT NULL THEN
    DELETE FROM registration_requests WHERE lower(email) = lower(v_email);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Delete interessado AND associated account for developer
CREATE OR REPLACE FUNCTION delete_interessado_for_developer(
  p_request_id uuid
)
RETURNS void AS $$
DECLARE
  v_email text;
  v_user_id uuid;
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Permission denied: not a developer';
  END IF;

  SELECT email INTO v_email FROM registration_requests WHERE id = p_request_id;

  IF v_email IS NOT NULL THEN
    SELECT id INTO v_user_id FROM profiles WHERE lower(email) = lower(v_email);

    IF v_user_id IS NOT NULL THEN
      DELETE FROM user_brands WHERE user_id = v_user_id;
      DELETE FROM profiles WHERE id = v_user_id;
    END IF;
  END IF;

  DELETE FROM registration_requests WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FILE: migration-fix-rls-recursion-and-storage.sql
-- ============================================================
-- ============================================================
-- FIX: Infinite recursion on profiles + brand-images bucket
-- Run in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. Fix is_developer() to NOT query profiles (which causes
--    infinite recursion when a Developer-full-access policy
--    on profiles itself calls is_developer()).
--    Uses auth.jwt() metadata instead.
-- ============================================================
-- Helper: check profiles.role directly, bypassing RLS
CREATE OR REPLACE FUNCTION public.is_developer_by_profile()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT
    -- Check JWT metadata first (fast, no table query)
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'developer',
      false
    )
    OR
    -- Check profiles.role via SECURITY DEFINER (bypasses RLS, no recursion)
    public.is_developer_by_profile()
    OR
    -- Fallback: check developer_emails allowlist
    public.is_developer_by_email();
$$;

-- ============================================================
-- 2. Drop ALL existing policies on profiles to start clean
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- ============================================================
-- 3. Create simple, non-recursive profiles policies
-- ============================================================

-- Everyone can read own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Developers can read ALL profiles
DROP POLICY IF EXISTS "profiles_select_developer" ON profiles;
CREATE POLICY "profiles_select_developer"
  ON profiles FOR SELECT
  USING (public.is_developer());

-- Users can update their own safe fields (role/permissions protected by trigger)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Developers can update any profile
DROP POLICY IF EXISTS "profiles_update_developer" ON profiles;
CREATE POLICY "profiles_update_developer"
  ON profiles FOR UPDATE
  USING (public.is_developer());

-- Insert: allow trigger-based profile creation on signup
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Developers can insert profiles
DROP POLICY IF EXISTS "profiles_insert_developer" ON profiles;
CREATE POLICY "profiles_insert_developer"
  ON profiles FOR INSERT
  WITH CHECK (public.is_developer());

-- Developers can delete profiles
DROP POLICY IF EXISTS "profiles_delete_developer" ON profiles;
CREATE POLICY "profiles_delete_developer"
  ON profiles FOR DELETE
  USING (public.is_developer());

-- ============================================================
-- 4. Create brand-images storage bucket (if storage is available)
-- ============================================================
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not available, skipping brand-images bucket setup';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'brand-images',
    'brand-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']::text[]
  )
  ON CONFLICT (id) DO NOTHING;

  DROP POLICY IF EXISTS "Authenticated can upload brand images" ON storage.objects;
  CREATE POLICY "Authenticated can upload brand images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'brand-images');

  DROP POLICY IF EXISTS "Public can read brand images" ON storage.objects;
  CREATE POLICY "Public can read brand images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'brand-images');

  DROP POLICY IF EXISTS "Authenticated can update brand images" ON storage.objects;
  CREATE POLICY "Authenticated can update brand images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'brand-images');

  DROP POLICY IF EXISTS "Authenticated can delete brand images" ON storage.objects;
  CREATE POLICY "Authenticated can delete brand images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'brand-images');
END $$;


-- ============================================================
-- FILE: migration-fix-developer-access.sql
-- ============================================================
-- ============================================================
-- FIX: Restaurar acesso de developer para ver usuÃ¡rios
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Garantir tabela developer_emails
CREATE TABLE IF NOT EXISTS public.developer_emails (
  email text PRIMARY KEY
);

INSERT INTO public.developer_emails (email) VALUES
  ('developer.yuregabriel@gmail.com'),
  ('yuhgamestv@gmail.com'),
  ('yuhsantostv@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 2. FunÃ§Ã£o is_developer_by_email
CREATE OR REPLACE FUNCTION public.is_developer_by_email()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_emails
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- 3. FunÃ§Ã£o is_developer
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT 
    public.is_developer_by_email()
    OR COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), '') = 'developer';
$$;

-- 4. Policy para developer ver todos os profiles
DROP POLICY IF EXISTS "profiles_select_developer" ON public.profiles;
CREATE POLICY "profiles_select_developer" ON public.profiles FOR SELECT
  USING (public.is_developer());

-- 5. RPC para listar profiles (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_developer()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.role, p.is_active, p.created_at
  FROM public.profiles p
  WHERE p.role != 'developer'
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_developer() TO authenticated;

-- 6. Policies para brands, stores, user_brands
DROP POLICY IF EXISTS "brands_select_developer" ON public.brands;
CREATE POLICY "brands_select_developer" ON public.brands FOR SELECT
  USING (public.is_developer());

DROP POLICY IF EXISTS "stores_select_developer" ON public.stores;
CREATE POLICY "stores_select_developer" ON public.stores FOR SELECT
  USING (public.is_developer());

DROP POLICY IF EXISTS "user_brands_select_developer" ON public.user_brands;
CREATE POLICY "user_brands_select_developer" ON public.user_brands FOR SELECT
  USING (public.is_developer());

-- 7. Garantir que seus profiles tÃªm role developer
UPDATE public.profiles 
SET role = 'developer' 
WHERE lower(email) IN (SELECT lower(email) FROM public.developer_emails);

SELECT 'Acesso restaurado!' as status;


-- ============================================================
-- FILE: migration-cash-registers-deposited.sql
-- ============================================================
-- Add deposited flag to cash_registers so "Fechamento Anterior" can zero after deposit
ALTER TABLE cash_registers
ADD COLUMN IF NOT EXISTS deposited boolean DEFAULT false;

COMMENT ON COLUMN cash_registers.deposited IS 'When true, the next opening should use 0 as previous closing (value was deposited).';


-- ============================================================
-- FILE: migration-cash-registers-closure-details.sql
-- ============================================================
-- Store full closing form data (espÃ©cie, cartÃ£o, delivery, apuraÃ§Ã£o, extras, etc.)
ALTER TABLE cash_registers
  ADD COLUMN IF NOT EXISTS closure_details jsonb;

COMMENT ON COLUMN cash_registers.closure_details IS 'Full closing form: closingEspecie, closingCartao, closingDelivery, cartaoItems, deliveryItems, apuracao*, extras, comments, etc.';


-- ============================================================
-- FILE: migration-product-images-bucket.sql
-- ============================================================
-- Migration: Create product-images storage bucket
-- Allows uploading product images directly from the app.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not available, skipping product-images bucket setup';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg','image/png','image/gif','image/webp']::text[]
  )
  ON CONFLICT (id) DO NOTHING;

  -- Drop policies first to allow re-running this migration safely
  DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;

  CREATE POLICY "Authenticated can upload product images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-images');

  CREATE POLICY "Public can read product images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'product-images');

  CREATE POLICY "Authenticated can update product images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-images');

  CREATE POLICY "Authenticated can delete product images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');
END $$;


