# GroceryShop Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Set Up Supabase (2 minutes)

1. Visit [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in:
   - **Name**: GroceryShop
   - **Database Password**: (choose a strong password)
   - **Region**: (closest to you)
4. Click "Create new project" and wait ~2 minutes

### 2. Create Database Tables (1 minute)

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click "New Query"
3. Open `supabase/schema.sql` in your code editor
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" (bottom right)
7. You should see "Success. No rows returned"

### 3. Get Your API Keys (30 seconds)

1. Click **Project Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### 4. Configure Your App (1 minute)

1. In your project folder, find the file `env.example`
2. Create a new file called `.env.local` (note the dot at the start!)
3. Copy this into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_DEFAULT_SEARCH_RADIUS_KM=10
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Replace `your-project.supabase.co` with your **Project URL**
5. Replace `your-anon-key-here` with your **anon public** key
6. Save the file

### 5. Run the App (30 seconds)

Open your terminal in the project folder and run:

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🎯 Create Your First Admin Account

1. Go to [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
2. Fill in the registration form
3. Select any role (we'll change it to admin)
4. Click "Create Account"

### Make Yourself Admin

1. Go to your Supabase project
2. Click **Table Editor** in the sidebar
3. Click the **users** table
4. Find your newly created user
5. Click the `role` field
6. Change it from `consumer` to `admin`
7. Click the checkmark to save

### Test Admin Access

1. Go back to [http://localhost:3000](http://localhost:3000)
2. Click "Sign In"
3. Log in with your credentials
4. You should be redirected to `/admin` (Admin Dashboard)

---

## ✅ You're All Set!

You now have:
- ✅ A working GroceryShop platform
- ✅ Supabase database configured
- ✅ Admin account created
- ✅ Authentication working

### What You Can Do Now

1. **Explore the Admin Dashboard** at `/admin`
2. **Create more users** with different roles
3. **Start building features** (see walkthrough.md for next steps)

---

## 🆘 Troubleshooting

### App won't start?
- Make sure `.env.local` exists and has the correct values
- Run `npm install` to ensure all dependencies are installed

### Can't log in?
- Check that your Supabase URL and key are correct in `.env.local`
- Make sure the database schema was created successfully

### Redirected to login after signing in?
- Check that your user exists in the `users` table in Supabase
- Verify the `role` field is set correctly

---

**Need help?** Check the full [walkthrough.md](file:///C:/Users/UESR/.gemini/antigravity/brain/936964a8-21ae-4c81-961d-967fddde81ac/walkthrough.md) for detailed information.
