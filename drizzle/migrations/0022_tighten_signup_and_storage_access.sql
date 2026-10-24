-- Visitors may join the signup lists but never read them; only admins manage them.
CREATE POLICY "Anyone joins the newsletter"
ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
WITH CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND confirmed_at IS NULL
  AND unsubscribed_at IS NULL
  AND tags <@ ARRAY['newsletter','podcast']::text[]
);

CREATE POLICY "Admins delete subscribers"
ON public.newsletter_subscribers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone joins the Systole waitlist"
ON public.systole_waitlist FOR INSERT TO anon, authenticated
WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

CREATE POLICY "Admins update Systole waitlist"
ON public.systole_waitlist FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete from Systole waitlist"
ON public.systole_waitlist FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Site settings: public pages read only the safe columns through a function.
CREATE OR REPLACE FUNCTION public.public_site_settings()
RETURNS TABLE(contact_email text, linkedin_url text, instagram_url text, podcast_themes text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.contact_email, s.linkedin_url, s.instagram_url, s.podcast_themes
  FROM public.site_settings s
  WHERE s.id = 1
$$;

GRANT EXECUTE ON FUNCTION public.public_site_settings() TO anon, authenticated;

CREATE POLICY "Admins read site settings"
ON public.site_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY "Anyone reads site settings" ON public.site_settings;

-- Private bucket for admin files (exports, anything submitted): only admins may read or write.
CREATE POLICY "Admins read admin files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'admin-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload admin files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'admin-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins replace admin files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'admin-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete admin files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'admin-files' AND public.has_role(auth.uid(), 'admin'));