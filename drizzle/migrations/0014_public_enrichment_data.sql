ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS openalex_id text,
  ADD COLUMN IF NOT EXISTS openalex_name text,
  ADD COLUMN IF NOT EXISTS research jsonb,
  ADD COLUMN IF NOT EXISTS research_fetched_at timestamptz,
  ADD COLUMN IF NOT EXISTS business_id text,
  ADD COLUMN IF NOT EXISTS registration_date date,
  ADD COLUMN IF NOT EXISTS company_form text,
  ADD COLUMN IF NOT EXISTS main_business_line text,
  ADD COLUMN IF NOT EXISTS registry_fetched_at timestamptz,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS geocoded_at timestamptz,
  ADD COLUMN IF NOT EXISTS news_feed_url text,
  ADD COLUMN IF NOT EXISTS news_items jsonb,
  ADD COLUMN IF NOT EXISTS news_fetched_at timestamptz,
  ADD COLUMN IF NOT EXISTS trials_fetched_at timestamptz;
ALTER TABLE public.organisations ADD CONSTRAINT organisations_openalex_id_format CHECK (openalex_id IS NULL OR openalex_id ~ '^I[0-9]+$');
ALTER TABLE public.organisations ADD CONSTRAINT organisations_business_id_format CHECK (business_id IS NULL OR business_id ~ '^[0-9]{7}-[0-9]$');
ALTER TABLE public.organisations ADD CONSTRAINT organisations_coordinates CHECK ((latitude IS NULL OR latitude BETWEEN -90 AND 90) AND (longitude IS NULL OR longitude BETWEEN -180 AND 180));
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;
ALTER TABLE public.events ADD CONSTRAINT events_coordinates CHECK ((latitude IS NULL OR latitude BETWEEN -90 AND 90) AND (longitude IS NULL OR longitude BETWEEN -180 AND 180));
GRANT SELECT (openalex_id, research, business_id, registration_date, company_form, main_business_line, latitude, longitude, news_items) ON public.organisations TO anon;
GRANT SELECT, UPDATE ON public.organisations TO authenticated;
GRANT SELECT ON public.events TO anon, authenticated;

CREATE TABLE public.organisation_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  nct_id text NOT NULL CHECK (nct_id ~ '^NCT[0-9]{8}$'),
  title text NOT NULL,
  sponsor text,
  status text,
  phase text,
  start_date text,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, nct_id)
);
GRANT SELECT ON public.organisation_trials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisation_trials TO authenticated;
GRANT ALL ON public.organisation_trials TO service_role;
ALTER TABLE public.organisation_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads trials of published organisations" ON public.organisation_trials FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.status = 'published'));
CREATE POLICY "Admins read all trials" ON public.organisation_trials FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write trials" ON public.organisation_trials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));