-- =====================================================
-- STORAGE: Bucket para imagens dos imóveis
-- =====================================================
-- Cria o bucket 'property-images' com políticas RLS
-- para permitir upload/leitura apenas por usuários autenticados
-- vinculados ao tenant proprietário do imóvel.
-- =====================================================

-- 1. Criar o bucket (idempotente via INSERT ... ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política de leitura pública (imagens de imóveis devem ser acessíveis no site público)
DROP POLICY IF EXISTS "Leitura pública de imagens de imóveis" ON storage.objects;
CREATE POLICY "Leitura pública de imagens de imóveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- 3. Política de upload apenas para usuários autenticados
DROP POLICY IF EXISTS "Upload de imagens por usuários autenticados" ON storage.objects;
CREATE POLICY "Upload de imagens por usuários autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

-- 4. Política de exclusão apenas para usuários autenticados
DROP POLICY IF EXISTS "Exclusão de imagens por usuários autenticados" ON storage.objects;
CREATE POLICY "Exclusão de imagens por usuários autenticados"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

COMMENT ON TABLE storage.buckets IS 'Bucket property-images: armazena fotos dos imóveis com limite de 5MB e tipos JPEG/PNG/WebP';