import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature, requireActiveLicense } from '@/lib/licensing/local-state'
import { propertyInputSchema } from '@/lib/properties/validation'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const createPropertySchema = propertyInputSchema

export async function GET() {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }

  const { data, error } = await result.context.supabase
    .from('properties')
    .select('id, tenant_id, titulo, descricao, tipo, finalidade, status, featured, preco_venda, preco_locacao, endereco, cidade, estado, cep, bairro, area_total, area_construida, quartos, banheiros, vagas_garagem, created_at, updated_at')
    .eq('tenant_id', result.context.tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Agency property list failed', { code: error.code })
    return NextResponse.json({ error: 'Não foi possível carregar os imóveis' }, { status: 503 })
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 32_768)
  if (!body.ok) return bodyErrorResponse(body.reason)
  const parsed = createPropertySchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confira os dados do imóvel' }, { status: 400 })
  }

  const { data, error } = await result.context.supabase
    .from('properties')
    .insert({ ...parsed.data, tenant_id: result.context.tenantId })
    .select('id, tenant_id, titulo, descricao, tipo, finalidade, status, featured, preco_venda, preco_locacao, endereco, cidade, estado, cep, bairro, area_total, area_construida, quartos, banheiros, vagas_garagem, created_at, updated_at')
    .single()

  if (error || !data) {
    console.error('Agency property create failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível salvar o imóvel' }, { status: 503 })
  }

  return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
