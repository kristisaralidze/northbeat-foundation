CREATE TYPE public.org_relation AS ENUM ('invested_in','spun_out_of','acquired','partner_of');
CREATE TABLE public.organisation_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  to_org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  relation public.org_relation NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_org_id, to_org_id, relation),
  CHECK (from_org_id <> to_org_id)
);
CREATE INDEX ON public.organisation_relations (to_org_id);
GRANT SELECT ON public.organisation_relations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisation_relations TO authenticated;
GRANT ALL ON public.organisation_relations TO service_role;
ALTER TABLE public.organisation_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage" ON public.organisation_relations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public reads published" ON public.organisation_relations FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.organisations a WHERE a.id = from_org_id AND a.status='published')
     AND EXISTS (SELECT 1 FROM public.organisations b WHERE b.id = to_org_id AND b.status='published'));