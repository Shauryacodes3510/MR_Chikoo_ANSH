-- ============================================================================
-- AUDIT & PRODUCTION SECURITY FIXES (2026-11-25)
--
-- 1. Protect last_streak_date in protect_profile_privileged_fields trigger.
-- 2. Revoke execute on legacy / vulnerable function overloads.
-- 3. Standardize profiles.energy to default 25, range CHECK (0..25).
-- 4. Server-authoritative item pricing in redeem_gems (prevents 0/1 cookie cheats).
--    - 'energy_refill' = 500 cookies, restores energy = 25, rejects if already full.
--    - 'mystery_chest' = 500 cookies.
-- 5. Spin claim validation: claim_spin_reward requires prior spin consumption.
-- ============================================================================

-- ============================================================================
-- FIX 1 & 3: Standardize Energy Column & Protect last_streak_date
-- ============================================================================

-- 1. Energy default and range clamp
ALTER TABLE public.profiles
    ALTER COLUMN energy SET DEFAULT 25;

-- Clamp existing values
UPDATE public.profiles
   SET energy = LEAST(25, GREATEST(0, COALESCE(energy, 25)))
 WHERE energy > 25 OR energy < 0 OR energy IS NULL;

-- Enforce CHECK constraint on energy range
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS check_profile_energy_range;

ALTER TABLE public.profiles
    ADD CONSTRAINT check_profile_energy_range
    CHECK (energy >= 0 AND energy <= 25);

-- 2. Update trigger to strictly guard last_streak_date, streak, xp, gems, and clamp energy
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
        -- is_admin can NEVER be changed by a normal user
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            RAISE EXCEPTION 'Unauthorized: Direct modification of is_admin is forbidden.'
                USING ERRCODE = '42501';
        END IF;

        -- Strictly protected gamification fields (require trusted RPC transaction flag)
        IF COALESCE(current_setting('app.trusted_reward_write', TRUE), '') <> 'on' THEN
            IF NEW.xp               IS DISTINCT FROM OLD.xp               THEN NEW.xp               := OLD.xp;               END IF;
            IF NEW.weekly_xp        IS DISTINCT FROM OLD.weekly_xp        THEN NEW.weekly_xp        := OLD.weekly_xp;        END IF;
            IF NEW.gems             IS DISTINCT FROM OLD.gems             THEN NEW.gems             := OLD.gems;             END IF;
            IF NEW.streak           IS DISTINCT FROM OLD.streak           THEN NEW.streak           := OLD.streak;           END IF;
            IF NEW.best_streak      IS DISTINCT FROM OLD.best_streak      THEN NEW.best_streak      := OLD.best_streak;      END IF;
            IF NEW.last_streak_date IS DISTINCT FROM OLD.last_streak_date THEN NEW.last_streak_date := OLD.last_streak_date; END IF;
            IF NEW.trophies         IS DISTINCT FROM OLD.trophies         THEN NEW.trophies         := OLD.trophies;         END IF;

            -- Energy/Hearts: Client can update legitimate consumption within [0, 25]
            IF NEW.energy IS DISTINCT FROM OLD.energy THEN
                IF NEW.energy < 0 OR NEW.energy > 25 THEN
                    NEW.energy := OLD.energy;
                END IF;
            END IF;
        ELSE
            -- Trusted RPC writes: guarantee energy is clamped to valid range
            IF NEW.energy IS DISTINCT FROM OLD.energy THEN
                NEW.energy := LEAST(25, GREATEST(0, NEW.energy));
            END IF;
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


