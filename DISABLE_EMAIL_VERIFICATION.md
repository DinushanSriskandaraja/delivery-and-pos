# Disable Email Verification (Temporary - For Testing)

To disable email verification in Supabase and allow immediate login after registration:

## Option 1: Disable in Supabase Dashboard (Recommended for Testing)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **Email Settings**
4. **Uncheck** "Confirm email"
5. Click **Save**

## Option 2: Use Supabase CLI (Alternative)

If you're using Supabase CLI, update your `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false  # Set this to false
```

## What This Does

- Users can register and immediately log in without confirming their email
- No confirmation email will be sent
- Perfect for development and testing
- **⚠️ WARNING**: Re-enable email verification before going to production!

## Current Code Changes

The registration page has been updated to include:
- `emailRedirectTo` option for proper callback handling
- User metadata in signup options

## Testing

After disabling email verification:

1. Register a new account at `/auth/register`
2. You should be immediately logged in and redirected
3. No email confirmation required

## Re-enabling for Production

Before deploying to production:

1. Go back to Supabase Dashboard
2. **Authentication** → **Providers** → **Email**
3. **Check** "Confirm email"
4. Click **Save**

This ensures users verify their email addresses in production.
