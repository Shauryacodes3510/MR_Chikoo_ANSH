-- ============================================================================
-- STRICT LEAST-PRIVILEGE MIGRATION: Phase 2 Security Hardening
-- Target: Confirmed Public Schema Tables in Supabase
-- ============================================================================

-- 1. Enable RLS on all confirmed base tables (excluding views such as school_student_overview)
DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY[
        'arena_rooms', 'arena_submissions', 'battle_pools', 
        'celebration_templates', 'celebrations', 'challenge_packs', 
        'daily_challenges', 'gem_redemptions', 'learning_paths', 
        'lesson_screen_audio', 'lessons', 'module_learning_path', 
        'modules', 'puzzle_packs', 'redemption_requests', 
        'reward_transactions', 'rewards', 'school_admins', 
        'school_classes', 'schools', 'spin_wheel_claims', 
        'spin_wheel_daily_usage', 'subscriptions', 'user_bookmarks', 
        'user_celebration_history', 'user_celebration_queue', 
        'user_challenge_completions', 'user_challenge_progress', 
        'user_intelligence_metrics', 'user_lesson_progress', 
        'user_world_progress', 'worlds', 'analytics_events'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        BEGIN
            EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Skipping RLS for %: %', t, SQLERRM;
        END;
    END LOOP;
END $$;


-- 2. Create strict least-privilege policies for each table (idempotent via DROP POLICY IF EXISTS)

-- --- Schools & School Management Tables ---
DROP POLICY IF EXISTS "Authenticated users can view schools" ON public.schools;
CREATE POLICY "Authenticated users can view schools"
    ON public.schools FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "School admins and platform admins manage schools" ON public.schools;
CREATE POLICY "School admins and platform admins manage schools"
    ON public.schools FOR ALL TO authenticated
    USING (
        auth_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR
        EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = schools.id)
    )
    WITH CHECK (
        auth_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR
        EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = schools.id)
    );

DROP POLICY IF EXISTS "Authenticated users can view school classes" ON public.school_classes;
CREATE POLICY "Authenticated users can view school classes"
    ON public.school_classes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "School staff manage classes" ON public.school_classes;
CREATE POLICY "School staff manage classes"
    ON public.school_classes FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR
        EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = school_classes.school_id)
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR
        EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = school_classes.school_id)
    );

DROP POLICY IF EXISTS "Authenticated users can view school admins" ON public.school_admins;
CREATE POLICY "Authenticated users can view school admins"
    ON public.school_admins FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Platform admins manage school admins" ON public.school_admins;
CREATE POLICY "Platform admins manage school admins"
    ON public.school_admins FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- --- Arena & Multiplayer Tables ---
DROP POLICY IF EXISTS "Users can manage their own arena rooms" ON public.arena_rooms;
CREATE POLICY "Users can manage their own arena rooms"
    ON public.arena_rooms FOR ALL TO authenticated
    USING (player_1_id = auth.uid()::TEXT OR player_2_id = auth.uid()::TEXT OR player_1_id IS NULL OR player_2_id IS NULL)
    WITH CHECK (player_1_id = auth.uid()::TEXT OR player_2_id = auth.uid()::TEXT OR player_1_id IS NULL OR player_2_id IS NULL);

DROP POLICY IF EXISTS "Participants can manage their arena submissions" ON public.arena_submissions;
CREATE POLICY "Participants can manage their arena submissions"
    ON public.arena_submissions FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.arena_rooms 
            WHERE id = arena_submissions.room_id 
              AND (player_1_id = auth.uid()::TEXT OR player_2_id = auth.uid()::TEXT)
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.arena_rooms 
            WHERE id = arena_submissions.room_id 
              AND (player_1_id = auth.uid()::TEXT OR player_2_id = auth.uid()::TEXT)
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );


-- --- Rewards & Transactions (Strict Protection Against Fabrication) ---
DROP POLICY IF EXISTS "Users can view their own reward transactions" ON public.reward_transactions;
CREATE POLICY "Users can view their own reward transactions"
    ON public.reward_transactions FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Prevent students from fabricating reward transactions; restrict INSERT/UPDATE/DELETE strictly to service_role or platform admins
DROP POLICY IF EXISTS "Only trusted service or admin can modify reward transactions" ON public.reward_transactions;
CREATE POLICY "Only trusted service or admin can modify reward transactions"
    ON public.reward_transactions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can view their own gem redemptions" ON public.gem_redemptions;
CREATE POLICY "Users can view their own gem redemptions"
    ON public.gem_redemptions FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can manage their own gem redemptions" ON public.gem_redemptions;
CREATE POLICY "Users can manage their own gem redemptions"
    ON public.gem_redemptions FOR ALL TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
    WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can view their own redemption requests" ON public.redemption_requests;
