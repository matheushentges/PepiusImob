import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { publicSlotQuerySchema } from '@/lib/calendar/validation'
import { calculateAvailableSlots } from '@/lib/calendar/slot-calculator'
import { getFreshAccessToken, fetchFreeBusyCalendar } from '@/lib/calendar/google-calendar'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const propertyId = url.searchParams.get('propertyId')
    const date = url.searchParams.get('date')

    const parsed = publicSlotQuerySchema.safeParse({ propertyId, date })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Informe propertyId e data no formato YYYY-MM-DD.' },
        { status: 400 },
      )
    }

    if (!(await requireActiveLicense('public-listing'))) {
      return NextResponse.json(
        { error: 'A vitrine está temporariamente indisponível' },
        { status: 423 },
      )
    }

    const tenantId = process.env.PEPIUS_TENANT_ID
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Serviço de agendamento não configurado' },
        { status: 503 },
      )
    }

    const admin = createAdminClient()

    // 1. Confirma que o imóvel existe, pertence ao tenant e está disponível
    const { data: property, error: propertyError } = await admin
      .from('properties')
      .select('id, titulo')
      .eq('id', parsed.data.propertyId)
      .eq('tenant_id', tenantId)
      .eq('status', 'disponivel')
      .maybeSingle()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Imóvel não encontrado ou não está disponível' },
        { status: 404 },
      )
    }

    // 2. Consulta configurações de agenda da imobiliária
    const { data: settings, error: settingsError } = await admin
      .from('calendar_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (settingsError || !settings || !settings.enabled || !settings.google_refresh_token) {
      return NextResponse.json(
        {
          enabled: false,
          visitDurationMinutes: 45,
          slots: [],
          message: 'Agendamento online de visitas não está habilitado para esta imobiliária.',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    // 3. Valida se a data solicitada respeita max_days_ahead
    const todaySaoPaulo = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
    }).format(new Date())

    const targetDateObj = new Date(`${parsed.data.date}T00:00:00-03:00`)
    const todayDateObj = new Date(`${todaySaoPaulo}T00:00:00-03:00`)
    const diffDays = Math.ceil(
      (targetDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24),
    )

    const maxDaysAhead = settings.max_days_ahead ?? 30
    if (diffDays < 0 || diffDays > maxDaysAhead) {
      return NextResponse.json(
        {
          enabled: true,
          visitDurationMinutes: settings.visit_duration_minutes,
          slots: [],
          message: 'Data fora do período permitido para agendamento.',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    // 4. Coleta intervalos ocupados do Google Calendar (FreeBusy)
    const busyIntervals: Array<{ start: string; end: string }> = []

    try {
      const accessToken = await getFreshAccessToken(tenantId)
      if (accessToken) {
        const timeMin = `${parsed.data.date}T00:00:00-03:00`
        const timeMax = `${parsed.data.date}T23:59:59-03:00`
        const googleBusy = await fetchFreeBusyCalendar(
          accessToken,
          settings.google_calendar_id || 'primary',
          timeMin,
          timeMax,
        )
        busyIntervals.push(...googleBusy)
      }
    } catch (gErr) {
      console.warn('Não foi possível sincronizar FreeBusy do Google, usando agenda local:', gErr)
    }

    // 5. Coleta visitas já reservadas na base local (leads) para a mesma data
    const startOfDay = `${parsed.data.date}T00:00:00-03:00`
    const endOfDay = `${parsed.data.date}T23:59:59-03:00`
    const { data: bookedLeads } = await admin
      .from('leads')
      .select('visit_starts_at, visit_ends_at')
      .eq('tenant_id', tenantId)
      .gte('visit_starts_at', startOfDay)
      .lte('visit_starts_at', endOfDay)
      .not('visit_starts_at', 'is', null)

    if (bookedLeads && bookedLeads.length > 0) {
      for (const lead of bookedLeads) {
        if (lead.visit_starts_at && lead.visit_ends_at) {
          busyIntervals.push({
            start: lead.visit_starts_at,
            end: lead.visit_ends_at,
          })
        }
      }
    }

    // 6. Determina o dia da semana para extrair o expediente configurado
    const [year, month, day] = parsed.data.date.split('-').map(Number)
    const dayOfWeekIndex = new Date(year, month - 1, day, 12, 0, 0).getDay()
    const dayKeys = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const
    const dayKey = dayKeys[dayOfWeekIndex]

    const operatingHours = settings.operating_hours as Record<
      string,
      { enabled: boolean; start: string; end: string }
    > | null
    const daySchedule = operatingHours?.[dayKey] ?? {
      enabled: false,
      start: '09:00',
      end: '18:00',
    }

    const visitDuration = settings.visit_duration_minutes ?? 45

    const availableTimes = calculateAvailableSlots({
      date: parsed.data.date,
      daySchedule,
      busyIntervals,
      visitDurationMinutes: visitDuration,
      bufferMinutes: settings.buffer_minutes ?? 15,
      minNoticeHours: settings.min_notice_hours ?? 2,
      currentTime: new Date(),
    })

    const slots = availableTimes.map((time) => {
      const [h, m] = time.split(':').map(Number)
      const totalStart = h * 60 + m
      const totalEnd = totalStart + visitDuration
      const endH = String(Math.floor(totalEnd / 60)).padStart(2, '0')
      const endM = String(totalEnd % 60).padStart(2, '0')
      return {
        time,
        startsAt: `${parsed.data.date}T${time}:00-03:00`,
        endsAt: `${parsed.data.date}T${endH}:${endM}:00-03:00`,
        formatted: `${time} às ${endH}:${endM}`,
      }
    })

    return NextResponse.json(
      {
        enabled: true,
        visitDurationMinutes: visitDuration,
        slots,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('Falha ao consultar slots livres:', err)
    return NextResponse.json(
      { error: 'Não foi possível carregar os horários disponíveis' },
      { status: 500 },
    )
  }
}
