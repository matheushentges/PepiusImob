import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature, requireActiveLicense } from '@/lib/licensing/local-state'
import { propertyInputSchema } from '@/lib/properties/validation'
import { getPropertyImagePath } from '@/lib/storage/property-images'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

type RouteContext = { params: Promise<{ id: string }> }
const idSchema = z.string().uuid()

export async function GET(_request: Request, { params }: RouteContext) {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }
  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  const { data, error } = await result.context.supabase
    .from('properties')
    .select('id, tenant_id, titulo, descricao, tipo, finalidade, status, featured, preco_venda, preco_locacao, endereco, cidade, estado, cep, bairro, area_total, area_construida, quartos, banheiros, vagas_garagem, created_at, updated_at')
    .eq('id', id)
    .eq('tenant_id', result.context.tenantId)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }
  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  const body = await readJsonBody(request, 32_768)
  if (!body.ok) return bodyErrorResponse(body.reason)
  const parsed = propertyInputSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confira os dados do imóvel' }, { status: 400 })
  }

  const { data, error } = await result.context.supabase
    .from('properties')
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', result.context.tenantId)
    .select('id, tenant_id, titulo, descricao, tipo, finalidade, status, featured, preco_venda, preco_locacao, endereco, cidade, estado, cep, bairro, area_total, area_construida, quartos, banheiros, vagas_garagem, created_at, updated_at')
    .maybeSingle()

  if (error || !data) {
    console.error('Agency property update failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível salvar o imóvel' }, { status: error ? 503 : 404 })
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }
  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  const { data: images } = await result.context.supabase
    .from('property_images')
    .select('url')
    .eq('property_id', id)

  const { data, error } = await result.context.supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('tenant_id', result.context.tenantId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('Agency property delete failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível excluir o imóvel' }, { status: error ? 503 : 404 })
  }

  const paths = (images ?? [])
    .map((image) => getPropertyImagePath(image.url))
    .filter((path): path is string => Boolean(path))
  if (paths.length > 0) {
    const { error: storageError } = await result.context.supabase.storage
      .from('property-images')
      .remove(paths)
    if (storageError) {
      console.error('Property image storage cleanup failed', { name: storageError.name })
    }
  }

  return NextResponse.json({ success: true })
}
