export interface EventDetailsInput {
  propertyTitle: string
  propertyCode: string
  propertyAddress: string
  clientName: string
  clientPhone: string
  clientEmail: string
  startDateTime: string
  endDateTime: string
  timeZone?: string
  leadId?: string
}

export function buildEventPayload(input: EventDetailsInput) {
  const timeZone = input.timeZone || 'America/Sao_Paulo'
  return {
    summary: `Visita Imóvel #${input.propertyCode} - ${input.propertyTitle} (${input.clientName})`,
    description: [
      `📅 Visita Presencial Agendada via Pepius Imob`,
      ``,
      `👤 Cliente: ${input.clientName}`,
      `📞 Telefone/WhatsApp: ${input.clientPhone}`,
      `✉️ E-mail: ${input.clientEmail}`,
      ``,
      `🏠 Imóvel: ${input.propertyTitle} (Código #${input.propertyCode})`,
      `📍 Localização / Bairro: ${input.propertyAddress}`,
      `ℹ️ O endereço completo e instruções de acesso serão informados pelo corretor responsável antes da visita.`,
      input.leadId ? `🔗 Lead ID: ${input.leadId}` : null,
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: input.startDateTime,
      timeZone,
    },
    end: {
      dateTime: input.endDateTime,
      timeZone,
    },
    attendees: input.clientEmail ? [{ email: input.clientEmail }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'email', minutes: 1440 },
      ],
    },
  }
}

export async function getFreshAccessToken(tenantId: string): Promise<string | null> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const { data: settings, error } = await admin
    .from('calendar_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error || !settings || !settings.google_refresh_token) {
    return null
  }

  const clientId = settings.google_client_id || process.env.GOOGLE_CLIENT_ID
  const clientSecret = settings.google_client_secret || process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const now = new Date()
  const expiresAt = settings.google_token_expires_at ? new Date(settings.google_token_expires_at) : null

  // Se o access_token atual for válido por mais de 5 minutos, reutiliza
  if (settings.google_access_token && expiresAt && expiresAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    return settings.google_access_token
  }

  // Renova via refresh_token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: settings.google_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    console.error('Failed to refresh Google token', await response.text())
    return null
  }

  const tokenData = await response.json()
  const newAccessToken = tokenData.access_token as string
  const expiresIn = (tokenData.expires_in as number) || 3600
  const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

  await admin
    .from('calendar_settings')
    .update({
      google_access_token: newAccessToken,
      google_token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)

  return newAccessToken
}

export async function fetchFreeBusyCalendar(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId || 'primary' }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Google FreeBusy error: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  const target = data.calendars?.[calendarId || 'primary']
  return (target?.busy || []) as Array<{ start: string; end: string }>
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventPayload: ReturnType<typeof buildEventPayload>,
) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId || 'primary',
  )}/events?sendUpdates=all`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  })

  if (!response.ok) {
    throw new Error(`Google Create Event error: ${response.status} ${await response.text()}`)
  }

  return await response.json()
}
