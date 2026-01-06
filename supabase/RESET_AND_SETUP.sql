-- ============================================================================
-- COMPLETE DATABASE RESET AND SETUP FOR DELIVERY-AND-POS
-- ============================================================================
-- WARNING: This will DROP ALL EXISTING DATA!
-- Only run this on a fresh database or if you want to completely reset
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- ============================================================================

-- IMPORTANT: Disable the trigger first to prevent it from firing during cleanup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop other triggers
DROP TRIGGER IF EXISTS shop_products_updated_at ON shop_products;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_shop_products_updated_at() CASCADE;
DROP FUNCTION IF EXISTS calculate_order_total(UUID) CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS consumer_addresses CASCADE;
DROP TABLE IF EXISTS shop_reviews CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS delivery_partners CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_requests CASCADE;
DROP TABLE IF EXISTS shop_products CASCADE;
DROP TABLE IF EXISTS global_products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop storage bucket
DELETE FROM storage.objects WHERE bucket_id = 'product-images';
DELETE FROM storage.buckets WHERE id = 'product-images';

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'shop_owner', 'consumer', 'delivery_partner')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shops table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global products catalog
CREATE TABLE global_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  base_unit TEXT NOT NULL,
  image_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop-specific products with pricing
CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  global_product_id UUID NOT NULL REFERENCES global_products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, global_product_id)
);

-- Product requests from shop owners
CREATE TABLE product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES users(id),
  shop_id UUID NOT NULL REFERENCES shops(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup', 'walk_in')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  assigned_delivery_partner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_product_id UUID NOT NULL REFERENCES shop_products(id),
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- Delivery partners
CREATE TABLE delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5)
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url TEXT
);

-- Shop reviews and ratings
CREATE TABLE shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(consumer_id, order_id)
);

-- Consumer addresses for quick checkout
CREATE TABLE consumer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_shops_location ON shops(latitude, longitude);
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_active ON shops(is_active, is_approved);
CREATE INDEX idx_shop_products_shop ON shop_products(shop_id);
CREATE INDEX idx_shop_products_global ON shop_products(global_product_id);
CREATE INDEX idx_orders_consumer ON orders(consumer_id);
CREATE INDEX idx_orders_shop ON orders(shop_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_partner ON orders(assigned_delivery_partner_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_global_products_category ON global_products(category);
CREATE INDEX idx_product_requests_shop ON product_requests(shop_id);
CREATE INDEX idx_product_requests_status ON product_requests(status);
CREATE INDEX idx_shop_reviews_shop ON shop_reviews(shop_id);
CREATE INDEX idx_shop_reviews_consumer ON shop_reviews(consumer_id);
CREATE INDEX idx_consumer_addresses_consumer ON consumer_addresses(consumer_id);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_addresses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Users policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can insert user data on signup" ON users FOR INSERT WITH CHECK (true);

-- Shops policies
CREATE POLICY "Anyone can view approved active shops" ON shops FOR SELECT USING (is_approved = true AND is_active = true);
CREATE POLICY "Shop owners can view their own shops" ON shops FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Shop owners can create shops" ON shops FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Shop owners can update their own shops" ON shops FOR UPDATE USING (auth.uid() = owner_id);

-- Global products policies
CREATE POLICY "Anyone can view approved products" ON global_products FOR SELECT USING (is_approved = true);
CREATE POLICY "Authenticated users can insert products" ON global_products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update products" ON global_products FOR UPDATE USING (auth.role() = 'authenticated');

-- Shop products policies
CREATE POLICY "Anyone can view available shop products" ON shop_products FOR SELECT USING (is_available = true);
CREATE POLICY "Shop owners can manage their shop products" ON shop_products FOR ALL USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Product requests policies
CREATE POLICY "Shop owners can create product requests" ON product_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Shop owners can view their requests" ON product_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Orders policies
CREATE POLICY "Consumers can view their orders" ON orders FOR SELECT USING (auth.uid() = consumer_id);
CREATE POLICY "Shop owners can view their shop orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Delivery partners can view assigned orders" ON orders FOR SELECT USING (auth.uid() = assigned_delivery_partner_id);
CREATE POLICY "Consumers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Shop owners can update their shop orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Delivery partners can update assigned orders" ON orders FOR UPDATE USING (auth.uid() = assigned_delivery_partner_id);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id 
    AND (consumer_id = auth.uid() OR assigned_delivery_partner_id = auth.uid() OR shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  )
);
CREATE POLICY "Consumers can insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND consumer_id = auth.uid())
);

-- Delivery partners policies
CREATE POLICY "Anyone can view available delivery partners" ON delivery_partners FOR SELECT USING (is_available = true);
CREATE POLICY "Delivery partners can update their own data" ON delivery_partners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delivery partners can insert their data" ON delivery_partners FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view invoices for their orders" ON invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id 
    AND (consumer_id = auth.uid() OR shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  )
);
CREATE POLICY "Shop owners can create invoices" ON invoices FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o JOIN shops s ON o.shop_id = s.id WHERE o.id = order_id AND s.owner_id = auth.uid())
);

-- Shop reviews policies
CREATE POLICY "Anyone can view shop reviews" ON shop_reviews FOR SELECT USING (true);
CREATE POLICY "Consumers can create reviews for completed orders" ON shop_reviews FOR INSERT WITH CHECK (
  auth.uid() = consumer_id AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id 
    AND consumer_id = auth.uid() 
    AND status IN ('delivered', 'completed')
  )
);
CREATE POLICY "Consumers can update their own reviews" ON shop_reviews FOR UPDATE USING (auth.uid() = consumer_id);
CREATE POLICY "Consumers can delete their own reviews" ON shop_reviews FOR DELETE USING (auth.uid() = consumer_id);

-- Consumer addresses policies
CREATE POLICY "Consumers can view their own addresses" ON consumer_addresses FOR SELECT USING (auth.uid() = consumer_id);
CREATE POLICY "Consumers can create their own addresses" ON consumer_addresses FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Consumers can update their own addresses" ON consumer_addresses FOR UPDATE USING (auth.uid() = consumer_id);
CREATE POLICY "Consumers can delete their own addresses" ON consumer_addresses FOR DELETE USING (auth.uid() = consumer_id);

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update shop_products updated_at timestamp
CREATE OR REPLACE FUNCTION update_shop_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shop_products_updated_at
BEFORE UPDATE ON shop_products
FOR EACH ROW
EXECUTE FUNCTION update_shop_products_updated_at();

-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT SUM(subtotal) INTO total
  FROM order_items
  WHERE order_id = order_uuid;
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 7: CREATE STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- ============================================================================
-- STEP 8: CREATE STORAGE POLICIES
-- ============================================================================

CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Database setup complete!' as status;
