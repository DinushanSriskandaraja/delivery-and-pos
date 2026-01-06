# Storage Bucket Setup Instructions

## The Problem
You're getting "Bucket not found" error because the `product-images` storage bucket hasn't been created in Supabase yet.

## Solution: Create Bucket Manually (Easiest Method)

### Step 1: Create the Bucket via Supabase Dashboard
1. Go to your **Supabase Dashboard**
2. Click on **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Fill in the form:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Check this box** (very important!)
   - **File size limit**: Leave default or set to 5MB
   - **Allowed MIME types**: Leave empty (allows all image types)
5. Click **"Create bucket"**

### Step 2: Set Up Policies (Optional but Recommended)
After creating the bucket, you can set up access policies:

1. In the Storage section, click on your `product-images` bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**
4. Create these policies:

#### Policy 1: Public Read Access
- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT`
- **Policy definition**: 
  ```sql
  bucket_id = 'product-images'
  ```

#### Policy 2: Authenticated Upload
- **Policy name**: `Authenticated users can upload`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
  ```

#### Policy 3: Authenticated Update
- **Policy name**: `Authenticated users can update`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
  ```

#### Policy 4: Authenticated Delete
- **Policy name**: `Authenticated users can delete`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
  ```

### Step 3: Test the Upload
1. Go to `/admin/products/new` in your app
2. Fill out the product form
3. Upload an image
4. Submit the form
5. The image should upload successfully!

---

## Alternative: Run SQL (If Manual Creation Doesn't Work)

If you prefer SQL, make sure you've run the main database schema first:

1. Run `supabase/schema.sql` in SQL Editor
2. Then run `supabase/storage-setup.sql` in SQL Editor

---

## Verification

After creating the bucket, you should see:
- The `product-images` bucket listed in Storage
- A green "Public" badge next to it
- You can upload files through the dashboard to test

Once the bucket is created, the upload functionality in your app will work immediately!
