-- Migration: Property Keys Allocation and Claviculário Movement History
-- Author: Antigravity
-- Date: 2026-10-26

DO $$ BEGIN
  CREATE TYPE key_status AS ENUM ('disponivel', 'com_consultor', 'com_cliente', 'em_manutencao', 'outros');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE key_holder_type AS ENUM ('consultor', 'cliente', 'prestador', 'outros');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de chaveiro/identificação de chaves do imóvel no claviculário
CREATE TABLE IF NOT EXISTS public.property_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  status key_status NOT NULL DEFAULT 'disponivel',
  localizacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_property_keys_property UNIQUE (property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_keys_tenant_property ON public.property_keys(tenant_id, property_id);
CREATE INDEX IF NOT EXISTS idx_property_keys_tenant_status ON public.property_keys(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_property_keys_codigo ON public.property_keys(tenant_id, codigo);

-- Tabela de movimentações e histórico (Check-out e Check-in de chaves)
CREATE TABLE IF NOT EXISTS public.key_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key_id UUID NOT NULL REFERENCES public.property_keys(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tipo_responsavel key_holder_type NOT NULL,
  consultor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome_responsavel TEXT NOT NULL,
  telefone_responsavel TEXT,
  documento_responsavel TEXT,
  motivo TEXT,
  data_saida TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previsao_retorno TIMESTAMPTZ,
  data_devolucao TIMESTAMPTZ,
  observacoes_saida TEXT,
  observacoes_devolucao TEXT,
  registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recebido_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_key_movements_tenant ON public.key_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_key_movements_key ON public.key_movements(key_id);
CREATE INDEX IF NOT EXISTS idx_key_movements_property ON public.key_movements(property_id);
CREATE INDEX IF NOT EXISTS idx_key_movements_open ON public.key_movements(key_id, data_devolucao) WHERE data_devolucao IS NULL;
CREATE INDEX IF NOT EXISTS idx_key_movements_data_saida ON public.key_movements(tenant_id, data_saida DESC);

-- RLS para property_keys
ALTER TABLE public.property_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.property_keys FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_keys TO authenticated, service_role;

DROP POLICY IF EXISTS "property_keys_tenant_select" ON public.property_keys;
CREATE POLICY "property_keys_tenant_select" ON public.property_keys
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "property_keys_tenant_insert" ON public.property_keys;
CREATE POLICY "property_keys_tenant_insert" ON public.property_keys
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "property_keys_tenant_update" ON public.property_keys;
CREATE POLICY "property_keys_tenant_update" ON public.property_keys
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "property_keys_tenant_delete" ON public.property_keys;
CREATE POLICY "property_keys_tenant_delete" ON public.property_keys
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- RLS para key_movements
ALTER TABLE public.key_movements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.key_movements FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.key_movements TO authenticated, service_role;

DROP POLICY IF EXISTS "key_movements_tenant_select" ON public.key_movements;
CREATE POLICY "key_movements_tenant_select" ON public.key_movements
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "key_movements_tenant_insert" ON public.key_movements;
CREATE POLICY "key_movements_tenant_insert" ON public.key_movements
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "key_movements_tenant_update" ON public.key_movements;
CREATE POLICY "key_movements_tenant_update" ON public.key_movements
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "key_movements_tenant_delete" ON public.key_movements;
CREATE POLICY "key_movements_tenant_delete" ON public.key_movements
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
