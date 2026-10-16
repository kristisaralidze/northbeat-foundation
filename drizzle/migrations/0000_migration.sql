-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.entry_status AS ENUM ('draft','published','archived');
CREATE TYPE public.organisation_type AS ENUM ('startup','investor','incubator','accelerator','funder','research_group','lab','hospital_innovation_unit','service_provider','university','public_agency','patient_organisation','community');
CREATE TYPE public.opportunity_type AS ENUM ('programme_intake','grant_call','competition','job');
CREATE TYPE public.term_kind AS ENUM ('field','sub_area','country','stage');
CREATE TYPE public.event_format AS ENUM ('in_person','online','hybrid');
CREATE TYPE public.event_type AS ENUM ('conference','pitch_competition','hackathon','demo_day','meetup','workshop','volunteering');
CREATE TYPE public.open_to_kind AS ENUM ('advising','mentoring','intros','investing','validation');
CREATE TYPE public.submission_type AS ENUM ('new_entry','correction','contact','podcast_guest');
CREATE TYPE public.submission_status AS ENUM ('new','in_review','accepted','rejected','done');
CREATE TYPE public.entry_kind AS ENUM ('organisation','person','event','opportunity','episode','newsletter_issue','guide');

-- ===== Roles =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== Entry tables =====
CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text, last_checked date, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  name text NOT NULL,
  type public.organisation_type NOT NULL,
  short_description text, description text, website text, logo_url text, city text,
  founded_year int, linkedin_url text,
  contact_email text, contact_email_public boolean NOT NULL DEFAULT false,
  ticket_min_eur numeric, ticket_max_eur numeric
);

CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text, last_checked date, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  full_name text NOT NULL,
  headline text, bio text, photo_url text, linkedin_url text,
  open_to public.open_to_kind[] NOT NULL DEFAULT '{}',
  expertise_note text,
  contact_email text, contact_email_public boolean NOT NULL DEFAULT false
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text, last_checked date, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  title text NOT NULL,
  event_type public.event_type NOT NULL,
  summary text, description text,
  starts_at timestamptz, ends_at timestamptz, apply_deadline_at timestamptz,
  timezone text DEFAULT 'Europe/Helsinki',
  format public.event_format, venue text, city text, registration_url text, price_note text
);

CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text, last_checked date, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  title text NOT NULL,
  type public.opportunity_type NOT NULL,
  summary text, description text,
  opens_at timestamptz, deadline_at timestamptz,
  amount_min_eur numeric, amount_max_eur numeric, apply_url text,
  location text, employment_type text, remote_ok boolean
);

CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text, last_checked date, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  title text NOT NULL,
  episode_number int, season int, summary text, show_notes text, transcript text,
  audio_url text, embed_url text, duration_seconds int, published_on date, cover_url text
);

CREATE TABLE public.newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text, last_checked date, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  title text NOT NULL,
  issue_number int, summary text, body text, sent_on date, web_url text
);

CREATE TABLE public.guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status public.entry_status NOT NULL DEFAULT 'draft',
  source_url text, last_checked date, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  title text NOT NULL,
  summary text, body text, cover_url text, reading_minutes int
);

