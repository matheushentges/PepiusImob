import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function verifyOAuthState(stateStr: string, secret: string): { ok: boolean; tenantId?: string } {
  try {
    const decoded = Buffer.from(stateStr, 'base64url').toString('utf8')
    const parts = decoded.split(':')
    if (parts.length !== 3) return { ok: false }
    const [tenantId, timestamp, signature] = parts
    const ageMs = Date.now() - Number(timestamp)
    if (Number.isNaN(ageMs) || ageMs < 0 || ageMs > 15 * 60 * 1000) {
      return { ok: false } // Expira em 15 minutos
    }
    const expectedSig = createHmac('sha256', secret).update(`${tenantId}:${timestamp}`).digest('hex')
    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSig)
    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { ok: false }
    }
    return { ok: true, tenantId }
  } catch {
    return { ok: false }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const redirectBase = `${url.origin}/dashboard/configuracoes?tab=agenda`

  if (error || !code || !state) {
    return NextResponse.redirect(`${redirectBase}&status=error&message=${encodeURIComponent(error || 'Acesso negado')}`)
  }

  const pepper = process.env.LEAD_RATE_LIMIT_PEPPER || 'calendar-state-secret'
  const stateCheck = verifyOAuthState(state, pepper)
  if (!stateCheck.ok || !stateCheck.tenantId) {
    return NextResponse.redirect(`${redirectBase}&status=error&message=${encodeURIComponent('Sessão expirada. Tente novamente.')}`)
  }

  const tenantId = stateCheck.tenantId
  const admin = createAdminClient()

  // Busca chaves
  const { data: settings } = await admin
    .from('calendar_settings')
    .select('google_client_id, google_client_secret')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  const clientId = settings?.google_client_id || process.env.GOOGLE_CLIENT_ID
  const clientSecret = settings?.google_client_secret || process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${redirectBase}&status=error&message=${encodeURIComponent('Credenciais Google ausentes')}`)
  }

  const redirectUri = `${url.origin}/api/dashboard/calendar/callback`

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('Google token exchange failed', await tokenRes.text())
      return NextResponse.redirect(`${redirectBase}&status=error&message=${encodeURIComponent('Falha ao obter autorização do Google')}`)
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token as string
    const refreshToken = tokenData.refresh_token as string | undefined
    const expiresIn = (tokenData.expires_in as number) || 3600
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Consulta e-mail da conta conectada
    let connectedEmail: string | null = null
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        connectedEmail = userData.email || null
      }
    } catch (err) {
      console.warn('Could not fetch Google user email', err)
    }

    // Upsert em calendar_settings
    const updatePayload: Record<string, unknown> = {
      tenant_id: tenantId,
      enabled: true,
      google_access_token: accessToken,
      google_token_expires_at: tokenExpiresAt,
      connected_email: connectedEmail,
      updated_at: new Date().toISOString(),
    }
    if (refreshToken) {
      updatePayload.google_refresh_token = refreshToken
    }

    const { error: upsertError } = await admin
      .from('calendar_settings')
      .upsert(updatePayload, { onConflict: 'tenant_id' })

    if (upsertError) {
      console.error('Failed to save calendar settings', upsertError)
      return NextResponse.redirect(`${redirectBase}&status=error&message=${encodeURIComponent('Falha ao salvar conexão')}`)
    }

    return NextResponse.redirect(`${redirectBase}&status=connected`)
  } catch (cause) {
    console.error('OAuth callback exception', cause)
    return NextResponse.redirect(`${redirectBase}&status=error&message=${encodeURIComponent('Erro inesperado no retorno do Google')}`)
  }
}
