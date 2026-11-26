-- Quest XP (server-authoritative), mystery-chest XP removed, unverified XP cap raised.
-- Target: aibo_web. Safe to re-run (CREATE OR REPLACE + guarded patch of complete_challenge).

-- 1. weekly_xp_for_claim: add quest_ branch, make chest_ (store purchase) give 0 XP ------------
CREATE OR REPLACE FUNCTION public.weekly_xp_for_claim(p_key text, p_client_xp integer)
 RETURNS TABLE(r_xp integer, r_verified boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cx        integer := GREATEST(0, COALESCE(p_client_xp, 0));
  v_val       integer;
  v_uid       uuid := auth.uid();
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
  v_n         integer;
  v_lesson    text;
  v_date      date;
  v_qid       text;
BEGIN
  IF p_key ~ '^lesson_' THEN
    SELECT l.xp_reward INTO v_val FROM public.lessons l WHERE l.id = substr(p_key, 8);
    RETURN QUERY SELECT GREATEST(COALESCE(v_val, 0), 0), true;

  ELSIF p_key ~ '^daily_challenge_' THEN
    SELECT d.xp_reward INTO v_val FROM public.daily_challenges d WHERE d.id::text = substr(p_key, 17);
    IF FOUND THEN
      RETURN QUERY SELECT LEAST(GREATEST(COALESCE(v_val, 0), 0), 500), true;
    ELSE
      RETURN QUERY SELECT LEAST(v_cx, 100), false;
    END IF;

  ELSIF p_key ~ '^adventure_' THEN
    RETURN QUERY SELECT LEAST(v_cx, 100), false;

  ELSIF p_key ~ '^challenge_' THEN
    RETURN QUERY SELECT LEAST(v_cx, 50), false;

  -- CHANGED: mystery chest is a store purchase -> no XP (was 150)
  ELSIF p_key ~ '^chest_' THEN
    RETURN QUERY SELECT 0, true;

  -- replay of a completed lesson. Key = practice_<lessonId>_<YYYY-MM-DD>.
  ELSIF p_key ~ '^practice_.+_[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    BEGIN
      v_date := right(p_key, 10)::date;
    EXCEPTION WHEN others THEN
      v_date := NULL;
    END;
    IF v_date IS NULL
       OR v_date NOT IN ((now() AT TIME ZONE 'UTC')::date, (now() AT TIME ZONE 'Asia/Kolkata')::date) THEN
      RETURN QUERY SELECT 0, true;
    ELSE
      v_lesson := substr(p_key, 10, length(p_key) - 20);
      IF EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = v_lesson) THEN
        RETURN QUERY SELECT 15, true;
      ELSE
        RETURN QUERY SELECT 15, false;
      END IF;
    END IF;

  ELSIF p_key ~ '^badge_' THEN
    RETURN QUERY SELECT 100, false;

  ELSIF p_key ~ '^streak_bonus_' THEN
    RETURN QUERY SELECT 5, false;

  ELSIF p_key ~ '^studyhub_.+_activity$' THEN
    RETURN QUERY SELECT 10, false;
  ELSIF p_key ~ '^studyhub_.+_chest$' THEN
    RETURN QUERY SELECT 30, false;

  ELSIF p_key ~ '^arena_' THEN
    SELECT count(*) INTO v_n
      FROM public.reward_claims
     WHERE user_id = v_uid AND created_at >= v_day_start
       AND left(claim_key, 6) = 'arena_' AND xp > 0;
    IF v_n >= 3 THEN
      RETURN QUERY SELECT 0, true;
    ELSE
      RETURN QUERY SELECT 20, false;
    END IF;

  ELSIF p_key ~ '^unit_mastery_' THEN
    RETURN QUERY SELECT LEAST(v_cx, 200), false;

  -- NEW: daily / weekly quests. Key = quest_<daily|weekly>_<questId>_<YYYY-MM-DD>
  -- XP comes from this table only (client amount is ignored). The date must be
  -- today (IST) for daily quests, or this IST week's Monday for weekly quests,
  -- so old keys cannot be replayed. One claim per key => once per day / week.
  ELSIF p_key ~ '^quest_(daily|weekly)_[a-z0-9_]+_[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    BEGIN
      v_date := right(p_key, 10)::date;
    EXCEPTION WHEN others THEN
      v_date := NULL;
    END;
    v_qid := substr(p_key, 7, length(p_key) - 17);   -- e.g. 'daily_lesson_1', 'weekly_xp_500'
    IF v_date IS NULL
       OR (v_qid LIKE 'daily_%'  AND v_date <> (now() AT TIME ZONE 'Asia/Kolkata')::date)
       OR (v_qid LIKE 'weekly_%' AND v_date <> public.ist_week_start()) THEN
      RETURN QUERY SELECT 0, true;
    ELSE
      RETURN QUERY SELECT
        CASE v_qid
          WHEN 'daily_lesson_1'      THEN 15
          WHEN 'daily_lesson_3'      THEN 30
          WHEN 'daily_practice_1'    THEN 15
          WHEN 'daily_challenge_1'   THEN 15
          WHEN 'daily_xp_50'         THEN 20
          WHEN 'daily_all_done'      THEN 50
          WHEN 'weekly_streak_5'     THEN 100
          WHEN 'weekly_xp_500'       THEN 50
          WHEN 'weekly_lessons_10'   THEN 60
          WHEN 'weekly_practice_5'   THEN 50
          ELSE 0
        END, false;
    END IF;

  ELSE
    RETURN QUERY SELECT 0, true;
  END IF;
END $function$;

-- 2. complete_challenge: raise unverified daily XP cap 300 -> 500 (only that constant changes) ---
DO $$
DECLARE
  d text;
  d2 text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'complete_challenge' AND p.pronargs = 6;

  IF d IS NULL THEN
    RAISE EXCEPTION 'complete_challenge(6 args) not found';
  END IF;

  d2 := regexp_replace(d, '(v_xp_unverif_daily\s+CONSTANT\s+integer\s*:=\s*)300', E'\\1' || '500');

  IF d2 = d THEN
    IF d ~ 'v_xp_unverif_daily\s+CONSTANT\s+integer\s*:=\s*500' THEN
      RETURN; -- already applied
    END IF;
    RAISE EXCEPTION 'unverified cap constant not found; aborting without changes';
  END IF;

  EXECUTE d2;
END $$;
