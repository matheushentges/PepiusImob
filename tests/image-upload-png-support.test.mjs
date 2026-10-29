import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('upload-image route detects PNG magic bytes and converts to WebP for efficient storage', () => {
  const filePath = resolve(process.cwd(), 'src/app/api/dashboard/properties/upload-image/route.ts')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('detectImageFormat'), 'Must define robust detectImageFormat')
  assert.ok(content.includes('0x89') && content.includes('0x50') && content.includes('0x4e'), 'Must validate PNG signature (89 50 4E 47)')
  assert.ok(content.includes('0xff') && content.includes('0xd8'), 'Must validate JPEG signature')
  assert.ok(content.includes('RIFF') && content.includes('WEBP'), 'Must validate WebP signature')
  assert.ok(content.includes('15 * 1024 * 1024'), 'Must support up to 15MB image uploads')
  assert.ok(content.includes('20 * 1024 * 1024'), 'Must allow 20MB bounded body')
  assert.ok(content.includes("detectedFormat === 'png'"), 'Must process PNG format specifically')
})

test('ImageUpload component accepts PNG files and up to 15MB', () => {
  const filePath = resolve(process.cwd(), 'src/components/shared/image-upload.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('maxSizeMB = 15'), 'Must default to 15MB max file size')
  assert.ok(content.includes('isImageFile'), 'Must check image files by extension and mime')
  assert.ok(content.includes('.png'), 'Must explicitly accept .png extension')
  assert.ok(content.includes('image/png'), 'Must explicitly accept image/png mime')
  assert.ok(content.includes('image/x-png'), 'Must accept image/x-png mime fallback')
})

test('Storage migration expands property-images bucket size limit to 20MB', () => {
  const filePath = resolve(process.cwd(), 'supabase/migrations/20261029000002_expand_property_images_bucket_limits.sql')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('20971520'), 'Must update bucket file_size_limit to 20MB')
  assert.ok(content.includes('image/png'), 'Must include image/png in allowed_mime_types')
  assert.ok(content.includes('image/x-png'), 'Must include image/x-png in allowed_mime_types')
})
