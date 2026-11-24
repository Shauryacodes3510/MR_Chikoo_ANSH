-- ============================================================================
-- MIGRATION: Complete Cookie Economy, Spin Wheel, Store Redemption & Streak RPCs
-- Target: Supabase / PostgreSQL
-- ============================================================================

-- 0. Ensure Missing Profile Columns Exist -------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_streak_date VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_rewards TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_lessons TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_daily_challenges TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earned_badges TEXT[] DEFAULT '{}';

-- 1. Idempotency Ledger Table ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_claims (
    user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    claim_key  TEXT        NOT NULL,
    amount     INTEGER     NOT NULL CHECK (amount >= 0),
    source     TEXT        NOT NULL DEFAULT 'challenge',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, claim_key)
);

CREATE INDEX IF NOT EXISTS idx_reward_claims_user_created
    ON public.reward_claims (user_id, created_at);

ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reward claims" ON public.reward_claims;
CREATE POLICY "Users can view their own reward claims"
    ON public.reward_claims FOR SELECT TO authenticated
    USING (user_id = auth.uid());

REVOKE ALL ON public.reward_claims FROM anon, authenticated;
GRANT SELECT ON public.reward_claims TO authenticated;
GRANT ALL ON public.reward_claims TO service_role;

-- 2. Profile Protection Trigger: allow trusted RPC writes --------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_service_or_admin BOOLEAN := FALSE;
BEGIN
    IF auth.role() = 'service_role' THEN
        is_service_or_admin := TRUE;
    ELSIF auth.uid() IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
            is_service_or_admin := TRUE;
        END IF;
    END IF;

    IF NOT is_service_or_admin THEN
        -- is_admin can NEVER be changed by a normal user (not even via RPC)
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            RAISE EXCEPTION 'Unauthorized: Direct modification of is_admin is forbidden.'
                USING ERRCODE = '42501';
        END IF;

        -- Balances may only change inside trusted RPC functions,
        -- which set this transaction-local flag around their UPDATE.
        IF COALESCE(current_setting('app.trusted_reward_write', TRUE), '') <> 'on' THEN
            IF NEW.xp          IS DISTINCT FROM OLD.xp          THEN NEW.xp          := OLD.xp;          END IF;
            IF NEW.weekly_xp   IS DISTINCT FROM OLD.weekly_xp   THEN NEW.weekly_xp   := OLD.weekly_xp;   END IF;
            IF NEW.gems        IS DISTINCT FROM OLD.gems        THEN NEW.gems        := OLD.gems;        END IF;
            IF NEW.streak      IS DISTINCT FROM OLD.streak      THEN NEW.streak      := OLD.streak;      END IF;
            IF NEW.best_streak IS DISTINCT FROM OLD.best_streak THEN NEW.best_streak := OLD.best_streak; END IF;
            IF NEW.energy      IS DISTINCT FROM OLD.energy      THEN NEW.energy      := OLD.energy;      END IF;
            IF NEW.trophies    IS DISTINCT FROM OLD.trophies    THEN NEW.trophies    := OLD.trophies;    END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 3. complete_challenge RPC --------------------------------------------------
-- Supports both parameter signatures called by client:
-- Signature A: (p_challenge_id, p_reward_gems, p_xp_reward, p_email)
-- Signature B: (p_challenge_id, p_metadata, p_reward_amount)
DROP FUNCTION IF EXISTS public.complete_challenge(TEXT, JSONB, INTEGER);
DROP FUNCTION IF EXISTS public.complete_challenge(TEXT, INTEGER, INTEGER, TEXT, JSONB, INTEGER);

