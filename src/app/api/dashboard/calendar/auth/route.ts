import { createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { createAdminClient } from '@/lib/supabase/admin'

function createOAuthState(tenantId: string, secret: string): string {
  const timestamp = Date.now().toString()
  const payload = `${tenantId}:${timestamp}`
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

export async function GET(request: Request) {
  const result = await getAgencyContext()
  if (!result.context) return result.response

  if (result.context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas o responsável da imobiliária pode conectar a conta Google' },
      { status: 403 },
    )
  }

  const tenantId = result.context.tenantId
  const admin = createAdminClient()
  const { data: settings } = await admin
    .from('calendar_settings')
    .select('google_client_id')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  const clientId = settings?.google_client_id || process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: 'Credenciais Google não configuradas. Preencha o Client ID nas configurações ou no arquivo .env.' },
      { status: 400 },
    )
  }

  const pepper = process.env.LEAD_RATE_LIMIT_PEPPER
  if (!pepper) {
    return NextResponse.json(
      { error: 'Configuração de segurança LEAD_RATE_LIMIT_PEPPER ausente no servidor.' },
      { status: 500 },
    )
  }
  const state = createOAuthState(tenantId, pepper)

  const urlObj = new URL(request.url)
  const redirectUri = `${urlObj.origin}/api/dashboard/calendar/callback`

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return NextResponse.redirect(authUrl)
}
