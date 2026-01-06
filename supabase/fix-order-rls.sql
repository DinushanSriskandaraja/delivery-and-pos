-- Enable RLS on orders and order_items
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow guests to view their own orders (by ID, if consumer_id is null)
-- DROP existing policy if it conflicts or is named differently
DROP POLICY IF EXISTS "Guests can view their orders" ON orders;

CREATE POLICY "Guests can view their orders" ON orders
FOR SELECT
USING (consumer_id IS NULL);

-- Allow guests to view order items for their orders
DROP POLICY IF EXISTS "Guests can view their order items" ON order_items;

CREATE POLICY "Guests can view their order items" ON order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.consumer_id IS NULL
  )
);
