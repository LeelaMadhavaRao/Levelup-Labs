-- ============================================================
-- Optional: Add Sample Users (Run AFTER seed_data.sql)
-- ============================================================
-- This script adds sample users for leaderboard demonstration
-- WARNING: Only run this AFTER you've manually created these users
-- in Supabase Auth Dashboard!
--
-- HOW TO USE:
-- 1. Go to: https://supabase.com/dashboard/project/eejbvmmgkfptyqcedsfz/auth/users
-- 2. Click "Add User" for each user below
-- 3. Copy the generated UUID for each user
-- 4. Replace the UUIDs in this file
-- 5. Run this file in SQL Editor

-- ============================================================
-- STEP 1: Update User Records with Points & Rankings
-- ============================================================

-- Replace these UUIDs with actual UUIDs from Supabase Auth
-- After creating users via Auth Dashboard, get their IDs and update below

-- User 1: Sarah Johnson
UPDATE users 
SET 
  full_name = 'Sarah Johnson',
  avatar_url = 'https://i.pravatar.cc/150?img=1',
  total_points = 2450,
  rank = 1,
  problems_solved = 18,
  courses_completed = 2
WHERE email = 'sarah.johnson@example.com';

-- User 2: Alex Chen  
UPDATE users 
SET 
  full_name = 'Alex Chen',
  avatar_url = 'https://i.pravatar.cc/150?img=12',
  total_points = 2200,
  rank = 2,
  problems_solved = 16,
  courses_completed = 2
WHERE email = 'alex.chen@example.com';

-- User 3: Maria Garcia
UPDATE users 
SET 
  full_name = 'Maria Garcia',
  avatar_url = 'https://i.pravatar.cc/150?img=5',
  total_points = 1950,
  rank = 3,
  problems_solved = 15,
  courses_completed = 1
WHERE email = 'maria.garcia@example.com';

-- User 4: James Wilson
UPDATE users 
SET 
  full_name = 'James Wilson',
  avatar_url = 'https://i.pravatar.cc/150?img=13',
  total_points = 1800,
  rank = 4,
  problems_solved = 14,
  courses_completed = 1
WHERE email = 'james.wilson@example.com';

-- User 5: Priya Patel
UPDATE users 
SET 
  full_name = 'Priya Patel',
  avatar_url = 'https://i.pravatar.cc/150?img=25',
  total_points = 1650,
  rank = 5,
  problems_solved = 12,
  courses_completed = 1
WHERE email = 'priya.patel@example.com';

-- Add more users as needed...

-- ============================================================
-- STEP 2: Add Leaderboard Entries
-- ============================================================

-- Update leaderboard with user IDs (replace with actual UUIDs)
INSERT INTO leaderboard (user_id, total_points, rank)
SELECT id, total_points, rank
FROM users
WHERE email IN (
  'sarah.johnson@example.com',
  'alex.chen@example.com',
  'maria.garcia@example.com',
  'james.wilson@example.com',
  'priya.patel@example.com'
)
ON CONFLICT (user_id) DO UPDATE SET
  total_points = EXCLUDED.total_points,
  rank = EXCLUDED.rank;

-- ============================================================
-- STEP 3: Register Users to Courses (Optional)
-- ============================================================

-- Register Sarah to DSA course (completed)
INSERT INTO user_courses (user_id, course_id, registered_at, completed_at)
SELECT 
  u.id,
  '10000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '5 days'
FROM users u
WHERE u.email = 'sarah.johnson@example.com'
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Register Alex to System Design (completed)
INSERT INTO user_courses (user_id, course_id, registered_at, completed_at)
SELECT 
  u.id,
  '10000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '1 day'
FROM users u
WHERE u.email = 'alex.chen@example.com'
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ============================================================
-- Verification Query
-- ============================================================

SELECT 
  u.full_name,
  u.email,
  u.total_points,
  u.rank,
  u.problems_solved,
  u.courses_completed,
  (SELECT COUNT(*) FROM user_courses uc WHERE uc.user_id = u.id) as enrolled_courses
FROM users u
WHERE u.role = 'user'
ORDER BY u.rank ASC
LIMIT 10;
