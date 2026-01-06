-- Add delivery_range_km column to shops table
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS delivery_range_km DOUBLE PRECISION DEFAULT 5.0;

-- Comment on column
COMMENT ON COLUMN shops.delivery_range_km IS 'Delivery range in kilometers';
