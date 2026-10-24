ALTER TYPE public.org_relation ADD VALUE IF NOT EXISTS 'part_of';
ALTER TABLE public.organisations ADD COLUMN logo_resolved_url text, ADD COLUMN logo_tone text NOT NULL DEFAULT 'dark', ADD COLUMN logo_status text NOT NULL DEFAULT 'missing', ADD COLUMN logo_checked_at timestamptz, ADD COLUMN logo_check_error text, ADD COLUMN logo_shared_from uuid REFERENCES public.organisations(id), ADD COLUMN logo_manual_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.organisations ADD CONSTRAINT resolved_logo_tone CHECK(logo_tone IN ('dark','light')), ADD CONSTRAINT resolved_logo_status CHECK(logo_status IN ('ok','light','missing'));
GRANT SELECT(logo_resolved_url,logo_tone,logo_status,logo_checked_at,logo_shared_from,logo_manual_required) ON public.organisations TO anon;
CREATE FUNCTION public.invalidate_logo_check() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.website IS DISTINCT FROM OLD.website OR NEW.logo_url IS DISTINCT FROM OLD.logo_url OR NEW.logo_choice IS DISTINCT FROM OLD.logo_choice THEN
NEW.logo_checked_at=NULL; NEW.logo_shared_from=NULL;
IF NEW.logo_choice='upload' OR NEW.logo_image_source='admin_upload' THEN NEW.logo_resolved_url=NEW.logo_url; NEW.logo_status=CASE WHEN NEW.logo_url IS NULL THEN 'missing' ELSE 'ok' END; NEW.logo_manual_required=false;
ELSE NEW.logo_resolved_url=NULL; NEW.logo_status='missing'; END IF;
END IF; RETURN NEW; END; $$;
CREATE TRIGGER invalidate_logo_check BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.invalidate_logo_check();