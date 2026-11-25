-- ============================================================================
-- FIX: Energy & Hearts System (Standardize to 5 Hearts / 25 Units)
--
-- 1. Alters DEFAULT energy on public.profiles to 25 (5 hearts * 5 units/heart).
-- 2. Clamps any existing user energy > 25 down to 25.
-- 3. Updates `protect_profile_privileged_fields` trigger to allow student
--    updates to `energy` as long as 0 <= energy <= 25 (so mistakes deduct 5,
--    streaks grant 5, offline recharges work, and cheats > 25 are blocked).
-- 4. Updates `redeem_gems` RPC so buying 'energy_refill' sets energy = 25.
-- ============================================================================

-- 1. Update column default & clamp existing rows
ALTER TABLE public.profiles
    ALTER COLUMN energy SET DEFAULT 25;

UPDATE public.profiles
   SET energy = LEAST(25, GREATEST(0, COALESCE(energy, 25)))
 WHERE energy > 25 OR energy IS NULL;

-- 2. Update trigger to allow legitimate client energy writes (0..25)
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

        -- Strictly protected gamification fields (require trusted RPC)
        IF COALESCE(current_setting('app.trusted_reward_write', TRUE), '') <> 'on' THEN
            IF NEW.xp          IS DISTINCT FROM OLD.xp          THEN NEW.xp          := OLD.xp;          END IF;
            IF NEW.weekly_xp   IS DISTINCT FROM OLD.weekly_xp   THEN NEW.weekly_xp   := OLD.weekly_xp;   END IF;
            IF NEW.gems        IS DISTINCT FROM OLD.gems        THEN NEW.gems        := OLD.gems;        END IF;
            IF NEW.streak      IS DISTINCT FROM OLD.streak      THEN NEW.streak      := OLD.streak;      END IF;
            IF NEW.best_streak IS DISTINCT FROM OLD.best_streak THEN NEW.best_streak := OLD.best_streak; END IF;
            IF NEW.last_streak_date IS DISTINCT FROM OLD.last_streak_date THEN NEW.last_streak_date := OLD.last_streak_date; END IF;
            IF NEW.trophies    IS DISTINCT FROM OLD.trophies    THEN NEW.trophies    := OLD.trophies;    END IF;

            -- Energy/Hearts: Client can update within [0, 25].
            -- Any attempt to set negative or exceed 25 is reverted to OLD.energy.
            IF NEW.energy IS DISTINCT FROM OLD.energy THEN
                IF NEW.energy < 0 OR NEW.energy > 25 THEN
                    NEW.energy := OLD.energy;
                END IF;
            END IF;
        ELSE
            -- Trusted RPC writes: clamp energy to [0, 25]
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

-- 3. Update redeem_gems to refill energy to 25 on 'energy_refill'
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
    v_uid      UUID    := auth.uid();
    v_cost     INTEGER := GREATEST(0, COALESCE(p_amount, 0));
    v_balance  INTEGER;
    v_energy   INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        IF p_email IS NOT NULL THEN
            SELECT id INTO v_uid FROM public.profiles WHERE email = lower(btrim(p_email));
        END IF;
    END IF;

    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT gems, energy INTO v_balance, v_energy FROM public.profiles WHERE id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_balance < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'new_balance', v_balance,
            'gems', v_balance,
            'energy', v_energy,
            'message', 'Insufficient cookies balance'
        );
    END IF;

    PERFORM set_config('app.trusted_reward_write', 'on', TRUE);
    IF p_item_id = 'energy_refill' THEN
        UPDATE public.profiles
           SET gems = gems - v_cost,
               energy = 25
         WHERE id = v_uid
        RETURNING gems, energy INTO v_balance, v_energy;
    ELSE
        UPDATE public.profiles
           SET gems = gems - v_cost
         WHERE id = v_uid
        RETURNING gems, energy INTO v_balance, v_energy;
    END IF;
    PERFORM set_config('app.trusted_reward_write', 'off', TRUE);

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_balance,
        'gems', v_balance,
        'energy', v_energy,
        'deducted', v_cost,
        'message', 'Cookies redeemed successfully'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_gems(INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_gems(INTEGER, TEXT, TEXT, TEXT) TO authenticated, service_role;
