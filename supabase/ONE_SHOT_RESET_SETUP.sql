-- ============================================================
-- ONE-SHOT RESET + REDEPLOY SCRIPT
-- Levelup-Labs (Supabase SQL Editor)
-- ============================================================
-- WARNING: This script is destructive for PUBLIC schema objects.
-- It drops and recreates public schema objects, then reapplies setup,
-- functions, seed data, and auth/profile trigger fixes.
--
-- Optional: To purge Auth users too, run separately (uncomment):
-- DELETE FROM auth.users;
--
-- System user credentials seeded by this script:
-- Email: system@levelup-labs.com
-- Password: SystemAdmin123!
-- ============================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- ==============================================
-- Levelup-Labs - Complete Database Setup
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
CREATE TYPE achievement_condition_type AS ENUM ('problems_solved', 'courses_completed', 'streak_days', 'points_earned', 'level_reached');

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
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- Authenticated users can only modify their own data via RLS policies
GRANT SELECT, INSERT, UPDATE ON quiz_responses, problem_solutions, user_courses, topic_progress TO authenticated;
GRANT SELECT ON users, courses, modules, topics, coding_problems, leaderboard, point_events, achievements, user_achievements, daily_streaks, quests, user_quest_progress, seasons, season_leaderboard_snapshots TO authenticated;
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
-- 2. Create user: admin@levelup-labs.com / admin123
-- 3. Copy the UUID from the user list
-- 4. Replace the UUID below and run this INSERT

INSERT INTO users (id, email, full_name, role, total_points, created_at, updated_at)
SELECT 
    id,
    'admin@levelup-labs.com',
    'Admin User',
    'admin'::user_role,
    0,
    now(),
    now()
FROM auth.users
WHERE email = 'admin@levelup-labs.com'
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
-- 1. Create admin user in Supabase Auth (admin@levelup-labs.com / admin123)
-- 2. Run this complete script in Supabase SQL Editor
-- 3. Login to your app with admin credentials
-- 4. Start creating courses!
-- ==============================================
-- ==============================================
-- Database Functions & Triggers
-- Purpose: Event-based, idempotent gamification core
-- ==============================================

-- ==============================================
-- Core Helpers
-- ==============================================

