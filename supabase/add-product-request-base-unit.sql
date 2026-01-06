-- Add base_unit column to product_requests table
ALTER TABLE product_requests 
ADD COLUMN IF NOT EXISTS base_unit TEXT;

-- Comment on column
COMMENT ON COLUMN product_requests.base_unit IS 'Base unit of measurement for the requested product (e.g., kg, L, pcs)';
