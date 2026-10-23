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
  } = options

  if (!daySchedule.enabled) return []

  const startMinutes = parseTimeToMinutes(daySchedule.start)
  const endMinutes = parseTimeToMinutes(daySchedule.end)
  const stepMinutes = visitDurationMinutes + bufferMinutes

  if (startMinutes >= endMinutes || stepMinutes <= 0) return []

  // Converte busyIntervals em timestamps numéricos
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

    // 1. Verifica antecedência mínima
    if (slotStartMs < minNoticeTimestamp) {
      continue
    }

    // 2. Verifica colisão com busy intervals
    const hasConflict = parsedBusy.some(busy => {
      // Sobreposição: (slotStart < busyEnd) && (slotEnd > busyStart)
      return slotStartMs < busy.end && slotEndMs > busy.start
    })

    if (!hasConflict) {
      availableSlots.push(timeFormatted)
    }
  }

  return availableSlots
}
