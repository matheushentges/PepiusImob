import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('Listing detail page generates full OpenGraph and Twitter cards with cover image', () => {
  const filePath = resolve(process.cwd(), 'src/app/(public)/imoveis/[id]/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('openGraph:'), 'Must generate openGraph metadata')
  assert.ok(content.includes('twitter:'), 'Must generate twitter metadata')
  assert.ok(content.includes('coverImage'), 'Must use property cover image')
  assert.ok(content.includes("type: 'website'"), 'Must specify website type')
  assert.ok(content.includes("card: 'summary_large_image'"), 'Must specify summary_large_image for Twitter/WhatsApp')
  assert.ok(content.includes("locale: 'pt_BR'"), 'Must specify pt_BR locale')
})

test('Listing detail client provides Share button with WhatsApp formatting and copy link', () => {
  const filePath = resolve(process.cwd(), 'src/app/(public)/imoveis/[id]/listing-detail-client.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('Share2'), 'Must include Share2 icon')
  assert.ok(content.includes('handleShare'), 'Must include handleShare method')
  assert.ok(content.includes('handleCopyLink'), 'Must include handleCopyLink method')
  assert.ok(content.includes('api.whatsapp.com/send'), 'Must support WhatsApp web/app fallback')
  assert.ok(content.includes('navigator.share'), 'Must support native mobile share API')
  assert.ok(content.includes('Compartilhar'), 'Must render Compartilhar button')
})

test('VisitSchedulerWidget enforces LGPD consent checkbox before booking', () => {
  const filePath = resolve(process.cwd(), 'src/components/listing/visit-scheduler-widget.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('visit-lgpd-consent'), 'Must include LGPD consent checkbox')
  assert.ok(content.includes('consentGiven'), 'Must manage consent state')
  assert.ok(content.includes('/privacidade'), 'Must link to privacy policy')
  assert.ok(content.includes('Política de Privacidade'), 'Must display legal privacy terms')
})
