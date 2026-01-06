-- Run this SQL to verify the bucket exists and make sure it's public
SELECT id, name, public, owner 
FROM storage.buckets 
WHERE id = 'product-images';

-- If it shows up, make sure it's public:
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Verify the update:
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'product-images';
