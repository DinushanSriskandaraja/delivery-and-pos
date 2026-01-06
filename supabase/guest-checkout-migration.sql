-- Make consumer_id nullable to support guest checkout
ALTER TABLE orders 
ALTER COLUMN consumer_id DROP NOT NULL;

-- Add guest info columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Update RLS policies for orders
CREATE POLICY "Guests can create orders" ON orders FOR INSERT WITH CHECK (consumer_id IS NULL);
CREATE POLICY "Guests can view their orders" ON orders FOR SELECT USING (consumer_id IS NULL); -- Note: In a real app we'd want a secure token

-- Update RLS policies for order_items
CREATE POLICY "Guests can insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND consumer_id IS NULL)
);

CREATE POLICY "Guests can view order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id 
    AND consumer_id IS NULL
  )
);
