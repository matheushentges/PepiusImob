-- ==============================================================================
-- Pepius Imob — Carga de Dados de Simulação (Radar Reverso, Imagens e Clientes)
-- Tenant: 64377038-0f9c-40fa-bdac-cd928924f624 (Imobiliara Demo / Linha de Planta)
-- ==============================================================================

BEGIN;

-- 1. Limpa dados de testes prévios para garantir idempotência
DELETE FROM public.property_images WHERE property_id IN (
  SELECT id FROM public.properties WHERE tenant_id = '64377038-0f9c-40fa-bdac-cd928924f624'
);

DELETE FROM public.key_movements WHERE tenant_id = '64377038-0f9c-40fa-bdac-cd928924f624';
DELETE FROM public.property_keys WHERE tenant_id = '64377038-0f9c-40fa-bdac-cd928924f624';
DELETE FROM public.clients WHERE tenant_id = '64377038-0f9c-40fa-bdac-cd928924f624';
DELETE FROM public.leads WHERE tenant_id = '64377038-0f9c-40fa-bdac-cd928924f624' AND email LIKE '%@simulacao.pepius.com';

-- 2. Vincula Imagens Reais de Alta Resolução aos 10 Imóveis
-- 2.1 Apartamento com varanda no Cambuí (715cdd17-79ff-491f-be86-2d8405b3b4eb)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a1000000-0000-0000-0000-000000000001', '715cdd17-79ff-491f-be86-2d8405b3b4eb', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80', 0, true),
  ('a1000000-0000-0000-0000-000000000002', '715cdd17-79ff-491f-be86-2d8405b3b4eb', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', 1, false),
  ('a1000000-0000-0000-0000-000000000003', '715cdd17-79ff-491f-be86-2d8405b3b4eb', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', 2, false);

-- 2.2 Casa com quintal no Jardim Aquarius (38e10971-b270-4e37-867f-9824280d8a9b)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a2000000-0000-0000-0000-000000000001', '38e10971-b270-4e37-867f-9824280d8a9b', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 0, true),
  ('a2000000-0000-0000-0000-000000000002', '38e10971-b270-4e37-867f-9824280d8a9b', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 1, false),
  ('a2000000-0000-0000-0000-000000000003', '38e10971-b270-4e37-867f-9824280d8a9b', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80', 2, false);

-- 2.3 Sala comercial na Savassi (4fd8bb98-0633-462c-997c-e3412e160dff)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a3000000-0000-0000-0000-000000000001', '4fd8bb98-0633-462c-997c-e3412e160dff', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80', 0, true),
  ('a3000000-0000-0000-0000-000000000002', '4fd8bb98-0633-462c-997c-e3412e160dff', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80', 1, false);

-- 2.4 Studio compacto em Moinhos de Vento (0b3d5326-4705-4b23-99c4-b7efbb49ee73)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a4000000-0000-0000-0000-000000000001', '0b3d5326-4705-4b23-99c4-b7efbb49ee73', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&q=80', 0, true),
  ('a4000000-0000-0000-0000-000000000002', '0b3d5326-4705-4b23-99c4-b7efbb49ee73', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', 1, false);

-- 2.5 Casa familiar em Boa Viagem (bd770fe3-3de3-4e62-b59b-be6451229d0b)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a5000000-0000-0000-0000-000000000001', 'bd770fe3-3de3-4e62-b59b-be6451229d0b', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80', 0, true),
  ('a5000000-0000-0000-0000-000000000002', 'bd770fe3-3de3-4e62-b59b-be6451229d0b', 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1200&q=80', 1, false);

-- 2.6 Casa térrea no Jardim Botânico (9929de03-5016-4a6a-b2a5-4e64c81c76e6)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a6000000-0000-0000-0000-000000000001', '9929de03-5016-4a6a-b2a5-4e64c81c76e6', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80', 0, true),
  ('a6000000-0000-0000-0000-000000000002', '9929de03-5016-4a6a-b2a5-4e64c81c76e6', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 1, false);

-- 2.7 Apartamento de dois quartos na Trindade (490b3cfa-7866-4632-b8dd-d1f11d50c0e5)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a7000000-0000-0000-0000-000000000001', '490b3cfa-7866-4632-b8dd-d1f11d50c0e5', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80', 0, true),
  ('a7000000-0000-0000-0000-000000000002', '490b3cfa-7866-4632-b8dd-d1f11d50c0e5', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', 1, false);

-- 2.8 Sítio em Pirenópolis (ddf635c7-7641-4164-abca-83bde8b500af)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a8000000-0000-0000-0000-000000000001', 'ddf635c7-7641-4164-abca-83bde8b500af', 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200&q=80', 0, true);

-- 2.9 Terreno em Santa Felicidade (5f84d6c9-5d64-48f7-bcbd-4d1ffe93a9f0)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('a9000000-0000-0000-0000-000000000001', '5f84d6c9-5d64-48f7-bcbd-4d1ffe93a9f0', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80', 0, true);

-- 2.10 Loja comercial em Águas Claras (09af134e-cfb8-479b-98e2-b44594427fd7)
INSERT INTO public.property_images (id, property_id, url, ordem, is_cover) VALUES
  ('aa000000-0000-0000-0000-000000000001', '09af134e-cfb8-479b-98e2-b44594427fd7', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80', 0, true);

-- 3. Cadastra Clientes Estruturados com Perfis de Interesse (Radar Reverso)
INSERT INTO public.clients (
  id, tenant_id, tipo_pessoa, papeis, status, nome, documento, email, telefone,
  bairro, cidade, estado, perfil_interesse, observacoes, corretor_id
) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    '64377038-0f9c-40fa-bdac-cd928924f624',
    'pf',
    ARRAY['comprador'],
    'ativo',
    'Mariana Alcântara',
    '28471938012',
    'mariana.alcantara@gmail.com',
    '19981234567',
    'Cambuí',
    'Campinas',
    'SP',
    '{
      "finalidade": "venda",
      "tipos_imovel": ["apartamento"],
      "valor_minimo": 550000,
      "valor_maximo": 750000,
      "quartos_minimo": 2,
      "bairros_interesse": ["Cambuí", "Guanabara", "Taquaral"]
    }'::jsonb,
    'Busca apartamento com varanda e boa luminosidade no Cambuí. Crédito pré-aprovado no Itaú.',
    'ae6aab68-eca5-4333-afe6-aa7e18999029'
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    '64377038-0f9c-40fa-bdac-cd928924f624',
    'pf',
    ARRAY['locatario'],
    'ativo',
    'Ricardo Silveira',
    '51928374091',
    'ricardo.silveira@outlook.com',
    '12997654321',
    'Jardim Aquarius',
    'São José dos Campos',
    'SP',
    '{
      "finalidade": "locacao",
      "tipos_imovel": ["casa"],
      "valor_maximo": 5500,
      "quartos_minimo": 3,
      "bairros_interesse": ["Jardim Aquarius", "Urbanova"]
    }'::jsonb,
    'Engenheiro aeronáutico transferido. Procura casa ampla com quintal para família.',
    'ae6aab68-eca5-4333-afe6-aa7e18999029'
  ),
  (
    'c3000000-0000-0000-0000-000000000003',
    '64377038-0f9c-40fa-bdac-cd928924f624',
    'pf',
    ARRAY['comprador', 'locatario'],
    'ativo',
    'Dra. Camila Prado',
    '63819274015',
    'dra.camila.prado@clinica.med.br',
    '31988776655',
    'Savassi',
    'Belo Horizonte',
    'MG',
    '{
      "finalidade": "ambos",
      "tipos_imovel": ["comercial"],
      "valor_minimo": 400000,
      "valor_maximo": 650000,
      "bairros_interesse": ["Savassi", "Funcionários", "Lourdes"]
    }'::jsonb,
    'Médica dermatologista procurando sala comercial moderna na Savassi.',
    'ae6aab68-eca5-4333-afe6-aa7e18999029'
  ),
  (
    'c4000000-0000-0000-0000-000000000004',
    '64377038-0f9c-40fa-bdac-cd928924f624',
    'pf',
    ARRAY['locatario'],
    'ativo',
    'Felipe Zanetti',
    '71928304918',
    'felipe.zanetti@tech.io',
    '51991112233',
    'Moinhos de Vento',
    'Porto Alegre',
    'RS',
    '{
      "finalidade": "locacao",
      "tipos_imovel": ["apartamento"],
      "valor_maximo": 2500,
      "quartos_minimo": 1,
      "bairros_interesse": ["Moinhos de Vento", "Bom Fim"]
    }'::jsonb,
    'Desenvolvedor de software em home office. Busca studio compacto e bem localizado.',
    'ae6aab68-eca5-4333-afe6-aa7e18999029'
  ),
  (
    'c5000000-0000-0000-0000-000000000005',
    '64377038-0f9c-40fa-bdac-cd928924f624',
    'pf',
    ARRAY['proprietario'],
    'ativo',
    'Eduardo e Beatriz Mendes',
    '10928374902',
    'eduardo.mendes@mendesinvest.com.br',
    '11976543210',
    'Jardins',
    'São Paulo',
    'SP',
    '{}'::jsonb,
    'Proprietários de imóveis administrados pela imobiliária. Repasse Pix mensal programado.',
    'ae6aab68-eca5-4333-afe6-aa7e18999029'
  );

