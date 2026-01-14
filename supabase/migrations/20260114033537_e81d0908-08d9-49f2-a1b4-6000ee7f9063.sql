-- Drop the increment_lifetime_stats function
DROP FUNCTION IF EXISTS public.increment_lifetime_stats(INTEGER, INTEGER, BIGINT);

-- Drop the lifetime_stats table
DROP TABLE IF EXISTS public.lifetime_stats;