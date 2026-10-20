-- =====================================================
-- SEED: Usuário Admin Master do SaaS
-- =====================================================
-- Cria admin@pepius-imob.com com senha '123' e role 'admin'
-- Executado automaticamente no deploy da Vercel via Supabase Migrations
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

  -- 2. Criar usuário no Supabase Auth com senha '123'
  -- supabase.auth.admin.create_user é disponível nas migrations do Supabase CLI
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@pepius-imob.com';

  IF v_user_id IS NULL THEN
    v_user_id := supabase.auth.admin.create_user(
      email => 'admin@pepius-imob.com',
      password => '123',
      email_confirm => true,
      user_metadata => '{"role": "admin", "nome": "Administrador Pepius"}'::jsonb
    );
  END IF;

  -- 3. Vincular profile ao tenant admin
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

  RAISE NOTICE 'Admin master criado/atualizado: % (tenant: %)', v_user_id, v_tenant_id;
END $$;

-- Comentário documental
COMMENT ON TABLE tenants IS 'Inclui tenant especial para admin master do SaaS (ID: 00000000-0000-0000-0000-000000000001)';