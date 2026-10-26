import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateAvailableSlots, getNextOperatingDays } from '../src/lib/calendar/slot-calculator.ts'

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

test('getNextOperatingDays includes Saturday by default and respects agency operating hours', () => {
  // Monday 2026-10-26 -> Tue 10-27, Wed 10-28, Thu 10-29
  const monday = new Date('2026-10-26T12:00:00-03:00')
  const daysFromMonday = getNextOperatingDays(null, monday, 3)
  assert.strictEqual(daysFromMonday.length, 3)
  assert.strictEqual(daysFromMonday[0].dateStr, '2026-10-27')
  assert.strictEqual(daysFromMonday[0].isTomorrow, true)
  assert.strictEqual(daysFromMonday[0].label, 'Amanhã')
  assert.strictEqual(daysFromMonday[1].dateStr, '2026-10-28')
  assert.strictEqual(daysFromMonday[2].dateStr, '2026-10-29')

  // Friday 2026-10-30 -> Saturday 10-31 (default agency includes Saturday!), skips Sunday, then Monday 11-02, Tuesday 11-03
  const friday = new Date('2026-10-30T12:00:00-03:00')
  const daysFromFriday = getNextOperatingDays(null, friday, 3)
  assert.strictEqual(daysFromFriday.length, 3)
  assert.strictEqual(daysFromFriday[0].dateStr, '2026-10-31') // Saturday!
  assert.strictEqual(daysFromFriday[0].isTomorrow, true)
  assert.strictEqual(daysFromFriday[0].label, 'Amanhã')
  assert.strictEqual(daysFromFriday[1].dateStr, '2026-11-02') // Monday (Sunday skipped)
  assert.strictEqual(daysFromFriday[2].dateStr, '2026-11-03') // Tuesday

  // Custom operating hours where agency disabled Saturday
  const noSaturdayHours = {
    monday: { enabled: true },
    tuesday: { enabled: true },
    wednesday: { enabled: true },
    thursday: { enabled: true },
    friday: { enabled: true },
    saturday: { enabled: false },
    sunday: { enabled: false },
  }
  const daysWithoutSaturday = getNextOperatingDays(noSaturdayHours, friday, 3)
  assert.strictEqual(daysWithoutSaturday.length, 3)
  assert.strictEqual(daysWithoutSaturday[0].dateStr, '2026-11-02') // Monday
  assert.strictEqual(daysWithoutSaturday[1].dateStr, '2026-11-03') // Tuesday
  assert.strictEqual(daysWithoutSaturday[2].dateStr, '2026-11-04') // Wednesday
})

test('clamps slots to window 08:00 to 17:00', () => {
  const options = {
    date: '2026-10-27',
    daySchedule: { enabled: true, start: '07:00', end: '19:00' }, // agency configured wider hours
    busyIntervals: [],
    visitDurationMinutes: 60,
    bufferMinutes: 0,
    minNoticeHours: 0,
    currentTime: new Date('2026-10-26T12:00:00-03:00'),
    windowStart: '08:00',
    windowEnd: '17:00',
  }

  const slots = calculateAvailableSlots(options)
  // Window clamped: 08:00 to 17:00, 60min visits -> 08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00
  assert.deepStrictEqual(slots, [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ])
  assert.ok(!slots.includes('07:00'), 'Must not include 07:00')
  assert.ok(!slots.includes('17:00'), 'Must not start at 17:00 (ends 18:00 outside window)')
})
