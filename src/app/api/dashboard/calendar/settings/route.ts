import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { calendarSettingsSchema } from '@/lib/calendar/validation'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const result = await getAgencyContext()
  if (!result.context) return result.response

  const admin = createAdminClient()
  const { data: settings } = await admin
    .from('calendar_settings')
    .select('*')
    .eq('tenant_id', result.context.tenantId)
    .maybeSingle()

  const defaultOperatingHours = {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: true, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' },
  }

  const responseData = {
    enabled: settings?.enabled ?? false,
    connected: Boolean(settings?.google_refresh_token),
    connected_email: settings?.connected_email || null,
    google_calendar_id: settings?.google_calendar_id || 'primary',
    google_client_id: settings?.google_client_id || '',
    has_client_secret: Boolean(settings?.google_client_secret),
    has_env_credentials: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    visit_duration_minutes: settings?.visit_duration_minutes ?? 45,
    buffer_minutes: settings?.buffer_minutes ?? 15,
    min_notice_hours: settings?.min_notice_hours ?? 2,
    max_days_ahead: settings?.max_days_ahead ?? 30,
    operating_hours: settings?.operating_hours ?? defaultOperatingHours,
    can_edit: result.context.role === 'imobiliaria_owner' && (await requireActiveLicense('public-listing')),
  }

  return NextResponse.json(responseData, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response

  if (result.context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas o responsável da imobiliária pode alterar as configurações da agenda' },
      { status: 403 },
    )
  }

  if (!(await requireActiveLicense('public-listing'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 16384)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = calendarSettingsSchema.safeParse(body.value)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Confira os dados informados'
    return NextResponse.json({ error: firstIssue }, { status: 400 })
  }

  const admin = createAdminClient()

  // Busca registro atual para preservar tokens e secret caso não fornecido novamente
  const { data: existing } = await admin
    .from('calendar_settings')
    .select('google_client_secret, google_refresh_token')
    .eq('tenant_id', result.context.tenantId)
    .maybeSingle()

  const secretToSave = parsed.data.google_client_secret?.trim()
    ? parsed.data.google_client_secret.trim()
    : existing?.google_client_secret || null

  const updateData: Record<string, unknown> = {
    tenant_id: result.context.tenantId,
    enabled: parsed.data.enabled,
    google_client_id: parsed.data.google_client_id?.trim() || null,
    google_client_secret: secretToSave,
    google_calendar_id: parsed.data.google_calendar_id,
    visit_duration_minutes: parsed.data.visit_duration_minutes,
    buffer_minutes: parsed.data.buffer_minutes,
    min_notice_hours: parsed.data.min_notice_hours,
    max_days_ahead: parsed.data.max_days_ahead,
    operating_hours: parsed.data.operating_hours,
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await admin
    .from('calendar_settings')
    .upsert(updateData, { onConflict: 'tenant_id' })

  if (upsertError) {
    console.error('Failed to update calendar settings', upsertError)
    return NextResponse.json({ error: 'Não foi possível salvar as configurações' }, { status: 503 })
  }

  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
}
