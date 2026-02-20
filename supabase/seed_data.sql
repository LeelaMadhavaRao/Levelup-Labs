-- ============================================================
-- CodeZapra - Realistic Seed Data
-- ============================================================
-- Run this AFTER database_setup.sql and database_functions.sql
-- This creates realistic course data for a coding learning platform
--

-- ============================================================
-- STEP 1: Get Admin User ID (If exists)
-- ============================================================
-- Note: Admin user must be created via Supabase Auth Dashboard first:
-- 1. Go to Authentication → Users → Add User
-- 2. Email: admin@CodeZapra.com
-- 3. Password: (choose secure password)
-- 4. Then run this script to set admin role

-- Then make sure that user's profile row in public.users has role='admin'.

-- ============================================================
-- STEP 2: Sample Users - SKIP FOR NOW
-- ============================================================
-- Note: Users are automatically created when they sign up through the app
-- The sample leaderboard data will be created after real users sign up
-- For demo purposes, you can manually create users via Supabase Auth Dashboard

-- Uncomment below ONLY if you've manually created these users in Auth Dashboard:
/*
INSERT INTO users (id, email, full_name, avatar_url, total_points, rank, problems_solved, courses_completed) VALUES
  ('REPLACE-WITH-REAL-UUID-1', 'sarah.johnson@example.com', 'Sarah Johnson', 'https://i.pravatar.cc/150?img=1', 2450, 1, 18, 2),
  ('REPLACE-WITH-REAL-UUID-2', 'alex.chen@example.com', 'Alex Chen', 'https://i.pravatar.cc/150?img=12', 2200, 2, 16, 2)
ON CONFLICT (id) DO UPDATE SET
  total_points = EXCLUDED.total_points,
  rank = EXCLUDED.rank,
  problems_solved = EXCLUDED.problems_solved,
  courses_completed = EXCLUDED.courses_completed;

INSERT INTO leaderboard (user_id, total_points, rank) VALUES
  ('REPLACE-WITH-REAL-UUID-1', 2450, 1),
  ('REPLACE-WITH-REAL-UUID-2', 2200, 2)
ON CONFLICT (user_id) DO UPDATE SET
  total_points = EXCLUDED.total_points,
  rank = EXCLUDED.rank;
*/

-- ============================================================
-- STEP 3: Validate Admin Profile Exists (For Course Creation)
-- ============================================================
-- This script intentionally does NOT write to auth.users.
-- It requires at least one existing admin in public.users.

DO $$
DECLARE
  admin_count INT;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM users
  WHERE role = 'admin';

  IF admin_count = 0 THEN
    RAISE EXCEPTION 'No admin user found in public.users. Create an auth user first and set role=''admin'' in public.users.';
  END IF;

  RAISE NOTICE 'Found % admin user(s) in public.users. Proceeding with seed data.', admin_count;
END $$;

-- ============================================================
-- STEP 4: Create Courses
-- ============================================================

-- Use the first available admin ID for course ownership
DO $$
DECLARE
  admin_uuid UUID;
BEGIN
  SELECT id INTO admin_uuid
  FROM users
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF admin_uuid IS NULL THEN
    RAISE EXCEPTION 'No admin user found in public.users. Seed aborted.';
  END IF;

INSERT INTO courses (id, admin_id, name, description, thumbnail_url, completion_reward_points) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    admin_uuid,
    'Data Structures & Algorithms Mastery',
    'Master the fundamental data structures and algorithms essential for technical interviews and efficient problem-solving. From arrays to graphs, learn to analyze time complexity and build optimal solutions.',
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
    500
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    admin_uuid,
    'System Design Fundamentals',
    'Learn how to design scalable, distributed systems from scratch. Understand key concepts like load balancing, caching, database sharding, and microservices architecture.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    600
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    admin_uuid,
    'Full Stack Web Development',
    'Build modern web applications from frontend to backend. Learn React, Node.js, databases, authentication, deployment, and best practices for production-ready applications.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
    700
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    admin_uuid,
    'Python Programming for Data Science',
    'Master Python for data analysis, machine learning, and visualization. Learn pandas, NumPy, scikit-learn, and build real-world data science projects.',
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
    550
  )
ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================
-- STEP 5: Create Modules for Each Course
-- ============================================================