CREATE OR REPLACE FUNCTION calculate_level_from_xp(p_xp INT)
RETURNS INT AS $$
BEGIN
    IF COALESCE(p_xp, 0) <= 0 THEN
        RETURN 1;
    END IF;
    -- Smooth progression curve.
    RETURN GREATEST(1, FLOOR(SQRT(p_xp::NUMERIC / 100.0))::INT + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_title_for_level(p_level INT)
RETURNS TEXT AS $$
BEGIN
    IF p_level >= 20 THEN RETURN 'Legend';
    ELSIF p_level >= 15 THEN RETURN 'Grandmaster';
    ELSIF p_level >= 10 THEN RETURN 'Elite';
    ELSIF p_level >= 7 THEN RETURN 'Pro Coder';
    ELSIF p_level >= 4 THEN RETURN 'Rising Star';
    ELSE RETURN 'Rookie';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS VOID AS $$
BEGIN
    WITH ranked_users AS (
        SELECT
            l.user_id,
            ROW_NUMBER() OVER (ORDER BY l.total_points DESC, l.updated_at ASC) AS new_rank
        FROM leaderboard l
        JOIN users u ON u.id = l.user_id
        WHERE u.role = 'user'
    )
    UPDATE leaderboard l
    SET rank = ru.new_rank
    FROM ranked_users ru
    WHERE l.user_id = ru.user_id;

    UPDATE users u
    SET rank = l.rank
    FROM leaderboard l
    WHERE u.id = l.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_streak_multiplier(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_streak INT := 0;
BEGIN
    SELECT current_streak
    INTO v_streak
    FROM daily_streaks
    WHERE user_id = p_user_id;

    v_streak := COALESCE(v_streak, 0);

    IF v_streak >= 30 THEN RETURN 1.50;
    ELSIF v_streak >= 14 THEN RETURN 1.30;
    ELSIF v_streak >= 7 THEN RETURN 1.20;
    ELSIF v_streak >= 3 THEN RETURN 1.10;
    ELSE RETURN 1.00;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_daily_activity(
    p_user_id UUID,
    p_activity_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(current_streak INT, longest_streak INT, multiplier NUMERIC) AS $$
DECLARE
    v_current INT := 0;
    v_longest INT := 0;
    v_last DATE;
BEGIN
    INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
    VALUES (p_user_id, 0, 0, NULL, now())
    ON CONFLICT (user_id) DO NOTHING;

    SELECT ds.current_streak, ds.longest_streak, ds.last_active_date
    INTO v_current, v_longest, v_last
    FROM daily_streaks ds
    WHERE ds.user_id = p_user_id
    FOR UPDATE;

    IF v_last IS NULL THEN
        v_current := 1;
    ELSIF v_last = p_activity_date THEN
        -- Already counted today.
        v_current := v_current;
    ELSIF v_last = (p_activity_date - 1) THEN
        v_current := v_current + 1;
    ELSE
        v_current := 1;
    END IF;

    v_longest := GREATEST(COALESCE(v_longest, 0), v_current);

    UPDATE daily_streaks
    SET
        current_streak = v_current,
        longest_streak = v_longest,
        last_active_date = p_activity_date,
        updated_at = now()
    WHERE user_id = p_user_id;

    RETURN QUERY
    SELECT
        v_current,
        v_longest,
        get_streak_multiplier(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Internal Reward Application (idempotent by event_key)
-- ==============================================

CREATE OR REPLACE FUNCTION apply_event_reward(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_key TEXT,
    p_points INT,
    p_xp INT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    applied BOOLEAN,
    points_awarded INT,
    xp_awarded INT,
    new_total_points INT,
    new_xp INT,
    new_level INT
) AS $$
DECLARE
    v_points INT := GREATEST(COALESCE(p_points, 0), 0);
    v_xp INT := GREATEST(COALESCE(p_xp, 0), 0);
    v_inserted_count INT := 0;
    v_new_total_points INT := 0;
    v_new_xp INT := 0;
    v_new_level INT := 1;
BEGIN
    INSERT INTO point_events (user_id, event_type, event_key, points, xp, metadata)
    VALUES (p_user_id, p_event_type, p_event_key, v_points, v_xp, COALESCE(p_metadata, '{}'::jsonb))
    ON CONFLICT (event_key) DO NOTHING;

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    IF v_inserted_count = 0 THEN
        SELECT
            COALESCE(total_points, 0),
            COALESCE(xp, 0),
            COALESCE(level, 1)
        INTO v_new_total_points, v_new_xp, v_new_level
        FROM users
        WHERE id = p_user_id;

        RETURN QUERY SELECT false, 0, 0, v_new_total_points, v_new_xp, v_new_level;
        RETURN;
    END IF;

    UPDATE users
    SET
        total_points = COALESCE(total_points, 0) + v_points,
        xp = COALESCE(xp, 0) + v_xp,
        level = calculate_level_from_xp(COALESCE(xp, 0) + v_xp),
        title = get_title_for_level(calculate_level_from_xp(COALESCE(xp, 0) + v_xp)),
        updated_at = now()
    WHERE id = p_user_id
    RETURNING total_points, xp, level
    INTO v_new_total_points, v_new_xp, v_new_level;

    INSERT INTO leaderboard (user_id, total_points, updated_at)
    VALUES (p_user_id, v_new_total_points, now())
    ON CONFLICT (user_id) DO UPDATE
    SET
        total_points = EXCLUDED.total_points,
        updated_at = now();

    PERFORM update_leaderboard_ranks();

    RETURN QUERY SELECT true, v_points, v_xp, v_new_total_points, v_new_xp, v_new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Achievements + Quests Hooks
-- ==============================================

CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_achievement RECORD;
    v_met BOOLEAN;
    v_current_streak INT := 0;
BEGIN
    SELECT COALESCE(current_streak, 0)
    INTO v_current_streak
    FROM daily_streaks
    WHERE user_id = p_user_id;

    FOR v_achievement IN
        SELECT a.*
        FROM achievements a
        LEFT JOIN user_achievements ua
            ON ua.achievement_id = a.id
            AND ua.user_id = p_user_id
        WHERE a.is_active = true
          AND ua.id IS NULL
    LOOP
        v_met := false;

        IF v_achievement.condition_type = 'problems_solved' THEN
            SELECT (COALESCE(u.problems_solved, 0) >= v_achievement.condition_value)
            INTO v_met
            FROM users u
            WHERE u.id = p_user_id;
        ELSIF v_achievement.condition_type = 'courses_completed' THEN
            SELECT (COALESCE(u.courses_completed, 0) >= v_achievement.condition_value)
            INTO v_met
            FROM users u
            WHERE u.id = p_user_id;
        ELSIF v_achievement.condition_type = 'streak_days' THEN
            v_met := (COALESCE(v_current_streak, 0) >= v_achievement.condition_value);
        ELSIF v_achievement.condition_type = 'points_earned' THEN
            SELECT (COALESCE(u.total_points, 0) >= v_achievement.condition_value)
            INTO v_met
            FROM users u
            WHERE u.id = p_user_id;
        ELSIF v_achievement.condition_type = 'level_reached' THEN
            SELECT (COALESCE(u.level, 1) >= v_achievement.condition_value)
            INTO v_met
            FROM users u
            WHERE u.id = p_user_id;
        END IF;

        IF v_met THEN
            INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
            VALUES (p_user_id, v_achievement.id, now())
            ON CONFLICT (user_id, achievement_id) DO NOTHING;

            PERFORM apply_event_reward(
                p_user_id,
                'achievement_unlock',
                format('achievement:%s:%s', p_user_id::text, v_achievement.code),
                COALESCE(v_achievement.points_reward, 0),
                COALESCE(v_achievement.xp_reward, 0),
                jsonb_build_object('achievement_code', v_achievement.code)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION progress_active_quests(
    p_user_id UUID,
    p_event_type TEXT,
    p_increment INT DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    v_quest RECORD;
    v_bucket_date DATE;
    v_progress INT := 0;
BEGIN
    FOR v_quest IN
        SELECT *
        FROM quests q
        WHERE q.is_active = true
          AND q.target_type = p_event_type
          AND (q.starts_at IS NULL OR q.starts_at <= CURRENT_DATE)
          AND (q.ends_at IS NULL OR q.ends_at >= CURRENT_DATE)
    LOOP
        IF v_quest.frequency = 'daily' THEN
            v_bucket_date := CURRENT_DATE;
        ELSE
            v_bucket_date := date_trunc('week', now())::date;
        END IF;

        INSERT INTO user_quest_progress (
            user_id,
            quest_id,
            bucket_date,
            progress,
            completed,
            completed_at,
            updated_at
        )
        VALUES (
            p_user_id,
            v_quest.id,
            v_bucket_date,
            LEAST(GREATEST(p_increment, 0), v_quest.target_count),
            (LEAST(GREATEST(p_increment, 0), v_quest.target_count) >= v_quest.target_count),
            CASE
                WHEN LEAST(GREATEST(p_increment, 0), v_quest.target_count) >= v_quest.target_count THEN now()
                ELSE NULL
            END,
            now()
        )
        ON CONFLICT (user_id, quest_id, bucket_date) DO UPDATE
        SET
            progress = LEAST(user_quest_progress.progress + GREATEST(p_increment, 0), v_quest.target_count),
            completed = CASE
                WHEN LEAST(user_quest_progress.progress + GREATEST(p_increment, 0), v_quest.target_count) >= v_quest.target_count THEN true
                ELSE user_quest_progress.completed
            END,
            completed_at = CASE
                WHEN LEAST(user_quest_progress.progress + GREATEST(p_increment, 0), v_quest.target_count) >= v_quest.target_count
                    AND user_quest_progress.completed = false THEN now()
                ELSE user_quest_progress.completed_at
            END,
            updated_at = now()
        RETURNING progress INTO v_progress;

        IF v_progress >= v_quest.target_count THEN
            PERFORM apply_event_reward(
                p_user_id,
                'quest_completion',
                format('quest:%s:%s:%s', p_user_id::text, v_quest.id::text, v_bucket_date::text),
                COALESCE(v_quest.reward_points, 0),
                COALESCE(v_quest.reward_xp, 0),
                jsonb_build_object('quest_slug', v_quest.slug, 'bucket_date', v_bucket_date::text)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Public Event-Based Award API
-- ==============================================

CREATE OR REPLACE FUNCTION award_points_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_key TEXT,
    p_points INT,
    p_xp INT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    applied BOOLEAN,
    points_awarded INT,
    xp_awarded INT,
    new_total_points INT,
    new_xp INT,
    new_level INT
) AS $$
DECLARE
    v_points INT := GREATEST(COALESCE(p_points, 0), 0);
    v_xp INT := GREATEST(COALESCE(p_xp, p_points, 0), 0);
    v_multiplier NUMERIC := 1.0;
    v_effective_points INT;
BEGIN
    IF p_event_type NOT IN ('quest_completion', 'achievement_unlock') THEN
        PERFORM record_daily_activity(p_user_id, CURRENT_DATE);
        v_multiplier := get_streak_multiplier(p_user_id);
    END IF;

    v_effective_points := FLOOR(v_points * v_multiplier)::INT;

    RETURN QUERY
    SELECT *
    FROM apply_event_reward(
        p_user_id,
        p_event_type,
        p_event_key,
        v_effective_points,
        v_xp,
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('streak_multiplier', v_multiplier)
    );

    IF p_event_type NOT IN ('quest_completion', 'achievement_unlock') THEN
        PERFORM progress_active_quests(p_user_id, p_event_type, 1);
        PERFORM check_and_unlock_achievements(p_user_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backward-compatible wrapper
CREATE OR REPLACE FUNCTION add_points_to_user(
    p_user_id UUID,
    p_points INT,
    p_problem_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_event_key TEXT;
BEGIN
    IF p_problem_id IS NOT NULL THEN
        v_event_key := format('solve_problem:%s:%s', p_user_id::text, p_problem_id::text);
        PERFORM award_points_event(
            p_user_id,
            'solve_problem',
            v_event_key,
            p_points,
            p_points,
            jsonb_build_object('problem_id', p_problem_id::text)
        );
    ELSE
        v_event_key := format('generic:%s:%s', p_user_id::text, extract(epoch from now())::bigint::text);
        PERFORM award_points_event(
            p_user_id,
            'generic_reward',
            v_event_key,
            p_points,
            p_points,
            '{}'::jsonb
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Existing Compatibility RPCs
-- ==============================================

CREATE OR REPLACE FUNCTION get_user_problems_solved_in_course(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS INT AS $$
DECLARE
    solved_count INT;
BEGIN
    SELECT COUNT(DISTINCT ps.problem_id)
    INTO solved_count
    FROM problem_solutions ps
    INNER JOIN coding_problems cp ON cp.id = ps.problem_id
    INNER JOIN topics t ON t.id = cp.topic_id
    INNER JOIN modules m ON m.id = t.module_id
    WHERE ps.user_id = p_user_id
      AND ps.status = 'completed'
      AND m.course_id = p_course_id;

    RETURN COALESCE(solved_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_user_completed_all_course_topics(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    total_topics INT;
    completed_topics INT;
BEGIN
    SELECT COUNT(DISTINCT t.id)
    INTO total_topics
    FROM topics t
    INNER JOIN modules m ON m.id = t.module_id
    WHERE m.course_id = p_course_id;

    SELECT COUNT(DISTINCT t.id)
    INTO completed_topics
    FROM topics t
    INNER JOIN modules m ON m.id = t.module_id
    WHERE m.course_id = p_course_id
      AND EXISTS (
          SELECT 1
          FROM quiz_responses qr
          WHERE qr.user_id = p_user_id
            AND qr.topic_id = t.id
            AND qr.passed = true
      )
      AND (
          NOT EXISTS (
              SELECT 1 FROM coding_problems cp WHERE cp.topic_id = t.id
          )
          OR NOT EXISTS (
              SELECT 1
              FROM coding_problems cp
              WHERE cp.topic_id = t.id
                AND NOT EXISTS (
                    SELECT 1
                    FROM problem_solutions ps
                    WHERE ps.user_id = p_user_id
                      AND ps.problem_id = cp.id
                      AND ps.status = 'completed'
                )
          )
      );

    RETURN total_topics > 0 AND total_topics = completed_topics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Leaderboard RPCs
-- ==============================================

CREATE OR REPLACE FUNCTION get_leaderboard_all_time(
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE(
    rank BIGINT,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points INT,
    courses_completed INT,
    problems_solved INT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked AS (
        SELECT
            ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) AS rank,
            u.id AS user_id,
            u.full_name,
            u.avatar_url,
            COALESCE(u.total_points, 0) AS total_points,
            COALESCE(u.courses_completed, 0) AS courses_completed,
            COALESCE(u.problems_solved, 0) AS problems_solved
        FROM users u
        WHERE u.role = 'user'
    )
    SELECT *
    FROM ranked
    ORDER BY rank ASC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_leaderboard_weekly(
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0,
    p_days INT DEFAULT 7
)
RETURNS TABLE(
    rank BIGINT,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points INT,
    courses_completed INT,
    problems_solved INT
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly AS (
        SELECT
            pe.user_id,
            SUM(pe.points)::INT AS total_points
        FROM point_events pe
        WHERE pe.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
        GROUP BY pe.user_id
    ),
    ranked AS (
        SELECT
            ROW_NUMBER() OVER (ORDER BY w.total_points DESC, u.created_at ASC) AS rank,
            u.id AS user_id,
            u.full_name,
            u.avatar_url,
            COALESCE(w.total_points, 0) AS total_points,
            COALESCE(u.courses_completed, 0) AS courses_completed,
            COALESCE(u.problems_solved, 0) AS problems_solved
        FROM users u
        JOIN weekly w ON w.user_id = u.id
        WHERE u.role = 'user'
    )
    SELECT *
    FROM ranked
    ORDER BY rank ASC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_season_info()
RETURNS TABLE(
    season_id UUID,
    name TEXT,
    starts_at DATE,
    ends_at DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.starts_at, s.ends_at
    FROM seasons s
    WHERE s.is_active = true
      AND CURRENT_DATE BETWEEN s.starts_at AND s.ends_at
    ORDER BY s.starts_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_leaderboard_seasonal(
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0,
    p_season_id UUID DEFAULT NULL
)
RETURNS TABLE(
    rank BIGINT,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points INT,
    courses_completed INT,
    problems_solved INT
) AS $$
DECLARE
    v_season_id UUID;
    v_start DATE;
    v_end DATE;
BEGIN
    IF p_season_id IS NULL THEN
        SELECT season_id, starts_at, ends_at
        INTO v_season_id, v_start, v_end
        FROM get_active_season_info()
        LIMIT 1;
    ELSE
        SELECT s.id, s.starts_at, s.ends_at
        INTO v_season_id, v_start, v_end
        FROM seasons s
        WHERE s.id = p_season_id;
    END IF;

    IF v_season_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH seasonal AS (
        SELECT
            pe.user_id,
            SUM(pe.points)::INT AS total_points
        FROM point_events pe
        WHERE pe.created_at::date BETWEEN v_start AND v_end
        GROUP BY pe.user_id
    ),
    ranked AS (
        SELECT
            ROW_NUMBER() OVER (ORDER BY s.total_points DESC, u.created_at ASC) AS rank,
            u.id AS user_id,
            u.full_name,
            u.avatar_url,
            COALESCE(s.total_points, 0) AS total_points,
            COALESCE(u.courses_completed, 0) AS courses_completed,
            COALESCE(u.problems_solved, 0) AS problems_solved
        FROM users u
        JOIN seasonal s ON s.user_id = u.id
        WHERE u.role = 'user'
    )
    SELECT *
    FROM ranked
    ORDER BY rank ASC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_rank_window(
    p_user_id UUID,
    p_scope TEXT DEFAULT 'all_time',
    p_window INT DEFAULT 5,
    p_days INT DEFAULT 7,
    p_season_id UUID DEFAULT NULL
)
RETURNS TABLE(
    rank BIGINT,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_points INT,
    is_me BOOLEAN
) AS $$
DECLARE
    v_user_rank BIGINT;
BEGIN
    IF p_scope = 'weekly' THEN
        WITH ranked AS (
            SELECT
                ROW_NUMBER() OVER (ORDER BY w.total_points DESC, u.created_at ASC) AS rank,
                u.id AS user_id,
                u.full_name,
                u.avatar_url,
                COALESCE(w.total_points, 0) AS total_points
            FROM users u
            JOIN (
                SELECT pe.user_id, SUM(pe.points)::INT AS total_points
                FROM point_events pe
                WHERE pe.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
                GROUP BY pe.user_id
            ) w ON w.user_id = u.id
            WHERE u.role = 'user'
        )
        SELECT r.rank INTO v_user_rank
        FROM ranked r
        WHERE r.user_id = p_user_id;

        RETURN QUERY
        WITH ranked AS (
            SELECT
                ROW_NUMBER() OVER (ORDER BY w.total_points DESC, u.created_at ASC) AS rank,
                u.id AS user_id,
                u.full_name,
                u.avatar_url,
                COALESCE(w.total_points, 0) AS total_points
            FROM users u
            JOIN (
                SELECT pe.user_id, SUM(pe.points)::INT AS total_points
                FROM point_events pe
                WHERE pe.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
                GROUP BY pe.user_id
            ) w ON w.user_id = u.id
            WHERE u.role = 'user'
        )
        SELECT
            r.rank,
            r.user_id,
            r.full_name,
            r.avatar_url,
            r.total_points,
            (r.user_id = p_user_id) AS is_me
        FROM ranked r
        WHERE v_user_rank IS NULL
              OR r.rank BETWEEN GREATEST(v_user_rank - GREATEST(p_window, 1), 1)
                          AND (v_user_rank + GREATEST(p_window, 1))
        ORDER BY r.rank;
        RETURN;
    ELSIF p_scope = 'seasonal' THEN
        RETURN QUERY
        WITH seasonal AS (
            SELECT * FROM get_leaderboard_seasonal(5000, 0, p_season_id)
        ),
        my_rank AS (
            SELECT s.rank AS rank_val
            FROM seasonal s
            WHERE s.user_id = p_user_id
            LIMIT 1
        )
        SELECT
            s.rank,
            s.user_id,
            s.full_name,
            s.avatar_url,
            s.total_points,
            (s.user_id = p_user_id) AS is_me
        FROM seasonal s
        LEFT JOIN my_rank mr ON true
        WHERE mr.rank_val IS NULL
              OR s.rank BETWEEN GREATEST(mr.rank_val - GREATEST(p_window, 1), 1)
                          AND (mr.rank_val + GREATEST(p_window, 1))
        ORDER BY s.rank;
        RETURN;
    ELSE
        WITH ranked AS (
            SELECT
                ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) AS rank,
                u.id AS user_id,
                u.full_name,
                u.avatar_url,
                COALESCE(u.total_points, 0) AS total_points
            FROM users u
            WHERE u.role = 'user'
        )
        SELECT r.rank INTO v_user_rank
        FROM ranked r
        WHERE r.user_id = p_user_id;

        RETURN QUERY
        WITH ranked AS (
            SELECT
                ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) AS rank,
                u.id AS user_id,
                u.full_name,
                u.avatar_url,
                COALESCE(u.total_points, 0) AS total_points
            FROM users u
            WHERE u.role = 'user'
        )
        SELECT
            r.rank,
            r.user_id,
            r.full_name,
            r.avatar_url,
            r.total_points,
            (r.user_id = p_user_id) AS is_me
        FROM ranked r
        WHERE v_user_rank IS NULL
              OR r.rank BETWEEN GREATEST(v_user_rank - GREATEST(p_window, 1), 1)
                          AND (v_user_rank + GREATEST(p_window, 1))
        ORDER BY r.rank;
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_top_movers(
    p_limit INT DEFAULT 10,
    p_days INT DEFAULT 7
)
RETURNS TABLE(
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    current_rank BIGINT,
    previous_rank BIGINT,
    rank_change BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_points AS (
        SELECT pe.user_id, SUM(pe.points)::INT AS earned_recent
        FROM point_events pe
        WHERE pe.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
        GROUP BY pe.user_id
    ),
    current_totals AS (
        SELECT
            u.id AS user_id,
            u.full_name,
            u.avatar_url,
            COALESCE(u.total_points, 0) AS current_total,
            (COALESCE(u.total_points, 0) - COALESCE(rp.earned_recent, 0))::INT AS previous_total
        FROM users u
        LEFT JOIN recent_points rp ON rp.user_id = u.id
        WHERE u.role = 'user'
    ),
    current_ranked AS (
        SELECT
            ct.*,
            ROW_NUMBER() OVER (ORDER BY ct.current_total DESC, ct.user_id ASC) AS current_rank,
            ROW_NUMBER() OVER (ORDER BY ct.previous_total DESC, ct.user_id ASC) AS previous_rank
        FROM current_totals ct
    )
    SELECT
        cr.user_id,
        cr.full_name,
        cr.avatar_url,
        cr.current_rank,
        cr.previous_rank,
        (cr.previous_rank - cr.current_rank) AS rank_change
    FROM current_ranked cr
    WHERE (cr.previous_rank - cr.current_rank) > 0
    ORDER BY rank_change DESC, cr.current_rank ASC
    LIMIT GREATEST(p_limit, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION snapshot_active_season_leaderboard()
RETURNS VOID AS $$
DECLARE
    v_season_id UUID;
BEGIN
    SELECT season_id INTO v_season_id
    FROM get_active_season_info()
    LIMIT 1;

    IF v_season_id IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO season_leaderboard_snapshots (season_id, user_id, total_points, rank, captured_at)
    SELECT
        v_season_id,
        s.user_id,
        s.total_points,
        s.rank::INT,
        now()
    FROM get_leaderboard_seasonal(10000, 0, v_season_id) s
    ON CONFLICT (season_id, user_id) DO UPDATE
    SET
        total_points = EXCLUDED.total_points,
        rank = EXCLUDED.rank,
        captured_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Triggers
-- ==============================================

CREATE OR REPLACE FUNCTION update_user_problems_solved()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        UPDATE users
        SET problems_solved = COALESCE(problems_solved, 0) + 1
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_problems_solved ON problem_solutions;
CREATE TRIGGER trigger_update_problems_solved
    AFTER INSERT OR UPDATE ON problem_solutions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_problems_solved();

CREATE OR REPLACE FUNCTION update_user_courses_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD IS NULL) THEN
        UPDATE users
        SET courses_completed = COALESCE(courses_completed, 0) + 1
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_courses_completed ON user_courses;
CREATE TRIGGER trigger_update_courses_completed
    AFTER INSERT OR UPDATE ON user_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_user_courses_completed();

CREATE OR REPLACE FUNCTION initialize_user_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard (user_id, total_points, updated_at)
    VALUES (NEW.id, COALESCE(NEW.total_points, 0), now())
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO daily_streaks (user_id, current_streak, longest_streak, updated_at)
    VALUES (NEW.id, 0, 0, now())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_initialize_leaderboard ON users;
CREATE TRIGGER trigger_initialize_leaderboard
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_leaderboard();

-- Auth helper (kept for compatibility, trigger intentionally disabled)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Backward-Compatible Column Extensions
-- ==============================================

ALTER TABLE user_courses
ADD COLUMN IF NOT EXISTS completion_points_awarded INT DEFAULT 0;

ALTER TABLE problem_solutions
ADD COLUMN IF NOT EXISTS language TEXT;

ALTER TABLE modules
ADD COLUMN IF NOT EXISTS order_index INT;

UPDATE modules SET order_index = "order" WHERE order_index IS NULL;

ALTER TABLE topics
ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE modules
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE modules SET name = title WHERE name IS NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Rookie';

-- ==============================================
-- RPC Execute Grants
-- ==============================================

GRANT EXECUTE ON FUNCTION add_points_to_user(UUID, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_points_event(UUID, TEXT, TEXT, INT, INT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_streak_multiplier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_leaderboard_ranks() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_all_time(INT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_leaderboard_weekly(INT, INT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_active_season_info() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_leaderboard_seasonal(INT, INT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_rank_window(UUID, TEXT, INT, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_movers(INT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_problems_solved_in_course(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_completed_all_course_topics(UUID, UUID) TO authenticated;

-- ==============================================
-- FUNCTIONS COMPLETE
-- ==============================================
-- ============================================================
-- Levelup-Labs - Realistic Seed Data
-- ============================================================
-- Run this AFTER database_setup.sql and database_functions.sql
-- This creates realistic course data for a coding learning platform

-- ============================================================
-- STEP 1: Get Admin User ID (If exists)
-- ============================================================
-- Note: Admin user must be created via Supabase Auth Dashboard first:
-- 1. Go to Authentication → Users → Add User
-- 2. Email: admin@levelup-labs.com
-- 3. Password: (choose secure password)
-- 4. Then run this script to set admin role

-- This will be set by the admin creation process later
-- We'll use auth.uid() in the course inserts to reference current admin

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
-- STEP 3: Create System Admin (For Course Creation)
-- ============================================================
-- This creates a system admin user that can own courses
-- Note: This is a special user just for course ownership

DO $$
DECLARE
  system_admin_id UUID;
BEGIN
  -- Check if system admin already exists in auth.users
  SELECT id INTO system_admin_id FROM auth.users WHERE email = 'system@levelup-labs.com' LIMIT 1;
  
  IF system_admin_id IS NULL THEN
    -- Create system admin in auth.users
    system_admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      system_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'system@levelup-labs.com',
      crypt('SystemAdmin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"System Admin"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    );
  END IF;
  
  -- Insert or update in users table
  INSERT INTO users (id, email, full_name, role, total_points, rank, courses_completed, problems_solved)
  VALUES (system_admin_id, 'system@levelup-labs.com', 'System Admin', 'admin', 0, 0, 0, 0)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
  
  RAISE NOTICE 'System admin created with ID: %', system_admin_id;
END $$;

-- ============================================================
-- STEP 4: Create Courses
-- ============================================================

-- Get the system admin ID for course creation
DO $$
DECLARE
  admin_uuid UUID;
BEGIN
  SELECT id INTO admin_uuid FROM users WHERE email = 'system@levelup-labs.com' AND role = 'admin' LIMIT 1;

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
-- ✅ 1 System Admin user created (for course ownership)
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
--    Email: admin@levelup-labs.com (or your choice)
-- 5. Update that user's role to 'admin' in users table
-- 6. Start using the application!
--
-- To create a real admin:
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
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

-- ==============================================
-- Ensure RLS + grants support app-managed profile creation
-- ==============================================

-- Remove overly broad/legacy insert policy if present
DROP POLICY IF EXISTS "Service role can create users" ON public.users;

-- Authenticated user can insert only their own profile and cannot self-elevate role
CREATE POLICY "Users can insert own profile" ON public.users
	FOR INSERT TO authenticated
	WITH CHECK (
		auth.uid() = id
		AND role = 'user'
	);

-- Service role may still insert any profile server-side if needed
CREATE POLICY "Service role can insert users" ON public.users
	FOR INSERT TO service_role
	WITH CHECK (true);

-- Required privileges for profile creation/update flows
GRANT INSERT, UPDATE ON public.users TO authenticated;
