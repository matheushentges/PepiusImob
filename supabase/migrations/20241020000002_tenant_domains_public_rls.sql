-- Public tenant rows contain private contact and configuration fields.
-- Domain resolution from raw tenant records is disabled in the on-prem product.
DROP POLICY IF EXISTS "Permitir leitura pública de domínios ativos" ON public.tenants;