-- Grants: anon cannot read contact_email directly
GRANT SELECT (id, slug, status, source_url, last_checked, published_at, created_at, updated_at, name, type, short_description, description, website, logo_url, city, founded_year, linkedin_url, contact_email_public, ticket_min_eur, ticket_max_eur) ON public.organisations TO anon;
GRANT SELECT (id, slug, status, source_url, last_checked, published_at, created_at, updated_at, full_name, headline, bio, photo_url, linkedin_url, open_to, expertise_note, contact_email_public) ON public.people TO anon;
GRANT SELECT ON public.events, public.opportunities, public.episodes, public.newsletter_issues, public.guides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisations, public.people, public.events, public.opportunities, public.episodes, public.newsletter_issues, public.guides TO authenticated;
GRANT ALL ON public.organisations, public.people, public.events, public.opportunities, public.episodes, public.newsletter_issues, public.guides TO service_role;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['organisations','people','events','opportunities','episodes','newsletter_issues','guides'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public reads published" ON public.%I FOR SELECT TO anon USING (status = ''published'')', t);
    EXECUTE format('CREATE POLICY "Admins manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
    EXECUTE format('CREATE INDEX ON public.%I (status)', t);
  END LOOP;
END $$;
CREATE INDEX ON public.events (starts_at);
CREATE INDEX ON public.events (apply_deadline_at);
CREATE INDEX ON public.opportunities (deadline_at);
CREATE INDEX ON public.organisations (type);
CREATE INDEX ON public.opportunities (type);
CREATE INDEX ON public.events (event_type);

-- Is any entry published? (used for polymorphic links)
CREATE OR REPLACE FUNCTION public.entry_is_published(_kind public.entry_kind, _id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE _kind
    WHEN 'organisation' THEN EXISTS (SELECT 1 FROM public.organisations WHERE id=_id AND status='published')
    WHEN 'person' THEN EXISTS (SELECT 1 FROM public.people WHERE id=_id AND status='published')
    WHEN 'event' THEN EXISTS (SELECT 1 FROM public.events WHERE id=_id AND status='published')
    WHEN 'opportunity' THEN EXISTS (SELECT 1 FROM public.opportunities WHERE id=_id AND status='published')
    WHEN 'episode' THEN EXISTS (SELECT 1 FROM public.episodes WHERE id=_id AND status='published')
    WHEN 'newsletter_issue' THEN EXISTS (SELECT 1 FROM public.newsletter_issues WHERE id=_id AND status='published')
    WHEN 'guide' THEN EXISTS (SELECT 1 FROM public.guides WHERE id=_id AND status='published')
  END
$$;

-- ===== Public views with conditional contact email =====
CREATE VIEW public.public_organisations AS
  SELECT id, slug, source_url, last_checked, published_at, updated_at, name, type, short_description, description,
         website, logo_url, city, founded_year, linkedin_url, ticket_min_eur, ticket_max_eur,
         CASE WHEN contact_email_public THEN contact_email END AS contact_email
  FROM public.organisations WHERE status = 'published';
CREATE VIEW public.public_people AS
  SELECT id, slug, source_url, last_checked, published_at, updated_at, full_name, headline, bio, photo_url,
         linkedin_url, open_to, expertise_note,
         CASE WHEN contact_email_public THEN contact_email END AS contact_email
  FROM public.people WHERE status = 'published';
GRANT SELECT ON public.public_organisations, public.public_people TO anon, authenticated;
GRANT ALL ON public.public_organisations, public.public_people TO service_role;

-- ===== Terms =====
CREATE TABLE public.terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.term_kind NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES public.terms(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, name), UNIQUE (kind, slug)
);
GRANT SELECT ON public.terms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terms TO authenticated;
GRANT ALL ON public.terms TO service_role;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads terms" ON public.terms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage terms" ON public.terms FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.terms (parent_id);

-- Tag tables
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('organisation_terms','organisation_id','organisations'),
    ('person_terms','person_id','people'),
    ('event_terms','event_id','events'),
    ('opportunity_terms','opportunity_id','opportunities'),
    ('episode_terms','episode_id','episodes'),
    ('newsletter_issue_terms','newsletter_issue_id','newsletter_issues'),
    ('guide_terms','guide_id','guides')) AS v(tbl, col, parent) LOOP
    EXECUTE format('CREATE TABLE public.%I (%I uuid NOT NULL REFERENCES public.%I(id) ON DELETE CASCADE, term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE, PRIMARY KEY (%I, term_id))', r.tbl, r.col, r.parent, r.col);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', r.tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tbl);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('CREATE POLICY "Public reads published" ON public.%I FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.%I p WHERE p.id = %I AND p.status = ''published''))', r.tbl, r.parent, r.col);
    EXECUTE format('CREATE POLICY "Admins manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', r.tbl);
    EXECUTE format('CREATE INDEX ON public.%I (term_id)', r.tbl);
  END LOOP;
END $$;

-- ===== Many-to-many links =====
CREATE TABLE public.organisation_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', is_current boolean NOT NULL DEFAULT true, started_on date, ended_on date,
  UNIQUE (organisation_id, person_id, role));
CREATE TABLE public.organisation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', UNIQUE (organisation_id, event_id, role));
CREATE TABLE public.organisation_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', UNIQUE (organisation_id, opportunity_id, role));
CREATE TABLE public.organisation_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', UNIQUE (organisation_id, episode_id, role));
CREATE TABLE public.person_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', UNIQUE (person_id, event_id, role));
CREATE TABLE public.person_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', UNIQUE (person_id, opportunity_id, role));
CREATE TABLE public.person_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', UNIQUE (person_id, episode_id, role));
CREATE TABLE public.event_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '', UNIQUE (event_id, opportunity_id, role));

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('organisation_people','organisation_id','organisations','person_id','people'),
    ('organisation_events','organisation_id','organisations','event_id','events'),
    ('organisation_opportunities','organisation_id','organisations','opportunity_id','opportunities'),
    ('organisation_episodes','organisation_id','organisations','episode_id','episodes'),
    ('person_events','person_id','people','event_id','events'),
    ('person_opportunities','person_id','people','opportunity_id','opportunities'),
    ('person_episodes','person_id','people','episode_id','episodes'),
    ('event_opportunities','event_id','events','opportunity_id','opportunities')) AS v(tbl, ca, ta, cb, tb) LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', r.tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tbl);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('CREATE POLICY "Public reads published" ON public.%I FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.%I a WHERE a.id = %I AND a.status = ''published'') AND EXISTS (SELECT 1 FROM public.%I b WHERE b.id = %I AND b.status = ''published''))', r.tbl, r.ta, r.ca, r.tb, r.cb);
    EXECUTE format('CREATE POLICY "Admins manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', r.tbl);
    EXECUTE format('CREATE INDEX ON public.%I (%I)', r.tbl, r.cb);
  END LOOP;
