import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  publicSlotQuerySchema,
  publicBookVisitSchema,
} from '../src/lib/calendar/validation.ts'

test('publicSlotQuerySchema enforces valid UUID and YYYY-MM-DD date', () => {
  const valid = {
    propertyId: '11111111-2222-4333-8444-555555555555',
    date: '2026-10-24',
  }
  const result = publicSlotQuerySchema.safeParse(valid)
  assert.ok(result.success)

  const invalidDate = {
    propertyId: '11111111-2222-4333-8444-555555555555',
    date: '24/10/2026',
  }
  assert.strictEqual(publicSlotQuerySchema.safeParse(invalidDate).success, false)

  const invalidId = {
    propertyId: 'invalid-id',
    date: '2026-10-24',
  }
  assert.strictEqual(publicSlotQuerySchema.safeParse(invalidId).success, false)
})

test('publicBookVisitSchema validates complete booking payload and honeypot field', () => {
  const valid = {
    propertyId: '11111111-2222-4333-8444-555555555555',
    date: '2026-10-24',
    time: '14:30',
    name: 'Mariana Silva',
    phone: '(11) 99888-7766',
    email: 'mariana@example.com',
    message: 'Gostaria de ver o imóvel à tarde.',
  }
  const result = publicBookVisitSchema.safeParse(valid)
  assert.ok(result.success)

  // Honeypot test: valid schema allows optional website field
  const withHoneypot = {
    ...valid,
    website: 'http://spam-bot.net',
  }
  const honeypotResult = publicBookVisitSchema.safeParse(withHoneypot)
  assert.ok(honeypotResult.success)
  assert.strictEqual(honeypotResult.data.website, 'http://spam-bot.net')

  // Rejects invalid email
  const invalidEmail = { ...valid, email: 'not-an-email' }
  assert.strictEqual(publicBookVisitSchema.safeParse(invalidEmail).success, false)

  // Rejects invalid time format
  const invalidTime = { ...valid, time: '2:30pm' }
  assert.strictEqual(publicBookVisitSchema.safeParse(invalidTime).success, false)
})
