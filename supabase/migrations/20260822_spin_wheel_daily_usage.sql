-- ============================================================================
-- MIGRATION: Spin Wheel Daily Limit (3 spins per user per day)
-- Target: Supabase / PostgreSQL
-- Timezone: Asia/Kolkata (Daily Reset at 00:00 IST)
-- ============================================================================

-- 1. Create spin_wheel_daily_usage table
CREATE TABLE IF NOT EXISTS public.spin_wheel_daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    usage_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,
    spins_used INTEGER NOT NULL DEFAULT 0 CHECK (spins_used >= 0 AND spins_used <= 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_spin_wheel_daily_usage UNIQUE (user_id, usage_date)
);

-- Index for high-performance daily lookups and locks
CREATE INDEX IF NOT EXISTS idx_spin_wheel_daily_usage_lookup 
    ON public.spin_wheel_daily_usage(user_id, usage_date);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_spin_wheel_daily_usage_updated_at ON public.spin_wheel_daily_usage;
CREATE TRIGGER trg_update_spin_wheel_daily_usage_updated_at
    BEFORE UPDATE ON public.spin_wheel_daily_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.spin_wheel_daily_usage ENABLE ROW LEVEL SECURITY;

-- Allow users to only SELECT their own daily usage records
DROP POLICY IF EXISTS "Users can read their own spin usage" ON public.spin_wheel_daily_usage;
CREATE POLICY "Users can read their own spin usage"
    ON public.spin_wheel_daily_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Note: No INSERT, UPDATE, or DELETE policies are granted to authenticated or anon roles.
-- Spin consumption is strictly handled by the SECURITY DEFINER RPCs below.

-- 3. Ensure existing spin_wheel_claims table exists
CREATE TABLE IF NOT EXISTS public.spin_wheel_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    spin_reference VARCHAR(255) UNIQUE NOT NULL,
    reward_gems INTEGER NOT NULL DEFAULT 0,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spin_wheel_claims_ref ON public.spin_wheel_claims(spin_reference);

-- 4. RPC 1: get_spin_wheel_daily_status()
-- Returns limit (3), used, remaining, canSpin for the current user and Asia/Kolkata date
CREATE OR REPLACE FUNCTION public.get_spin_wheel_daily_status(
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
    v_spins_used INT := 0;
    v_daily_limit CONSTANT INT := 3;
BEGIN
    -- 1. Identify target user
    v_user_id := auth.uid();
    IF v_user_id IS NULL AND p_user_id IS NOT NULL THEN
        v_user_id := p_user_id;
    END IF;
    IF v_user_id IS NULL AND p_email IS NOT NULL AND p_email <> '' THEN
        SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(p_email)) LIMIT 1;
        IF v_user_id IS NULL THEN
            SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = LOWER(TRIM(p_email)) LIMIT 1;
        END IF;
    END IF;

    -- 2. Compute date in Asia/Kolkata timezone
    v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

    -- 3. Query usage if user is identified
    IF v_user_id IS NOT NULL THEN
        SELECT COALESCE(spins_used, 0) INTO v_spins_used
        FROM public.spin_wheel_daily_usage
        WHERE user_id = v_user_id AND usage_date = v_today;

        IF v_spins_used IS NULL THEN
            v_spins_used := 0;
        END IF;
    END IF;

    -- 4. Return status JSON
    RETURN jsonb_build_object(
        'limit', v_daily_limit,
        'used', v_spins_used,
        'remaining', GREATEST(0, v_daily_limit - v_spins_used),
        'canSpin', (v_spins_used < v_daily_limit),
        'can_spin', (v_spins_used < v_daily_limit),
        'usage_date', v_today,
        'timezone', 'Asia/Kolkata'
    );
END;
$$;

-- 5. RPC 2: consume_spin_wheel()
-- Atomically locks row, verifies spins_used < 3, increments count, and returns updated status
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
    -- 1. Identify target user
    v_user_id := auth.uid();
    IF v_user_id IS NULL AND p_user_id IS NOT NULL THEN
        v_user_id := p_user_id;
    END IF;
    IF v_user_id IS NULL AND p_email IS NOT NULL AND p_email <> '' THEN
        SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(p_email)) LIMIT 1;
        IF v_user_id IS NULL THEN
            SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = LOWER(TRIM(p_email)) LIMIT 1;
        END IF;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required or valid user identifier must be provided.'
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

-- Grant EXECUTE privileges on the RPC functions to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.get_spin_wheel_daily_status(UUID, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.consume_spin_wheel(UUID, TEXT) TO authenticated, anon, service_role;
