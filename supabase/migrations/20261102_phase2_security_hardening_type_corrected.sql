-- ============================================================================
-- PROPOSED TYPE-CORRECTED MIGRATION: Phase 2 Security Hardening
-- Resolves all UUID vs VARCHAR / TEXT operator mismatch errors (ERROR: 42883)
-- ============================================================================

-- 1. Enable RLS on confirmed base tables
ALTER TABLE IF EXISTS public.arena_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.arena_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.battle_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.celebration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.challenge_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gem_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lesson_screen_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.module_learning_path ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.puzzle_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.school_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spin_wheel_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spin_wheel_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_celebration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_celebration_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_intelligence_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_world_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;


-- 2. Type-Corrected Least-Privilege Policies

-- --- Arena Rooms (player_1_id / player_2_id as TEXT/VARCHAR matching auth.uid()::TEXT) ---
DROP POLICY IF EXISTS "Users can create arena rooms" ON public.arena_rooms;
CREATE POLICY "Users can create arena rooms"
    ON public.arena_rooms FOR INSERT TO authenticated
    WITH CHECK (player_1_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users can discover and view their arena rooms" ON public.arena_rooms;
CREATE POLICY "Users can discover and view their arena rooms"
    ON public.arena_rooms FOR SELECT TO authenticated
    USING (player_1_id = auth.uid()::TEXT OR player_2_id = auth.uid()::TEXT OR player_2_id IS NULL);

DROP POLICY IF EXISTS "Users can join open arena rooms as player 2" ON public.arena_rooms;
CREATE POLICY "Users can join open arena rooms as player 2"
    ON public.arena_rooms FOR UPDATE TO authenticated
    USING (player_2_id IS NULL AND player_1_id <> auth.uid()::TEXT)
    WITH CHECK (player_2_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Participants can update their active arena room" ON public.arena_rooms;
CREATE POLICY "Participants can update their active arena room"
    ON public.arena_rooms FOR UPDATE TO authenticated
    USING (player_1_id = auth.uid()::TEXT OR player_2_id = auth.uid()::TEXT)
    WITH CHECK (player_1_id = auth.uid()::TEXT OR player_2_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Creators or admins can delete arena rooms" ON public.arena_rooms;
CREATE POLICY "Creators or admins can delete arena rooms"
    ON public.arena_rooms FOR DELETE TO authenticated
    USING (player_1_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- --- Arena Submissions ---
DROP POLICY IF EXISTS "Participants manage their arena submissions" ON public.arena_submissions;
CREATE POLICY "Participants manage their arena submissions"
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


-- --- Schools & Classes ---
DROP POLICY IF EXISTS "Authenticated users view schools" ON public.schools;
CREATE POLICY "Authenticated users view schools" ON public.schools FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "School owners and admins manage schools" ON public.schools;
CREATE POLICY "School owners and admins manage schools"
    ON public.schools FOR ALL TO authenticated
    USING (auth_user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = schools.id))
    WITH CHECK (auth_user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = schools.id));

DROP POLICY IF EXISTS "Authenticated users view school classes" ON public.school_classes;
CREATE POLICY "Authenticated users view school classes" ON public.school_classes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "School staff manage classes" ON public.school_classes;
CREATE POLICY "School staff manage classes"
    ON public.school_classes FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = school_classes.school_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) OR EXISTS (SELECT 1 FROM public.school_admins WHERE user_id = auth.uid() AND school_id = school_classes.school_id));

DROP POLICY IF EXISTS "Authenticated users view school admins" ON public.school_admins;
CREATE POLICY "Authenticated users view school admins" ON public.school_admins FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Platform admins manage school admins" ON public.school_admins;
CREATE POLICY "Platform admins manage school admins"
    ON public.school_admins FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- --- Reward Transactions & Redemptions (user_id as UUID / TEXT safe casting) ---