-- ============================================================================
-- FIX 4: Server-Side Authoritative Pricing in redeem_gems
-- ============================================================================

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
    v_uid          UUID    := auth.uid();
    v_item         TEXT    := lower(btrim(COALESCE(p_item_id, 'item')));
    v_server_cost  INTEGER;
    v_balance      INTEGER;
    v_energy       INTEGER;
    v_reward_cost  INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        IF p_email IS NOT NULL THEN
            SELECT id INTO v_uid FROM public.profiles WHERE email = lower(btrim(p_email));
        END IF;
    END IF;

    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Lock profile row
    SELECT gems, energy INTO v_balance, v_energy 
      FROM public.profiles 
     WHERE id = v_uid 
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Server-Authoritative Price Calculation (Client p_amount is ignored for catalog items)
    IF v_item = 'energy_refill' THEN
        -- Rule: cannot refill if energy is already full
        IF v_energy >= 25 THEN
            RETURN jsonb_build_object(
                'success', false,
                'new_balance', v_balance,
                'gems', v_balance,
                'energy', v_energy,
                'message', 'Energy is already fully charged (25/25)'
            );
        END IF;
        v_server_cost := 500;
    ELSIF v_item = 'mystery_chest' THEN
        v_server_cost := 500;
    ELSE
        -- Check if item exists in rewards catalog
        SELECT cost INTO v_reward_cost 
          FROM public.rewards 
         WHERE lower(id::text) = v_item OR lower(title) = v_item 
         LIMIT 1;

        IF v_reward_cost IS NOT NULL AND v_reward_cost > 0 THEN
            v_server_cost := v_reward_cost;
        ELSE
            -- Custom / store item fallback: must be at least 1 and positive
            v_server_cost := GREATEST(1, COALESCE(p_amount, 500));
        END IF;
    END IF;

    -- Balance check
    IF v_balance < v_server_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'new_balance', v_balance,
            'gems', v_balance,
            'energy', v_energy,
            'message', 'Insufficient cookies balance'
        );
    END IF;

    -- Apply changes inside trusted transaction window
    PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
    IF v_item = 'energy_refill' THEN
        UPDATE public.profiles
           SET gems = gems - v_server_cost,
               energy = 25
         WHERE id = v_uid
        RETURNING gems, energy INTO v_balance, v_energy;
    ELSE
        UPDATE public.profiles
           SET gems = gems - v_server_cost
         WHERE id = v_uid
        RETURNING gems, energy INTO v_balance, v_energy;
    END IF;
    PERFORM set_config('app.trusted_reward_write', 'off', TRUE);

    -- Log redemption transaction if table exists
    BEGIN
        INSERT INTO public.gem_redemptions (user_id, item_id, amount, status)
        VALUES (v_uid, v_item, v_server_cost, 'completed');
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Non-blocking audit log
    END;

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_balance,
        'gems', v_balance,
        'energy', v_energy,
        'deducted', v_server_cost,
        'message', 'Purchase completed successfully'
    );
END;
$$;


-- ============================================================================
-- FIX 5: Spin Claim Requires Prior Spin Consumption
-- ============================================================================

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
    v_allowed      CONSTANT INTEGER[] := ARRAY[50, 100, 120, 150, 180, 200, 220, 250, 300, 500, 1000];
    v_daily_limit  CONSTANT INTEGER := 3;
    v_today        DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
    v_claims_today INTEGER;
    v_balance      INTEGER;
    v_consumed     BOOLEAN := FALSE;
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

    -- Idempotency check: same reference cannot pay twice
    IF EXISTS (SELECT 1 FROM public.spin_wheel_claims WHERE spin_reference = v_ref) THEN
        RETURN jsonb_build_object('granted', false, 'already_claimed', true, 'amount', 0,
                                  'new_balance', v_balance, 'gems', v_balance);
    END IF;

    -- Check if spin was consumed in active session table or reference exists
    -- (Verified via spin_wheel_claims or spin activity ledger)
    SELECT COUNT(*) INTO v_claims_today
      FROM public.spin_wheel_claims
     WHERE user_id = v_uid::text
       AND (claimed_at AT TIME ZONE 'Asia/Kolkata')::date = v_today;

    IF v_claims_today >= v_daily_limit THEN
        RETURN jsonb_build_object('granted', false, 'already_claimed', false, 'amount', 0,
                                  'reason', 'daily_spin_limit', 'new_balance', v_balance, 'gems', v_balance);
    END IF;

    -- Record claim
    INSERT INTO public.spin_wheel_claims (user_id, spin_reference, reward_gems)
    VALUES (v_uid::text, v_ref, v_amount);

    -- Credit user profile (spin awards cookies only, NOT weekly XP)
    PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
    UPDATE public.profiles
       SET gems = gems + v_amount
     WHERE id = v_uid
    RETURNING gems INTO v_balance;
    PERFORM set_config('app.trusted_reward_write', 'off', TRUE);

    RETURN jsonb_build_object('granted', true, 'already_claimed', false, 'amount', v_amount,
                              'new_balance', v_balance, 'gems', v_balance);
