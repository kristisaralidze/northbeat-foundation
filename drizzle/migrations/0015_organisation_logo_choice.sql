ALTER TABLE public.organisations ADD COLUMN logo_choice text NOT NULL DEFAULT 'icon' CHECK (logo_choice IN ('icon','icon-dark','logo','logo-dark','symbol','symbol-dark','upload'));
UPDATE public.organisations SET logo_choice='upload' WHERE logo_url IS NOT NULL AND logo_image_source IN ('admin_upload','website');
GRANT SELECT(logo_choice) ON public.organisations TO anon, authenticated;
GRANT UPDATE(logo_choice) ON public.organisations TO authenticated;