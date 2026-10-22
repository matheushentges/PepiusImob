-- Featured listings are curated by the agency and shown first on the public home.
-- Non-destructive: existing properties keep the default (not featured).
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_tenant_featured
  ON public.properties(tenant_id, featured)
  WHERE featured = true;
