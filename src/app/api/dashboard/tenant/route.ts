import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const siteConfigSchema = z.object({
  hero_title: z.string().trim().max(100).default(''),
  hero_subtitle: z.string().trim().max(300).default(''),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#334155'),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#E07A5F'),
}).strict()

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

  const body = await readJsonBody(request, 8192)
  if (!body.ok) return bodyErrorResponse(body.reason)
  const parsed = z.object({ site_config: siteConfigSchema }).strict()
    .safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confira as configurações informadas' }, { status: 400 })
  }

  const { data, error } = await result.context.supabase
    .from('tenants')
    .update({ site_config: parsed.data.site_config })
    .eq('id', result.context.tenantId)
    .select('id, nome, site_config')
    .single()

  if (error || !data) {
    console.error('Agency site settings update failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível salvar as configurações' }, { status: 503 })
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
