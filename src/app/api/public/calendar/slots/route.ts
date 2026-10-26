import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { publicSlotQuerySchema } from '@/lib/calendar/validation'
import { calculateAvailableSlots, getNextOperatingDays } from '@/lib/calendar/slot-calculator'
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

    if (settingsError || !settings || !settings.enabled) {
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

    const visitDuration = settings.visit_duration_minutes ?? 45
    const bufferMinutes = settings.buffer_minutes ?? 15
    let slots: Array<{ time: string; startsAt: string; endsAt: string; formatted: string }> = []
    let n8nHandled = false

    // 4. Tentativa de consulta síncrona via n8n (rede interna Docker)
    const n8nSlotsUrl = process.env.PEPIUS_N8N_CALENDAR_SLOTS_URL || 'http://n8n:5678/webhook/pepius-slots'
    try {
      const url = new URL(n8nSlotsUrl)
      url.searchParams.set('date', parsed.data.date)
      url.searchParams.set('duration', String(visitDuration))
      url.searchParams.set('buffer', String(bufferMinutes))
      url.searchParams.set('propertyId', parsed.data.propertyId)

      const n8nRes = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
      })

      if (n8nRes.ok) {
        const n8nData = await n8nRes.json()
        if (Array.isArray(n8nData.slots) && n8nData.slots.length > 0) {
          slots = (n8nData.slots as string[]).map((time) => {
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
          n8nHandled = true
        }
      }
    } catch {
      // Fallback para motor local
    }

    // 5. Motor local de contingência (caso n8n não responda ou retorne vazio)
    if (!n8nHandled) {
      const busyIntervals: Array<{ start: string; end: string }> = []

      // Coleta do Google se token nativo estiver configurado
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

      // Coleta reservas locais (leads) para a data
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

      // Determina dia da semana
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
        enabled: dayOfWeekIndex >= 1 && dayOfWeekIndex <= 5, // seg a sex ativado por padrão
        start: '08:00',
        end: '17:00',
      }

      const availableTimes = calculateAvailableSlots({
        date: parsed.data.date,
        daySchedule,
        busyIntervals,
        visitDurationMinutes: visitDuration,
        bufferMinutes,
        minNoticeHours: settings.min_notice_hours ?? 2,
        currentTime: new Date(),
        windowStart: '08:00',
        windowEnd: '17:00',
      })

      slots = availableTimes.map((time) => {
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
    }

    const availableDays = getNextOperatingDays(settings.operating_hours, new Date(), 3)

    return NextResponse.json(
      {
        enabled: true,
        visitDurationMinutes: visitDuration,
        availableDays,
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
