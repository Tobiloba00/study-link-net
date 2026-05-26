-- ════════════════════════════════════════════════════════════
-- Search performance: trigram GIN indexes for fast ILIKE.
--
-- Problem the typeahead solved before this:
--   SELECT … FROM profiles WHERE name ILIKE '%car%'
--
-- The leading '%' kills any btree index — PostgreSQL falls back to a
-- sequential scan over every profile. Fine at 200 users, brutal at 5k+.
--
-- Fix: pg_trgm. It splits each indexed column into 3-character grams
-- and stores them in a GIN index. With this, ILIKE '%car%' becomes an
-- index lookup ("rows whose grams contain {car}") instead of a scan,
-- and the planner can prune ~99% of rows before touching them.
--
-- One-time cost: building the index. After that every keystroke is fast.
-- ════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN on the columns actually used in the typeahead query.
-- We drop bio from the typeahead query frontend-side, so it's not
-- indexed here — small payoff for a wide column.
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm
  ON public.profiles USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_course_trgm
  ON public.profiles USING gin (course gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON public.profiles USING gin (email gin_trgm_ops);

-- Btree on created_at — used by every paginated query that orders by
-- created_at DESC for cursor pagination + "Recently Joined" filters.
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at DESC);
