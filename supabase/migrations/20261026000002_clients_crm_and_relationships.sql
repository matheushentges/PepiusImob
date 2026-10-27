-- Migration: Clients CRM, Relationships and Opportunity Matching
-- Author: Antigravity
-- Date: 2026-10-26

DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('pf', 'pj');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('ativo', 'inativo', 'potencial', 'arquivado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de clientes (unificada: proprietário, comprador, locatário, fiador)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo_pessoa client_type NOT NULL DEFAULT 'pf',
  papeis TEXT[] NOT NULL DEFAULT ARRAY['comprador']::TEXT[],
  status client_status NOT NULL DEFAULT 'ativo',
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  documento TEXT,
  rg_ie TEXT,
  data_nascimento DATE,
  profissao TEXT,
  estado_civil TEXT,
  regime_bens TEXT,
  conjuge_nome TEXT,
  conjuge_cpf TEXT,
  email TEXT,
  email_secundario TEXT,
  telefone TEXT NOT NULL,
  telefone_secundario TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  dados_bancarios JSONB DEFAULT '{}'::JSONB,
  perfil_interesse JSONB DEFAULT '{}'::JSONB,
  corretor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_status ON public.clients(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_documento ON public.clients(tenant_id, documento);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_nome ON public.clients(tenant_id, nome);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_corretor ON public.clients(tenant_id, corretor_id);
CREATE INDEX IF NOT EXISTS idx_clients_papeis ON public.clients USING GIN (papeis);

-- Tabela de anotações internas / timeline de atendimento do cliente
CREATE TABLE IF NOT EXISTS public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client ON public.client_notes(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_notes_tenant ON public.client_notes(tenant_id);

-- Integrações e relacionamentos com tabelas existentes
-- 1. Leads -> Cliente
DO $$ BEGIN
  ALTER TABLE public.leads ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
CREATE INDEX IF NOT EXISTS idx_leads_client ON public.leads(client_id);

-- 2. Imóveis -> Proprietário
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN proprietario_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
CREATE INDEX IF NOT EXISTS idx_properties_proprietario ON public.properties(proprietario_id);

-- 3. Movimentações de Chaves -> Cliente responsável
DO $$ BEGIN
  ALTER TABLE public.key_movements ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
CREATE INDEX IF NOT EXISTS idx_key_movements_client ON public.key_movements(client_id);

-- RLS para clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clients FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated, service_role;

DROP POLICY IF EXISTS "clients_tenant_select" ON public.clients;
CREATE POLICY "clients_tenant_select" ON public.clients
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clients_tenant_insert" ON public.clients;
CREATE POLICY "clients_tenant_insert" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clients_tenant_update" ON public.clients;
CREATE POLICY "clients_tenant_update" ON public.clients
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clients_tenant_delete" ON public.clients;
CREATE POLICY "clients_tenant_delete" ON public.clients
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- RLS para client_notes
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_notes FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated, service_role;

DROP POLICY IF EXISTS "client_notes_tenant_select" ON public.client_notes;
CREATE POLICY "client_notes_tenant_select" ON public.client_notes
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "client_notes_tenant_insert" ON public.client_notes;
CREATE POLICY "client_notes_tenant_insert" ON public.client_notes
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "client_notes_tenant_update" ON public.client_notes;
CREATE POLICY "client_notes_tenant_update" ON public.client_notes
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "client_notes_tenant_delete" ON public.client_notes;
CREATE POLICY "client_notes_tenant_delete" ON public.client_notes
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
