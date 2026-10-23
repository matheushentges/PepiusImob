import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateAvailableSlots } from '../src/lib/calendar/slot-calculator.ts'

test('calculates slots correctly for a 45min visit with 15min buffer', () => {
  const options = {
    date: '2026-10-26', // Monday
    daySchedule: { enabled: true, start: '09:00', end: '12:00' },
    busyIntervals: [],
    visitDurationMinutes: 45,
    bufferMinutes: 15,
    minNoticeHours: 0,
    currentTime: new Date('2026-10-26T07:00:00-03:00'),
    timeZone: 'America/Sao_Paulo',
  }

  const slots = calculateAvailableSlots(options)
  // 09:00 (ends 09:45, next +15m buffer = 10:00)
  // 10:00 (ends 10:45, next = 11:00)
  // 11:00 (ends 11:45, buffer extends to 12:00) -> 12:00 is end of day
  assert.deepStrictEqual(slots, ['09:00', '10:00', '11:00'])
})

test('discards slots that overlap with busy intervals', () => {
  const options = {
    date: '2026-10-26',
    daySchedule: { enabled: true, start: '09:00', end: '13:00' },
    busyIntervals: [
      {
        start: '2026-10-26T10:15:00-03:00',
        end: '2026-10-26T10:45:00-03:00',
      },
    ],
    visitDurationMinutes: 45,
    bufferMinutes: 15,
    minNoticeHours: 0,
    currentTime: new Date('2026-10-26T07:00:00-03:00'),
    timeZone: 'America/Sao_Paulo',
  }

  const slots = calculateAvailableSlots(options)
  // 09:00-09:45 ok
  // 10:00-10:45 collides with 10:15-10:45 -> discarded!
  // 11:00-11:45 ok
  // 12:00-12:45 ok
  assert.deepStrictEqual(slots, ['09:00', '11:00', '12:00'])
})

test('discards slots that violate minimum notice hours', () => {
  const options = {
    date: '2026-10-26',
    daySchedule: { enabled: true, start: '09:00', end: '13:00' },
    busyIntervals: [],
    visitDurationMinutes: 45,
    bufferMinutes: 15,
    minNoticeHours: 2,
    currentTime: new Date('2026-10-26T09:30:00-03:00'), // 09:30, so notice window is up to 11:30
    timeZone: 'America/Sao_Paulo',
  }

  const slots = calculateAvailableSlots(options)
  // 09:00 in past -> discarded
  // 10:00 < 11:30 -> discarded
  // 11:00 < 11:30 -> discarded
  // 12:00 >= 11:30 -> allowed!
  assert.deepStrictEqual(slots, ['12:00'])
})

test('returns empty array when day is disabled', () => {
  const options = {
    date: '2026-10-25', // Sunday
    daySchedule: { enabled: false, start: '09:00', end: '13:00' },
    busyIntervals: [],
    visitDurationMinutes: 45,
    bufferMinutes: 15,
    minNoticeHours: 0,
    currentTime: new Date('2026-10-25T07:00:00-03:00'),
    timeZone: 'America/Sao_Paulo',
  }

  const slots = calculateAvailableSlots(options)
  assert.deepStrictEqual(slots, [])
})
