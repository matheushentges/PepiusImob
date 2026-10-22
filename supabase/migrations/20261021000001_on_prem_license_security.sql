-- The property application keeps only a verified runtime lease locally.
-- Commercial license, payment and installation records live in the separate
-- Pepius control-plane database.

CREATE TABLE IF NOT EXISTS public.local_license_state (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  installation_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'suspended')),
  features TEXT[] NOT NULL DEFAULT '{}',
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  signed_lease JSONB,
  last_heartbeat_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.local_license_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.local_license_state FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.local_license_state TO service_role;

CREATE OR REPLACE FUNCTION public.license_allows_app()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.local_license_state AS license
    WHERE license.id = 1
      AND license.status = 'active'
      AND license.expires_at > NOW()
  );
$$;

REVOKE ALL ON FUNCTION public.license_allows_app() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.license_allows_app() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.license_has_feature(p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.local_license_state AS license
    WHERE license.id = 1
      AND license.status = 'active'
      AND license.expires_at > NOW()
      AND p_feature = ANY(license.features)
  );
$$;

REVOKE ALL ON FUNCTION public.license_has_feature(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.license_has_feature(TEXT) TO anon, authenticated, service_role;

-- Prevent public signup metadata from granting privileged roles or tenant IDs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'nome'), ''), NEW.email),
    'cliente'::public.user_role,
    NULL
  );
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.create_admin_user(TEXT, TEXT, TEXT);


CREATE TABLE IF NOT EXISTS public.public_lead_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0)
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS horario_preferido TEXT
  CHECK (horario_preferido IS NULL OR horario_preferido IN ('manha', 'tarde', 'noite'));

ALTER TABLE public.public_lead_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.public_lead_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_lead_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_public_lead_rate_limit(
  p_ip_hash TEXT,
  p_window_seconds INTEGER DEFAULT 900,
  p_max_requests INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF p_ip_hash IS NULL OR length(p_ip_hash) < 32
     OR p_window_seconds < 1 OR p_window_seconds > 86400
     OR p_max_requests < 1 OR p_max_requests > 100 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.public_lead_rate_limits AS limits (
    ip_hash, window_started_at, request_count
  ) VALUES (p_ip_hash, NOW(), 1)
  ON CONFLICT (ip_hash) DO UPDATE
  SET window_started_at = CASE
        WHEN limits.window_started_at + make_interval(secs => p_window_seconds) <= NOW()
          THEN NOW()
        ELSE limits.window_started_at
      END,
      request_count = CASE
        WHEN limits.window_started_at + make_interval(secs => p_window_seconds) <= NOW()
          THEN 1
        ELSE limits.request_count + 1
      END
  RETURNING request_count INTO current_count;

  DELETE FROM public.public_lead_rate_limits
  WHERE window_started_at < NOW() - INTERVAL '1 day';

  RETURN current_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_lead_rate_limit(TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_lead_rate_limit(TEXT, INTEGER, INTEGER)
  TO service_role;

-- Remove broad owner/admin access from the agency database. A single on-prem
-- installation owns one agency; operator functions belong in the control plane.
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Permitir leitura pública de domínios ativos" ON public.tenants;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_same_tenant" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_by_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manage_by_admin" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can update their properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can delete their properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view images of available properties" ON public.property_images;
DROP POLICY IF EXISTS "Tenant users can manage images of their properties" ON public.property_images;
DROP POLICY IF EXISTS "Tenant users can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Tenant users can update their leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Tenant users can view their licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can view all channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "System can insert conversations (webhooks)" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "System can insert messages (webhooks)" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all training data" ON public.ai_training_data;
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;

-- Omnichannel and AI are not shipped in the agency application. Their dormant
-- tables are not exposed until a later product version adds a reviewed API.
REVOKE ALL ON public.channels, public.conversations, public.messages, public.ai_training_data
  FROM PUBLIC, anon, authenticated;

CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT TO authenticated
USING (id = public.current_user_tenant_id());

CREATE POLICY "Agency owner can update site configuration"
ON public.tenants FOR UPDATE TO authenticated
USING (
  id = public.current_user_tenant_id()
  AND public.current_user_role() = 'imobiliaria_owner'
)
WITH CHECK (
  id = public.current_user_tenant_id()
  AND public.current_user_role() = 'imobiliaria_owner'
);

-- Public data is served by a server-only projection. Raw tables contain the
-- agency contact details and exact property addresses and stay private.
REVOKE ALL ON public.tenants, public.properties, public.property_images, public.leads, public.profiles
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.tenants, public.profiles TO authenticated;
GRANT UPDATE (site_config) ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties, public.property_images TO authenticated;
GRANT SELECT, UPDATE ON public.leads TO authenticated;

CREATE POLICY "Users can read only their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Tenant users can read their properties"
ON public.properties FOR SELECT TO authenticated
USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY "Active license required to insert properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_user_tenant_id()
  AND public.license_has_feature('properties')
);

CREATE POLICY "Active license required to update properties"
ON public.properties FOR UPDATE TO authenticated
USING (
  tenant_id = public.current_user_tenant_id()
  AND public.license_has_feature('properties')
)
WITH CHECK (
  tenant_id = public.current_user_tenant_id()
  AND public.license_has_feature('properties')
);

CREATE POLICY "Active license required to delete properties"
ON public.properties FOR DELETE TO authenticated
USING (
  tenant_id = public.current_user_tenant_id()
  AND public.license_has_feature('properties')
);

CREATE POLICY "Tenant users can read their property images"
ON public.property_images FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.tenant_id = public.current_user_tenant_id()
  )
);

