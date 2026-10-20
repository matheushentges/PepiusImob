-- =====================================================
-- SEED: Usuário Admin Master do SaaS
-- =====================================================
-- Cria admin@pepius-imob.com com senha '123' e role 'admin'
-- Executado automaticamente no deploy da Vercel via Supabase Migrations
-- =====================================================

-- =====================================================
-- INSTRUÇÕES PRÉVIAS (EXECUTE ANTES DESTA MIGRATION):
-- Crie o usuário manualmente no Supabase Dashboard > Authentication > Users:
--   Email: admin@pepius-imob.com
--   Password: 123
--   Auto Confirm User: ON
-- Esta migration apenas vincula o profile e cria o tenant admin.
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- 1. Criar tenant admin master (idempotente)
  INSERT INTO tenants (id, nome, slug, email, active, license_expires_at)
  VALUES (
    v_tenant_id,
    'Pepius Admin',
    'pepius-admin',
    'admin@pepius-imob.com',
    true,
    NOW() + INTERVAL '100 years'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- 2. Buscar usuário existente no auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@pepius-imob.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário admin@pepius-imob.com não encontrado em auth.users. Crie-o primeiro no Supabase Dashboard > Authentication.';
  END IF;

  -- 3. Vincular profile ao tenant admin (idempotente)
  INSERT INTO profiles (id, tenant_id, role, nome, email)
  VALUES (
    v_user_id,
    v_tenant_id,
    'admin',
    'Administrador Pepius',
    'admin@pepius-imob.com'
  )
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role,
    nome = EXCLUDED.nome,
    email = EXCLUDED.email;

  RAISE NOTICE 'Admin master vinculado: % (tenant: %)', v_user_id, v_tenant_id;
END $$;

-- Comentário documental
COMMENT ON TABLE tenants IS 'Inclui tenant especial para admin master do SaaS (ID: 00000000-0000-0000-0000-000000000001)';