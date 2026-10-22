-- =====================================================
-- FIX: Recursão infinita nas políticas RLS de profiles
-- Causa raiz: subqueries em USING() que referenciam a própria
-- tabela profiles causam erro 42P17 no PostgREST/Supabase.
-- Solução: funções SECURITY DEFINER no schema public que
-- leem profiles bypassando RLS, usadas nas políticas.
-- =====================================================

-- 1. Funções que leem profiles sem passar pelo RLS.
-- Elas só consultam o usuário da sessão; não aceitam IDs arbitrários.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT p.role::text
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS uuid AS $$
  SELECT p.tenant_id
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated;

-- 2. Remover TODAS as políticas antigas de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_read" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_manage_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_by_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_same_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_manage_by_admin" ON profiles;

-- Remover as variantes inseguras de uma edição anterior dessa migration.
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_tenant(uuid);

-- 3. Novas políticas usando funções SECURITY DEFINER (zero recursão)

CREATE POLICY "profiles_select_self"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_select_by_admin"
ON profiles FOR SELECT TO authenticated
USING (public.current_user_role() = 'admin');

CREATE POLICY "profiles_select_same_tenant"
ON profiles FOR SELECT TO authenticated
USING (tenant_id IS NOT NULL AND tenant_id = public.current_user_tenant_id());

CREATE POLICY "profiles_update_self"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role::text = public.current_user_role()
  AND tenant_id IS NOT DISTINCT FROM public.current_user_tenant_id()
);

CREATE POLICY "profiles_manage_by_admin"
ON profiles FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');


-- Application helpers live in public; Supabase Cloud protects the auth schema.
