-- Migration: Google Calendar Settings & Visit Leads Enrichment
-- Author: Antigravity
-- Date: 2026-10-23

CREATE TABLE IF NOT EXISTS public.calendar_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Credenciais OAuth 2.0 Google
  google_client_id TEXT,
  google_client_secret TEXT,
  google_refresh_token TEXT,
  google_access_token TEXT,
  google_token_expires_at TIMESTAMPTZ,
  google_calendar_id TEXT DEFAULT 'primary',
  connected_email TEXT,

  -- Regras de Janela de Visita
  visit_duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (visit_duration_minutes IN (15, 30, 45, 60, 90, 120)),
  buffer_minutes INTEGER NOT NULL DEFAULT 15 CHECK (buffer_minutes IN (0, 10, 15, 30, 45, 60)),
  min_notice_hours INTEGER NOT NULL DEFAULT 2 CHECK (min_notice_hours >= 0 AND min_notice_hours <= 72),
  max_days_ahead INTEGER NOT NULL DEFAULT 30 CHECK (max_days_ahead >= 1 AND max_days_ahead <= 90),
  
  -- Grade de Atendimento Semanal
  operating_hours JSONB NOT NULL DEFAULT '{
    "monday":    {"enabled": true,  "start": "09:00", "end": "18:00"},
    "tuesday":   {"enabled": true,  "start": "09:00", "end": "18:00"},
    "wednesday": {"enabled": true,  "start": "09:00", "end": "18:00"},
    "thursday":  {"enabled": true,  "start": "09:00", "end": "18:00"},
    "friday":    {"enabled": true,  "start": "09:00", "end": "18:00"},
    "saturday":  {"enabled": true,  "start": "09:00", "end": "13:00"},
    "sunday":    {"enabled": false, "start": "09:00", "end": "13:00"}
  }'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_calendar UNIQUE (tenant_id)
);

ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.calendar_settings FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.calendar_settings TO authenticated, service_role;

DROP POLICY IF EXISTS "calendar_settings_tenant_select" ON public.calendar_settings;
CREATE POLICY "calendar_settings_tenant_select" ON public.calendar_settings
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "calendar_settings_tenant_update" ON public.calendar_settings;
CREATE POLICY "calendar_settings_tenant_update" ON public.calendar_settings
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "calendar_settings_tenant_insert" ON public.calendar_settings;
CREATE POLICY "calendar_settings_tenant_insert" ON public.calendar_settings
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Enriquecimento da tabela leads
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS visit_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS google_event_link TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_visit_starts_at ON public.leads(visit_starts_at) WHERE visit_starts_at IS NOT NULL;
