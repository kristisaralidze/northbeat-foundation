ALTER TABLE public.organisations ADD COLUMN cover_image_url text;
GRANT SELECT (cover_image_url) ON public.organisations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.organisations TO authenticated;
GRANT ALL ON public.organisations TO service_role;