CREATE POLICY "Public can read licensed property images"
ON public.property_images FOR SELECT TO anon, authenticated
USING (
  public.license_has_feature('public-listing')
  AND EXISTS (
    SELECT 1 FROM public.properties
    JOIN public.tenants ON tenants.id = properties.tenant_id
    WHERE properties.id = property_images.property_id
      AND properties.status = 'disponivel'
      AND tenants.active = TRUE
  )
);

CREATE POLICY "Active license required to add property images"
ON public.property_images FOR INSERT TO authenticated
WITH CHECK (
  public.license_has_feature('properties')
  AND EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.tenant_id = public.current_user_tenant_id()
  )
);

CREATE POLICY "Active license required to update property images"
ON public.property_images FOR UPDATE TO authenticated
USING (
  public.license_has_feature('properties')
  AND EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.tenant_id = public.current_user_tenant_id()
  )
)
WITH CHECK (
  public.license_has_feature('properties')
  AND EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.tenant_id = public.current_user_tenant_id()
  )
);

CREATE POLICY "Active license required to delete property images"
ON public.property_images FOR DELETE TO authenticated
USING (
  public.license_has_feature('properties')
  AND EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.tenant_id = public.current_user_tenant_id()
  )
);

CREATE POLICY "Tenant users can read their leads"
ON public.leads FOR SELECT TO authenticated
USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY "Active license required to update leads"
ON public.leads FOR UPDATE TO authenticated
USING (
  tenant_id = public.current_user_tenant_id()
  AND public.license_has_feature('leads')
)
WITH CHECK (
  tenant_id = public.current_user_tenant_id()
  AND public.license_has_feature('leads')
);

-- No direct anonymous lead inserts. The public contact handler validates the
-- property, rate-limits the request and writes with its server-only database key.
REVOKE INSERT ON public.leads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO service_role;

-- Old commercial license rows and global admin APIs are no longer part of the
-- agency database. Export any real billing records before applying this migration.
DROP TABLE IF EXISTS public.licenses;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS license_expires_at;
DROP TYPE IF EXISTS public.license_plan;

-- Remove the old global owner account and the demo agency installed by the
-- legacy SaaS seed. A real on-prem agency is provisioned per installation.
UPDATE public.profiles
SET tenant_id = NULL,
    role = 'cliente'::public.user_role,
    updated_at = NOW()
WHERE role = 'admin'::public.user_role;

DELETE FROM public.tenants
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID
   OR slug = 'pepius-admin';

DELETE FROM public.tenants
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID
   OR slug = 'imobiliaria-exemplo';

-- Property photos are served through short-lived signed URLs so a suspended
-- installation does not leave a permanent public Storage URL.
UPDATE storage.buckets SET public = FALSE WHERE id = 'property-images';
DROP POLICY IF EXISTS "Leitura pública de imagens de imóveis" ON storage.objects;
DROP POLICY IF EXISTS "Upload de imagens por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Exclusão de imagens por usuários autenticados" ON storage.objects;

CREATE POLICY "Tenant users can read their property image objects"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = public.current_user_tenant_id()::TEXT
);

CREATE POLICY "Active tenant users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND public.license_has_feature('properties')
  AND (storage.foldername(name))[1] = public.current_user_tenant_id()::TEXT
);

CREATE POLICY "Active tenant users can delete property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images'
  AND public.license_has_feature('properties')
  AND (storage.foldername(name))[1] = public.current_user_tenant_id()::TEXT
);