-- ==============================================
-- Migration: Create topic_progress table
-- ==============================================
-- This table tracks user progress through course topics
-- Run this in Supabase SQL Editor if you get 404 errors on topic_progress

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS topic_progress (
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

-- Enable RLS
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can create their own progress" ON topic_progress;
CREATE POLICY "Users can create their own progress" ON topic_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own progress" ON topic_progress;
CREATE POLICY "Users can read their own progress" ON topic_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON topic_progress;
CREATE POLICY "Users can update their own progress" ON topic_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON topic_progress TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_topic_progress_user_id ON topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_topic_id ON topic_progress(topic_id);
