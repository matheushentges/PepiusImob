-- Seed exportado do Supabase Cloud

INSERT INTO public.tenants (id, nome, slug, email, telefone, active, site_config)
VALUES ('64377038-0f9c-40fa-bdac-cd928924f624', 'Linha de Planta', 'linha-de-planta-demonstracao', 'contato@linha-de-planta.example', NULL, true, '{"hero_title":"","accent_color":"#a9604c","hero_subtitle":"","primary_color":"#334155"}')
ON CONFLICT (id) DO UPDATE SET site_config = EXCLUDED.site_config, nome = EXCLUDED.nome;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('715cdd17-79ff-491f-be86-2d8405b3b4eb', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('38e10971-b270-4e37-867f-9824280d8a9b', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('5f84d6c9-5d64-48f7-bcbd-4d1ffe93a9f0', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('490b3cfa-7866-4632-b8dd-d1f11d50c0e5', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('bd770fe3-3de3-4e62-b59b-be6451229d0b', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('ddf635c7-7641-4164-abca-83bde8b500af', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('0b3d5326-4705-4b23-99c4-b7efbb49ee73', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('9929de03-5016-4a6a-b2a5-4e64c81c76e6', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('09af134e-cfb8-479b-98e2-b44594427fd7', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('4fd8bb98-0633-462c-997c-e3412e160dff', '64377038-0f9c-40fa-bdac-cd928924f624', '', '', 'undefined', 'undefined', NULL, NULL, 'disponivel', 0, 0, 0, 0, 0, 0, '', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

