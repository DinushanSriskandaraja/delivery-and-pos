# Quick Fix: Create Storage Bucket

## The Problem
You're getting **"Bucket not found"** error because the `product-images` storage bucket doesn't exist in your Supabase project yet.

## ✅ Simplest Solution (2 minutes)

### Go to Supabase Dashboard and create the bucket manually:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Click "Storage"** in the left sidebar
4. **Click "New bucket"** button (top right)
5. **Fill in the form:**
   - **Name**: `product-images` (exactly this name!)
   - **Public bucket**: ✅ **MUST CHECK THIS BOX**
   - Click **"Create bucket"**

That's it! Once created, go back to your app and try uploading a product image - it will work immediately.

---

## Alternative: Run SQL (If you prefer)

If the manual method doesn't work, you can run this SQL in Supabase SQL Editor:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

---

## Verify It Worked

After creating the bucket, you should see:
- `product-images` listed in Storage section
- A green **"Public"** badge next to it

Then test by:
1. Go to `/admin/products/new`
2. Upload an image
3. Submit the form
4. Image should upload successfully! ✅
