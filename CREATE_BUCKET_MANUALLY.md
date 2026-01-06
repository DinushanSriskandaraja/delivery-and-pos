# ✅ SIMPLE FIX: Create Storage Bucket Manually

The SQL scripts aren't working because of permissions or project mismatch. 
Here's the **guaranteed working solution** using the Supabase Dashboard:

## 📋 Step-by-Step Instructions:

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Sign in if needed
- **Make sure you're in the correct project** (check project name in top-left)

### 2. Navigate to Storage
- Click **"Storage"** in the left sidebar
- You should see a page that says "No buckets" or shows existing buckets

### 3. Create the Bucket
- Click the **"New bucket"** button (green button, top-right)
- A form will appear

### 4. Fill in the Form
- **Name**: `product-images` (EXACTLY this, no spaces, no capitals)
- **Public bucket**: ✅ **MUST CHECK THIS BOX** (very important!)
- **File size limit**: Leave default or set to 5242880 (5MB)
- **Allowed MIME types**: Leave empty (allows all images)

### 5. Create
- Click **"Create bucket"** button
- You should see the bucket appear in the list
- It should have a green "Public" badge

### 6. Verify
- Refresh your app page: `/admin/products/new`
- You should now see: ✅ **"Storage Bucket Ready"** (green box)
- The bucket name should show: `product-images (Public)`

### 7. Test Upload
- Fill out the product form
- Upload an image
- Submit
- It should work! ✅

---

## ❓ Troubleshooting

**If you don't see the "New bucket" button:**
- You might not have the right permissions
- Make sure you're the project owner or admin

**If the bucket shows as "Private":**
- Click on the bucket name
- Go to "Configuration" tab
- Toggle "Public bucket" to ON
- Save changes

**If you still get "Bucket not found" after creating it:**
- Double-check the bucket name is exactly: `product-images` (with hyphen, not underscore)
- Make sure you're in the correct Supabase project
- Check your `.env.local` file has the correct `NEXT_PUBLIC_SUPABASE_URL`

---

## 🎯 Why This Works

The Supabase Dashboard UI creates the bucket with all the correct permissions automatically. 
SQL scripts can fail due to RLS policies or permission issues, but the UI always works.

Once the bucket is created, the image upload will work immediately!
