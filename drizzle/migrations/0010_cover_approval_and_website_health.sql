ALTER TABLE public.organisations ADD COLUMN cover_image_status text NOT NULL DEFAULT 'pending' CHECK (cover_image_status IN ('pending','approved','rejected')), ADD COLUMN cover_image_pending_url text, ADD COLUMN cover_page_title text, ADD COLUMN cover_image_flag text, ADD COLUMN website_health_status text, ADD COLUMN website_health_title text, ADD COLUMN website_health_reason text, ADD COLUMN website_health_checked_at timestamptz;
ALTER TABLE public.events ADD COLUMN cover_image_url text, ADD COLUMN cover_image_status text NOT NULL DEFAULT 'pending' CHECK (cover_image_status IN ('pending','approved','rejected')), ADD COLUMN cover_image_pending_url text, ADD COLUMN cover_page_title text, ADD COLUMN cover_image_flag text;
CREATE FUNCTION public.enforce_cover_review() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
   IF NEW.cover_image_url IS NOT NULL THEN NEW.cover_image_pending_url := NEW.cover_image_url; NEW.cover_image_status := 'pending'; END IF;
 ELSIF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url AND NEW.cover_image_url IS NOT NULL THEN
   NEW.cover_image_pending_url := NEW.cover_image_url; NEW.cover_image_status := 'pending'; NEW.cover_page_title := NULL; NEW.cover_image_flag := NULL;
 ELSIF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url AND NEW.cover_image_url IS NULL AND NEW.cover_image_status = OLD.cover_image_status THEN
   NEW.cover_image_pending_url := NULL; NEW.cover_image_status := 'rejected';
 END IF;
 IF TG_OP = 'UPDATE' AND NEW.cover_image_pending_url IS DISTINCT FROM OLD.cover_image_pending_url AND NEW.cover_image_pending_url IS NOT NULL AND NEW.cover_image_status <> 'rejected' THEN NEW.cover_image_status := 'pending'; END IF;
 IF NEW.cover_image_status = 'approved' THEN
   IF NEW.cover_image_pending_url IS NULL OR NEW.cover_image_flag IS NOT NULL THEN RAISE EXCEPTION 'A cover needs an unflagged candidate before approval'; END IF;
   NEW.cover_image_url := NEW.cover_image_pending_url;
 ELSE NEW.cover_image_url := NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER enforce_organisation_cover_review BEFORE INSERT OR UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.enforce_cover_review();
CREATE TRIGGER enforce_event_cover_review BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.enforce_cover_review();
REVOKE SELECT ON public.organisations FROM anon;
REVOKE SELECT (contact_email,cover_image_pending_url,cover_page_title,cover_image_flag,website_health_status,website_health_title,website_health_reason,website_health_checked_at) ON public.organisations FROM anon;
GRANT SELECT (id,slug,status,source_url,last_checked,published_at,created_at,updated_at,created_by,name,type,short_description,description,website,logo_url,city,founded_year,linkedin_url,contact_email_public,ticket_min_eur,ticket_max_eur,cover_image_url,cover_image_status) ON public.organisations TO anon;
REVOKE SELECT ON public.events FROM anon;
GRANT SELECT (id,slug,status,source_url,last_checked,published_at,created_at,updated_at,created_by,title,event_type,summary,description,starts_at,ends_at,apply_deadline_at,timezone,format,venue,city,registration_url,price_note,cover_image_url,cover_image_status) ON public.events TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.organisations,public.events TO authenticated;
GRANT ALL ON public.organisations,public.events TO service_role;