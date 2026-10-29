-- ==============================================================================
-- Pepius Imob: Expandir limites de upload do bucket de imagens de imóveis
-- Permite uploads de fotos de alta resolução (PNG, WebP, JPEG até 20MB)
-- ==============================================================================

UPDATE storage.buckets
SET
  file_size_limit = 20971520, -- 20 MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/x-png', 'image/pjpeg']::text[]
WHERE id = 'property-images';
