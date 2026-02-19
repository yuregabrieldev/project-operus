-- Developer can read all brands, stores, and licenses (for DevDashboard and DevBrands).
-- Run in Supabase SQL Editor.

-- Brands: developer can select all
CREATE POLICY "Developer can read all brands"
  ON brands FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- Stores: developer can select all
CREATE POLICY "Developer can read all stores"
  ON stores FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- Licenses: developer can select all
CREATE POLICY "Developer can read all licenses"
  ON licenses FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');

-- Profiles: developer can read all (for user list in DevBrands/DevUsers)
CREATE POLICY "Developer can read all profiles"
  ON profiles FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'developer');
