-- Apply this migration only to the Pepius control-plane Supabase project.
-- Never apply it to a realty installation database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.license_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL CHECK (length(trim(agency_name)) BETWEEN 2 AND 160),
  plan TEXT NOT NULL CHECK (length(trim(plan)) BETWEEN 1 AND 80),
  features TEXT[] NOT NULL DEFAULT '{}',
  monthly_amount_cents INTEGER NOT NULL CHECK (monthly_amount_cents >= 0),
  paid_through DATE NOT NULL,
  manually_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.license_activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.license_accounts(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.license_installations (
  id UUID PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.license_accounts(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.license_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.license_accounts(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_through DATE NOT NULL,
  reference TEXT,
  recorded_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.license_audit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_id UUID REFERENCES public.license_accounts(id) ON DELETE SET NULL,
  installation_id UUID,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (length(trim(action)) BETWEEN 1 AND 80),
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS license_activation_codes_license_idx
  ON public.license_activation_codes (license_id, created_at DESC);
CREATE INDEX IF NOT EXISTS license_installations_license_idx
  ON public.license_installations (license_id);
CREATE INDEX IF NOT EXISTS license_payments_license_idx
  ON public.license_payments (license_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS license_audit_events_license_idx
  ON public.license_audit_events (license_id, created_at DESC);

ALTER TABLE public.license_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.license_accounts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.license_activation_codes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.license_installations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.license_payments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.license_audit_events FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_activation_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_installations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_audit_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.license_audit_events_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.activate_license_installation(
  p_code_hash TEXT,
  p_installation_id UUID,
  p_public_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  activation public.license_activation_codes%ROWTYPE;
  existing_license_id UUID;
BEGIN
  SELECT * INTO activation
  FROM public.license_activation_codes
  WHERE code_hash = p_code_hash
  FOR UPDATE;

  IF NOT FOUND OR p_public_key IS NULL OR length(p_public_key) > 2048 THEN
    RETURN NULL;
  END IF;

  IF activation.consumed_at IS NOT NULL THEN
    SELECT license_id INTO existing_license_id
    FROM public.license_installations
    WHERE id = p_installation_id
      AND public_key = p_public_key
      AND active = TRUE;
    RETURN existing_license_id;
  END IF;

  IF activation.expires_at <= NOW() THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.license_installations (id, license_id, public_key)
  VALUES (p_installation_id, activation.license_id, p_public_key);

  UPDATE public.license_activation_codes
  SET consumed_at = NOW()
  WHERE id = activation.id;

  INSERT INTO public.license_audit_events (license_id, installation_id, actor_id, action)
  VALUES (activation.license_id, p_installation_id, 'installation', 'installation.activated');

  RETURN activation.license_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_license_installation(TEXT, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_license_installation(TEXT, UUID, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.issue_license_account(
  p_agency_name TEXT,
  p_plan TEXT,
  p_features TEXT[],
  p_monthly_amount_cents INTEGER,
  p_paid_through DATE,
  p_code_hash TEXT,
  p_activation_expires_at TIMESTAMPTZ,
  p_actor_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  license_id UUID;
BEGIN
  INSERT INTO public.license_accounts (
    agency_name, plan, features, monthly_amount_cents, paid_through
  ) VALUES (
    p_agency_name, p_plan, p_features, p_monthly_amount_cents, p_paid_through
  ) RETURNING id INTO license_id;

  INSERT INTO public.license_activation_codes (
    license_id, code_hash, expires_at, created_by
  ) VALUES (license_id, p_code_hash, p_activation_expires_at, p_actor_id);

  INSERT INTO public.license_audit_events (license_id, actor_id, action, details)
  VALUES (
    license_id,
    p_actor_id,
    'license.issued',
    jsonb_build_object('plan', p_plan, 'features', p_features)
  );

  RETURN license_id;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_license_account(
  TEXT, TEXT, TEXT[], INTEGER, DATE, TEXT, TIMESTAMPTZ, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_license_account(
  TEXT, TEXT, TEXT[], INTEGER, DATE, TEXT, TIMESTAMPTZ, TEXT
) TO service_role;

CREATE OR REPLACE FUNCTION public.record_license_payment(
  p_license_id UUID,
  p_amount_cents INTEGER,
  p_paid_through DATE,
  p_reference TEXT,
  p_actor_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_paid_through DATE;
BEGIN
  SELECT paid_through INTO current_paid_through
  FROM public.license_accounts
  WHERE id = p_license_id
  FOR UPDATE;

  IF NOT FOUND
     OR p_amount_cents <= 0
     OR p_paid_through < CURRENT_DATE
     OR p_paid_through < current_paid_through THEN
    RETURN FALSE;
  END IF;

  UPDATE public.license_accounts
  SET paid_through = p_paid_through,
      manually_suspended = FALSE,
      updated_at = NOW()
  WHERE id = p_license_id;

  INSERT INTO public.license_payments (
    license_id, amount_cents, paid_through, reference, recorded_by
  ) VALUES (
    p_license_id, p_amount_cents, p_paid_through, NULLIF(trim(p_reference), ''), p_actor_id
  );

  INSERT INTO public.license_audit_events (license_id, actor_id, action, details)
  VALUES (
    p_license_id,
    p_actor_id,
    'license.payment_recorded',
    jsonb_build_object('amount_cents', p_amount_cents, 'paid_through', p_paid_through)
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.record_license_payment(UUID, INTEGER, DATE, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_license_payment(UUID, INTEGER, DATE, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.set_license_suspension(
  p_license_id UUID,
  p_suspended BOOLEAN,
  p_actor_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.license_accounts
  SET manually_suspended = p_suspended,
      updated_at = NOW()
  WHERE id = p_license_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.license_audit_events (license_id, actor_id, action)
  VALUES (
    p_license_id,
    p_actor_id,
    CASE WHEN p_suspended THEN 'license.suspended' ELSE 'license.restored' END
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.set_license_suspension(UUID, BOOLEAN, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_license_suspension(UUID, BOOLEAN, TEXT)
  TO service_role;
