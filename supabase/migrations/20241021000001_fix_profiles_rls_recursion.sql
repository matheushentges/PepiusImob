-- =====================================================
-- FIX: Recursão infinita nas políticas RLS de profiles
-- Problema: auth.is_admin() e auth.user_tenant_id() consultam
-- a tabela profiles dentro das próprias políticas de SELECT,
-- causando loop infinito (erro 42P17).
-- Solução: Substituir por políticas inline sem funções auxiliares.
-- =====================================================

-- Remover todas as políticas existentes em profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_tenant" ON profiles;

-- Política 1: Usuário pode ler seu próprio perfil (sem dependência externa)
CREATE POLICY "profiles_self_read"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Admin pode ler todos os perfis
-- Usa subquery direta em vez de auth.is_admin() para evitar recursão
CREATE POLICY "profiles_admin_read_all"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p_check
    WHERE p_check.id = auth.uid() AND p_check.role = 'admin'
  )
);

-- Política 3: Usuários podem ler perfis do mesmo tenant
-- Subquery direta evita chamada recursiva a auth.user_tenant_id()
CREATE POLICY "profiles_tenant_read"
ON profiles FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = (
    SELECT p_t.tenant_id FROM profiles p_t WHERE p_t.id = auth.uid() LIMIT 1
  )
);

-- Política 4: Usuário pode atualizar seu próprio perfil
CREATE POLICY "profiles_self_update"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política 5: Admin pode gerenciar todos os perfis (INSERT/UPDATE/DELETE)
CREATE POLICY "profiles_admin_manage_all"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p_check
    WHERE p_check.id = auth.uid() AND p_check.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p_check
    WHERE p_check.id = auth.uid() AND p_check.role = 'admin'
  )
);

-- Recriar funções auxiliares com SECURITY DEFINER para uso em outras tabelas
-- (estas funções são usadas em policies de properties, leads, etc., não em profiles)
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;