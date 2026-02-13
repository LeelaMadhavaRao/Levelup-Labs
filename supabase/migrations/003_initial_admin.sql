-- ==============================================
-- CodeQuest AI - Initial Admin User Setup
-- ==============================================
-- NOTE: Execute this AFTER creating auth.users entry manually or via signup

-- This script creates the initial admin user profile
-- The actual auth.users entry should be created via Supabase Auth UI or Edge Function

-- ⚠️ IMPORTANT STEPS:
-- 1. Go to Supabase Authentication → Users
-- 2. Click "Invite" → send to admin@example.com OR
--    Create a test account with admin@example.com manually
-- 3. Set password to: admin123
-- 4. Then run the INSERT below with the correct UUID from auth.users table

-- Get the UUID of admin user from auth.users table first:
-- SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- Replace 'your-admin-uuid-here' with the actual UUID from above
INSERT INTO users (id, email, full_name, role, total_points, created_at, updated_at)
VALUES (
    'your-admin-uuid-here',
    'admin@example.com',
    'Admin User',
    'admin',
    0,
    now(),
    now()
)
ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- ALTERNATIVE: Using a known test UUID
-- ==============================================
-- If you need to test with a specific UUID, uncomment below:
-- INSERT INTO users (id, email, full_name, role, total_points, created_at, updated_at)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     'admin@example.com',
--     'Admin User',
--     'admin',
--     0,
--     now(),
--     now()
-- )
-- ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- Sample Course Data (Optional - for testing)
-- ==============================================
-- Uncomment to add test data

-- INSERT INTO courses (admin_id, name, description, thumbnail_url, completion_reward_points)
-- VALUES (
--     'your-admin-uuid-here',
--     'Introduction to Python',
--     'Learn Python fundamentals from scratch',
--     'https://via.placeholder.com/300x200?text=Python+Course',
--     500
-- );

-- INSERT INTO courses (admin_id, name, description, thumbnail_url, completion_reward_points)
-- VALUES (
--     'your-admin-uuid-here',
--     'Data Structures & Algorithms',
--     'Master DSA for coding interviews',
--     'https://via.placeholder.com/300x200?text=DSA+Course',
--     750
-- );

-- ==============================================
-- MANUAL STEPS FOR ADMIN CREATION:
-- ==============================================

/*
STEP 1: Create Auth User in Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Invite user" button
3. Enter: admin@example.com
4. Check your email and set password to: admin123
5. OR manually create a user via "Add user" option

STEP 2: Get the UUID
1. After creating the user, note down the UUID shown in the Users list
2. It will look like: 12345678-1234-1234-1234-123456789012

STEP 3: Update the SQL Script
1. Replace 'your-admin-uuid-here' with the actual UUID
2. Run this entire script in Supabase SQL Editor

STEP 4: Verify
1. Go to your Next.js app
2. Try logging in with: admin@example.com / admin123
3. Check if dashboard redirects to /admin/dashboard
*/
