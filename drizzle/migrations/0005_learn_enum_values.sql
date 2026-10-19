ALTER TYPE public.term_kind ADD VALUE IF NOT EXISTS 'area';
ALTER TYPE public.term_kind ADD VALUE IF NOT EXISTS 'journey_step';
ALTER TYPE public.entry_kind ADD VALUE IF NOT EXISTS 'glossary_term';
CREATE TYPE public.guide_level AS ENUM ('beginner', 'intermediate');