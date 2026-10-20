-- Política RLS para permitir leitura pública de subdomain e custom_domain
-- Necessário para o middleware resolver o tenant pelo hostname

-- Habilita RLS na tabela tenants se ainda não estiver habilitado
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop da política se já existir (para idempotência)
DROP POLICY IF EXISTS "Permitir leitura pública de domínios ativos" ON tenants;

-- Política: qualquer pessoa pode ler subdomain e custom_domain de tenants ativos
-- Isso é necessário para o middleware resolver o tenant pelo Host header
CREATE POLICY "Permitir leitura pública de domínios ativos"
ON tenants FOR SELECT
USING (
  active = true AND
  (subdomain IS NOT NULL OR custom_domain IS NOT NULL)
);

-- Comentário explicativo
COMMENT ON POLICY "Permitir leitura pública de domínios ativos" ON tenants IS
'Permite que o middleware consulte subdomain e custom_domain para roteamento multi-tenant. Apenas tenants ativos com domínio configurado são expostos publicamente.';