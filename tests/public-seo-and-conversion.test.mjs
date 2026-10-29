import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('Public layout includes dynamic AgencyJsonLd and WhatsAppFab button', () => {
  const filePath = resolve(process.cwd(), 'src/app/(public)/layout.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('AgencyJsonLd'), 'Must render AgencyJsonLd component')
  assert.ok(content.includes('WhatsAppFab'), 'Must render WhatsAppFab component')
  assert.ok(content.includes('baseUrl'), 'Must pass dynamic installation baseUrl')
})

test('json-ld component defines RealEstateAgent, RealEstateListing and BreadcrumbList', () => {
  const filePath = resolve(process.cwd(), 'src/components/shared/json-ld.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('https://schema.org'), 'Must declare schema.org context')
  assert.ok(content.includes('RealEstateAgent'), 'Must support RealEstateAgent entity')
  assert.ok(content.includes('RealEstateListing'), 'Must support RealEstateListing entity')
  assert.ok(content.includes('BreadcrumbList'), 'Must support BreadcrumbList entity')
  assert.ok(content.includes('PostalAddress'), 'Must include structured address')
  assert.ok(content.includes('priceCurrency'), 'Must specify currency BRL')
})

test('Public pages declare dynamic canonical alternates', () => {
  const homePath = resolve(process.cwd(), 'src/app/(public)/page.tsx')
  const catalogPath = resolve(process.cwd(), 'src/app/(public)/imoveis/page.tsx')
  const detailPath = resolve(process.cwd(), 'src/app/(public)/imoveis/[id]/page.tsx')
  const privacyPath = resolve(process.cwd(), 'src/app/(public)/privacidade/page.tsx')

  const homeContent = readFileSync(homePath, 'utf-8')
  const catalogContent = readFileSync(catalogPath, 'utf-8')
  const detailContent = readFileSync(detailPath, 'utf-8')
  const privacyContent = readFileSync(privacyPath, 'utf-8')

  assert.ok(homeContent.includes('canonical:'), 'Home must include canonical tag')
  assert.ok(catalogContent.includes('canonical:'), 'Catalog must include canonical tag')
  assert.ok(detailContent.includes('canonical:'), 'Property detail must include canonical tag')
  assert.ok(privacyContent.includes('canonical:'), 'Privacy must include canonical tag')
})

test('Listing detail client provides sticky mobile conversion bar with direct action', () => {
  const filePath = resolve(process.cwd(), 'src/app/(public)/imoveis/[id]/listing-detail-client.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('lg:hidden'), 'Must render mobile-specific bar')
  assert.ok(content.includes('id="agendamento"'), 'Must have scroll target for booking visit')
  assert.ok(content.includes('Agendar Visita'), 'Must have Agendar Visita CTA')
  assert.ok(content.includes('wa.me/'), 'Must have direct WhatsApp link with property code')
})

test('Catalog supports bedrooms and parking filters and dynamic H1', () => {
  const filePath = resolve(process.cwd(), 'src/app/(public)/imoveis/listing-results.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('minBedrooms'), 'Must handle minimum bedrooms filter')
  assert.ok(content.includes('minParking'), 'Must handle minimum parking filter')
  assert.ok(content.includes('BEDROOM_OPTIONS'), 'Must provide bedroom options')
  assert.ok(content.includes('PARKING_OPTIONS'), 'Must provide parking options')
  assert.ok(content.includes('pageHeading'), 'Must render search/filter dynamic H1')
})
