-- ============================================================================
-- AIBO - AI LEARNING JOURNEY DATABASE SCHEMA
-- Compatible with PostgreSQL / Supabase
-- Target Systems: User Management, Student Intelligence Hub, Analytics,
--                 Curriculum/Learning Paths, and Subscriptions.
-- ============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- ============================================================================

-- Reusable trigger function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 2. USER MANAGEMENT SYSTEM
-- ============================================================================

-- Master users list for authentication and platform-wide role management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255), -- Securely stored salt & hash for native auth
    role VARCHAR(50) DEFAULT 'student' NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Profiles table tracking student progression, gamification points, and preferences
-- Aligned exactly with SupabaseUserProfile from the application runtime context
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL CHECK (xp >= 0),
    weekly_xp INTEGER DEFAULT 0 NOT NULL CHECK (weekly_xp >= 0),
    gems INTEGER DEFAULT 50 NOT NULL CHECK (gems >= 0),
    streak INTEGER DEFAULT 0 NOT NULL CHECK (streak >= 0),
    energy INTEGER DEFAULT 50 NOT NULL CHECK (energy >= 0),
    accuracy NUMERIC(5, 2) DEFAULT 1.00 NOT NULL CHECK (accuracy >= 0.00 AND accuracy <= 1.00),
    avatar_id VARCHAR(50) DEFAULT 'user' NOT NULL,
    theme_id VARCHAR(50) DEFAULT 'blue' NOT NULL,
    best_streak INTEGER DEFAULT 0 NOT NULL CHECK (best_streak >= 0),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    total_chests_claimed INTEGER DEFAULT 0 NOT NULL CHECK (total_chests_claimed >= 0),
    total_steps_claimed INTEGER DEFAULT 0 NOT NULL CHECK (total_steps_claimed >= 0),
    trophies INTEGER DEFAULT 45 NOT NULL CHECK (trophies >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_chest_claimed_at TIMESTAMP WITH TIME ZONE,
    welcome_video_seen BOOLEAN DEFAULT FALSE NOT NULL
);

-- Idempotent column addition for existing deployments
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_video_seen BOOLEAN DEFAULT FALSE;



-- ============================================================================
-- 3. CURRICULUM & LEARNING PATHS SYSTEM
-- ============================================================================

