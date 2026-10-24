ALTER TABLE public.organisations ADD COLUMN sources jsonb;
COMMENT ON COLUMN public.organisations.sources IS 'Array of source URLs backing the rich profile, shown small at the bottom of the page.';
GRANT SELECT (sources) ON public.organisations TO anon;
GRANT SELECT (sources) ON public.organisations TO authenticated;