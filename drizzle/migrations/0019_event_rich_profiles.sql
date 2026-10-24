ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS story text,
  ADD COLUMN IF NOT EXISTS scale_facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS our_take text,
  ADD COLUMN IF NOT EXISTS who_youll_meet text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_info text,
  ADD COLUMN IF NOT EXISTS free_ways_in text,
  ADD COLUMN IF NOT EXISTS tips text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_sources text[] NOT NULL DEFAULT '{}';
COMMENT ON COLUMN public.events.scale_facts IS 'Array of {value,label,year,source_url} numbers shown on the event page.';