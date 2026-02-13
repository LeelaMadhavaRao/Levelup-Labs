-- ==============================================
-- CodeQuest AI - Row Level Security (RLS) Policies
-- ==============================================

-- ==============================================
-- Users Table Policies
-- ==============================================

CREATE POLICY "Users can read all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can create users" ON users
    FOR INSERT WITH CHECK (true);

-- ==============================================
-- Courses Table Policies
-- ==============================================

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
    FOR UPDATE USING (
        admin_id = auth.uid()
    );

CREATE POLICY "Admins can delete their own courses" ON courses
    FOR DELETE USING (
        admin_id = auth.uid()
    );

-- ==============================================
-- User Courses Registration Policies
-- ==============================================

CREATE POLICY "Users can register for courses" ON user_courses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their registrations" ON user_courses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can unregister from courses" ON user_courses
    FOR DELETE USING (user_id = auth.uid());

-- ==============================================
-- Modules Table Policies
-- ==============================================

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

-- ==============================================
-- Topics Table Policies
-- ==============================================

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

-- ==============================================
-- Quiz Responses Table Policies
-- ==============================================

CREATE POLICY "Users can create quiz responses" ON quiz_responses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own quiz responses" ON quiz_responses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz responses" ON quiz_responses
    FOR UPDATE USING (user_id = auth.uid());

-- ==============================================
-- Coding Problems Table Policies
-- ==============================================

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

-- ==============================================
-- Problem Solutions Table Policies
-- ==============================================

CREATE POLICY "Users can create problem solutions" ON problem_solutions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own solutions" ON problem_solutions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own solutions" ON problem_solutions
    FOR UPDATE USING (user_id = auth.uid());

-- ==============================================
-- Leaderboard Table Policies
-- ==============================================

CREATE POLICY "Anyone can read leaderboard" ON leaderboard
    FOR SELECT USING (true);

CREATE POLICY "Service role can update leaderboard" ON leaderboard
    FOR UPDATE USING (true);

CREATE POLICY "Service role can insert leaderboard entries" ON leaderboard
    FOR INSERT WITH CHECK (true);
