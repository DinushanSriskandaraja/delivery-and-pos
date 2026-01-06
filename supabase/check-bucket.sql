-- Check if bucket exists and verify its configuration
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- If the bucket exists but isn't public, update it:
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';