-- Course 1: Data Structures & Algorithms Mastery
INSERT INTO modules (id, course_id, title, name, "order", order_index) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Arrays & Strings', 'Arrays & Strings', 1, 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Linked Lists & Stacks', 'Linked Lists & Stacks', 2, 2),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Trees & Graphs', 'Trees & Graphs', 3, 3),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Sorting & Searching', 'Sorting & Searching', 4, 4),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Dynamic Programming', 'Dynamic Programming', 5, 5)
ON CONFLICT (course_id, "order") DO NOTHING;

-- Course 2: System Design Fundamentals
INSERT INTO modules (id, course_id, title, name, "order", order_index) VALUES
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'Scalability Basics', 'Scalability Basics', 1, 1),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Database Design', 'Database Design', 2, 2),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'Caching Strategies', 'Caching Strategies', 3, 3),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 'Microservices Architecture', 'Microservices Architecture', 4, 4)
ON CONFLICT (course_id, "order") DO NOTHING;

-- Course 3: Full Stack Web Development
INSERT INTO modules (id, course_id, title, name, "order", order_index) VALUES
  ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000003', 'Frontend Foundations', 'Frontend Foundations', 1, 1),
  ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000003', 'React & State Management', 'React & State Management', 2, 2),
  ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000003', 'Backend with Node.js', 'Backend with Node.js', 3, 3),
  ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000003', 'Database & Authentication', 'Database & Authentication', 4, 4),
  ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000003', 'Deployment & DevOps', 'Deployment & DevOps', 5, 5)
ON CONFLICT (course_id, "order") DO NOTHING;

-- Course 4: Python Programming for Data Science
INSERT INTO modules (id, course_id, title, name, "order", order_index) VALUES
  ('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000004', 'Python Basics', 'Python Basics', 1, 1),
  ('20000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000004', 'NumPy & Pandas', 'NumPy & Pandas', 2, 2),
  ('20000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000004', 'Data Visualization', 'Data Visualization', 3, 3),
  ('20000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000004', 'Machine Learning Basics', 'Machine Learning Basics', 4, 4)
ON CONFLICT (course_id, "order") DO NOTHING;

-- ============================================================
-- STEP 6: Create Topics for Each Module
-- ============================================================

-- Module 1: Arrays & Strings (Course 1)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Array Basics & Two Pointers', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Sliding Window Technique', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'String Manipulation & Hashing', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 2: Linked Lists & Stacks (Course 1)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'Linked List Fundamentals', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'Stack & Queue Implementation', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002', 'Fast & Slow Pointers', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 3: Trees & Graphs (Course 1)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000003', 'Binary Trees & Traversals', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000003', 'Binary Search Trees', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000003', 'Graph Algorithms (BFS/DFS)', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 4: Sorting & Searching (Course 1)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000004', 'Binary Search Variations', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000004', 'Merge Sort & Quick Sort', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 5: Dynamic Programming (Course 1)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000041', '20000000-0000-0000-0000-000000000005', 'DP Introduction & Memoization', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000042', '20000000-0000-0000-0000-000000000005', '1D Dynamic Programming', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000043', '20000000-0000-0000-0000-000000000005', '2D Dynamic Programming', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 11: Scalability Basics (Course 2)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000011', 'Load Balancing & CDN', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 2),
  ('30000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000011', 'Horizontal vs Vertical Scaling', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 2)
ON CONFLICT DO NOTHING;

-- Module 12: Database Design (Course 2)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000111', '20000000-0000-0000-0000-000000000012', 'SQL vs NoSQL', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 2),
  ('30000000-0000-0000-0000-000000000112', '20000000-0000-0000-0000-000000000012', 'Database Sharding & Replication', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 2)
