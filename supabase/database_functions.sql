-- ==============================================
-- Database Functions & Triggers
-- Purpose: Handle points, leaderboard updates automatically
-- ==============================================

-- Function: Add points to user
-- Called by: verifyCode Edge Function, updatePoints Edge Function
CREATE OR REPLACE FUNCTION add_points_to_user(
    p_user_id UUID,
    p_points INT
) RETURNS VOID AS $$
BEGIN
    -- Update user's total points
    UPDATE users
    SET 
        total_points = total_points + p_points,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Update or insert into leaderboard
    INSERT INTO leaderboard (user_id, total_points, updated_at)
    VALUES (p_user_id, p_points, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_points = leaderboard.total_points + p_points,
        updated_at = now();
    
    -- Trigger leaderboard rank update
    PERFORM update_leaderboard_ranks();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update leaderboard ranks
-- Called by: add_points_to_user trigger
CREATE OR REPLACE FUNCTION update_leaderboard_ranks() RETURNS VOID AS $$
BEGIN
    -- Update ranks based on total points (descending)
    WITH ranked_users AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, updated_at ASC) as new_rank
        FROM leaderboard
    )
    UPDATE leaderboard l
    SET rank = ru.new_rank
    FROM ranked_users ru
    WHERE l.user_id = ru.user_id;
    
    -- Also update the rank in users table for easy access
    UPDATE users u
    SET rank = l.rank
    FROM leaderboard l
    WHERE u.id = l.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's problems solved count in a course
CREATE OR REPLACE FUNCTION get_user_problems_solved_in_course(
    p_user_id UUID,
    p_course_id UUID
) RETURNS INT AS $$
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

-- Function: Check if user completed all topics in a course
CREATE OR REPLACE FUNCTION has_user_completed_all_course_topics(
    p_user_id UUID,
    p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    total_topics INT;
    completed_topics INT;
BEGIN
    -- Get total number of topics in course
    SELECT COUNT(DISTINCT t.id)
    INTO total_topics
    FROM topics t
    INNER JOIN modules m ON m.id = t.module_id
    WHERE m.course_id = p_course_id;
    
    -- Get number of topics where user passed quiz AND solved all problems
    SELECT COUNT(DISTINCT t.id)
    INTO completed_topics
    FROM topics t
    INNER JOIN modules m ON m.id = t.module_id
    WHERE m.course_id = p_course_id
    AND EXISTS (
        -- User passed quiz for this topic
        SELECT 1 FROM quiz_responses qr
        WHERE qr.user_id = p_user_id
        AND qr.topic_id = t.id
        AND qr.passed = true
    )
    AND (
        -- Either no problems exist for this topic, or all are solved
        NOT EXISTS (
            SELECT 1 FROM coding_problems cp
            WHERE cp.topic_id = t.id
        )
        OR NOT EXISTS (
            SELECT 1 FROM coding_problems cp
            WHERE cp.topic_id = t.id
            AND NOT EXISTS (
                SELECT 1 FROM problem_solutions ps
                WHERE ps.user_id = p_user_id
                AND ps.problem_id = cp.id
                AND ps.status = 'completed'
            )
        )
    );
    
    RETURN total_topics > 0 AND total_topics = completed_topics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update problems solved count when solution status changes
CREATE OR REPLACE FUNCTION update_user_problems_solved() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Increment problems solved
        UPDATE users
        SET problems_solved = problems_solved + 1
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update problems solved count
DROP TRIGGER IF EXISTS trigger_update_problems_solved ON problem_solutions;
CREATE TRIGGER trigger_update_problems_solved
    AFTER INSERT OR UPDATE ON problem_solutions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_problems_solved();

-- Function: Update courses completed count when course is completed
CREATE OR REPLACE FUNCTION update_user_courses_completed() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD IS NULL) THEN
        -- Increment courses completed
        UPDATE users
        SET courses_completed = courses_completed + 1
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update courses completed count
DROP TRIGGER IF EXISTS trigger_update_courses_completed ON user_courses;
CREATE TRIGGER trigger_update_courses_completed
    AFTER INSERT OR UPDATE ON user_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_user_courses_completed();

-- Function: Initialize leaderboard entry for new users
CREATE OR REPLACE FUNCTION initialize_user_leaderboard() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard (user_id, total_points, updated_at)
    VALUES (NEW.id, 0, now())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create leaderboard entry for new users
DROP TRIGGER IF EXISTS trigger_initialize_leaderboard ON users;
CREATE TRIGGER trigger_initialize_leaderboard
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_leaderboard();

-- Function: Auto-create user profile when auth user confirms email
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

-- Trigger: Create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- Additional Columns for PRD Requirements
-- ==============================================

-- Add completion tracking to user_courses
ALTER TABLE user_courses 
ADD COLUMN IF NOT EXISTS completion_points_awarded INT DEFAULT 0;

-- Add language field to problem_solutions
ALTER TABLE problem_solutions
ADD COLUMN IF NOT EXISTS language TEXT;

-- Add order_index to modules (if using "order" is problematic)
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS order_index INT;

-- Copy data from "order" to order_index if needed
UPDATE modules SET order_index = "order" WHERE order_index IS NULL;

-- Add order_index and description to topics
ALTER TABLE topics
ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add name and description to modules
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing modules to have name = title if name is null
UPDATE modules SET name = title WHERE name IS NULL;

-- Add bio and social links to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- ==============================================
-- FUNCTIONS COMPLETE!
-- ==============================================
-- These functions will:
-- ✅ Automatically update leaderboard when points are awarded
-- ✅ Update user's rank based on total points
-- ✅ Track problems solved count
-- ✅ Track courses completed count
-- ✅ Support course completion checking
-- ==============================================
