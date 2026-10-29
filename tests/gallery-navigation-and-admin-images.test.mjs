import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('GalleryDialog includes navigation arrows, keyboard events and fullscreen styling', () => {
  const filePath = resolve(process.cwd(), 'src/components/listing/gallery-dialog.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('ChevronLeft'), 'Must import and use ChevronLeft icon')
  assert.ok(content.includes('ChevronRight'), 'Must import and use ChevronRight icon')
  assert.ok(content.includes('handlePrev'), 'Must define handlePrev function')
  assert.ok(content.includes('handleNext'), 'Must define handleNext function')
  assert.ok(content.includes('ArrowLeft'), 'Must support ArrowLeft keyboard navigation')
  assert.ok(content.includes('ArrowRight'), 'Must support ArrowRight keyboard navigation')
  assert.ok(content.includes('Foto anterior'), 'Must include accessibility aria-label for previous photo')
  assert.ok(content.includes('Próxima foto'), 'Must include accessibility aria-label for next photo')
})

test('ImageUpload synchronizes existingImages and provides admin gallery with delete and zoom', () => {
  const filePath = resolve(process.cwd(), 'src/components/shared/image-upload.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('useEffect'), 'Must use useEffect to sync async existingImages')
  assert.ok(content.includes('setImages(existingImages)'), 'Must update internal state when existingImages changes')
  assert.ok(content.includes('Trash2'), 'Must include Trash2 icon for deletion')
  assert.ok(content.includes('Eye'), 'Must include Eye icon for zoom preview')
  assert.ok(content.includes('deletingId'), 'Must provide visual feedback when deleting an image')
  assert.ok(content.includes('previewIndex'), 'Must support full screen preview modal in admin panel')
  assert.ok(content.includes('Galeria de Fotos do Imóvel'), 'Must render dedicated property gallery section')
})
