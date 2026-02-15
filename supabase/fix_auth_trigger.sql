-- ==============================================
-- Fix: Remove problematic auth.users trigger
-- ==============================================
-- The trigger on auth.users causes 500 errors during signup
-- because auth.users is a protected Supabase system table.
-- User profile creation is now handled in the application code.

-- Drop the trigger on auth.users (this will fail silently if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function (keep it for reference but it won't be used)
-- Uncomment if you want to completely remove it:
-- DROP FUNCTION IF EXISTS handle_new_user();

-- Note: User profiles are now created by:
-- 1. signUpWithEmail() function - creates profile immediately after signup
-- 2. auth/callback route - creates profile after email confirmation
-- 3. getUserProfile() function - fallback creation if profile is missing
