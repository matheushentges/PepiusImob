import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanPhoneNumber,
  buildKeyReminderWhatsAppUrl,
  formatDateTimeBR,
} from '../src/lib/keys/whatsapp.ts'

test('cleanPhoneNumber handles brazilian phone numbers with and without country code', () => {
  assert.equal(cleanPhoneNumber('(11) 98765-4321'), '5511987654321')
  assert.equal(cleanPhoneNumber('11987654321'), '5511987654321')
  assert.equal(cleanPhoneNumber('(11) 3456-7890'), '551134567890')
  assert.equal(cleanPhoneNumber('5511987654321'), '5511987654321')
})

test('formatDateTimeBR formats valid ISO dates and returns empty string for null', () => {
  assert.equal(formatDateTimeBR(null), '')
  assert.equal(formatDateTimeBR(undefined), '')
  const formatted = formatDateTimeBR('2026-10-26T18:00:00.000Z')
  assert.ok(formatted.includes('26/10'))
})

test('buildKeyReminderWhatsAppUrl generates valid link with customized friendly message', () => {
  const url = buildKeyReminderWhatsAppUrl({
    phone: '(11) 98765-4321',
    responsibleName: 'Juliana Mendes',
    propertyTitle: 'Apartamento Jardim das Flores',
    expectedAt: '2026-10-26T18:00:00.000Z',
    isLate: false,
  })

  assert.ok(url !== null)
  assert.ok(url.startsWith('https://wa.me/5511987654321?text='))
  const decoded = decodeURIComponent(url.split('text=')[1])
  assert.ok(decoded.includes('Juliana'))
  assert.ok(decoded.includes('Apartamento Jardim das Flores'))
  assert.ok(decoded.includes('previsão de devolução combinada'))
})

test('buildKeyReminderWhatsAppUrl formats overdue notice when isLate is true', () => {
  const url = buildKeyReminderWhatsAppUrl({
    phone: '11987654321',
    responsibleName: 'Rafael Silva',
    propertyTitle: 'Casa Alphaville',
    expectedAt: '2026-10-26T14:00:00.000Z',
    isLate: true,
  })

  assert.ok(url !== null)
  const decoded = decodeURIComponent(url.split('text=')[1])
  assert.ok(decoded.includes('acompanhando a devolução das chaves'))
  assert.ok(decoded.includes('previsão atualizada de retorno'))
})

test('buildKeyReminderWhatsAppUrl returns null for invalid or missing phone', () => {
  assert.equal(
    buildKeyReminderWhatsAppUrl({
      phone: '',
      responsibleName: 'Teste',
      propertyTitle: 'Imóvel',
    }),
    null
  )
  assert.equal(
    buildKeyReminderWhatsAppUrl({
      phone: '123',
      responsibleName: 'Teste',
      propertyTitle: 'Imóvel',
    }),
    null
  )
})
