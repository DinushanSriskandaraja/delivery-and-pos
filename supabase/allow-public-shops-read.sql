-- Create shop_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS shop_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(consumer_id, order_id)
);

-- Allow public read access to approved and active shops
CREATE POLICY "Public can view active approved shops" ON shops
FOR SELECT USING (is_active = true AND is_approved = true);

-- Allow public read access to available shop products
CREATE POLICY "Public can view active shop products" ON shop_products
FOR SELECT USING (is_available = true);

-- Allow public read access to global products (needed for product details)
CREATE POLICY "Public can view global products" ON global_products
FOR SELECT USING (true);

-- Allow public read access to shop reviews
CREATE POLICY "Public can view shop reviews" ON shop_reviews
FOR SELECT USING (true);