-- Modules correspond to high-level biomes/units in the Aibo game journey
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'Sparkles' NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    is_practice BOOLEAN DEFAULT FALSE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Learning Paths contain courses or target streams of curricula
CREATE TABLE IF NOT EXISTS learning_paths (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module_id VARCHAR(100) REFERENCES modules(id) ON DELETE SET NULL,
    difficulty_level VARCHAR(50) DEFAULT 'Beginner' NOT NULL CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Individual lessons aligned with SupabaseLesson and lesson session logic
CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(100) PRIMARY KEY,
    module_id VARCHAR(100) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    learning_path_id VARCHAR(100) REFERENCES learning_paths(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50) DEFAULT 'Easy' NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    xp_reward INTEGER DEFAULT 100 NOT NULL CHECK (xp_reward >= 0),
    challenges JSONB DEFAULT '[]'::jsonb NOT NULL, -- Structured JSON array containing interactive challenges & questions
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Dedicated database-driven learning paths table storing the ordered list of nodes for each module
CREATE TABLE IF NOT EXISTS module_learning_path (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id VARCHAR(100) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('lesson', 'challenge', 'treasure')),
    node_id VARCHAR(100) NOT NULL,
    lane VARCHAR(50) DEFAULT 'center' NOT NULL CHECK (lane IN ('left', 'center', 'right')),
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_module_learning_path_module_id ON module_learning_path(module_id);
CREATE INDEX IF NOT EXISTS idx_module_learning_path_sort_order ON module_learning_path(sort_order);


-- ============================================================================
-- 4. STUDENT RELATIONSHIPS & GAMEPLAY PROGRESSION
-- ============================================================================

-- Relational table mapping lessons bookmarked by students
CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id VARCHAR(100) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own bookmarks" ON public.user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookmarks" ON public.user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON public.user_bookmarks FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to bookmarks" ON public.user_bookmarks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Core progress logs tracking complete, ongoing, or abandoned lessons
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id VARCHAR(100) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    completion_percentage INTEGER DEFAULT 0 NOT NULL CHECK (completion_percentage BETWEEN 0 AND 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own progress" ON public.user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_lesson_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access to progress" ON public.user_lesson_progress FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- ============================================================================
-- 5. STUDENT INTELLIGENCE HUB & ANALYTICS SYSTEMS
-- ============================================================================

-- Intelligence table storing student-specific performance traits, risk alerts, and calculated habits
CREATE TABLE IF NOT EXISTS user_intelligence_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accuracy_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL CHECK (accuracy_rate >= 0.00 AND accuracy_rate <= 100.00),
    retention_score INTEGER DEFAULT 0 NOT NULL CHECK (retention_score BETWEEN 0 AND 100),
    risk_score INTEGER DEFAULT 0 NOT NULL CHECK (risk_score BETWEEN 0 AND 100), -- Alerts admins of high risk of student dropping off
    favorite_feature VARCHAR(100) DEFAULT 'None' NOT NULL,
    traits TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Stores dynamic flags like 'Practice Heavy', 'Morning Learner' etc.
    total_sessions INTEGER DEFAULT 0 NOT NULL CHECK (total_sessions >= 0),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.user_intelligence_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own intelligence" ON public.user_intelligence_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own intelligence" ON public.user_intelligence_metrics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access to intelligence" ON public.user_intelligence_metrics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Analytics event logging table for continuous behavior tracking (corresponds to AnalyticsEvent in TS engine)
CREATE TABLE IF NOT EXISTS analytics_events (
    id VARCHAR(100) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb NOT NULL, -- Nested hardware metadata, geolocations, and activity attributes
    browser VARCHAR(100),
    platform VARCHAR(100),
    screen_resolution VARCHAR(50),
    timezone VARCHAR(100),
    language VARCHAR(50),
    device_information TEXT,
    internet_speed VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100)
);


-- ============================================================================
-- 6. SUBSCRIPTIONS & CELEBRATIONS
-- ============================================================================

-- Subscription tracker for school or premium personal Space Plus memberships
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier VARCHAR(50) DEFAULT 'free' NOT NULL CHECK (tier IN ('free', 'space_plus', 'premium')),
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Active micro-celebration animations and effects unlocked via admin or streak goals
CREATE TABLE IF NOT EXISTS celebrations (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    animation VARCHAR(100) NOT NULL,
    asset_url TEXT DEFAULT 'default' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- ============================================================================
-- 7. PERFORMANCE TUNING INDEXES
-- ============================================================================

-- Indexes for lightning fast lookups during user sessions & admin intelligence reports
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_learning_path_id ON lessons(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intelligence_metrics_user_id ON user_intelligence_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_email_timestamp ON analytics_events(email, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);


-- ============================================================================
-- 8. TRIGGERS DECLARATION
-- ============================================================================

-- Attach triggers to keep 'updated_at' column accurate automatically on edit
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_intelligence_metrics_updated_at
    BEFORE UPDATE ON user_intelligence_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- ============================================================================
-- 9. PRACTICE ARENA & CHALLENGE PACKS SYSTEM
-- ============================================================================

-- Challenge Packs correspond to standard bite-sized daily practices
CREATE TABLE IF NOT EXISTS challenge_packs (
    id VARCHAR(100) PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'Easy' NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    description TEXT,
    xp_reward INTEGER DEFAULT 50 NOT NULL CHECK (xp_reward >= 0),
    questions_count INTEGER DEFAULT 0 NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    questions JSONB DEFAULT '[]'::jsonb NOT NULL,
    linked_unit_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Puzzle Packs contain harder, logic or visual AI mysteries
CREATE TABLE IF NOT EXISTS puzzle_packs (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Logic Lab' NOT NULL,
    cost_xp INTEGER DEFAULT 100 NOT NULL CHECK (cost_xp >= 0),
    xp_reward INTEGER DEFAULT 250 NOT NULL CHECK (xp_reward >= 0),
    questions_count INTEGER DEFAULT 0 NOT NULL,
    unlocked BOOLEAN DEFAULT FALSE NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    badge_reward VARCHAR(100),
    questions JSONB DEFAULT '[]'::jsonb NOT NULL,
    chest_image_url TEXT,
    chest_icon_url TEXT,
    linked_unit_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Battle Pools for live student-vs-student interactive math/AI battles
CREATE TABLE IF NOT EXISTS battle_pools (
    id VARCHAR(100) PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'Easy' NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    questions JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Speed optimization indexes
CREATE INDEX IF NOT EXISTS idx_challenge_packs_difficulty ON challenge_packs(difficulty);
CREATE INDEX IF NOT EXISTS idx_puzzle_packs_category ON puzzle_packs(category);


-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) & AUTH TRIGGER FOR PROFILES
-- ============================================================================

-- Enable RLS on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own profile
CREATE POLICY "Users can select their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trigger to prevent privilege escalation and protect sensitive profile progression fields
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

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- Automatic trigger to create a single profile for new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_email TEXT;
    generated_username TEXT;
    base_username TEXT;
    counter INT := 1;
BEGIN
    clean_email := LOWER(TRIM(NEW.email));
    
    base_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(clean_email, '@', 1),
        'explorer'
    );
    
    IF base_username = '' THEN
        base_username := 'explorer';
    END IF;

    generated_username := base_username;

    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
        counter := counter + 1;
        generated_username := base_username || '_' || counter;
    END LOOP;

    INSERT INTO public.profiles (
        id,
        email,
        username,
        xp,
        weekly_xp,
        gems,
        streak,
        energy,
        accuracy,
        avatar_id,
        theme_id,
        best_streak,
        is_admin,
        total_chests_claimed,
        total_steps_claimed,
        trophies
    ) VALUES (
        NEW.id,
        clean_email,
        generated_username,
        0,
        0,
        50,
        0,
        50,
        1.00,
        'user',
        'blue',
        0,
        FALSE,
        0,
        0,
        45
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 11. MULTI-TENANT SCHOOLS SYSTEM
-- ============================================================================

-- Master schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    school_code VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schools_auth_user_id ON schools(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);

-- Classes within a school
CREATE TABLE IF NOT EXISTS school_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50),
    teacher_name VARCHAR(255),
    room_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_classes_school_id ON school_classes(school_id);

-- Teachers within a school
CREATE TABLE IF NOT EXISTS school_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_teachers_school_id ON school_teachers(school_id);

-- Students assigned to a school
CREATE TABLE IF NOT EXISTS school_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    grade VARCHAR(50),
    class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_students_school_id ON school_students(school_id);


-- ============================================================================
-- 12. LUCKY COOKIE SPIN WHEEL & DAILY USAGE SYSTEM
-- ============================================================================

-- Daily usage tracking table enforcing maximum 3 spins per user per day (Asia/Kolkata timezone)
CREATE TABLE IF NOT EXISTS public.spin_wheel_daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,
    spins_used INTEGER NOT NULL DEFAULT 0 CHECK (spins_used >= 0 AND spins_used <= 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_spin_wheel_daily_usage UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_spin_wheel_daily_usage_lookup 
    ON public.spin_wheel_daily_usage(user_id, usage_date);

-- Trigger to maintain updated_at on edits
DROP TRIGGER IF EXISTS trg_update_spin_wheel_daily_usage_updated_at ON public.spin_wheel_daily_usage;
CREATE TRIGGER trg_update_spin_wheel_daily_usage_updated_at
    BEFORE UPDATE ON public.spin_wheel_daily_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.spin_wheel_daily_usage ENABLE ROW LEVEL SECURITY;

-- Allow users to only SELECT their own daily usage records
DROP POLICY IF EXISTS "Users can read their own spin usage" ON public.spin_wheel_daily_usage;
CREATE POLICY "Users can read their own spin usage"
    ON public.spin_wheel_daily_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Master table storing cryptographically distinct, single-use spin reward claims
CREATE TABLE IF NOT EXISTS public.spin_wheel_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    spin_reference VARCHAR(255) UNIQUE NOT NULL,
    reward_gems INTEGER NOT NULL DEFAULT 0,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spin_wheel_claims_ref ON public.spin_wheel_claims(spin_reference);

-- RPC 1: get_spin_wheel_daily_status()
-- Returns limit (3), used, remaining, canSpin for current user and Asia/Kolkata date
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

-- RPC 2: consume_spin_wheel()
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

-- ============================================================================
-- 13. LESSON SCREEN AUDIO & TTS NARRATION SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_screen_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id VARCHAR(100) NOT NULL,
    screen_id VARCHAR(100) NOT NULL,
    language VARCHAR(50) NOT NULL CHECK (language IN ('english', 'hinglish', 'marathi')),
    narration_text TEXT NOT NULL,
    text_hash VARCHAR(100) NOT NULL,
    audio_url TEXT NOT NULL,
    audio_duration NUMERIC(8, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(lesson_id, screen_id, language)
);

CREATE INDEX IF NOT EXISTS idx_lesson_screen_audio_screen ON public.lesson_screen_audio(screen_id);
CREATE INDEX IF NOT EXISTS idx_lesson_screen_audio_lesson ON public.lesson_screen_audio(lesson_id);


-- ============================================================================
-- 14. USER DAILY ACTIVITY (Streak Calendar, Daily Goals & Cross-Device Sync)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_daily_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,

    -- Activity Counters
    lessons_completed INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
    challenges_completed INTEGER NOT NULL DEFAULT 0 CHECK (challenges_completed >= 0),
    battles_played INTEGER NOT NULL DEFAULT 0 CHECK (battles_played >= 0),
    battles_won INTEGER NOT NULL DEFAULT 0 CHECK (battles_won >= 0),
    quests_completed INTEGER NOT NULL DEFAULT 0 CHECK (quests_completed >= 0),

    -- Daily Rewards Earned
    cookies_earned INTEGER NOT NULL DEFAULT 0 CHECK (cookies_earned >= 0),
    xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
    time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),

    -- Streak & Metadata
    streak_counted BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Enforce one record per user per calendar day
    CONSTRAINT uq_user_daily_activity_user_date UNIQUE (user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date
    ON public.user_daily_activity (user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_date
    ON public.user_daily_activity (activity_date DESC);

DROP TRIGGER IF EXISTS trg_update_user_daily_activity_updated_at ON public.user_daily_activity;
CREATE TRIGGER trg_update_user_daily_activity_updated_at
    BEFORE UPDATE ON public.user_daily_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.user_daily_activity ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND is_admin = TRUE
    );
$$;

DROP POLICY IF EXISTS "Users can view own daily activity" ON public.user_daily_activity;
CREATE POLICY "Users can view own daily activity"
    ON public.user_daily_activity
    FOR SELECT
    TO authenticated, anon
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can view all daily activity" ON public.user_daily_activity;
CREATE POLICY "Admins can view all daily activity"
    ON public.user_daily_activity
    FOR SELECT
    TO authenticated
    USING (public.is_admin_user());

DROP POLICY IF EXISTS "Users can insert own daily activity" ON public.user_daily_activity;
CREATE POLICY "Users can insert own daily activity"
    ON public.user_daily_activity
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can insert any daily activity" ON public.user_daily_activity;
CREATE POLICY "Admins can insert any daily activity"
    ON public.user_daily_activity
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Users can update own daily activity" ON public.user_daily_activity;
CREATE POLICY "Users can update own daily activity"
    ON public.user_daily_activity
    FOR UPDATE
    TO authenticated, anon
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can update any daily activity" ON public.user_daily_activity;
CREATE POLICY "Admins can update any daily activity"
    ON public.user_daily_activity
    FOR UPDATE
    TO authenticated
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can delete daily activity" ON public.user_daily_activity;
CREATE POLICY "Admins can delete daily activity"
    ON public.user_daily_activity
    FOR DELETE
    TO authenticated
    USING (public.is_admin_user());

CREATE OR REPLACE FUNCTION public.record_user_daily_activity(
    p_lessons_delta INTEGER DEFAULT 0,
    p_challenges_delta INTEGER DEFAULT 0,
    p_battles_played_delta INTEGER DEFAULT 0,
    p_battles_won_delta INTEGER DEFAULT 0,
    p_quests_delta INTEGER DEFAULT 0,
    p_cookies_delta INTEGER DEFAULT 0,
    p_xp_delta INTEGER DEFAULT 0,
    p_time_spent_delta INTEGER DEFAULT 0,
    p_activity_date DATE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,
    p_user_id UUID DEFAULT NULL
)
RETURNS public.user_daily_activity
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := COALESCE(auth.uid(), p_user_id);
    v_row public.user_daily_activity;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required or user_id must be provided';
    END IF;

    INSERT INTO public.user_daily_activity (
        user_id,
        activity_date,
        lessons_completed,
        challenges_completed,
        battles_played,
        battles_won,
        quests_completed,
        cookies_earned,
        xp_earned,
        time_spent_seconds
    )
    VALUES (
        v_user_id,
        p_activity_date,
        GREATEST(0, p_lessons_delta),
        GREATEST(0, p_challenges_delta),
        GREATEST(0, p_battles_played_delta),
        GREATEST(0, p_battles_won_delta),
        GREATEST(0, p_quests_delta),
        GREATEST(0, p_cookies_delta),
        GREATEST(0, p_xp_delta),
        GREATEST(0, p_time_spent_delta)
    )
    ON CONFLICT (user_id, activity_date)
    DO UPDATE SET
        lessons_completed    = public.user_daily_activity.lessons_completed    + GREATEST(0, EXCLUDED.lessons_completed),
        challenges_completed = public.user_daily_activity.challenges_completed + GREATEST(0, EXCLUDED.challenges_completed),
        battles_played       = public.user_daily_activity.battles_played       + GREATEST(0, EXCLUDED.battles_played),
        battles_won          = public.user_daily_activity.battles_won          + GREATEST(0, EXCLUDED.battles_won),
        quests_completed     = public.user_daily_activity.quests_completed     + GREATEST(0, EXCLUDED.quests_completed),
        cookies_earned       = public.user_daily_activity.cookies_earned       + GREATEST(0, EXCLUDED.cookies_earned),
        xp_earned            = public.user_daily_activity.xp_earned            + GREATEST(0, EXCLUDED.xp_earned),
        time_spent_seconds   = public.user_daily_activity.time_spent_seconds   + GREATEST(0, EXCLUDED.time_spent_seconds),
        streak_counted       = TRUE,
        updated_at           = CURRENT_TIMESTAMP
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_user_daily_activity(
    INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, DATE, UUID
) TO authenticated, anon, service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'user_daily_activity'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_daily_activity;
    END IF;
END $$;




