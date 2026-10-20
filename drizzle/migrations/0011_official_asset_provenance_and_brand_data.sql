ALTER TABLE public.organisations ADD COLUMN image_source_url text, ADD COLUMN image_source text, ADD COLUMN image_uploaded_by uuid, ADD COLUMN logo_image_source_url text, ADD COLUMN logo_image_source text, ADD COLUMN logo_uploaded_by uuid, ADD COLUMN brand_logo_light_url text, ADD COLUMN brand_logo_dark_url text, ADD COLUMN brand_cover_urls jsonb NOT NULL DEFAULT '[]', ADD COLUMN brand_accent text, ADD COLUMN brand_dark text, ADD COLUMN brand_light text, ADD COLUMN brand_fetched_at timestamptz, ADD COLUMN brand_fetch_status text, ADD COLUMN brand_fetch_reason text;
ALTER TABLE public.events ADD COLUMN image_source_url text, ADD COLUMN image_source text, ADD COLUMN image_uploaded_by uuid, ADD COLUMN logo_url text, ADD COLUMN logo_image_source_url text, ADD COLUMN logo_image_source text, ADD COLUMN logo_uploaded_by uuid;
CREATE OR REPLACE FUNCTION public.asset_domain(_url text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT CASE WHEN _url ~* '^https?://[^/@:]+([/:?#]|$)' THEN lower(regexp_replace(split_part(split_part(split_part(regexp_replace(_url,'^https?://','','i'), '/',1),'?',1),'#',1),'^www\.','','i')) END $$;
CREATE OR REPLACE FUNCTION public.asset_on_domain(_url text, _website text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT coalesce(public.asset_domain(_url) = public.asset_domain(_website) OR right(public.asset_domain(_url), length(public.asset_domain(_website))+1) = '.' || public.asset_domain(_website), false) $$;
CREATE OR REPLACE FUNCTION public.is_admin_media_asset(_url text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT coalesce(public.asset_domain(_url) = 'lbhrwntmzbxolyxvxxgu.supabase.co' AND EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id='media' AND o.name = split_part(substring(_url from '/storage/v1/object/(?:sign|authenticated|public)/media/(.*)'), '?', 1)), false) $$;
REVOKE ALL ON FUNCTION public.is_admin_media_asset(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_media_asset(text) TO authenticated, service_role;
UPDATE public.organisations SET image_source_url=website, image_source='website' WHERE cover_image_pending_url IS NOT NULL;
UPDATE public.events SET image_source_url=coalesce(registration_url,source_url), image_source='website' WHERE cover_image_pending_url IS NOT NULL;
UPDATE public.organisations SET cover_image_status='pending', cover_image_url=NULL WHERE cover_image_status='approved' AND NOT public.asset_on_domain(cover_image_pending_url,website);
UPDATE public.events SET cover_image_status='pending', cover_image_url=NULL WHERE cover_image_status='approved' AND NOT public.asset_on_domain(cover_image_pending_url,coalesce(registration_url,source_url));
CREATE OR REPLACE FUNCTION public.enforce_cover_review() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE website_url text; authorised_source boolean;
BEGIN
 website_url := CASE WHEN TG_TABLE_NAME='organisations' THEN to_jsonb(NEW)->>'website' ELSE coalesce(to_jsonb(NEW)->>'registration_url',to_jsonb(NEW)->>'source_url') END;
 IF TG_OP='INSERT' THEN
  IF NEW.cover_image_url IS NOT NULL THEN NEW.cover_image_pending_url:=NEW.cover_image_url; NEW.cover_image_status:='pending'; END IF;
 ELSIF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url AND NEW.cover_image_url IS NOT NULL THEN
  NEW.cover_image_pending_url:=NEW.cover_image_url; NEW.cover_image_status:='pending'; NEW.cover_page_title:=NULL; NEW.cover_image_flag:=NULL;
 ELSIF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url AND NEW.cover_image_url IS NULL AND NEW.cover_image_status=OLD.cover_image_status THEN
  NEW.cover_image_pending_url:=NULL; NEW.cover_image_status:='rejected';
 END IF;
 IF TG_OP='UPDATE' AND (NEW.cover_image_pending_url IS DISTINCT FROM OLD.cover_image_pending_url OR NEW.image_source_url IS DISTINCT FROM OLD.image_source_url OR NEW.image_source IS DISTINCT FROM OLD.image_source OR website_url IS DISTINCT FROM CASE WHEN TG_TABLE_NAME='organisations' THEN to_jsonb(OLD)->>'website' ELSE coalesce(to_jsonb(OLD)->>'registration_url',to_jsonb(OLD)->>'source_url') END) AND NEW.cover_image_pending_url IS NOT NULL AND NEW.cover_image_status<>'rejected' THEN NEW.cover_image_status:='pending'; END IF;
 IF NEW.image_source='admin_upload' THEN
  IF NOT public.is_admin_media_asset(NEW.cover_image_pending_url) THEN RAISE EXCEPTION 'An admin upload must be an uploaded media file'; END IF;
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin') THEN NEW.image_uploaded_by:=auth.uid(); END IF;
 END IF;
 IF NEW.cover_image_status='approved' THEN
  IF NEW.cover_image_pending_url IS NULL OR NEW.cover_image_flag IS NOT NULL THEN RAISE EXCEPTION 'A cover needs an unflagged candidate before approval'; END IF;
  authorised_source := CASE NEW.image_source WHEN 'website' THEN public.asset_on_domain(NEW.image_source_url,website_url) AND public.asset_on_domain(NEW.cover_image_pending_url,website_url) WHEN 'admin_upload' THEN NEW.image_uploaded_by IS NOT NULL AND public.is_admin_media_asset(NEW.cover_image_pending_url) WHEN 'brandfetch' THEN NEW.image_source_url ~ '^https://api\.brandfetch\.io/v2/brands/domain/' AND NEW.cover_image_pending_url ~ '^https://' ELSE false END;
  IF NOT coalesce(authorised_source,false) THEN RAISE EXCEPTION 'Only own-domain assets, admin uploads or Brandfetch assets can be approved'; END IF;
  NEW.cover_image_url:=NEW.cover_image_pending_url;
 ELSE NEW.cover_image_url:=NULL; END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.enforce_official_logo() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE website_url text;
BEGIN
 website_url:=CASE WHEN TG_TABLE_NAME='organisations' THEN to_jsonb(NEW)->>'website' ELSE coalesce(to_jsonb(NEW)->>'registration_url',to_jsonb(NEW)->>'source_url') END;
 IF NEW.logo_url IS NULL THEN RETURN NEW; END IF;
 IF NEW.logo_image_source='admin_upload' AND public.is_admin_media_asset(NEW.logo_url) THEN
  NEW.logo_image_source_url:=NEW.logo_url; IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin') THEN NEW.logo_uploaded_by:=auth.uid(); END IF;
 ELSIF NEW.logo_image_source='website' AND public.asset_on_domain(NEW.logo_url,website_url) AND public.asset_on_domain(NEW.logo_image_source_url,website_url) THEN NULL;
 ELSIF NEW.logo_image_source='brandfetch' AND NEW.logo_image_source_url ~ '^https://api\.brandfetch\.io/v2/brands/domain/' AND NEW.logo_url ~ '^https://' THEN NULL;
 ELSE RAISE EXCEPTION 'Logo must come from the official website, Brandfetch or an admin upload'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER enforce_official_organisation_logo BEFORE INSERT OR UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.enforce_official_logo();
CREATE TRIGGER enforce_official_event_logo BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.enforce_official_logo();
GRANT SELECT(image_source_url,image_source,logo_image_source_url,logo_image_source,brand_accent,brand_dark,brand_light,brand_logo_light_url,brand_logo_dark_url) ON public.organisations TO anon;
GRANT SELECT(image_source_url,image_source,logo_url,logo_image_source_url,logo_image_source) ON public.events TO anon;
COMMENT ON COLUMN public.organisations.image_source_url IS 'Provenance for the current cover candidate, public only with the approved image in application reads.';
COMMENT ON COLUMN public.organisations.logo_image_source_url IS 'Provenance for official logo. Brandfetch API metadata, own-domain source or admin media upload.';