ON CONFLICT DO NOTHING;

-- Module 21: Frontend Foundations (Course 3)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000021', 'HTML5 & Semantic Web', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 2),
  ('30000000-0000-0000-0000-000000000202', '20000000-0000-0000-0000-000000000021', 'CSS3 & Flexbox/Grid', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 2),
  ('30000000-0000-0000-0000-000000000203', '20000000-0000-0000-0000-000000000021', 'JavaScript ES6+ Features', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 22: React & State Management (Course 3)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000211', '20000000-0000-0000-0000-000000000022', 'React Hooks & Components', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000212', '20000000-0000-0000-0000-000000000022', 'Context API & Redux', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 31: Python Basics (Course 4)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000301', '20000000-0000-0000-0000-000000000031', 'Python Syntax & Data Types', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000302', '20000000-0000-0000-0000-000000000031', 'Functions & Modules', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000303', '20000000-0000-0000-0000-000000000031', 'OOP in Python', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- Module 32: NumPy & Pandas (Course 4)
INSERT INTO topics (id, module_id, name, video_url, num_mcqs, num_problems) VALUES
  ('30000000-0000-0000-0000-000000000311', '20000000-0000-0000-0000-000000000032', 'NumPy Arrays & Operations', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3),
  ('30000000-0000-0000-0000-000000000312', '20000000-0000-0000-0000-000000000032', 'Pandas DataFrames', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5, 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 7: Create Sample Coding Problems
-- ============================================================

-- Two Sum (Easy)
INSERT INTO coding_problems (id, topic_id, title, description, difficulty, examples, test_cases) VALUES
(
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
  'easy',
  '[
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]"
    },
    {
      "input": "nums = [3,2,4], target = 6",
      "output": "[1,2]",
      "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]"
    }
  ]'::jsonb,
  '[
    {"input": {"nums": [2,7,11,15], "target": 9}, "expectedOutput": [0,1]},
    {"input": {"nums": [3,2,4], "target": 6}, "expectedOutput": [1,2]},
    {"input": {"nums": [3,3], "target": 6}, "expectedOutput": [0,1]}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Maximum Subarray (Medium)
INSERT INTO coding_problems (id, topic_id, title, description, difficulty, examples, test_cases) VALUES
(
  '40000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000002',
  'Maximum Subarray Sum',
  'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
  'medium',
  '[
    {
      "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
      "output": "6",
      "explanation": "The subarray [4,-1,2,1] has the largest sum 6"
    },
    {
      "input": "nums = [1]",
      "output": "1",
      "explanation": "The subarray [1] has the largest sum 1"
    }
  ]'::jsonb,
  '[
    {"input": {"nums": [-2,1,-3,4,-1,2,1,-5,4]}, "expectedOutput": 6},
    {"input": {"nums": [1]}, "expectedOutput": 1},
    {"input": {"nums": [5,4,-1,7,8]}, "expectedOutput": 23}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Reverse Linked List (Easy)
INSERT INTO coding_problems (id, topic_id, title, description, difficulty, examples, test_cases) VALUES
(
  '40000000-0000-0000-0000-000000000011',
  '30000000-0000-0000-0000-000000000011',
  'Reverse Linked List',
  'Given the head of a singly linked list, reverse the list, and return the reversed list.',
  'easy',
  '[
    {
      "input": "head = [1,2,3,4,5]",
      "output": "[5,4,3,2,1]",
      "explanation": "The linked list is reversed"
    }
  ]'::jsonb,
  '[
    {"input": {"head": [1,2,3,4,5]}, "expectedOutput": [5,4,3,2,1]},
    {"input": {"head": [1,2]}, "expectedOutput": [2,1]},
    {"input": {"head": []}, "expectedOutput": []}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Valid Parentheses (Easy)
