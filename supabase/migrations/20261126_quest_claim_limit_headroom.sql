-- Issue C: quest_ claims per IST day were exactly saturated (5 daily + Perfect Day + 4 weekly = 10).
-- Raises ONLY reward_catalog.max_claims_per_day for the 'quest_' prefix to 20. No other caps change.
-- Target project: aibo_web (wopyfbcvkingofvooett). Safe to re-run (only raises, never lowers).
UPDATE public.reward_catalog
   SET max_claims_per_day = 20
 WHERE prefix = 'quest_'
   AND COALESCE(max_claims_per_day, 0) < 20;

-- ROLLBACK:
-- UPDATE public.reward_catalog SET max_claims_per_day = 10 WHERE prefix = 'quest_';
