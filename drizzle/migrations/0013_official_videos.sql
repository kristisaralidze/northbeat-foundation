ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS video_url text, ADD COLUMN IF NOT EXISTS video_source_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_url text, ADD COLUMN IF NOT EXISTS video_source_url text;
ALTER TABLE public.organisations ADD CONSTRAINT organisations_video_platform CHECK (video_url IS NULL OR (video_url ~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/' AND video_source_url ~* '^https://(www\.)?(youtube\.com|vimeo\.com)/'));
ALTER TABLE public.events ADD CONSTRAINT events_video_platform CHECK (video_url IS NULL OR (video_url ~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/' AND video_source_url ~* '^https://(www\.)?(youtube\.com|vimeo\.com)/'));
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.column_privileges WHERE table_name='organisations' AND column_name='name' AND grantee='anon') THEN
    GRANT SELECT (video_url, video_source_url) ON public.organisations TO anon;
  END IF;
END $$;
GRANT SELECT (video_url, video_source_url) ON public.organisations TO authenticated;
GRANT SELECT ON public.events TO anon, authenticated;