CREATE POLICY "Users can view their own redemption requests"
    ON public.redemption_requests FOR SELECT TO authenticated
    USING (user_email = auth.jwt() ->> 'email' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can insert redemption requests" ON public.redemption_requests;
CREATE POLICY "Users can insert redemption requests"
    ON public.redemption_requests FOR INSERT TO authenticated
    WITH CHECK (user_email = auth.jwt() ->> 'email');


-- --- Challenge & Learning Progression Tables (Strict Student Isolation) ---
DROP POLICY IF EXISTS "Users can manage their own challenge completions" ON public.user_challenge_completions;
CREATE POLICY "Users can manage their own challenge completions"
    ON public.user_challenge_completions FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own challenge progress" ON public.user_challenge_progress;
CREATE POLICY "Users can manage their own challenge progress"
    ON public.user_challenge_progress FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own world progress" ON public.user_world_progress;
CREATE POLICY "Users can manage their own world progress"
    ON public.user_world_progress FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own lesson progress" ON public.user_lesson_progress;
CREATE POLICY "Users can manage their own lesson progress"
    ON public.user_lesson_progress FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can manage their own bookmarks"
    ON public.user_bookmarks FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own intelligence metrics" ON public.user_intelligence_metrics;
CREATE POLICY "Users can manage their own intelligence metrics"
    ON public.user_intelligence_metrics FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own celebration history" ON public.user_celebration_history;
CREATE POLICY "Users can manage their own celebration history"
    ON public.user_celebration_history FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own celebration queue" ON public.user_celebration_queue;
CREATE POLICY "Users can manage their own celebration queue"
    ON public.user_celebration_queue FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- --- Analytics Events Table ---
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;
CREATE POLICY "Users can insert their own analytics events"
    ON public.analytics_events FOR INSERT TO authenticated
    WITH CHECK (email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Admins have full access to analytics" ON public.analytics_events;
CREATE POLICY "Admins have full access to analytics"
    ON public.analytics_events FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- --- Spin Wheel Claims & Usage Table ---
DROP POLICY IF EXISTS "Users can view and insert their own spin claims" ON public.spin_wheel_claims;
CREATE POLICY "Users can view and insert their own spin claims"
    ON public.spin_wheel_claims FOR ALL TO authenticated
    USING (user_id = auth.uid()::TEXT OR user_id = auth.jwt() ->> 'email')
    WITH CHECK (user_id = auth.uid()::TEXT OR user_id = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users can read their own spin usage" ON public.spin_wheel_daily_usage;
CREATE POLICY "Users can read their own spin usage"
    ON public.spin_wheel_daily_usage FOR SELECT TO authenticated
    USING (user_id = auth.uid());


-- --- Lesson Screen Audio Table ---
DROP POLICY IF EXISTS "Anyone authenticated can read screen audio" ON public.lesson_screen_audio;
CREATE POLICY "Anyone authenticated can read screen audio"
    ON public.lesson_screen_audio FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage screen audio" ON public.lesson_screen_audio;
CREATE POLICY "Admins manage screen audio"
    ON public.lesson_screen_audio FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- --- Public Educational & Gamification Content Tables ---
DO $$
DECLARE
    tbl text;
    pub_tables text[] := ARRAY[
        'celebrations', 'celebration_templates', 'challenge_packs', 
        'daily_challenges', 'learning_paths', 'lessons', 
        'module_learning_path', 'modules', 'puzzle_packs', 
        'rewards', 'battle_pools', 'worlds'
    ];
BEGIN
    FOREACH tbl IN ARRAY pub_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Anyone authenticated can read %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Anyone authenticated can read %I" ON public.%I FOR SELECT TO authenticated USING (true);', tbl, tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Admins manage %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Admins manage %I" ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));', tbl, tbl);
    END LOOP;
END $$;


-- 3. Harden consume_spin_wheel() and revoke EXECUTE from anon
CREATE OR REPLACE FUNCTION public.consume_spin_wheel(
    p_user_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_today DATE;
    v_current_used INT;
    v_row_id UUID;
    v_daily_limit CONSTANT INT := 3;
BEGIN
    -- 1. Strictly require auth.uid() for security (reject client-supplied parameters for non-admins)
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required. Anonymous users cannot consume spins.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Compute date in Asia/Kolkata timezone
    v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

    -- 3. Atomically ensure row exists for today
    INSERT INTO public.spin_wheel_daily_usage (user_id, usage_date, spins_used, created_at, updated_at)
    VALUES (v_user_id, v_today, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, usage_date) DO NOTHING;

    -- 4. Lock row FOR UPDATE to prevent race conditions & double spin submissions
    SELECT id, spins_used INTO v_row_id, v_current_used
    FROM public.spin_wheel_daily_usage
    WHERE user_id = v_user_id AND usage_date = v_today
    FOR UPDATE;

    -- 5. Strict Limit Check: must be strictly less than 3
    IF v_current_used >= v_daily_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'consumed', false,
            'limit', v_daily_limit,
            'used', v_current_used,
            'remaining', 0,
            'canSpin', false,
            'can_spin', false,
            'usage_date', v_today,
            'timezone', 'Asia/Kolkata',
            'message', 'Daily spin limit of 3 spins reached. Resets at midnight Asia/Kolkata.'
        );
    END IF;

    -- 6. Atomically increment spins_used
    UPDATE public.spin_wheel_daily_usage
    SET spins_used = spins_used + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_row_id
    RETURNING spins_used INTO v_current_used;

    -- 7. Return updated status
    RETURN jsonb_build_object(
        'success', true,
        'consumed', true,
        'limit', v_daily_limit,
        'used', v_current_used,
        'remaining', GREATEST(0, v_daily_limit - v_current_used),
        'canSpin', (v_current_used < v_daily_limit),
        'can_spin', (v_current_used < v_daily_limit),
        'usage_date', v_today,
        'timezone', 'Asia/Kolkata',
        'message', 'Spin successfully consumed.'
    );
END;
$$;

-- Revoke EXECUTE from anon role entirely
REVOKE EXECUTE ON FUNCTION public.consume_spin_wheel(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_spin_wheel(UUID, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_spin_wheel_daily_status(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_spin_wheel_daily_status(UUID, TEXT) TO authenticated, service_role;
