import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(timeRegex, 'Formato HH:MM obrigatório'),
  end: z.string().regex(timeRegex, 'Formato HH:MM obrigatório'),
}).refine(data => {
  if (!data.enabled) return true
  return data.start < data.end
}, { message: 'Horário final deve ser maior que o inicial' })

export const operatingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
})

export const calendarSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  google_client_id: z.string().trim().max(250).optional().default(''),
  google_client_secret: z.string().trim().max(250).optional().default(''),
  google_calendar_id: z.string().trim().max(150).default('primary'),
  visit_duration_minutes: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(45),
    z.literal(60),
    z.literal(90),
    z.literal(120),
  ]).default(45),
  buffer_minutes: z.union([
    z.literal(0),
    z.literal(10),
    z.literal(15),
    z.literal(30),
    z.literal(45),
    z.literal(60),
  ]).default(15),
  min_notice_hours: z.number().int().min(0).max(72).default(2),
  max_days_ahead: z.number().int().min(1).max(90).default(30),
  operating_hours: operatingHoursSchema.default({
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: true, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' },
  }),
})

export const publicSlotQuerySchema = z.object({
  propertyId: z.string().uuid(),
  date: z.string().regex(dateRegex, 'Data deve estar no formato YYYY-MM-DD'),
})

export const publicBookVisitSchema = z.object({
  propertyId: z.string().uuid(),
  date: z.string().regex(dateRegex, 'Data no formato YYYY-MM-DD'),
  time: z.string().regex(timeRegex, 'Horário no formato HH:MM'),
  name: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(120),
  phone: z.string().trim().min(10, 'Telefone inválido').max(30).regex(/^[0-9+().\s-]+$/),
  email: z.string().trim().email('E-mail inválido').max(254),
  message: z.string().trim().max(1000).optional(),
  website: z.string().max(200).optional(), // Honeypot
}).strict()

export type CalendarSettingsInput = z.infer<typeof calendarSettingsSchema>
export type PublicBookVisitInput = z.infer<typeof publicBookVisitSchema>
export type DayScheduleInput = z.infer<typeof dayScheduleSchema>
export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>
