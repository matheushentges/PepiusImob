import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildEventPayload } from '../src/lib/calendar/google-calendar.ts'

test('buildEventPayload formats event details, summary and attendees', () => {
  const payload = buildEventPayload({
    propertyTitle: 'Apartamento Jardins',
    propertyCode: '0042',
    propertyAddress: 'Av Paulista, 1000 - Jardins, São Paulo',
    clientName: 'Mariana Costa',
    clientPhone: '(11) 98888-7777',
    clientEmail: 'mariana@example.com',
    startDateTime: '2026-10-26T14:00:00-03:00',
    endDateTime: '2026-10-26T14:45:00-03:00',
    timeZone: 'America/Sao_Paulo',
    leadId: 'lead-123',
  })

  assert.strictEqual(payload.summary, 'Visita Imóvel #0042 - Apartamento Jardins (Mariana Costa)')
  assert.ok(payload.description.includes('Mariana Costa'))
  assert.ok(payload.description.includes('(11) 98888-7777'))
  assert.ok(payload.description.includes('Av Paulista, 1000'))
  assert.deepStrictEqual(payload.attendees, [{ email: 'mariana@example.com' }])
  assert.strictEqual(payload.start.dateTime, '2026-10-26T14:00:00-03:00')
})
