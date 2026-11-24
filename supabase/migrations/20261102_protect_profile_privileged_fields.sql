-- ============================================================================
-- MIGRATION: Protect Profile Privileged Fields & Prevent Privilege Escalation
-- Target: Supabase / PostgreSQL (public.profiles)
-- ============================================================================

-- Function to validate profile updates and prevent unauthorized privilege escalation
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_service_or_admin BOOLEAN := FALSE;
BEGIN
    -- 1. Check if execution is from service_role
    IF auth.role() = 'service_role' THEN
        is_service_or_admin := TRUE;
    -- 2. Check if current authenticated user has confirmed admin role
    ELSIF auth.uid() IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
            is_service_or_admin := TRUE;
        END IF;
    END IF;

    -- 3. Enforce strict restrictions if caller is not service role or administrator
    IF NOT is_service_or_admin THEN
        -- Strictly forbid ordinary users from modifying is_admin
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            RAISE EXCEPTION 'Unauthorized: Direct modification of is_admin is forbidden.'
                USING ERRCODE = '42501';
        END IF;

        -- Prevent unauthorized direct mutation of reward currency and progression balances.
        -- Revert to previous confirmed values if a client attempt is made.
        IF NEW.xp IS DISTINCT FROM OLD.xp THEN
            NEW.xp := OLD.xp;
        END IF;
        IF NEW.weekly_xp IS DISTINCT FROM OLD.weekly_xp THEN
            NEW.weekly_xp := OLD.weekly_xp;
        END IF;
        IF NEW.gems IS DISTINCT FROM OLD.gems THEN
            NEW.gems := OLD.gems;
        END IF;
        IF NEW.streak IS DISTINCT FROM OLD.streak THEN
            NEW.streak := OLD.streak;
        END IF;
        IF NEW.best_streak IS DISTINCT FROM OLD.best_streak THEN
            NEW.best_streak := OLD.best_streak;
        END IF;
        IF NEW.energy IS DISTINCT FROM OLD.energy THEN
            NEW.energy := OLD.energy;
        END IF;
        IF NEW.trophies IS DISTINCT FROM OLD.trophies THEN
            NEW.trophies := OLD.trophies;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to public.profiles
DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileged_fields();
