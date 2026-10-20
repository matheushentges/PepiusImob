-- Adicionar campos de domínio para suporte a subdomínios e domínios próprios
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS site_config JSONB NOT NULL DEFAULT '{}';

-- Índice para busca rápida por domínio no middleware
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN tenants.subdomain IS 'Subdomínio no formato imobiliaria.pepius.com (sem o domínio base)';
COMMENT ON COLUMN tenants.custom_domain IS 'Domínio próprio da imobiliária (ex: www.minhaimob.com.br)';
COMMENT ON COLUMN tenants.domain_verified IS 'Indica se o domínio próprio foi verificado via DNS/CNAME';
COMMENT ON COLUMN tenants.site_config IS 'Configurações do site público: logo, textos, destaques, cores de accent, integrações ativas';