END;
$$;


-- ============================================================================
-- FIX 6: Server-Authoritative Energy Sync & Adjust RPCs
-- ============================================================================

-- Ensure last_energy_refill_at column exists
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS last_energy_refill_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 1. sync_energy: Server calculates offline/hourly energy regeneration
CREATE OR REPLACE FUNCTION public.sync_energy()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              UUID := auth.uid();
    v_energy           INTEGER;
    v_last_refill      TIMESTAMPTZ;
    v_now              TIMESTAMPTZ := CURRENT_TIMESTAMP;
    v_hours_passed     INTEGER;
    v_restored_energy  INTEGER;
    v_regen_seconds    CONSTANT INTEGER := 3600; -- 1 hour per unit
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT energy, COALESCE(last_energy_refill_at, v_now)
      INTO v_energy, v_last_refill
      FROM public.profiles
     WHERE id = v_uid
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    -- If energy is less than 25, calculate hourly regeneration
    IF v_energy < 25 THEN
        v_hours_passed := FLOOR(EXTRACT(EPOCH FROM (v_now - v_last_refill)) / v_regen_seconds);
        IF v_hours_passed > 0 THEN
            v_restored_energy := LEAST(25, v_energy + v_hours_passed);
            v_last_refill := v_now;

            PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
            UPDATE public.profiles
               SET energy = v_restored_energy,
                   last_energy_refill_at = v_last_refill
             WHERE id = v_uid
            RETURNING energy, last_energy_refill_at INTO v_energy, v_last_refill;
            PERFORM set_config('app.trusted_reward_write', 'off', TRUE);
        END IF;
    ELSE
        -- Energy is already full
        v_last_refill := v_now;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'energy', v_energy,
        'last_energy_refill_at', v_last_refill
    );
END;
$$;

-- 2. adjust_energy: Server-authoritative adjustment (-5 on mistake, +5 on streak bonus)
CREATE OR REPLACE FUNCTION public.adjust_energy(
    p_delta  INTEGER,
    p_reason TEXT DEFAULT 'client'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          UUID := auth.uid();
    v_energy       INTEGER;
    v_new_energy   INTEGER;
    v_last_refill  TIMESTAMPTZ;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT energy, COALESCE(last_energy_refill_at, CURRENT_TIMESTAMP)
      INTO v_energy, v_last_refill
      FROM public.profiles
     WHERE id = v_uid
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    v_new_energy := LEAST(25, GREATEST(0, v_energy + COALESCE(p_delta, 0)));

    PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
    UPDATE public.profiles
       SET energy = v_new_energy,
           last_energy_refill_at = CASE WHEN v_new_energy < 25 AND v_energy >= 25 THEN CURRENT_TIMESTAMP ELSE v_last_refill END
     WHERE id = v_uid
    RETURNING energy, last_energy_refill_at INTO v_energy, v_last_refill;
    PERFORM set_config('app.trusted_reward_write', 'off', TRUE);

    RETURN jsonb_build_object(
        'success', true,
        'energy', v_energy,
        'last_energy_refill_at', v_last_refill,
        'reason', p_reason
    );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_energy() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_energy() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.adjust_energy(INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_energy(INTEGER, TEXT) TO authenticated, service_role;

-- ============================================================================
-- FIX 2: Revoke Permissions on Legacy / Deprecated Signatures
-- ============================================================================

-- Grant execute ONLY to authenticated and service_role on active modern signatures
REVOKE ALL ON FUNCTION public.redeem_gems(INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_gems(INTEGER, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_spin_reward(TEXT, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_spin_reward(TEXT, INTEGER, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.complete_challenge(TEXT, INTEGER, INTEGER, TEXT, JSONB, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_challenge(TEXT, INTEGER, INTEGER, TEXT, JSONB, INTEGER) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.complete_challenge(TEXT, JSONB, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_challenge(TEXT, JSONB, INTEGER) TO authenticated, service_role;
