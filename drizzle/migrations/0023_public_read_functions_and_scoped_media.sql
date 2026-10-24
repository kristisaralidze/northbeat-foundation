-- Tags: public pages read them through a function, not direct table access.
CREATE OR REPLACE FUNCTION public.public_terms()
RETURNS TABLE(id uuid, kind public.term_kind, name text, slug text, parent_id uuid, sort_order integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.kind, t.name, t.slug, t.parent_id, t.sort_order FROM public.terms t
$$;

GRANT EXECUTE ON FUNCTION public.public_terms() TO anon, authenticated;

DROP POLICY "Anyone reads terms" ON public.terms;

-- Founders: public pages read the About-page columns through a function.
CREATE OR REPLACE FUNCTION public.public_founders()
RETURNS TABLE(id uuid, name text, one_line text, photo_url text, linkedin_url text, sort_order integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id, f.name, f.one_line, f.photo_url, f.linkedin_url, f.sort_order FROM public.founders f ORDER BY f.sort_order, f.created_at
$$;

GRANT EXECUTE ON FUNCTION public.public_founders() TO anon, authenticated;

DROP POLICY "Anyone reads founders" ON public.founders;

-- Media bucket: public downloads only for the shared asset folders; admins read everything.
DROP POLICY "Public reads media" ON storage.objects;

CREATE POLICY "Public reads shared media"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'media' AND (name LIKE 'logo/%' OR name LIKE 'logos/%' OR name LIKE 'photo/%' OR name LIKE 'cover/%' OR name LIKE 'cover_image/%'));

CREATE POLICY "Admins read all media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));