CREATE OR REPLACE FUNCTION public.complete_challenge(
    p_challenge_id   TEXT,
    p_reward_gems    INTEGER DEFAULT NULL,
    p_xp_reward      INTEGER DEFAULT 0,
    p_email          TEXT    DEFAULT NULL,
    p_metadata       JSONB   DEFAULT '{}'::jsonb,
    p_reward_amount  INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          UUID    := auth.uid();
    v_key          TEXT    := btrim(COALESCE(p_challenge_id, ''));
    v_amount       INTEGER := GREATEST(0, COALESCE(p_reward_gems, p_reward_amount, 0));
    v_max_claim    CONSTANT INTEGER := 1000;
    v_daily_cap    CONSTANT INTEGER := 5000;
    v_day_start    TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
    v_earned_today INTEGER;
    v_balance      INTEGER;
    v_chest_date   DATE;
BEGIN
    IF v_uid IS NULL THEN
        IF p_email IS NOT NULL THEN
            SELECT id INTO v_uid FROM public.profiles WHERE email = lower(btrim(p_email));
        END IF;
    END IF;

    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF v_key = '' OR length(v_key) > 200 THEN
        RAISE EXCEPTION 'Invalid challenge id.' USING ERRCODE = '22023';
    END IF;

    -- Daily chest keys format check: daily_chest_YYYY-MM-DD
    IF v_key ~ '^daily_chest_\d{4}-\d{2}-\d{2}$' THEN
        v_chest_date := substr(v_key, 13)::date;
        IF v_chest_date NOT IN ((now() AT TIME ZONE 'UTC')::date, (now() AT TIME ZONE 'Asia/Kolkata')::date) THEN
            RETURN jsonb_build_object('granted', false, 'already_claimed', false, 'amount', 0,
                                      'reason', 'invalid_chest_date');
        END IF;
    END IF;

    -- Lock the profile row for update
    SELECT gems INTO v_balance FROM public.profiles WHERE id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Check idempotency
    IF EXISTS (SELECT 1 FROM public.reward_claims WHERE user_id = v_uid AND claim_key = v_key) THEN
        RETURN jsonb_build_object('granted', false, 'already_claimed', true, 'already_completed', true,
                                  'amount', 0, 'new_balance', v_balance, 'gems', v_balance);
    END IF;

    v_amount := LEAST(v_amount, v_max_claim);

    SELECT COALESCE(SUM(amount), 0) INTO v_earned_today
      FROM public.reward_claims
     WHERE user_id = v_uid AND source = 'challenge' AND created_at >= v_day_start;

    IF v_earned_today >= v_daily_cap THEN
        RETURN jsonb_build_object('granted', false, 'already_claimed', false, 'amount', 0,
                                  'reason', 'daily_cap_reached', 'new_balance', v_balance, 'gems', v_balance);
    END IF;
    v_amount := LEAST(v_amount, v_daily_cap - v_earned_today);

    INSERT INTO public.reward_claims (user_id, claim_key, amount, source)
    VALUES (v_uid, v_key, v_amount, 'challenge');

    IF v_amount > 0 THEN
        PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
        UPDATE public.profiles
           SET gems = gems + v_amount,
               weekly_xp = weekly_xp + v_amount
         WHERE id = v_uid
        RETURNING gems INTO v_balance;
        PERFORM set_config('app.trusted_reward_write', 'off', TRUE);
    END IF;

    RETURN jsonb_build_object('granted', true, 'already_claimed', false, 'amount', v_amount,
                              'new_balance', v_balance, 'gems', v_balance);
END;
$$;

-- Overload for p_metadata signature
CREATE OR REPLACE FUNCTION public.complete_challenge(
    p_challenge_id  TEXT,
    p_metadata      JSONB,
    p_reward_amount INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.complete_challenge(
        p_challenge_id => p_challenge_id,
        p_reward_gems => p_reward_amount,
        p_metadata => p_metadata,
        p_reward_amount => p_reward_amount
    );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_challenge(TEXT, INTEGER, INTEGER, TEXT, JSONB, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_challenge(TEXT, INTEGER, INTEGER, TEXT, JSONB, INTEGER) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.complete_challenge(TEXT, JSONB, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_challenge(TEXT, JSONB, INTEGER) TO authenticated, service_role;

-- 4. claim_spin_reward RPC ---------------------------------------------------
DROP FUNCTION IF EXISTS public.claim_spin_reward(TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.claim_spin_reward(
    p_spin_reference TEXT,
    p_reward_gems    INTEGER,
    p_email          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          UUID    := auth.uid();
    v_ref          TEXT    := btrim(COALESCE(p_spin_reference, ''));
    v_amount       INTEGER := COALESCE(p_reward_gems, 0);
    -- Include slices from both default wheel and AI missions wheel
    v_allowed      CONSTANT INTEGER[] := ARRAY[50, 100, 120, 150, 180, 200, 220, 250, 300, 500, 1000];
    v_daily_limit  CONSTANT INTEGER := 3;
    v_today        DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
    v_claims_today INTEGER;
    v_balance      INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        IF p_email IS NOT NULL THEN
            SELECT id INTO v_uid FROM public.profiles WHERE email = lower(btrim(p_email));
        END IF;
    END IF;

    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF v_ref = '' OR length(v_ref) > 255 THEN
        RAISE EXCEPTION 'Invalid spin reference.' USING ERRCODE = '22023';
    END IF;

    SELECT gems INTO v_balance FROM public.profiles WHERE id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    IF NOT (v_amount = ANY (v_allowed)) THEN
        RETURN jsonb_build_object('granted', false, 'already_claimed', false, 'amount', 0,
                                  'reason', 'invalid_reward', 'new_balance', v_balance, 'gems', v_balance);
    END IF;

    -- Single-use reference check
    IF EXISTS (SELECT 1 FROM public.spin_wheel_claims WHERE spin_reference = v_ref) THEN
        RETURN jsonb_build_object('granted', false, 'already_claimed', true, 'amount', 0,
                                  'new_balance', v_balance, 'gems', v_balance);
    END IF;

    SELECT COUNT(*) INTO v_claims_today
      FROM public.spin_wheel_claims
     WHERE user_id = v_uid::text
       AND (claimed_at AT TIME ZONE 'Asia/Kolkata')::date = v_today;

    IF v_claims_today >= v_daily_limit THEN
        RETURN jsonb_build_object('granted', false, 'already_claimed', false, 'amount', 0,
                                  'reason', 'daily_spin_limit', 'new_balance', v_balance, 'gems', v_balance);
    END IF;

    INSERT INTO public.spin_wheel_claims (user_id, spin_reference, reward_gems)
    VALUES (v_uid::text, v_ref, v_amount);

    PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
    UPDATE public.profiles
       SET gems = gems + v_amount,
           weekly_xp = weekly_xp + v_amount
     WHERE id = v_uid
    RETURNING gems INTO v_balance;
    PERFORM set_config('app.trusted_reward_write', 'off', TRUE);

    RETURN jsonb_build_object('granted', true, 'already_claimed', false, 'amount', v_amount,
                              'new_balance', v_balance, 'gems', v_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_spin_reward(TEXT, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_spin_reward(TEXT, INTEGER, TEXT) TO authenticated, service_role;

-- 5. redeem_gems RPC (Store Purchases & Energy Refill) -----------------------
DROP FUNCTION IF EXISTS public.redeem_gems(INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.redeem_gems(
    p_amount  INTEGER,
    p_item_id TEXT DEFAULT 'item',
    p_reason  TEXT DEFAULT 'Purchase',
    p_email   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid     UUID    := auth.uid();
    v_cost    INTEGER := GREATEST(0, COALESCE(p_amount, 0));
    v_balance INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        IF p_email IS NOT NULL THEN
            SELECT id INTO v_uid FROM public.profiles WHERE email = lower(btrim(p_email));
        END IF;
    END IF;

    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT gems INTO v_balance FROM public.profiles WHERE id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_balance < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'new_balance', v_balance,
            'gems', v_balance,
            'message', 'Insufficient cookies balance'
        );
    END IF;

    PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
    UPDATE public.profiles
       SET gems = gems - v_cost
     WHERE id = v_uid
    RETURNING gems INTO v_balance;
    PERFORM set_config('app.trusted_reward_write', 'off', TRUE);

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_balance,
        'gems', v_balance,
        'deducted', v_cost,
        'message', 'Cookies redeemed successfully'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_gems(INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_gems(INTEGER, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 6. record_streak_activity RPC ----------------------------------------------
DROP FUNCTION IF EXISTS public.record_streak_activity(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.record_streak_activity(
    p_activity_id TEXT,
    p_email       TEXT DEFAULT NULL,
    p_user_id     UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           UUID := COALESCE(auth.uid(), p_user_id);
    v_today_str     TEXT := to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');
    v_yest_str      TEXT := to_char((now() AT TIME ZONE 'Asia/Kolkata') - interval '1 day', 'YYYY-MM-DD');
    v_streak        INTEGER;
    v_best_streak   INTEGER;
    v_last_date     TEXT;
BEGIN
    IF v_uid IS NULL AND p_email IS NOT NULL THEN
        SELECT id INTO v_uid FROM public.profiles WHERE email = lower(btrim(p_email));
    END IF;

    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT streak, best_streak, last_streak_date
      INTO v_streak, v_best_streak, v_last_date
      FROM public.profiles
     WHERE id = v_uid
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    v_streak := COALESCE(v_streak, 0);
    v_best_streak := COALESCE(v_best_streak, 0);

    -- If already completed activity today, keep streak as is
    IF v_last_date = v_today_str THEN
        v_streak := GREATEST(1, v_streak);
    -- If practiced yesterday, increment streak
    ELSIF v_last_date = v_yest_str THEN
        v_streak := v_streak + 1;
    -- Gap > 1 day or first activity: start streak at 1
    ELSE
        v_streak := 1;
    END IF;

    v_best_streak := GREATEST(v_best_streak, v_streak);

    PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
    UPDATE public.profiles
       SET streak = v_streak,
           best_streak = v_best_streak,
           last_streak_date = v_today_str
     WHERE id = v_uid;
    PERFORM set_config('app.trusted_reward_write', 'off', TRUE);

    RETURN jsonb_build_object(
        'success', true,
        'streak', v_streak,
        'best_streak', v_best_streak,
        'last_streak_date', v_today_str
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_streak_activity(TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_streak_activity(TEXT, TEXT, UUID) TO authenticated, service_role;

-- 7. validate_streak_on_login RPC --------------------------------------------
DROP FUNCTION IF EXISTS public.validate_streak_on_login(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.validate_streak_on_login(
    p_user_id UUID DEFAULT NULL,
    p_email   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           UUID := COALESCE(auth.uid(), p_user_id);
    v_today_str     TEXT := to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');
    v_yest_str      TEXT := to_char((now() AT TIME ZONE 'Asia/Kolkata') - interval '1 day', 'YYYY-MM-DD');
    v_streak        INTEGER;
    v_best_streak   INTEGER;
    v_last_date     TEXT;
    v_was_reset     BOOLEAN := FALSE;
BEGIN
    IF v_uid IS NULL AND p_email IS NOT NULL THEN
        SELECT id INTO v_uid FROM public.profiles WHERE email = lower(btrim(p_email));
    END IF;

    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'streak', 0, 'best_streak', 0, 'was_reset', false);
    END IF;

    SELECT streak, best_streak, last_streak_date
      INTO v_streak, v_best_streak, v_last_date
      FROM public.profiles
     WHERE id = v_uid;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'streak', 0, 'best_streak', 0, 'was_reset', false);
    END IF;

    v_streak := COALESCE(v_streak, 0);
    v_best_streak := COALESCE(v_best_streak, 0);

    -- If user missed yesterday, streak resets to 0 until they complete an activity
    IF v_last_date IS NOT NULL AND v_last_date <> v_today_str AND v_last_date <> v_yest_str THEN
        IF v_streak > 0 THEN
            v_streak := 0;
            v_was_reset := TRUE;
            PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
            UPDATE public.profiles SET streak = 0 WHERE id = v_uid;
            PERFORM set_config('app.trusted_reward_write', 'off', TRUE);
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'streak', v_streak,
        'best_streak', v_best_streak,
        'last_streak_date', v_last_date,
        'was_reset', v_was_reset
    );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_streak_on_login(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_streak_on_login(UUID, TEXT) TO authenticated, service_role;
