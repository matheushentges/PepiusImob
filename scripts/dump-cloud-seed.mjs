import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Supabase URL or key missing in env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function dump() {
  const { data: tenants, error: tErr } = await supabase.from('tenants').select('*')
  if (tErr) throw tErr

  const { data: properties, error: pErr } = await supabase.from('properties').select('*')
  if (pErr) throw pErr

  let sql = '-- Seed exportado do Supabase Cloud\n\n'

  for (const t of tenants) {
    const siteConfigStr = JSON.stringify(t.site_config || {}).replace(/'/g, "''")
    const phoneVal = t.telefone ? `'${t.telefone.replace(/'/g, "''")}'` : 'NULL'
    sql += `INSERT INTO public.tenants (id, nome, slug, email, telefone, active, site_config)
VALUES ('${t.id}', '${t.nome}', '${t.slug}', '${t.email}', ${phoneVal}, ${t.active}, '${siteConfigStr}')
ON CONFLICT (id) DO UPDATE SET site_config = EXCLUDED.site_config, nome = EXCLUDED.nome;\n\n`
  }

  for (const p of properties) {
    const titulo = (p.titulo || '').replace(/'/g, "''")
    const descricao = (p.descricao || '').replace(/'/g, "''")
    const endereco = (p.endereco || '').replace(/'/g, "''")
    const bairro = (p.bairro || '').replace(/'/g, "''")
    const cidade = (p.cidade || '').replace(/'/g, "''")
    const estado = (p.estado || '').replace(/'/g, "''")
    const cep = (p.cep || '').replace(/'/g, "''")
    const sale = p.preco_venda !== null && p.preco_venda !== undefined ? p.preco_venda : 'NULL'
    const rent = p.preco_locacao !== null && p.preco_locacao !== undefined ? p.preco_locacao : 'NULL'
    const carac = JSON.stringify(p.caracteristicas || []).replace(/'/g, "''")

    sql += `INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('${p.id}', '${p.tenant_id}', '${titulo}', '${descricao}', '${p.tipo}', '${p.finalidade}', ${sale}, ${rent}, '${p.status}', ${p.quartos || 0}, ${p.banheiros || 0}, ${p.vagas_garagem || 0}, ${p.area_total || 0}, ${p.area_construida || 0}, '${endereco}', '${bairro}', '${cidade}', '${estado}', '${cep}', '${carac}', ${p.featured ? 'true' : 'false'})
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;\n\n`
  }

  // Admin user seed
  sql += `-- Usuário administrador padrão para testes e acesso ao painel
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'ae6aab68-eca5-4333-afe6-aa7e18999029',
  'authenticated',
  'authenticated',
  'admin@pepius-imob.com',
  crypt('admin123456', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nome": "Administrador Pepius"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('admin123456', gen_salt('bf')), email_confirmed_at = NOW();

INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'ae6aab68-eca5-4333-afe6-aa7e18999029',
  'ae6aab68-eca5-4333-afe6-aa7e18999029',
  'ae6aab68-eca5-4333-afe6-aa7e18999029',
  jsonb_build_object('sub', 'ae6aab68-eca5-4333-afe6-aa7e18999029', 'email', 'admin@pepius-imob.com'),
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider_id, provider) DO UPDATE SET identity_data = EXCLUDED.identity_data;

INSERT INTO public.profiles (
  id,
  tenant_id,
  role,
  nome,
  email
) VALUES (
  'ae6aab68-eca5-4333-afe6-aa7e18999029',
  '64377038-0f9c-40fa-bdac-cd928924f624',
  'imobiliaria_owner',
  'Administrador Pepius',
  'admin@pepius-imob.com'
) ON CONFLICT (id) DO UPDATE SET
  tenant_id = '64377038-0f9c-40fa-bdac-cd928924f624',
  role = 'imobiliaria_owner',
  nome = 'Administrador Pepius',
  email = 'admin@pepius-imob.com';

INSERT INTO public.local_license_state (
  id,
  installation_id,
  status,
  features,
  issued_at,
  expires_at,
  signed_lease,
  last_heartbeat_at,
  updated_at
) VALUES (
  1,
  'dev-onprem-vm-2026',
  'active',
  ARRAY['properties', 'leads', 'public-listing', 'calendar'],
  NOW(),
  NOW() + INTERVAL '10 years',
  '{"status": "active", "features": ["properties", "leads", "public-listing", "calendar"]}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  features = ARRAY['properties', 'leads', 'public-listing', 'calendar'],
  expires_at = NOW() + INTERVAL '10 years';\n\n`

  writeFileSync('supabase/seed-cloud-data.sql', sql, 'utf-8')
  console.log(`Generated supabase/seed-cloud-data.sql with ${tenants.length} tenants and ${properties.length} properties!`)
}

dump().catch(console.error)
