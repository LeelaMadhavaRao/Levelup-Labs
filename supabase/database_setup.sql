-- ==============================================
-- CodeZapra - Complete Database Setup
-- ==============================================
-- Execute this entire script in Supabase SQL Editor
-- This will create all tables, policies, and set up the database

-- ==============================================
-- STEP 1: Create ENUM Types
-- ==============================================
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE problem_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE solution_status AS ENUM ('pending', 'algorithm_submitted', 'algorithm_verified', 'algorithm_approved', 'code_submitted', 'code_failed', 'completed', 'failed');
CREATE TYPE quest_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE achievement_condition_type AS ENUM ('problems_solved', 'courses_completed', 'streak_days', 'points_earned', 'xp_earned', 'level_reached');

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
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    title TEXT DEFAULT 'Rookie',
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
    name TEXT NOT NULL,
    description TEXT,
    "order" INT NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(course_id, "order"),
    UNIQUE(course_id, order_index)
);

-- Topics Table
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    overview TEXT,
    video_url TEXT NOT NULL,
    order_index INT,
    num_mcqs INT DEFAULT 5,
    num_problems INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Topic Progress Table (tracks video watched status)
CREATE TABLE topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    video_watched BOOLEAN DEFAULT FALSE,
    quiz_passed BOOLEAN DEFAULT FALSE,
    problems_completed INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, topic_id)
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

-- Point events ledger (idempotent rewards)
CREATE TABLE point_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_key TEXT NOT NULL UNIQUE,
    points INT NOT NULL DEFAULT 0,
    xp INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE VIEW xp_events AS
SELECT
    id,
    user_id,
    event_type,
    event_key,
    points AS xp_points,
    xp,
    metadata,
    created_at
FROM point_events;

-- Achievement definitions
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    condition_type achievement_condition_type NOT NULL,
    condition_value INT NOT NULL DEFAULT 1,
    points_reward INT NOT NULL DEFAULT 0,
    xp_reward INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Achievements unlocked by users
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Daily streak tracking
CREATE TABLE daily_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quest templates
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    frequency quest_frequency NOT NULL,
    target_type TEXT NOT NULL,
    target_count INT NOT NULL DEFAULT 1,
    reward_points INT NOT NULL DEFAULT 0,
    reward_xp INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at DATE,
    ends_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Per-user quest progress per period bucket
CREATE TABLE user_quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    bucket_date DATE NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, quest_id, bucket_date)
);

-- Seasons for seasonal leaderboards
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Season snapshot leaderboard
CREATE TABLE season_leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INT NOT NULL DEFAULT 0,
    rank INT,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(season_id, user_id)
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
CREATE INDEX idx_point_events_user_id ON point_events(user_id);
CREATE INDEX idx_point_events_created_at ON point_events(created_at DESC);
CREATE INDEX idx_point_events_event_type ON point_events(event_type);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_quests_frequency_active ON quests(frequency, is_active);
CREATE INDEX idx_user_quest_progress_user_bucket ON user_quest_progress(user_id, bucket_date DESC);
CREATE INDEX idx_daily_streaks_last_active ON daily_streaks(last_active_date DESC);
CREATE INDEX idx_seasons_active_dates ON seasons(is_active, starts_at, ends_at);
CREATE INDEX idx_season_snapshots_season_rank ON season_leaderboard_snapshots(season_id, rank);

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
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 4.5: Create Helper Functions for RLS Policies
-- ==============================================

-- Create a SECURITY DEFINER function to check admin status
-- This avoids any subquery permission issues in RLS policies
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ==============================================
-- STEP 5: Create RLS Policies
-- ==============================================

-- Users Table Policies
CREATE POLICY "Users can read all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile (except role)" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = id
        AND role = 'user'
    );

CREATE POLICY "Service role can create users" ON users
    FOR INSERT TO service_role
    WITH CHECK (true);

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

CREATE POLICY "Admins can update any course" ON courses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete any course" ON courses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- User Courses Registration Policies
CREATE POLICY "Users can register for courses" ON user_courses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their registrations" ON user_courses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollments" ON user_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

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
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Students can generate problems for enrolled courses" ON coding_problems
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM topics
            INNER JOIN modules ON modules.id = topics.module_id
            INNER JOIN courses ON courses.id = modules.course_id
            INNER JOIN user_courses ON user_courses.course_id = courses.id
            WHERE topics.id = coding_problems.topic_id
            AND user_courses.user_id = auth.uid()
        )
    );

-- Problem Solutions Table Policies
CREATE POLICY "Users can create problem solutions" ON problem_solutions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own solutions" ON problem_solutions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own solutions" ON problem_solutions
    FOR UPDATE USING (user_id = auth.uid());