-- Atualiza dados bancários do proprietário
UPDATE public.clients
SET dados_bancarios = '{
  "banco": "Banco Itaú (341)",
  "agencia": "1234",
  "conta": "56789-0",
  "tipo_conta": "corrente",
  "tipo_chave_pix": "cpf",
  "chave_pix": "109.283.749-02",
  "titular": "Eduardo Mendes"
}'::jsonb
WHERE id = 'c5000000-0000-0000-0000-000000000005';

-- 4. Cadastra Chaves e Claviculário Físico
INSERT INTO public.property_keys (id, tenant_id, property_id, codigo, localizacao, status) VALUES
  ('b1000000-0000-0000-0000-000000000001', '64377038-0f9c-40fa-bdac-cd928924f624', '715cdd17-79ff-491f-be86-2d8405b3b4eb', 'G-01', 'Claviculário A - Gancho 01', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000002', '64377038-0f9c-40fa-bdac-cd928924f624', '38e10971-b270-4e37-867f-9824280d8a9b', 'G-02', 'Claviculário A - Gancho 02', 'com_consultor'),
  ('b1000000-0000-0000-0000-000000000003', '64377038-0f9c-40fa-bdac-cd928924f624', '4fd8bb98-0633-462c-997c-e3412e160dff', 'G-03', 'Claviculário A - Gancho 03', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000004', '64377038-0f9c-40fa-bdac-cd928924f624', '0b3d5326-4705-4b23-99c4-b7efbb49ee73', 'G-04', 'Claviculário A - Gancho 04', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000005', '64377038-0f9c-40fa-bdac-cd928924f624', 'bd770fe3-3de3-4e62-b59b-be6451229d0b', 'G-05', 'Claviculário B - Gancho 05', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000006', '64377038-0f9c-40fa-bdac-cd928924f624', '9929de03-5016-4a6a-b2a5-4e64c81c76e6', 'G-06', 'Claviculário B - Gancho 06', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000007', '64377038-0f9c-40fa-bdac-cd928924f624', '490b3cfa-7866-4632-b8dd-d1f11d50c0e5', 'G-07', 'Claviculário B - Gancho 07', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000008', '64377038-0f9c-40fa-bdac-cd928924f624', 'ddf635c7-7641-4164-abca-83bde8b500af', 'G-08', 'Claviculário C - Gancho 08', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000009', '64377038-0f9c-40fa-bdac-cd928924f624', '5f84d6c9-5d64-48f7-bcbd-4d1ffe93a9f0', 'G-09', 'Claviculário C - Gancho 09', 'disponivel'),
  ('b1000000-0000-0000-0000-000000000010', '64377038-0f9c-40fa-bdac-cd928924f624', '09af134e-cfb8-479b-98e2-b44594427fd7', 'G-10', 'Claviculário C - Gancho 10', 'disponivel');

-- 5. Movimento de Chave com ATRASO (Venceu há 3 horas) na Chave G-02
INSERT INTO public.key_movements (
  id, tenant_id, key_id, property_id, tipo_responsavel, consultor_id, nome_responsavel,
  telefone_responsavel, motivo, data_saida, previsao_retorno
) VALUES (
  'f1000000-0000-0000-0000-000000000001',
  '64377038-0f9c-40fa-bdac-cd928924f624',
  'b1000000-0000-0000-0000-000000000002',
  '38e10971-b270-4e37-867f-9824280d8a9b',
  'consultor',
  'ae6aab68-eca5-4333-afe6-aa7e18999029',
  'Administrador Pepius',
  '11999998888',
  'Visita presencial acompanhada de cliente',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '3 hours' -- Venceu há 3 horas para ativar o alerta de atraso!
);

-- 6. Leads no Pipeline
INSERT INTO public.leads (
  id, tenant_id, property_id, nome, email, telefone, mensagem, status, created_at
) VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    '64377038-0f9c-40fa-bdac-cd928924f624',
    '715cdd17-79ff-491f-be86-2d8405b3b4eb',
    'Arthur Vasconcellos',
    'arthur.vasc@simulacao.pepius.com',
    '19998887766',
    'Gostaria de agendar visita no apartamento do Cambuí para este sábado pela manhã.',
    'novo',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'e2000000-0000-0000-0000-000000000002',
    '64377038-0f9c-40fa-bdac-cd928924f624',
    '38e10971-b270-4e37-867f-9824280d8a9b',
    'Carla Silveira Meireles',
    'carla.meireles@simulacao.pepius.com',
    '12988771122',
    'Aceita proposta de locação com caução de 3 meses?',
    'em_contato',
    NOW() - INTERVAL '1 day'
  );

COMMIT;
