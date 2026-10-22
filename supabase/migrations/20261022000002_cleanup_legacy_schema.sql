-- Remove legacy tables from disconnected SaaS omnichannel/AI scopes.
-- These features are not part of the single-tenant on-premise product.
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.ai_training_data CASCADE;

-- Remove legacy SaaS subdomain and routing columns from tenants.
-- On-premise deployments resolve directly through dedicated host and reverse proxy (Caddy).
ALTER TABLE public.tenants
  DROP COLUMN IF EXISTS subdomain,
  DROP COLUMN IF EXISTS custom_domain,
  DROP COLUMN IF EXISTS domain_verified;