-- Topic Progress Table Policies
CREATE POLICY "Users can create their own progress" ON topic_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own progress" ON topic_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON topic_progress
    FOR UPDATE USING (user_id = auth.uid());

-- Leaderboard Table Policies
CREATE POLICY "Anyone can read leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- Note: UPDATE and INSERT are intentionally restricted to service role via SECURITY DEFINER functions
-- No policies for UPDATE/INSERT - only functions can modify leaderboard

-- Point Events Policies
CREATE POLICY "Users can read own point events" ON point_events
    FOR SELECT USING (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Anyone can read achievements" ON achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can read own unlocked achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Streak Policies
CREATE POLICY "Users can read own streak" ON daily_streaks
    FOR SELECT USING (auth.uid() = user_id);

-- Quest Policies
CREATE POLICY "Anyone can read quests" ON quests
    FOR SELECT USING (true);

CREATE POLICY "Users can read own quest progress" ON user_quest_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Season Policies
CREATE POLICY "Anyone can read seasons" ON seasons
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read season snapshots" ON season_leaderboard_snapshots
    FOR SELECT USING (true);

-- ==============================================
-- STEP 5.5: Grant Schema/Table Access (RESTRICTED)
-- ==============================================
-- Ensure anon/authenticated roles can access public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON TYPE user_role, problem_difficulty, solution_status, quest_frequency, achievement_condition_type TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- Authenticated users can only modify their own data via RLS policies
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON quiz_responses, problem_solutions, user_courses, topic_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON courses, modules, topics, coding_problems TO authenticated;
GRANT SELECT ON leaderboard, point_events, xp_events, achievements, user_achievements, daily_streaks, quests, user_quest_progress, seasons, season_leaderboard_snapshots TO authenticated;
-- Leaderboard modifications only via SECURITY DEFINER functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO authenticated;

-- ==============================================
-- STEP 6: Create Initial Admin User
-- ==============================================
-- IMPORTANT: First create auth user manually in Supabase Dashboard
-- Then replace 'YOUR_AUTH_USER_UUID_HERE' with the actual UUID

-- To get the UUID:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create user: admin@CodeZapra.com / admin123
-- 3. Copy the UUID from the user list
-- 4. Replace the UUID below and run this INSERT

INSERT INTO users (id, email, full_name, role, total_points, created_at, updated_at)
SELECT 
    id,
    'admin@CodeZapra.com',
    'Admin User',
    'admin'::user_role,
    0,
    now(),
    now()
FROM auth.users
WHERE email = 'admin@CodeZapra.com'
ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- STEP 7: Seed Gamification Templates
-- ==============================================

INSERT INTO achievements (code, name, description, icon, condition_type, condition_value, points_reward, xp_reward)
VALUES
    ('first_solve', 'First Blood', 'Solve your first coding problem', 'trophy', 'problems_solved', 1, 50, 75),
    ('ten_solves', 'Problem Hunter', 'Solve 10 coding problems', 'target', 'problems_solved', 10, 150, 200),
    ('seven_day_streak', 'Consistency Champ', 'Maintain a 7-day learning streak', 'flame', 'streak_days', 7, 120, 160),
    ('first_course', 'Course Finisher', 'Complete your first course', 'medal', 'courses_completed', 1, 200, 250)
ON CONFLICT (code) DO NOTHING;

INSERT INTO quests (slug, title, description, frequency, target_type, target_count, reward_points, reward_xp, is_active)
VALUES
    ('daily_problem_1', 'Warmup Solve', 'Solve 1 problem today', 'daily', 'solve_problem', 1, 50, 40, true),
    ('daily_problem_3', 'Triple Threat', 'Solve 3 problems today', 'daily', 'solve_problem', 3, 140, 120, true),
    ('daily_quiz_1', 'Quiz Sprint', 'Pass 1 quiz today', 'daily', 'pass_quiz', 1, 60, 50, true),
    ('weekly_course_1', 'Weekly Finisher', 'Complete 1 course this week', 'weekly', 'complete_course', 1, 300, 300, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO seasons (name, starts_at, ends_at, is_active)
VALUES (
    'Season 1',
    date_trunc('month', now())::date,
    (date_trunc('month', now()) + interval '3 month - 1 day')::date,
    true
)
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- SETUP COMPLETE!
-- ==============================================
-- Next Steps:
-- 1. Create admin user in Supabase Auth (admin@CodeZapra.com / admin123)
-- 2. Run this complete script in Supabase SQL Editor
-- 3. Login to your app with admin credentials
-- 4. Start creating courses!
-- ==============================================