INSERT INTO coding_problems (id, topic_id, title, description, difficulty, examples, test_cases) VALUES
(
  '40000000-0000-0000-0000-000000000012',
  '30000000-0000-0000-0000-000000000012',
  'Valid Parentheses',
  'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets and in the correct order.',
  'easy',
  '[
    {
      "input": "s = \"()\"",
      "output": "true",
      "explanation": "The string has valid parentheses"
    },
    {
      "input": "s = \"()[]{}\"",
      "output": "true",
      "explanation": "All brackets are properly closed"
    },
    {
      "input": "s = \"(]\"",
      "output": "false",
      "explanation": "Mismatched brackets"
    }
  ]'::jsonb,
  '[
    {"input": {"s": "()"}, "expectedOutput": true},
    {"input": {"s": "()[]{}"}, "expectedOutput": true},
    {"input": {"s": "(]"}, "expectedOutput": false},
    {"input": {"s": "([)]"}, "expectedOutput": false}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Binary Tree Level Order Traversal (Medium)
INSERT INTO coding_problems (id, topic_id, title, description, difficulty, examples, test_cases) VALUES
(
  '40000000-0000-0000-0000-000000000021',
  '30000000-0000-0000-0000-000000000021',
  'Binary Tree Level Order Traversal',
  'Given the root of a binary tree, return the level order traversal of its nodes'' values (i.e., from left to right, level by level).',
  'medium',
  '[
    {
      "input": "root = [3,9,20,null,null,15,7]",
      "output": "[[3],[9,20],[15,7]]",
      "explanation": "Level order traversal returns nodes level by level"
    }
  ]'::jsonb,
  '[
    {"input": {"root": [3,9,20,null,null,15,7]}, "expectedOutput": [[3],[9,20],[15,7]]},
    {"input": {"root": [1]}, "expectedOutput": [[1]]},
    {"input": {"root": []}, "expectedOutput": []}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Climbing Stairs (Easy)
INSERT INTO coding_problems (id, topic_id, title, description, difficulty, examples, test_cases) VALUES
(
  '40000000-0000-0000-0000-000000000041',
  '30000000-0000-0000-0000-000000000041',
  'Climbing Stairs',
  'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
  'easy',
  '[
    {
      "input": "n = 2",
      "output": "2",
      "explanation": "There are two ways: 1+1 or 2"
    },
    {
      "input": "n = 3",
      "output": "3",
      "explanation": "There are three ways: 1+1+1, 1+2, or 2+1"
    }
  ]'::jsonb,
  '[
    {"input": {"n": 2}, "expectedOutput": 2},
    {"input": {"n": 3}, "expectedOutput": 3},
    {"input": {"n": 5}, "expectedOutput": 8}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 8: Sample Course Registrations - SKIP FOR NOW
-- ============================================================
-- Note: Course registrations will be created when real users sign up and enroll
-- Uncomment below ONLY if you've manually created users in Auth Dashboard:
/*
INSERT INTO user_courses (user_id, course_id, registered_at, completed_at) VALUES
  ('REPLACE-WITH-REAL-UUID-1', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
  ('REPLACE-WITH-REAL-UUID-2', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, course_id) DO NOTHING;
*/

-- ============================================================
-- Seed Data Complete!
-- ============================================================
-- Summary:
-- ✅ Uses an existing admin user for course ownership
-- ✅ 4 Courses (DSA, System Design, Full Stack, Python)
-- ✅ 18 Modules across all courses
-- ✅ 25+ Topics with video links
-- ✅ 6 Sample coding problems (Easy & Medium)
--
-- Note: Student users and leaderboard will be populated when real users sign up!
--
-- Next Steps:
-- 1. Run database_setup.sql (if not already done)
-- 2. Run database_functions.sql (if not already done)
-- 3. Run this seed_data.sql file
-- 4. Create your first real admin user via Supabase Auth Dashboard
--    Email: admin@CodeZapra.com (or your choice)
-- 5. Update that user's role to 'admin' in users table
-- 6. Start using the application!
--
-- To create a real admin:
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
