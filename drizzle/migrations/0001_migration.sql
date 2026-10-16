DROP VIEW public.public_organisations;
DROP VIEW public.public_people;

CREATE OR REPLACE FUNCTION public.public_organisations()
RETURNS TABLE (id uuid, slug text, source_url text, last_checked date, published_at timestamptz, updated_at timestamptz,
  name text, type public.organisation_type, short_description text, description text, website text, logo_url text,
  city text, founded_year int, linkedin_url text, ticket_min_eur numeric, ticket_max_eur numeric, contact_email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.slug, o.source_url, o.last_checked, o.published_at, o.updated_at, o.name, o.type, o.short_description,
         o.description, o.website, o.logo_url, o.city, o.founded_year, o.linkedin_url, o.ticket_min_eur, o.ticket_max_eur,
         CASE WHEN o.contact_email_public THEN o.contact_email END
  FROM public.organisations o WHERE o.status = 'published'
$$;

CREATE OR REPLACE FUNCTION public.public_people()
RETURNS TABLE (id uuid, slug text, source_url text, last_checked date, published_at timestamptz, updated_at timestamptz,
  full_name text, headline text, bio text, photo_url text, linkedin_url text, open_to public.open_to_kind[],
  expertise_note text, contact_email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.slug, p.source_url, p.last_checked, p.published_at, p.updated_at, p.full_name, p.headline, p.bio,
         p.photo_url, p.linkedin_url, p.open_to, p.expertise_note,
         CASE WHEN p.contact_email_public THEN p.contact_email END
  FROM public.people p WHERE p.status = 'published'
$$;

REVOKE EXECUTE ON FUNCTION public.delete_entry_links() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;