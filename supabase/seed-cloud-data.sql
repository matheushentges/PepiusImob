-- Seed exportado do Supabase Cloud

INSERT INTO public.tenants (id, nome, slug, email, telefone, active, site_config)
VALUES ('64377038-0f9c-40fa-bdac-cd928924f624', 'Linha de Planta', 'linha-de-planta-demonstracao', 'contato@linha-de-planta.example', NULL, true, '{"hero_title":"","accent_color":"#a9604c","hero_subtitle":"","primary_color":"#334155"}')
ON CONFLICT (id) DO UPDATE SET site_config = EXCLUDED.site_config, nome = EXCLUDED.nome;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('715cdd17-79ff-491f-be86-2d8405b3b4eb', '64377038-0f9c-40fa-bdac-cd928924f624', 'Apartamento com varanda no Cambuí', 'Anúncio demonstrativo para avaliação da vitrine. Apartamento claro, com varanda, planta integrada e acesso fácil a comércio e serviços do bairro.', 'apartamento', 'venda', 640000, NULL, 'disponivel', 3, 2, 2, 91, 91, 'Rua Demonstrativa, 101', 'Cambuí', 'Campinas', 'SP', '13025-100', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('38e10971-b270-4e37-867f-9824280d8a9b', '64377038-0f9c-40fa-bdac-cd928924f624', 'Casa com quintal no Jardim Aquarius', 'Anúncio demonstrativo para avaliação da vitrine. Casa espaçosa com quintal, boa iluminação e ambientes pensados para a rotina de uma família.', 'casa', 'locacao', NULL, 5200, 'disponivel', 3, 3, 2, 240, 190, 'Alameda Exemplo, 202', 'Jardim Aquarius', 'São José dos Campos', 'SP', '12246-000', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('5f84d6c9-5d64-48f7-bcbd-4d1ffe93a9f0', '64377038-0f9c-40fa-bdac-cd928924f624', 'Terreno residencial em Santa Felicidade', 'Anúncio demonstrativo para avaliação da vitrine. Terreno amplo para projeto residencial, com acesso a vias principais e serviços da região.', 'terreno', 'venda', 390000, NULL, 'disponivel', 0, 0, 0, 400, 0, 'Rua Modelo, 404', 'Santa Felicidade', 'Curitiba', 'PR', '82020-300', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('490b3cfa-7866-4632-b8dd-d1f11d50c0e5', '64377038-0f9c-40fa-bdac-cd928924f624', 'Apartamento de dois quartos na Trindade', 'Anúncio demonstrativo para avaliação da vitrine. Apartamento funcional com varanda e boa iluminação, próximo a comércio, serviços e transporte.', 'apartamento', 'locacao', NULL, 3800, 'disponivel', 2, 2, 1, 78, 78, 'Rua Fictícia, 505, apartamento 302', 'Trindade', 'Florianópolis', 'SC', '88036-200', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('bd770fe3-3de3-4e62-b59b-be6451229d0b', '64377038-0f9c-40fa-bdac-cd928924f624', 'Casa familiar em Boa Viagem', 'Anúncio demonstrativo para avaliação da vitrine. Casa com ambientes amplos, área externa e espaço para receber, em bairro com serviços variados.', 'casa', 'venda', 890000, NULL, 'disponivel', 3, 3, 2, 220, 160, 'Travessa Cenográfica, 606', 'Boa Viagem', 'Recife', 'PE', '51020-170', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('ddf635c7-7641-4164-abca-83bde8b500af', '64377038-0f9c-40fa-bdac-cd928924f624', 'Sítio com área verde em Pirenópolis', 'Anúncio demonstrativo para avaliação da vitrine. Propriedade rural fictícia com casa principal, área aberta e espaço para lazer e cultivo.', 'rural', 'venda', 1250000, NULL, 'disponivel', 4, 3, 4, 20000, 210, 'Estrada Demonstrativa, km 7', 'Zona Rural', 'Pirenópolis', 'GO', '72980-000', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('0b3d5326-4705-4b23-99c4-b7efbb49ee73', '64377038-0f9c-40fa-bdac-cd928924f624', 'Studio compacto em Moinhos de Vento', 'Anúncio demonstrativo para avaliação da vitrine. Studio compacto com planta inteligente, ideal para quem busca praticidade perto de serviços e áreas de lazer.', 'apartamento', 'locacao', NULL, 2200, 'disponivel', 1, 1, 1, 42, 42, 'Rua Cenográfica, 707, unidade 405', 'Moinhos de Vento', 'Porto Alegre', 'RS', '90430-090', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('9929de03-5016-4a6a-b2a5-4e64c81c76e6', '64377038-0f9c-40fa-bdac-cd928924f624', 'Casa térrea no Jardim Botânico', 'Anúncio demonstrativo para avaliação da vitrine. Casa térrea com sala integrada, jardim e garagem, em rua residencial tranquila.', 'casa', 'ambos', 760000, 4300, 'disponivel', 3, 2, 3, 280, 175, 'Rua de Teste, 808', 'Jardim Botânico', 'Ribeirão Preto', 'SP', '14021-600', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('09af134e-cfb8-479b-98e2-b44594427fd7', '64377038-0f9c-40fa-bdac-cd928924f624', 'Loja comercial em Águas Claras', 'Anúncio demonstrativo para avaliação da vitrine. Loja térrea com salão versátil e boa visibilidade, adequada a diferentes atividades comerciais.', 'comercial', 'locacao', NULL, 6500, 'disponivel', 0, 2, 2, 120, 120, 'Avenida de Exemplo, 909, loja 12', 'Águas Claras', 'Brasília', 'DF', '71930-000', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

INSERT INTO public.properties (id, tenant_id, titulo, descricao, tipo, finalidade, preco_venda, preco_locacao, status, quartos, banheiros, vagas_garagem, area_total, area_construida, endereco, bairro, cidade, estado, cep, caracteristicas, featured)
VALUES ('4fd8bb98-0633-462c-997c-e3412e160dff', '64377038-0f9c-40fa-bdac-cd928924f624', 'Sala comercial na Savassi', 'Anúncio demonstrativo para avaliação da vitrine. Sala comercial com espaço flexível para escritório ou consultório, em região com transporte e serviços próximos.', 'comercial', 'ambos', 560000, 2900, 'disponivel', 0, 1, 1, 58, 58, 'Avenida Ilustrativa, 303, sala 804', 'Savassi', 'Belo Horizonte', 'MG', '30140-110', '[]', false)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, preco_venda = EXCLUDED.preco_venda, preco_locacao = EXCLUDED.preco_locacao;

-- Usuário administrador padrão para testes e acesso ao painel
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
  expires_at = NOW() + INTERVAL '10 years';

