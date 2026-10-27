import test from 'node:test'
import assert from 'node:assert/strict'
import { tenantBrandingSchema } from '../src/lib/tenant/validation.ts'

test('tenant branding schema accepts valid complete payload', () => {
  const payload = {
    nome: 'Imobiliária Morada Nobre',
    site_config: {
      creci: 'CRECI 12.345-J',
      slogan: 'Tradição e excelência em imóveis de alto padrão',
      logo_url: 'branding/tenant-123/logo.webp',
      favicon_url: 'branding/tenant-123/favicon.webp',
      primary_color: '#1B3B36',
      accent_color: '#D4AF37',
      hero_title: 'Encontre seu imóvel dos sonhos',
      hero_subtitle: 'Casas, coberturas e apartamentos nas melhores regiões',
      about_tag: 'Atendimento Consultivo',
      about_title: 'Mais de 15 anos transformando sonhos em endereços',
      about_text: 'Fundada com o compromisso de oferecer assessoria transparente e personalizada na compra e locação.',
      whatsapp: '5511999998888',
      telefone: '(11) 3456-7890',
      email_contato: 'contato@moradanobre.com.br',
      endereco_completo: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      redes_sociais: {
        instagram: 'https://instagram.com/moradanobre',
        facebook: 'https://facebook.com/moradanobre',
        linkedin: 'https://linkedin.com/company/moradanobre',
        youtube: 'https://youtube.com/@moradanobre',
      },
    },
  }

  const result = tenantBrandingSchema.safeParse(payload)
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.nome, 'Imobiliária Morada Nobre')
    assert.equal(result.data.site_config.creci, 'CRECI 12.345-J')
    assert.equal(result.data.site_config.primary_color, '#1B3B36')
    assert.equal(result.data.site_config.about_tag, 'Atendimento Consultivo')
    assert.equal(result.data.site_config.about_title, 'Mais de 15 anos transformando sonhos em endereços')
    assert.equal(result.data.site_config.about_text, 'Fundada com o compromisso de oferecer assessoria transparente e personalizada na compra e locação.')
    assert.equal(result.data.site_config.whatsapp, '5511999998888')
  }
})

test('tenant branding schema normalizes and cleans empty or trimmed values', () => {
  const payload = {
    nome: '  Imobiliária Central  ',
    site_config: {
      creci: '  CRECI 4567-F  ',
      primary_color: '#334155',
      accent_color: '#e07a5f',
      hero_title: '  ',
      hero_subtitle: 'Encontre seu lar',
      whatsapp: '(11) 98888-7777', // should clean non-digits or allow formatted
    },
  }

  const result = tenantBrandingSchema.safeParse(payload)
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.nome, 'Imobiliária Central')
    assert.equal(result.data.site_config.creci, 'CRECI 4567-F')
    assert.equal(result.data.site_config.accent_color, '#e07a5f')
  }
})

test('tenant branding schema rejects invalid colors or overlong fields', () => {
  const invalidPayload = {
    nome: 'A'.repeat(150), // max is 120
    site_config: {
      primary_color: 'invalid-color',
      accent_color: '#123456',
    },
  }

  const result = tenantBrandingSchema.safeParse(invalidPayload)
  assert.equal(result.success, false)

  const overlongAbout = {
    nome: 'Imobiliária Teste',
    site_config: {
      about_text: 'A'.repeat(601),
    },
  }
  const overlongResult = tenantBrandingSchema.safeParse(overlongAbout)
  assert.equal(overlongResult.success, false)
})
