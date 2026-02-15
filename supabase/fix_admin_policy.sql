-- ==============================================
-- Fix Admin Course/Module/Topic/Problem Permissions
-- ==============================================
-- ROOT CAUSE: The database_setup.sql only GRANTs SELECT on
-- courses, modules, topics, coding_problems to the authenticated role.
-- Admins need INSERT, UPDATE, DELETE as well (RLS policies control WHO can do it).
-- ==============================================

-- STEP 1: Grant table-level INSERT, UPDATE, DELETE permissions
-- (RLS policies still control row-level access, so this is safe)
GRANT INSERT, UPDATE, DELETE ON courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON modules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON topics TO authenticated;
GRANT INSERT, UPDATE, DELETE ON coding_problems TO authenticated;

-- STEP 2: Create a SECURITY DEFINER function to check admin status
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

-- STEP 3: Recreate course policies using is_admin() function
DROP POLICY IF EXISTS "Admins can create courses" ON courses;
CREATE POLICY "Admins can create courses" ON courses
    FOR INSERT 
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update their own courses" ON courses;
CREATE POLICY "Admins can update any course" ON courses
    FOR UPDATE 
    USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete their own courses" ON courses;
CREATE POLICY "Admins can delete any course" ON courses
    FOR DELETE 
    USING (is_admin());

-- STEP 4: Recreate module policies using is_admin()
DROP POLICY IF EXISTS "Admins can create modules" ON modules;
CREATE POLICY "Admins can create modules" ON modules
    FOR INSERT WITH CHECK (
        is_admin() AND EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id
            AND courses.admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can update their modules" ON modules;
CREATE POLICY "Admins can update their modules" ON modules
    FOR UPDATE USING (
        is_admin() AND EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id
            AND courses.admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can delete their modules" ON modules;
CREATE POLICY "Admins can delete their modules" ON modules
    FOR DELETE USING (
        is_admin() AND EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = modules.course_id
            AND courses.admin_id = auth.uid()
        )
    );

-- STEP 5: Recreate topic policies using is_admin()
DROP POLICY IF EXISTS "Admins can create topics" ON topics;
CREATE POLICY "Admins can create topics" ON topics
    FOR INSERT WITH CHECK (
        is_admin() AND EXISTS (
            SELECT 1 FROM modules
            INNER JOIN courses ON courses.id = modules.course_id
            WHERE modules.id = topics.module_id
            AND courses.admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can update their topics" ON topics;
CREATE POLICY "Admins can update their topics" ON topics
    FOR UPDATE USING (
        is_admin() AND EXISTS (
            SELECT 1 FROM modules
            INNER JOIN courses ON courses.id = modules.course_id
            WHERE modules.id = topics.module_id
            AND courses.admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can delete their topics" ON topics;
CREATE POLICY "Admins can delete their topics" ON topics
    FOR DELETE USING (
        is_admin() AND EXISTS (
            SELECT 1 FROM modules
            INNER JOIN courses ON courses.id = modules.course_id
            WHERE modules.id = topics.module_id
            AND courses.admin_id = auth.uid()
        )
    );

-- STEP 6: Recreate coding_problems policies using is_admin()
DROP POLICY IF EXISTS "Admins can create problems" ON coding_problems;
CREATE POLICY "Admins can create problems" ON coding_problems
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Students can generate problems for enrolled courses" ON coding_problems;
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

-- STEP 7: Allow admins to view all course enrollments
DROP POLICY IF EXISTS "Admins can view all enrollments" ON user_courses;
CREATE POLICY "Admins can view all enrollments" ON user_courses
    FOR SELECT 
    USING (is_admin());
