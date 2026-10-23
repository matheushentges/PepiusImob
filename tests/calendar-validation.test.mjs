import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calendarSettingsSchema,
  publicSlotQuerySchema,
  publicBookVisitSchema,
} from '../src/lib/calendar/validation.ts'

test('calendarSettingsSchema validates valid settings and sanitizes defaults', () => {
  const valid = {
    enabled: true,
    visit_duration_minutes: 45,
    buffer_minutes: 15,
    min_notice_hours: 2,
    max_days_ahead: 30,
    google_calendar_id: 'primary',
    operating_hours: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: true, start: '09:00', end: '13:00' },
      sunday: { enabled: false, start: '09:00', end: '13:00' },
    },
  }
  const result = calendarSettingsSchema.safeParse(valid)
  assert.ok(result.success, 'Valid settings should parse successfully')
})

test('calendarSettingsSchema rejects invalid visit duration', () => {
  const invalid = { visit_duration_minutes: 77 }
  const result = calendarSettingsSchema.safeParse(invalid)
  assert.strictEqual(result.success, false)
})

test('publicSlotQuerySchema validates property UUID and ISO date', () => {
  const valid = {
    propertyId: '11111111-1111-4111-8111-111111111111',
    date: '2026-10-25',
  }
  const result = publicSlotQuerySchema.safeParse(valid)
  assert.ok(result.success)

  const invalidDate = { propertyId: valid.propertyId, date: 'not-a-date' }
  assert.strictEqual(publicSlotQuerySchema.safeParse(invalidDate).success, false)
})

test('publicBookVisitSchema validates client details and slot', () => {
  const valid = {
    propertyId: '11111111-1111-4111-8111-111111111111',
    date: '2026-10-25',
    time: '15:00',
    name: 'Carlos Oliveira',
    phone: '(11) 98765-4321',
    email: 'carlos@example.com',
  }
  const result = publicBookVisitSchema.safeParse(valid)
  assert.ok(result.success)
})
