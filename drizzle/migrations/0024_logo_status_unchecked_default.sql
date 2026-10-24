ALTER TABLE public.organisations DROP CONSTRAINT resolved_logo_status;
ALTER TABLE public.organisations ADD CONSTRAINT resolved_logo_status CHECK (logo_status IN ('unchecked','ok','light','missing'));
ALTER TABLE public.organisations ALTER COLUMN logo_status SET DEFAULT 'unchecked';
COMMENT ON COLUMN public.organisations.logo_status IS 'unchecked = no stored check result, show the default Brandfetch icon; ok/light/missing come from the admin browser check only.';