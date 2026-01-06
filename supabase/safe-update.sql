-- SAFE UPDATE - Only fixes what's missing, doesn't recreate existing tables
-- Run this in Supabase SQL Editor

-- 1. Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Ensure RLS is enabled on users table (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Recreate RLS policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users 
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users 
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can insert user data on signup" ON users;
CREATE POLICY "Anyone can insert user data on signup" ON users 
FOR INSERT WITH CHECK (true);

-- 4. Update trigger to handle existing users (won't create duplicates)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer')
  )
  ON CONFLICT (id) DO NOTHING; -- This prevents duplicate key errors
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done! Everything should work now.
SELECT 'Setup complete!' as status;
