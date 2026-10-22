import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { tenantBrandingSchema } from '@/lib/tenant/validation'

export async function GET() {
  const result = await getAgencyContext()
  if (!result.context) return result.response

  const { data, error } = await result.context.supabase
    .from('tenants')
    .select('id, nome, site_config')
    .eq('id', result.context.tenantId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Não foi possível carregar as configurações' }, { status: 503 })
  }

  return NextResponse.json({
    ...data,
    can_edit: result.context.role === 'imobiliaria_owner' && await requireActiveLicense('public-listing'),
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (result.context.role !== 'imobiliaria_owner') {
    return NextResponse.json({ error: 'Apenas o responsável da imobiliária pode alterar as configurações' }, { status: 403 })
  }
  if (!(await requireActiveLicense('public-listing'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 16384)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = tenantBrandingSchema.safeParse(body.value)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Confira os dados informados'
    return NextResponse.json({ error: firstIssue }, { status: 400 })
  }

  const { data, error } = await result.context.supabase
    .from('tenants')
    .update({
      nome: parsed.data.nome,
      site_config: parsed.data.site_config,
    })
    .eq('id', result.context.tenantId)
    .select('id, nome, site_config')
    .single()

  if (error || !data) {
    console.error('Agency site settings update failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível salvar as configurações' }, { status: 503 })
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
