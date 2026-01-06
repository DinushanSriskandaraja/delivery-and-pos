-- ============================================================================
-- NUCLEAR OPTION: DROP EVERYTHING
-- ============================================================================
-- This script drops EVERYTHING from the public schema
-- WARNING: This will delete ALL data, tables, functions, triggers, policies
-- Use with extreme caution!
-- ============================================================================

-- Drop all triggers on auth.users first (critical!)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON auth.users CASCADE';
    END LOOP;
END $$;

-- Drop all policies on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all policies on storage.objects
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects CASCADE';
    END LOOP;
END $$;

-- Drop all triggers in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all functions in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all views in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all sequences in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;

-- Clean up storage
DELETE FROM storage.objects WHERE bucket_id = 'product-images';
DELETE FROM storage.buckets WHERE id = 'product-images';

-- Drop all custom types in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Verify everything is gone
SELECT 'All tables dropped' as status WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public');
SELECT 'All functions dropped' as status WHERE NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public');
SELECT 'All triggers dropped' as status WHERE NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'public');
SELECT 'All policies dropped' as status WHERE NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public');

SELECT '🧹 EVERYTHING DROPPED - Database is now completely clean!' as final_status;
