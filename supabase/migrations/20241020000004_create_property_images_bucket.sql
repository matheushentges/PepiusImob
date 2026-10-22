-- Property images are private and are served with short-lived signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Leitura pública de imagens de imóveis" ON storage.objects;
DROP POLICY IF EXISTS "Upload de imagens por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Exclusão de imagens por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Upload de imagens por usuÃ¡rios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "ExclusÃ£o de imagens por usuÃ¡rios autenticados" ON storage.objects;
