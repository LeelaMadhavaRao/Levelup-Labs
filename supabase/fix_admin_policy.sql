-- ============================================================
-- ADMIN / STUDENT PERMISSIONS FIX (SAFE TO RE-RUN)
-- ============================================================

-- ============================================================
-- STEP 0: TABLE-LEVEL PERMISSIONS
-- ============================================================
GRANT INSERT, UPDATE, DELETE ON courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON modules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON topics TO authenticated;
GRANT INSERT, UPDATE, DELETE ON coding_problems TO authenticated;
GRANT SELECT ON user_courses TO authenticated;

-- ============================================================
-- STEP 1: ADMIN CHECK FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================
-- STEP 2: DROP ALL EXISTING POLICIES (CLEAN RESET)
-- ============================================================

-- COURSES
DROP POLICY IF EXISTS "Admins can create courses" ON courses;
DROP POLICY IF EXISTS "Admins can update any course" ON courses;
DROP POLICY IF EXISTS "Admins can delete any course" ON courses;
DROP POLICY IF EXISTS "Admins can update their own courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete their own courses" ON courses;

-- MODULES
DROP POLICY IF EXISTS "Admins can create modules" ON modules;
DROP POLICY IF EXISTS "Admins can update modules" ON modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON modules;
DROP POLICY IF EXISTS "Admins can update their modules" ON modules;
DROP POLICY IF EXISTS "Admins can delete their modules" ON modules;

-- TOPICS
DROP POLICY IF EXISTS "Admins can create topics" ON topics;
DROP POLICY IF EXISTS "Admins can update topics" ON topics;
DROP POLICY IF EXISTS "Admins can delete topics" ON topics;
DROP POLICY IF EXISTS "Admins can update their topics" ON topics;
DROP POLICY IF EXISTS "Admins can delete their topics" ON topics;

-- CODING PROBLEMS
DROP POLICY IF EXISTS "Admins can create problems" ON coding_problems;
DROP POLICY IF EXISTS "Students can generate problems for enrolled courses" ON coding_problems;

-- USER COURSES
DROP POLICY IF EXISTS "Admins can view all enrollments" ON user_courses;

-- ============================================================
-- STEP 3: COURSES POLICIES
-- ============================================================
CREATE POLICY "Admins can create courses"
ON courses
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update any course"
ON courses
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete any course"
ON courses
FOR DELETE
USING (is_admin());

-- ============================================================
-- STEP 4: MODULES POLICIES
-- ============================================================
CREATE POLICY "Admins can create modules"
ON modules
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update modules"
ON modules
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete modules"
ON modules
FOR DELETE
USING (is_admin());

-- ============================================================
-- STEP 5: TOPICS POLICIES
-- ============================================================
CREATE POLICY "Admins can create topics"
ON topics
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update topics"
ON topics
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete topics"
ON topics
FOR DELETE
USING (is_admin());

-- ============================================================
-- STEP 6: CODING PROBLEMS POLICIES
-- ============================================================

-- ADMINS
CREATE POLICY "Admins can create problems"
ON coding_problems
FOR INSERT
WITH CHECK (is_admin());

-- STUDENTS (ENROLLED ONLY)
CREATE POLICY "Students can generate problems for enrolled courses"
ON coding_problems
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM topics
    JOIN modules ON modules.id = topics.module_id
    JOIN courses ON courses.id = modules.course_id
    JOIN user_courses ON user_courses.course_id = courses.id
    WHERE topics.id = coding_problems.topic_id
      AND user_courses.user_id = auth.uid()
  )
);

-- ============================================================
-- STEP 7: USER COURSE VISIBILITY
-- ============================================================
CREATE POLICY "Admins can view all enrollments"
ON user_courses
FOR SELECT
USING (is_admin());

-- ============================================================
-- DONE
-- ============================================================