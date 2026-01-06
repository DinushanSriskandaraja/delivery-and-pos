-- Fix shop_products RLS policies to allow shop owners to view all their products
-- This fixes the issue where shop products are not being fetched from the database

-- DROP ALL POSSIBLE EXISTING POLICIES FIRST
DROP POLICY IF EXISTS "Anyone can view available shop products" ON shop_products;
DROP POLICY IF EXISTS "Shop owners can manage their shop products" ON shop_products;
DROP POLICY IF EXISTS "Shop owners can view their shop products" ON shop_products;
DROP POLICY IF EXISTS "Shop owners can insert their shop products" ON shop_products;
DROP POLICY IF EXISTS "Shop owners can update their shop products" ON shop_products;
DROP POLICY IF EXISTS "Shop owners can delete their shop products" ON shop_products;

-- Create new, more explicit policies
-- Policy 1: Anyone can view available shop products (for consumers browsing)
CREATE POLICY "Anyone can view available shop products" ON shop_products 
FOR SELECT 
USING (is_available = true);

-- Policy 2: Shop owners can view ALL their shop products (regardless of availability)
CREATE POLICY "Shop owners can view their shop products" ON shop_products 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Policy 3: Shop owners can insert their shop products
CREATE POLICY "Shop owners can insert their shop products" ON shop_products 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Policy 4: Shop owners can update their shop products
CREATE POLICY "Shop owners can update their shop products" ON shop_products 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Policy 5: Shop owners can delete their shop products
CREATE POLICY "Shop owners can delete their shop products" ON shop_products 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);
