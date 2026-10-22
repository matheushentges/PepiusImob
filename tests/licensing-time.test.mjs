import assert from 'node:assert/strict'
import test from 'node:test'
import { formatRemainingTime } from '../src/lib/licensing/domain.ts'

test('formatRemainingTime handles inactive or missing expiration', () => {
  assert.equal(formatRemainingTime(0, null), 'Não ativada')
  assert.equal(formatRemainingTime(100000, null), 'Não ativada')
})

test('formatRemainingTime handles expired leases', () => {
  const pastDate = new Date(Date.now() - 10000).toISOString()
  assert.equal(formatRemainingTime(0, pastDate), 'Expirada')
  assert.equal(formatRemainingTime(-5000, pastDate), 'Expirada')
})

test('formatRemainingTime formats days and hours accurately', () => {
  const futureDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
  const sixDaysFourHoursMs = (6 * 24 + 4) * 60 * 60 * 1000
  assert.equal(formatRemainingTime(sixDaysFourHoursMs, futureDate), '6 dias e 4 horas')

  const oneDayOneHourMs = (1 * 24 + 1) * 60 * 60 * 1000
  assert.equal(formatRemainingTime(oneDayOneHourMs, futureDate), '1 dia e 1 hora')
})

test('formatRemainingTime formats hours and minutes when less than a day', () => {
  const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
  const fiveHoursThirtyMinMs = (5 * 60 + 30) * 60 * 1000
  assert.equal(formatRemainingTime(fiveHoursThirtyMinMs, futureDate), '5 horas e 30 min')

  const oneHourZeroMinMs = 1 * 60 * 60 * 1000
  assert.equal(formatRemainingTime(oneHourZeroMinMs, futureDate), '1 hora e 0 min')
})

test('formatRemainingTime formats minutes when less than an hour', () => {
  const futureDate = new Date(Date.now() + 45 * 60 * 1000).toISOString()
  assert.equal(formatRemainingTime(45 * 60 * 1000, futureDate), '45 minutos')
  assert.equal(formatRemainingTime(1 * 60 * 1000, futureDate), '1 minuto')
})
