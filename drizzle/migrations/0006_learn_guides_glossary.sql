ALTER TABLE public.guides
  ADD COLUMN level public.guide_level NOT NULL DEFAULT 'beginner',
  ADD COLUMN area_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  ADD COLUMN journey_step_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  ADD COLUMN one_sentence text,
  ADD COLUMN next_step text,
  ADD COLUMN reviewed_by text,
  ADD COLUMN sources jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX guides_area_idx ON public.guides(area_id);
CREATE INDEX guides_journey_step_idx ON public.guides(journey_step_id);

CREATE OR REPLACE FUNCTION public.validate_guide() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE s jsonb;
BEGIN
  IF NEW.area_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.terms WHERE id = NEW.area_id AND kind::text = 'area') THEN
    RAISE EXCEPTION 'Area must be one of the Areas list';
  END IF;
  IF NEW.journey_step_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.terms WHERE id = NEW.journey_step_id AND kind::text = 'journey_step') THEN
    RAISE EXCEPTION 'Journey step must be one of the Journey steps list';
  END IF;
  IF jsonb_typeof(NEW.sources) <> 'array' THEN RAISE EXCEPTION 'Sources must be a list'; END IF;
  FOR s IN SELECT * FROM jsonb_array_elements(NEW.sources) LOOP
    IF jsonb_typeof(s) <> 'object' OR coalesce(s->>'title','') = '' OR coalesce(s->>'url','') !~ '^https?://' THEN
      RAISE EXCEPTION 'Each source needs a title and a link starting with http';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER guides_validate BEFORE INSERT OR UPDATE ON public.guides FOR EACH ROW EXECUTE FUNCTION public.validate_guide();

CREATE TABLE public.glossary_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text,
  last_checked date,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  term text NOT NULL,
  short_definition text NOT NULL,
  explanation text
);
GRANT SELECT ON public.glossary_terms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.glossary_terms TO authenticated;
GRANT ALL ON public.glossary_terms TO service_role;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published" ON public.glossary_terms FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage" ON public.glossary_terms FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX glossary_terms_status_idx ON public.glossary_terms(status);
CREATE TRIGGER glossary_terms_updated_at BEFORE UPDATE ON public.glossary_terms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER glossary_terms_delete_links AFTER DELETE ON public.glossary_terms FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('glossary_term');

CREATE TABLE public.glossary_term_terms (
  glossary_term_id uuid NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  PRIMARY KEY (glossary_term_id, term_id)
);
GRANT SELECT ON public.glossary_term_terms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.glossary_term_terms TO authenticated;
GRANT ALL ON public.glossary_term_terms TO service_role;
ALTER TABLE public.glossary_term_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published" ON public.glossary_term_terms FOR SELECT USING (EXISTS (SELECT 1 FROM public.glossary_terms g WHERE g.id = glossary_term_id AND g.status = 'published'));
CREATE POLICY "Admins manage" ON public.glossary_term_terms FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX glossary_term_terms_term_idx ON public.glossary_term_terms(term_id);

CREATE TABLE public.glossary_term_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_term_id uuid NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  to_term_id uuid NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  CHECK (from_term_id <> to_term_id),
  UNIQUE (from_term_id, to_term_id)
);
GRANT SELECT ON public.glossary_term_relations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.glossary_term_relations TO authenticated;
GRANT ALL ON public.glossary_term_relations TO service_role;
ALTER TABLE public.glossary_term_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published" ON public.glossary_term_relations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.glossary_terms g WHERE g.id = from_term_id AND g.status = 'published')
  AND EXISTS (SELECT 1 FROM public.glossary_terms g WHERE g.id = to_term_id AND g.status = 'published'));
CREATE POLICY "Admins manage" ON public.glossary_term_relations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX glossary_term_relations_to_idx ON public.glossary_term_relations(to_term_id);

CREATE TABLE public.glossary_term_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  glossary_term_id uuid NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  guide_id uuid NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  UNIQUE (glossary_term_id, guide_id)
);
GRANT SELECT ON public.glossary_term_guides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.glossary_term_guides TO authenticated;
GRANT ALL ON public.glossary_term_guides TO service_role;
ALTER TABLE public.glossary_term_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published" ON public.glossary_term_guides FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.glossary_terms g WHERE g.id = glossary_term_id AND g.status = 'published')
  AND EXISTS (SELECT 1 FROM public.guides g WHERE g.id = guide_id AND g.status = 'published'));
CREATE POLICY "Admins manage" ON public.glossary_term_guides FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX glossary_term_guides_guide_idx ON public.glossary_term_guides(guide_id);

CREATE OR REPLACE FUNCTION public.entry_is_published(_kind entry_kind, _id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE _kind
    WHEN 'organisation' THEN EXISTS (SELECT 1 FROM public.organisations WHERE id=_id AND status='published')
    WHEN 'person' THEN EXISTS (SELECT 1 FROM public.people WHERE id=_id AND status='published')
    WHEN 'event' THEN EXISTS (SELECT 1 FROM public.events WHERE id=_id AND status='published')
    WHEN 'opportunity' THEN EXISTS (SELECT 1 FROM public.opportunities WHERE id=_id AND status='published')
    WHEN 'episode' THEN EXISTS (SELECT 1 FROM public.episodes WHERE id=_id AND status='published')
    WHEN 'newsletter_issue' THEN EXISTS (SELECT 1 FROM public.newsletter_issues WHERE id=_id AND status='published')
    WHEN 'guide' THEN EXISTS (SELECT 1 FROM public.guides WHERE id=_id AND status='published')
    WHEN 'glossary_term' THEN EXISTS (SELECT 1 FROM public.glossary_terms WHERE id=_id AND status='published')
  END
$function$;