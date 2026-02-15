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

CREATE OR REPLACE FUNCTION public.initialize_user_leaderboard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.leaderboard (user_id, total_points, updated_at)
    VALUES (NEW.id, COALESCE(NEW.total_points, 0), now())
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, updated_at)
    VALUES (NEW.id, 0, 0, now())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_initialize_leaderboard ON public.users;
CREATE TRIGGER trigger_initialize_leaderboard
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_user_leaderboard();

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
