# 🔍 Verify Supabase Project Connection

Your bucket exists but your app can't see it. This means you're connected to the WRONG Supabase project.

## ✅ How to Fix:

### Step 1: Find Your Correct Project URL

1. Go to Supabase Dashboard where you created the bucket
2. Click on **"Project Settings"** (gear icon, bottom-left)
3. Go to **"API"** tab
4. Copy the **"Project URL"** - it looks like: `https://xxxxxxxxxxxxx.supabase.co`
5. Copy the **"anon public"** key (long string starting with `eyJ...`)

### Step 2: Update Your `.env.local` File

Open `e:\Hortiiv\delivery-and-pos\.env.local` and make sure these match:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANT:** 
- The URL must be EXACTLY what you copied (including `https://`)
- The anon key must be the full key (very long string)
- NO quotes around the values
- NO trailing slashes on the URL

### Step 3: Restart Your Dev Server

After updating `.env.local`:

1. Stop the dev server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Wait for it to start

### Step 4: Test

1. Go to `/admin/products/new`
2. You should now see: ✅ **"Storage Bucket Ready"** (green box)
3. Try uploading an image

---

## 🎯 Quick Check

**To verify you're in the right project:**

1. In Supabase Dashboard, look at the top-left corner
2. You'll see your project name
3. Make sure this is the project where you created the `product-images` bucket

**Common mistake:**
- You might have multiple Supabase projects
- You created the bucket in Project A
- But your `.env.local` points to Project B

---

## 📝 What to Check in `.env.local`

Your file should look like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQzODQwMCwiZXhwIjoxOTMxOTk4NDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The URL and key should match the project where you created the bucket!
