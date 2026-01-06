-- Create a secure function to check if the current user is an admin
-- SECURITY DEFINER allows this function to bypass RLS when checking the users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
CREATE POLICY "Admins can view all profiles" ON users
FOR SELECT USING (is_admin());

-- Allow public to view basic user info if needed for shop owners (optional, strictly for admin fix right now)
-- But ensuring Shop Pages can show "Owner Name" might require this too? 
-- For now, let's fix Admin panel specifically.

-- Grant select on users to authenticated users (so policies can apply)
GRANT SELECT ON users TO authenticated;