END $$;

-- Polymorphic links for guides and newsletter issues
CREATE TABLE public.guide_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  entry_kind public.entry_kind NOT NULL, entry_id uuid NOT NULL, sort_order int NOT NULL DEFAULT 0,
  UNIQUE (guide_id, entry_kind, entry_id));
CREATE TABLE public.newsletter_issue_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_issue_id uuid NOT NULL REFERENCES public.newsletter_issues(id) ON DELETE CASCADE,
  entry_kind public.entry_kind NOT NULL, entry_id uuid NOT NULL, sort_order int NOT NULL DEFAULT 0,
  UNIQUE (newsletter_issue_id, entry_kind, entry_id));
GRANT SELECT ON public.guide_links, public.newsletter_issue_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guide_links, public.newsletter_issue_links TO authenticated;
GRANT ALL ON public.guide_links, public.newsletter_issue_links TO service_role;
ALTER TABLE public.guide_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_issue_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published" ON public.guide_links FOR SELECT TO anon
  USING (public.entry_is_published('guide', guide_id) AND public.entry_is_published(entry_kind, entry_id));
CREATE POLICY "Admins manage" ON public.guide_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public reads published" ON public.newsletter_issue_links FOR SELECT TO anon
  USING (public.entry_is_published('newsletter_issue', newsletter_issue_id) AND public.entry_is_published(entry_kind, entry_id));
CREATE POLICY "Admins manage" ON public.newsletter_issue_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.guide_links (entry_kind, entry_id);
CREATE INDEX ON public.newsletter_issue_links (entry_kind, entry_id);

-- Remove polymorphic links when the target entry is deleted
CREATE OR REPLACE FUNCTION public.delete_entry_links()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.guide_links WHERE entry_kind = TG_ARGV[0]::public.entry_kind AND entry_id = OLD.id;
  DELETE FROM public.newsletter_issue_links WHERE entry_kind = TG_ARGV[0]::public.entry_kind AND entry_id = OLD.id;
  RETURN OLD;
END; $$;
CREATE TRIGGER delete_entry_links AFTER DELETE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('organisation');
CREATE TRIGGER delete_entry_links AFTER DELETE ON public.people FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('person');
CREATE TRIGGER delete_entry_links AFTER DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('event');
CREATE TRIGGER delete_entry_links AFTER DELETE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('opportunity');
CREATE TRIGGER delete_entry_links AFTER DELETE ON public.episodes FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('episode');
CREATE TRIGGER delete_entry_links AFTER DELETE ON public.newsletter_issues FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('newsletter_issue');
CREATE TRIGGER delete_entry_links AFTER DELETE ON public.guides FOR EACH ROW EXECUTE FUNCTION public.delete_entry_links('guide');

-- ===== Submissions =====
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.submission_type NOT NULL,
  status public.submission_status NOT NULL DEFAULT 'new',
  name text, email text, organisation_name text,
  entry_kind public.entry_kind, entry_id uuid,
  proposed_url text, message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid, reviewed_at timestamptz, admin_note text,
  CONSTRAINT submissions_message_len CHECK (message IS NULL OR length(message) <= 10000),
  CONSTRAINT submissions_email_len CHECK (email IS NULL OR length(email) <= 320)
);
GRANT INSERT ON public.submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits" ON public.submissions FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new' AND reviewed_by IS NULL AND reviewed_at IS NULL AND admin_note IS NULL);
CREATE POLICY "Admins read" ON public.submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update" ON public.submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete" ON public.submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ON public.submissions (status, created_at DESC);

-- ===== Newsletter subscribers (server code only for visitors) =====
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  source text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX newsletter_subscribers_email_ci ON public.newsletter_subscribers (lower(email));
GRANT SELECT, UPDATE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update" ON public.newsletter_subscribers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Storage policies for media bucket =====
CREATE POLICY "Public reads media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "Admins upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));