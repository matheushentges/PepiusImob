import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature, requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['novo', 'em_contato', 'convertido', 'perdido']),
}).strict()

export async function GET(request: Request) {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('leads'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }

  const status = new URL(request.url).searchParams.get('status')
  const allowedStatus = ['novo', 'em_contato', 'convertido', 'perdido']
  if (status && status !== 'todos' && !allowedStatus.includes(status)) {
    return NextResponse.json({ error: 'Filtro inválido' }, { status: 400 })
  }

  let query = result.context.supabase
    .from('leads')
    .select('id, property_id, nome, email, telefone, mensagem, horario_preferido, status, created_at, properties(titulo)')
    .eq('tenant_id', result.context.tenantId)
    .order('created_at', { ascending: false })

  if (status && status !== 'todos') query = query.eq('status', status)
  const { data, error } = await query

  if (error) {
    console.error('Agency lead list failed', { code: error.code })
    return NextResponse.json({ error: 'Não foi possível carregar os contatos' }, { status: 503 })
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('leads'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 4096)
  if (!body.ok) return bodyErrorResponse(body.reason)
  const parsed = patchSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { data, error } = await result.context.supabase
    .from('leads')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id)
    .eq('tenant_id', result.context.tenantId)
    .select('id, status')
    .maybeSingle()

  if (error || !data) {
    console.error('Agency lead update failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível atualizar o contato' }, { status: error ? 503 : 404 })
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
