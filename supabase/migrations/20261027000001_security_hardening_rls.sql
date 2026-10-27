-- Migration: Security Hardening & RLS Optimization
-- Date: 2026-10-27
-- Description:
-- 1. Revoke direct authenticated PostgREST access to calendar_settings (prevent OAuth token leak)
-- 2. Restrict property and client deletions to imobiliaria_owner
-- 3. Optimize RLS on clients, client_notes, property_keys, and key_movements using current_user_tenant_id()

-- ---------------------------------------------------------------------
-- 1. calendar_settings: Bloqueio de acesso direto authenticated (Tokens OAuth)
-- ---------------------------------------------------------------------
REVOKE ALL ON public.calendar_settings FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_settings TO service_role;

DROP POLICY IF EXISTS "calendar_settings_tenant_select" ON public.calendar_settings;
DROP POLICY IF EXISTS "calendar_settings_tenant_update" ON public.calendar_settings;
DROP POLICY IF EXISTS "calendar_settings_tenant_insert" ON public.calendar_settings;

-- ---------------------------------------------------------------------
-- 2. properties: Restringir DELETE para 'imobiliaria_owner'
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Active license required to delete properties" ON public.properties;
CREATE POLICY "Active license required to delete properties"
ON public.properties FOR DELETE TO authenticated
USING (
  tenant_id = public.current_user_tenant_id()
  AND public.license_has_feature('properties')
  AND public.current_user_role() = 'imobiliaria_owner'
);

-- ---------------------------------------------------------------------
-- 3. clients: Otimização RLS com helper functions e DELETE restrito a owner
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "clients_tenant_select" ON public.clients;
CREATE POLICY "clients_tenant_select" ON public.clients
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "clients_tenant_insert" ON public.clients;
CREATE POLICY "clients_tenant_insert" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "clients_tenant_update" ON public.clients;
CREATE POLICY "clients_tenant_update" ON public.clients
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "clients_tenant_delete" ON public.clients;
CREATE POLICY "clients_tenant_delete" ON public.clients
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'imobiliaria_owner'
  );

-- ---------------------------------------------------------------------
-- 4. client_notes: Otimização RLS com helper functions
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "client_notes_tenant_select" ON public.client_notes;
CREATE POLICY "client_notes_tenant_select" ON public.client_notes
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "client_notes_tenant_insert" ON public.client_notes;
CREATE POLICY "client_notes_tenant_insert" ON public.client_notes
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "client_notes_tenant_delete" ON public.client_notes;
CREATE POLICY "client_notes_tenant_delete" ON public.client_notes
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'imobiliaria_owner'
  );

-- ---------------------------------------------------------------------
-- 5. property_keys: Otimização RLS e DELETE restrito a owner
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "property_keys_tenant_select" ON public.property_keys;
CREATE POLICY "property_keys_tenant_select" ON public.property_keys
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "property_keys_tenant_insert" ON public.property_keys;
CREATE POLICY "property_keys_tenant_insert" ON public.property_keys
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "property_keys_tenant_update" ON public.property_keys;
CREATE POLICY "property_keys_tenant_update" ON public.property_keys
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "property_keys_tenant_delete" ON public.property_keys;
CREATE POLICY "property_keys_tenant_delete" ON public.property_keys
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'imobiliaria_owner'
  );

-- ---------------------------------------------------------------------
-- 6. key_movements: Otimização RLS e DELETE restrito a owner
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "key_movements_tenant_select" ON public.key_movements;
CREATE POLICY "key_movements_tenant_select" ON public.key_movements
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "key_movements_tenant_insert" ON public.key_movements;
CREATE POLICY "key_movements_tenant_insert" ON public.key_movements
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "key_movements_tenant_update" ON public.key_movements;
CREATE POLICY "key_movements_tenant_update" ON public.key_movements
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "key_movements_tenant_delete" ON public.key_movements;
CREATE POLICY "key_movements_tenant_delete" ON public.key_movements
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'imobiliaria_owner'
  );

-- ---------------------------------------------------------------------
-- 7. tenants: Permitir que imobiliaria_owner atualize 'nome' e 'site_config'
-- ---------------------------------------------------------------------
GRANT UPDATE (nome, site_config) ON public.tenants TO authenticated;
