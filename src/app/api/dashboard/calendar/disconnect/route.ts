import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response

  if (result.context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas o responsável da imobiliária pode desconectar a agenda' },
      { status: 403 },
    )
  }

  if (!(await requireActiveLicense('public-listing'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('calendar_settings')
    .update({
      enabled: false,
      google_refresh_token: null,
      google_access_token: null,
      google_token_expires_at: null,
      connected_email: null,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', result.context.tenantId)

  if (error) {
    console.error('Failed to disconnect Google Calendar', error)
    return NextResponse.json({ error: 'Não foi possível desconectar a conta' }, { status: 503 })
  }

  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
}
