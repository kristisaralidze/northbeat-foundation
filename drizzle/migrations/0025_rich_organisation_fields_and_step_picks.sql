ALTER TABLE public.organisations
  ADD COLUMN story text,
  ADD COLUMN scale_facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN our_take text,
  ADD COLUMN how_to_get_involved jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.guides
  ADD COLUMN common_mistakes jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.journey_step_organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  reason text,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (term_id, organisation_id)
);
GRANT SELECT ON public.journey_step_organisations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_step_organisations TO authenticated;
GRANT ALL ON public.journey_step_organisations TO service_role;
ALTER TABLE public.journey_step_organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads step picks" ON public.journey_step_organisations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write step picks" ON public.journey_step_organisations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));