DROP POLICY IF EXISTS "Users view own reward transactions" ON public.reward_transactions;
CREATE POLICY "Users view own reward transactions" ON public.reward_transactions FOR SELECT TO authenticated USING (user_id::TEXT = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Admins manage reward transactions" ON public.reward_transactions;
CREATE POLICY "Admins manage reward transactions" ON public.reward_transactions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users manage own gem redemptions" ON public.gem_redemptions;
CREATE POLICY "Users manage own gem redemptions" ON public.gem_redemptions FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)) WITH CHECK (user_id::TEXT = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users view own redemption requests" ON public.redemption_requests;
CREATE POLICY "Users view own redemption requests" ON public.redemption_requests FOR SELECT TO authenticated USING (user_email = auth.jwt() ->> 'email' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users insert redemption requests" ON public.redemption_requests;
CREATE POLICY "Users insert redemption requests" ON public.redemption_requests FOR INSERT TO authenticated WITH CHECK (user_email = auth.jwt() ->> 'email');


-- --- Progression & Learning Tables (Explicitly casting user_id::TEXT = auth.uid()::TEXT to prevent operator mismatch ERROR 42883) ---
DROP POLICY IF EXISTS "Users manage own user_challenge_completions" ON public.user_challenge_completions;
CREATE POLICY "Users manage own user_challenge_completions" ON public.user_challenge_completions FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users manage own user_challenge_progress" ON public.user_challenge_progress;
CREATE POLICY "Users manage own user_challenge_progress" ON public.user_challenge_progress FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users manage own user_world_progress" ON public.user_world_progress;
CREATE POLICY "Users manage own user_world_progress" ON public.user_world_progress FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users manage own user_lesson_progress" ON public.user_lesson_progress;
CREATE POLICY "Users manage own user_lesson_progress" ON public.user_lesson_progress FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users manage own user_bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users manage own user_bookmarks" ON public.user_bookmarks FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users manage own user_intelligence_metrics" ON public.user_intelligence_metrics;
CREATE POLICY "Users manage own user_intelligence_metrics" ON public.user_intelligence_metrics FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users manage own user_celebration_history" ON public.user_celebration_history;
CREATE POLICY "Users manage own user_celebration_history" ON public.user_celebration_history FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users manage own user_celebration_queue" ON public.user_celebration_queue;
CREATE POLICY "Users manage own user_celebration_queue" ON public.user_celebration_queue FOR ALL TO authenticated USING (user_id::TEXT = auth.uid()::TEXT) WITH CHECK (user_id::TEXT = auth.uid()::TEXT);


-- --- Analytics & Spin Wheel ---
DROP POLICY IF EXISTS "Users insert analytics events" ON public.analytics_events;
CREATE POLICY "Users insert analytics events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Admins read analytics" ON public.analytics_events;
CREATE POLICY "Admins read analytics" ON public.analytics_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users manage own spin claims" ON public.spin_wheel_claims;
CREATE POLICY "Users manage own spin claims" ON public.spin_wheel_claims FOR ALL TO authenticated USING (user_id = auth.uid()::TEXT OR user_id = auth.jwt() ->> 'email') WITH CHECK (user_id = auth.uid()::TEXT OR user_id = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users read own spin usage" ON public.spin_wheel_daily_usage;
CREATE POLICY "Users read own spin usage" ON public.spin_wheel_daily_usage FOR SELECT TO authenticated USING (user_id::TEXT = auth.uid()::TEXT);


-- --- Public Educational Content ---
DO $$
DECLARE
    tbl text;
    pub_tables text[] := ARRAY[
        'celebrations', 'celebration_templates', 'challenge_packs', 
        'daily_challenges', 'learning_paths', 'lessons', 
        'module_learning_path', 'modules', 'puzzle_packs', 
        'rewards', 'battle_pools', 'worlds', 'lesson_screen_audio'
    ];
BEGIN
    FOREACH tbl IN ARRAY pub_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Anyone read %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Anyone read %I" ON public.%I FOR SELECT TO authenticated USING (true);', tbl, tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Admins manage %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Admins manage %I" ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));', tbl, tbl);
    END LOOP;
END $$;
