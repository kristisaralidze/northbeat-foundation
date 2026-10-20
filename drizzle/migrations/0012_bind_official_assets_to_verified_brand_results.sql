ALTER TABLE public.organisations ADD COLUMN logo_api_image_source_url text;
UPDATE public.organisations SET logo_api_image_source_url='https://cdn.brandfetch.io/domain/' || public.asset_domain(website) || '/w/128/h/128/fallback/404/type/icon?c=1idCGaWDUDXkjAD579-' WHERE public.asset_domain(website) IS NOT NULL;
GRANT SELECT(logo_api_image_source_url) ON public.organisations TO anon;
CREATE OR REPLACE FUNCTION public.verify_official_asset_provenance() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE source_url text; payload jsonb;
BEGIN
 payload:=to_jsonb(NEW);
 IF TG_TABLE_NAME='organisations' THEN
  NEW.logo_api_image_source_url := CASE WHEN public.asset_domain(NEW.website) IS NOT NULL THEN 'https://cdn.brandfetch.io/domain/' || public.asset_domain(NEW.website) || '/w/128/h/128/fallback/404/type/icon?c=1idCGaWDUDXkjAD579-' END;
  source_url:='https://api.brandfetch.io/v2/brands/domain/' || public.asset_domain(NEW.website);
 END IF;
 IF NEW.logo_url IS NOT NULL AND NEW.logo_image_source='brandfetch' THEN
  IF TG_TABLE_NAME<>'organisations' OR NEW.logo_image_source_url IS DISTINCT FROM source_url OR (NEW.logo_url IS DISTINCT FROM payload->>'brand_logo_light_url' AND NEW.logo_url IS DISTINCT FROM payload->>'brand_logo_dark_url') THEN RAISE EXCEPTION 'Brandfetch logo must match the stored result for this website'; END IF;
 END IF;
 IF NEW.cover_image_status='approved' AND NEW.image_source='brandfetch' THEN
  IF TG_TABLE_NAME<>'organisations' OR NEW.image_source_url IS DISTINCT FROM source_url OR NOT coalesce(payload->'brand_cover_urls' @> jsonb_build_array(NEW.cover_image_pending_url),false) THEN RAISE EXCEPTION 'Brandfetch cover must match the stored result for this website'; END IF;
 END IF;
 IF NEW.cover_image_status='approved' AND NEW.image_source='admin_upload' AND NOT public.has_role(NEW.image_uploaded_by,'admin') THEN RAISE EXCEPTION 'Image uploader must be an admin'; END IF;
 IF NEW.logo_url IS NOT NULL AND NEW.logo_image_source='admin_upload' AND NOT public.has_role(NEW.logo_uploaded_by,'admin') THEN RAISE EXCEPTION 'Logo uploader must be an admin'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zz_verify_official_asset_provenance BEFORE INSERT OR UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.verify_official_asset_provenance();
CREATE TRIGGER zz_verify_official_asset_provenance BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.verify_official_asset_provenance();