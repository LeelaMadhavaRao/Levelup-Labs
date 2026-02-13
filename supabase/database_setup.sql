-- ==============================================
-- CodeQuest AI - Complete Database Setup
-- ==============================================
-- Execute this entire script in Supabase SQL Editor
-- This will create all tables, policies, and set up the database

-- ==============================================
-- STEP 1: Create ENUM Types
-- ==============================================
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE problem_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE solution_status AS ENUM ('pending', 'algorithm_submitted', 'algorithm_verified', 'code_submitted', 'completed', 'failed');

-- ==============================================
-- STEP 2: Create Tables
-- ==============================================

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    total_points INT DEFAULT 0,
    rank INT,
    courses_completed INT DEFAULT 0,
    problems_solved INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    completion_reward_points INT DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Course Registration Table
CREATE TABLE user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);

-- Modules Table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "order" INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(course_id, "order")
);

-- Topics Table
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    video_url TEXT NOT NULL,
    num_mcqs INT DEFAULT 5,
    num_problems INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz Responses Table
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    quiz_data JSONB NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Coding Problems Table
CREATE TABLE coding_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty problem_difficulty NOT NULL,
    examples JSONB,
    test_cases JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Problem Solutions Table
CREATE TABLE problem_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    status solution_status DEFAULT 'pending',
    algorithm_explanation TEXT,
    algorithm_verified_at TIMESTAMP WITH TIME ZONE,
    code_solution TEXT,
    code_verified_at TIMESTAMP WITH TIME ZONE,
    points_awarded INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, problem_id)
);

-- Leaderboard Table
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INT NOT NULL,
    rank INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- ==============================================
-- STEP 3: Create Indexes for Performance
-- ==============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Course indexes
CREATE INDEX idx_courses_admin_id ON courses(admin_id);
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_id ON user_courses(course_id);

-- Module indexes
CREATE INDEX idx_modules_course_id ON modules(course_id);

-- Topic indexes
CREATE INDEX idx_topics_module_id ON topics(module_id);

-- Quiz indexes
CREATE INDEX idx_quiz_responses_user_id ON quiz_responses(user_id);
CREATE INDEX idx_quiz_responses_topic_id ON quiz_responses(topic_id);

-- Problem indexes
CREATE INDEX idx_coding_problems_topic_id ON coding_problems(topic_id);
CREATE INDEX idx_problem_solutions_user_id ON problem_solutions(user_id);
CREATE INDEX idx_problem_solutions_problem_id ON problem_solutions(problem_id);
CREATE INDEX idx_problem_solutions_status ON problem_solutions(status);

-- Leaderboard indexes
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX idx_leaderboard_total_points ON leaderboard(total_points DESC);

-- ==============================================
-- STEP 4: Enable Row Level Security (RLS)
-- ==============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 5: Create RLS Policies
-- ==============================================

-- Users Table Policies
CREATE POLICY "Users can read all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can create users" ON users
    FOR INSERT WITH CHECK (true);

-- Courses Table Policies
CREATE POLICY "Anyone can read courses" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Admins can create courses" ON courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update their own courses" ON courses
    FOR UPDATE USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete their own courses" ON courses
    FOR DELETE USING (admin_id = auth.uid());

-- User Courses Registration Policies
CREATE POLICY "Users can register for courses" ON user_courses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their registrations" ON user_courses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can unregister from courses" ON user_courses
    FOR DELETE USING (user_id = auth.uid());

-- Modules Table Policies
CREATE POLICY "Anyone can read modules" ON modules
    FOR SELECT USING (true);

CREATE POLICY "Admins can create modules" ON modules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id
            AND courses.admin_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their modules" ON modules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id
            AND courses.admin_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete their modules" ON modules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id
            AND courses.admin_id = auth.uid()
        )
    );

-- Topics Table Policies
CREATE POLICY "Anyone can read topics" ON topics
    FOR SELECT USING (true);

CREATE POLICY "Admins can create topics" ON topics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM modules
            INNER JOIN courses ON courses.id = modules.course_id
            WHERE modules.id = topics.module_id
            AND courses.admin_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their topics" ON topics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM modules
            INNER JOIN courses ON courses.id = modules.course_id
            WHERE modules.id = topics.module_id
            AND courses.admin_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete their topics" ON topics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM modules
            INNER JOIN courses ON courses.id = modules.course_id
            WHERE modules.id = topics.module_id
            AND courses.admin_id = auth.uid()
        )
    );

-- Quiz Responses Table Policies
CREATE POLICY "Users can create quiz responses" ON quiz_responses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own quiz responses" ON quiz_responses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz responses" ON quiz_responses
    FOR UPDATE USING (user_id = auth.uid());

-- Coding Problems Table Policies
CREATE POLICY "Anyone can read problems" ON coding_problems
    FOR SELECT USING (true);

CREATE POLICY "Admins can create problems" ON coding_problems
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM topics
            INNER JOIN modules ON modules.id = topics.module_id
            INNER JOIN courses ON courses.id = modules.course_id
            WHERE topics.id = coding_problems.topic_id
            AND courses.admin_id = auth.uid()
        )
    );

-- Problem Solutions Table Policies
CREATE POLICY "Users can create problem solutions" ON problem_solutions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own solutions" ON problem_solutions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own solutions" ON problem_solutions
    FOR UPDATE USING (user_id = auth.uid());

-- Leaderboard Table Policies
CREATE POLICY "Anyone can read leaderboard" ON leaderboard
    FOR SELECT USING (true);

CREATE POLICY "Service role can update leaderboard" ON leaderboard
    FOR UPDATE USING (true);

CREATE POLICY "Service role can insert leaderboard entries" ON leaderboard
    FOR INSERT WITH CHECK (true);

-- ==============================================
-- STEP 6: Create Initial Admin User
-- ==============================================
-- IMPORTANT: First create auth user manually in Supabase Dashboard
-- Then replace 'YOUR_AUTH_USER_UUID_HERE' with the actual UUID

-- To get the UUID:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create user: admin@codequest.ai / admin123
-- 3. Copy the UUID from the user list
-- 4. Replace the UUID below and run this INSERT

INSERT INTO users (id, email, full_name, role, total_points, created_at, updated_at)
SELECT 
    id,
    'admin@codequest.ai',
    'Admin User',
    'admin'::user_role,
    0,
    now(),
    now()
FROM auth.users
WHERE email = 'admin@codequest.ai'
ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- SETUP COMPLETE!
-- ==============================================
-- Next Steps:
-- 1. Create admin user in Supabase Auth (admin@codequest.ai / admin123)
-- 2. Run this complete script in Supabase SQL Editor
-- 3. Login to your app with admin credentials
-- 4. Start creating courses!
-- ==============================================
