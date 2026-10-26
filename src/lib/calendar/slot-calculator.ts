export interface BusyInterval {
  start: string
  end: string
}

export interface DaySchedule {
  enabled: boolean
  start: string // HH:MM
  end: string   // HH:MM
}

export interface SlotCalculatorOptions {
  date: string // YYYY-MM-DD
  daySchedule: DaySchedule
  busyIntervals: BusyInterval[]
  visitDurationMinutes: number
  bufferMinutes: number
  minNoticeHours: number
  currentTime?: Date
  timeZone?: string
  timeZoneOffset?: string
  windowStart?: string // HH:MM (ex: '08:00')
  windowEnd?: string   // HH:MM (ex: '17:00')
}

export interface BusinessDayItem {
  dateStr: string
  dayOfWeek: string
  dayOfMonth: number
  monthName: string
  isTomorrow: boolean
  label: string
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getNextOperatingDays(
  operatingHours?: Record<string, { enabled: boolean; start?: string; end?: string }> | null,
  baseDate: Date = new Date(),
  count: number = 3,
): BusinessDayItem[] {
  const days: BusinessDayItem[] = []

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const baseIsoDate = formatter.format(baseDate)
  const [baseY, baseM, baseD] = baseIsoDate.split('-').map(Number)

  const dayKeys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ] as const

  const current = new Date(Date.UTC(baseY, baseM - 1, baseD, 12, 0, 0))
  let attempts = 0

  while (days.length < count && attempts < 21) {
    attempts++
    current.setUTCDate(current.getUTCDate() + 1)

    const dayOfWeekIndex = current.getUTCDay()
    const dayKey = dayKeys[dayOfWeekIndex]

    let isEnabled = false
    if (operatingHours && typeof operatingHours[dayKey]?.enabled === 'boolean') {
      isEnabled = operatingHours[dayKey].enabled
    } else {
      // Padrão da imobiliária: segunda a sábado ativado (sábado atende!)
      isEnabled = dayOfWeekIndex >= 1 && dayOfWeekIndex <= 6
    }

    if (!isEnabled) {
      continue
    }

    const year = current.getUTCFullYear()
    const month = String(current.getUTCMonth() + 1).padStart(2, '0')
    const day = String(current.getUTCDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const dayOfMonth = current.getUTCDate()

    const dateForFormatting = new Date(Date.UTC(year, Number(month) - 1, dayOfMonth, 15, 0, 0))
    const dayOfWeekPt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
    })
      .format(dateForFormatting)
      .replace('.', '')
      .toUpperCase()

    const monthNamePt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      month: 'short',
    })
      .format(dateForFormatting)
      .replace('.', '')

    const isTomorrow = days.length === 0 && attempts === 1

    days.push({
      dateStr,
      dayOfWeek: dayOfWeekPt,
      dayOfMonth,
      monthName: monthNamePt,
      isTomorrow,
      label: isTomorrow ? 'Amanhã' : dayOfWeekPt,
    })
  }

  return days
}

export function getNextBusinessDays(baseDate: Date = new Date(), count: number = 3): BusinessDayItem[] {
  return getNextOperatingDays(null, baseDate, count)
}

export function calculateAvailableSlots(options: SlotCalculatorOptions): string[] {
  const {
    date,
    daySchedule,
    busyIntervals,
    visitDurationMinutes,
    bufferMinutes,
    minNoticeHours,
    currentTime = new Date(),
    timeZoneOffset = '-03:00',
    windowStart,
    windowEnd,
  } = options

  if (!daySchedule.enabled) return []

  const rawStart = parseTimeToMinutes(daySchedule.start)
  const rawEnd = parseTimeToMinutes(daySchedule.end)
  const windowStartMin = windowStart ? parseTimeToMinutes(windowStart) : null
  const windowEndMin = windowEnd ? parseTimeToMinutes(windowEnd) : null

  const startMinutes = windowStartMin !== null ? Math.max(rawStart, windowStartMin) : rawStart
  const endMinutes = windowEndMin !== null ? Math.min(rawEnd, windowEndMin) : rawEnd
  const stepMinutes = visitDurationMinutes + bufferMinutes

  if (startMinutes >= endMinutes || stepMinutes <= 0) return []

  const parsedBusy = busyIntervals.map(interval => ({
    start: new Date(interval.start).getTime(),
    end: new Date(interval.end).getTime(),
  }))

  const minNoticeTimestamp = currentTime.getTime() + minNoticeHours * 60 * 60 * 1000
  const availableSlots: string[] = []

  for (let current = startMinutes; current + visitDurationMinutes <= endMinutes; current += stepMinutes) {
    const timeFormatted = formatMinutesToTime(current)
    const slotStartIso = `${date}T${timeFormatted}:00${timeZoneOffset}`
    const slotStartDate = new Date(slotStartIso)
    const slotStartMs = slotStartDate.getTime()
    const slotEndMs = slotStartMs + visitDurationMinutes * 60 * 1000

    if (slotStartMs < minNoticeTimestamp) {
      continue
    }

    const hasConflict = parsedBusy.some(busy => {
      return slotStartMs < busy.end && slotEndMs > busy.start
    })

    if (!hasConflict) {
      availableSlots.push(timeFormatted)
    }
  }

  return availableSlots
}
