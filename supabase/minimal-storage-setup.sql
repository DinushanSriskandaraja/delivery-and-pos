-- This is a minimal schema to get storage working
-- Run this FIRST, then run the full schema.sql later

-- Just create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- That's it! The bucket is ready.
