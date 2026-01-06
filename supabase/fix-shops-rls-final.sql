-- Enable RLS just in case
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_reviews ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Public can view active approved shops" ON shops;
DROP POLICY IF EXISTS "Public can view active shop products" ON shop_products;
DROP POLICY IF EXISTS "Public can view global products" ON global_products;
DROP POLICY IF EXISTS "Public can view shop reviews" ON shop_reviews;

-- Create permissive policies for debugging (allows seeing unapproved/inactive shops)
CREATE POLICY "Public can view active approved shops" ON shops
FOR SELECT USING (true);

CREATE POLICY "Public can view active shop products" ON shop_products
FOR SELECT USING (true);

CREATE POLICY "Public can view global products" ON global_products
FOR SELECT USING (true);

CREATE POLICY "Public can view shop reviews" ON shop_reviews
FOR SELECT USING (true);
