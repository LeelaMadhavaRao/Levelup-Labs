-- ==============================================
-- CodeQuest AI - Initial Database Schema
-- ==============================================

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE problem_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE solution_status AS ENUM ('pending', 'algorithm_submitted', 'algorithm_verified', 'code_submitted', 'completed', 'failed');

-- ==============================================
-- Users Table
-- ==============================================
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

-- ==============================================
-- Courses Table
-- ==============================================
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

-- ==============================================
-- User Course Registration Table
-- ==============================================
CREATE TABLE user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);

-- ==============================================
-- Modules Table
-- ==============================================
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "order" INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(course_id, "order")
);

-- ==============================================
-- Topics Table
-- ==============================================
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

-- ==============================================
-- Quiz Responses Table
-- ==============================================
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    quiz_data JSONB NOT NULL, -- Stores questions and user answers
    score INT NOT NULL,
    total_questions INT NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================
-- Coding Problems Table
-- ==============================================
CREATE TABLE coding_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty problem_difficulty NOT NULL,
    examples JSONB, -- Array of {input, output} objects
    test_cases JSONB NOT NULL, -- Array of test cases
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================
-- Problem Solutions Table
-- ==============================================
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

-- ==============================================
-- Leaderboard Table
-- ==============================================
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INT NOT NULL,
    rank INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- ==============================================
-- Indexes for Performance
-- ==============================================

-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Course queries
CREATE INDEX idx_courses_admin_id ON courses(admin_id);
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_id ON user_courses(course_id);

-- Module queries
CREATE INDEX idx_modules_course_id ON modules(course_id);

-- Topic queries
CREATE INDEX idx_topics_module_id ON topics(module_id);

-- Quiz queries
CREATE INDEX idx_quiz_responses_user_id ON quiz_responses(user_id);
CREATE INDEX idx_quiz_responses_topic_id ON quiz_responses(topic_id);

-- Problem queries
CREATE INDEX idx_coding_problems_topic_id ON coding_problems(topic_id);
CREATE INDEX idx_problem_solutions_user_id ON problem_solutions(user_id);
CREATE INDEX idx_problem_solutions_problem_id ON problem_solutions(problem_id);
CREATE INDEX idx_problem_solutions_status ON problem_solutions(status);

-- Leaderboard queries
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX idx_leaderboard_total_points ON leaderboard(total_points DESC);

-- ==============================================
-- Create Initial Admin User
-- Note: This will be populated by 003_initial_admin.sql
-- ==============================================

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
