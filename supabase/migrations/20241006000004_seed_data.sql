-- Seed data for testing (opcional - apenas para desenvolvimento)

-- Insert sample tenant
INSERT INTO tenants (id, nome, slug, email, telefone, active, license_expires_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Imobiliária Exemplo',
  'imobiliaria-exemplo',
  'contato@exemplo.com',
  '(11) 99999-9999',
  true,
  NOW() + INTERVAL '1 year'
);

-- Insert sample license
INSERT INTO licenses (tenant_id, plano, valor, inicio, fim, active)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'profissional',
  299.00,
  NOW(),
  NOW() + INTERVAL '1 year',
  true
);

-- Insert sample properties
INSERT INTO properties (
  tenant_id, titulo, descricao, tipo, finalidade, status,
  preco_venda, endereco, cidade, estado, cep, bairro,
  area_total, area_construida, quartos, banheiros, vagas_garagem
) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Apartamento 3 Quartos no Centro',
  'Lindo apartamento com 3 quartos, 2 banheiros e 1 vaga de garagem. Localizado no coração da cidade.',
  'apartamento',
  'venda',
  'disponivel',
  450000.00,
  'Rua Principal, 123, Apto 501',
  'São Paulo',
  'SP',
  '01000-000',
  'Centro',
  100.00,
  85.00,
  3,
  2,
  1
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Casa Térrea com Quintal',
  'Casa espaçosa com quintal, 2 quartos e garagem para 2 carros.',
  'casa',
  'locacao',
  'disponivel',
  NULL,
  'Rua das Flores, 456',
  'São Paulo',
  'SP',
  '02000-000',
  'Vila Maria',
  200.00,
  120.00,
  2,
  1,
  2
);

-- Insert sample AI training data
INSERT INTO ai_training_data (tenant_id, tipo, pergunta, resposta, categoria, active)
VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'faq',
  'Qual o horário de atendimento?',
  'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h, e aos sábados das 9h às 13h.',
  'atendimento',
  true
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'faq',
  'Onde fica a imobiliária?',
  'Estamos localizados na Rua Principal, 123, Centro, São Paulo - SP.',
  'localizacao',
  true
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'script',
  'Saudação inicial',
  'Olá! Bem-vindo à Imobiliária Exemplo. Como posso ajudá-lo hoje? Estou aqui para tirar dúvidas sobre nossos imóveis, agendar visitas ou passar informações sobre disponibilidade.',
  'saudacao',
  true
);
