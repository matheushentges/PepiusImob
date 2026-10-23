import { createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { requestIp } from '@/lib/security/request-origin'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { publicBookVisitSchema } from '@/lib/calendar/validation'
import {
  getFreshAccessToken,
  fetchFreeBusyCalendar,
  buildEventPayload,
  createGoogleCalendarEvent,
} from '@/lib/calendar/google-calendar'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher'

export async function POST(request: Request) {
  const body = await readJsonBody(request, 8192)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = publicBookVisitSchema.safeParse(body.value)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Confira os dados do formulário'
    return NextResponse.json({ error: firstIssue }, { status: 400 })
  }

  // Honeypot: se preenchido, responde sucesso simulado para desarmar bots sem persistir
  if (parsed.data.website) {
    return NextResponse.json({ success: true, bookingId: 'mock-bot' }, { status: 201 })
  }

  if (
    !(await requireActiveLicense('public-listing')) ||
    !(await requireActiveLicense('leads'))
  ) {
    return NextResponse.json(
      { error: 'A vitrine está temporariamente indisponível' },
      { status: 423 },
    )
  }

  const ip = requestIp(request)
  const pepper = process.env.LEAD_RATE_LIMIT_PEPPER
  const tenantId = process.env.PEPIUS_TENANT_ID
  if (!ip || !pepper || !tenantId) {
    return NextResponse.json(
      { error: 'Agendamento de visitas temporariamente indisponível' },
      { status: 503 },
    )
  }

  try {
    const admin = createAdminClient()

    // Rate limit atômico por IP compartilhado com captação de leads
    const ipHash = createHmac('sha256', pepper).update(ip).digest('hex')
    const { data: allowed, error: rateError } = await admin.rpc(
      'consume_public_lead_rate_limit',
      {
        p_ip_hash: ipHash,
        p_window_seconds: 900,
        p_max_requests: 5,
      },
    )
    if (rateError) throw rateError
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas solicitações seguidas. Aguarde alguns minutos.' },
        { status: 429 },
      )
    }

    // Valida comprimento de dígitos do telefone
    const phoneDigits = parsed.data.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    // Busca dados do imóvel
    const { data: property, error: propertyError } = await admin
      .from('properties')
      .select('id, codigo, titulo, endereco, bairro, cidade, estado')
      .eq('id', parsed.data.propertyId)
      .eq('tenant_id', tenantId)
      .eq('status', 'disponivel')
      .maybeSingle()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Imóvel não encontrado ou não está disponível' }, { status: 404 })
    }

    // Busca configurações de agenda
    const { data: settings, error: settingsError } = await admin
      .from('calendar_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (settingsError || !settings || !settings.enabled || !settings.google_refresh_token) {
      return NextResponse.json(
        { error: 'O agendamento online de visitas não está ativado no momento' },
        { status: 400 },
      )
    }

    // Calcula janelas de início e término em America/Sao_Paulo (UTC-03:00)
    const [startHourStr, startMinStr] = parsed.data.time.split(':')
    const startHour = Number(startHourStr)
    const startMinute = Number(startMinStr)

    const visitDuration = settings.visit_duration_minutes ?? 45
    const totalStartMinutes = startHour * 60 + startMinute
    const totalEndMinutes = totalStartMinutes + visitDuration

    const endH = String(Math.floor(totalEndMinutes / 60)).padStart(2, '0')
    const endM = String(totalEndMinutes % 60).padStart(2, '0')

    const visitStartsAt = `${parsed.data.date}T${parsed.data.time}:00-03:00`
    const visitEndsAt = `${parsed.data.date}T${endH}:${endM}:00-03:00`

    const startDateObj = new Date(visitStartsAt)
    const now = new Date()

    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({ error: 'Data ou horário inválidos' }, { status: 400 })
    }

    // Validação de antecedência mínima
    const minNoticeMs = (settings.min_notice_hours ?? 2) * 60 * 60 * 1000
    if (startDateObj.getTime() < now.getTime() + minNoticeMs) {
      return NextResponse.json(
        { error: 'O horário selecionado não atende à antecedência mínima para visitas' },
        { status: 400 },
      )
    }

    // Validação de período máximo à frente
    const todaySaoPaulo = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
    }).format(now)
    const diffDays = Math.ceil(
      (new Date(`${parsed.data.date}T00:00:00-03:00`).getTime() -
        new Date(`${todaySaoPaulo}T00:00:00-03:00`).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    if (diffDays > (settings.max_days_ahead ?? 30)) {
      return NextResponse.json(
        { error: 'A data selecionada ultrapassa o limite de agendamento' },
        { status: 400 },
      )
    }

    // Verificação de conflito no banco local (leads)
    const { data: conflictingLead } = await admin
      .from('leads')
      .select('id')
      .eq('tenant_id', tenantId)
      .lt('visit_starts_at', visitEndsAt)
      .gt('visit_ends_at', visitStartsAt)
      .maybeSingle()

    if (conflictingLead) {
      return NextResponse.json(
        { error: 'Este horário acabou de ser reservado. Por favor, selecione outro.' },
        { status: 409 },
      )
    }

    // Verificação de conflito no Google Calendar
    const accessToken = await getFreshAccessToken(tenantId)
    if (accessToken) {
      try {
        const busyList = await fetchFreeBusyCalendar(
          accessToken,
          settings.google_calendar_id || 'primary',
          visitStartsAt,
          visitEndsAt,
        )

        const startTimestamp = startDateObj.getTime()
        const endTimestamp = new Date(visitEndsAt).getTime()

        const hasConflict = busyList.some((interval) => {
          const bStart = new Date(interval.start).getTime()
          const bEnd = new Date(interval.end).getTime()
          return startTimestamp < bEnd && endTimestamp > bStart
        })

        if (hasConflict) {
          return NextResponse.json(
            { error: 'O corretor possui um compromisso neste horário. Escolha outro slot.' },
            { status: 409 },
          )
        }
      } catch (gErr) {
        console.warn('Erro ao verificar FreeBusy durante reserva, prosseguindo com checagem local:', gErr)
      }
    }

    // Criação do evento no Google Calendar
    let googleEventId: string | null = null
    let googleEventLink: string | null = null

    if (accessToken) {
      try {
        const propertyAddress = [
          property.endereco,
          property.bairro,
          `${property.cidade} - ${property.estado}`,
        ]
          .filter(Boolean)
          .join(', ')

        const payload = buildEventPayload({
          propertyTitle: property.titulo,
          propertyCode: property.codigo || property.id.slice(0, 8),
          propertyAddress,
          clientName: parsed.data.name,
          clientPhone: parsed.data.phone,
          clientEmail: parsed.data.email,
          startDateTime: visitStartsAt,
          endDateTime: visitEndsAt,
        })

        const createdEvent = await createGoogleCalendarEvent(
          accessToken,
          settings.google_calendar_id || 'primary',
          payload,
        )

        googleEventId = (createdEvent?.id as string) || null
        googleEventLink = (createdEvent?.htmlLink as string) || null
      } catch (eventErr) {
        console.error('Falha ao criar evento no Google Calendar:', eventErr)
      }
    }

    // Grava lead na base PostgreSQL
    const { data: newLead, error: insertError } = await admin
      .from('leads')
      .insert({
        tenant_id: tenantId,
        property_id: property.id,
        nome: parsed.data.name,
        email: parsed.data.email,
        telefone: parsed.data.phone,
        mensagem: parsed.data.message || null,
        horario_preferido: 'visita_agendada',
        status: 'novo',
        visit_starts_at: visitStartsAt,
        visit_ends_at: visitEndsAt,
        google_event_id: googleEventId,
        google_event_link: googleEventLink,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Erro ao salvar lead de visita:', insertError)
      throw insertError
    }

    // Dispara webhook assinado de forma não-bloqueante para o n8n/automações
    dispatchWebhookEvent('visit.scheduled', {
      leadId: newLead.id,
      nome: parsed.data.name,
      telefone: parsed.data.phone,
      email: parsed.data.email,
      mensagem: parsed.data.message || null,
      visitStartsAt,
      visitEndsAt,
      googleEventLink,
      imovel: {
        id: property.id,
        titulo: property.titulo,
        codigo: property.codigo,
        bairro: property.bairro,
        cidade: property.cidade,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        leadId: newLead.id,
        visitStartsAt,
        visitEndsAt,
        googleEventLink,
      },
      {
        status: 201,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (err) {
    console.error('Falha no agendamento de visita:', err)
    return NextResponse.json(
      { error: 'Não foi possível concluir seu agendamento. Tente novamente em instantes.' },
      { status: 500 },
    )
  }
}
