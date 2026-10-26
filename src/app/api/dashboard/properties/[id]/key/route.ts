import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature, requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { upsertKeySchema, isKeyLate, getMinutesLate } from '@/lib/keys/validation'

type RouteContext = { params: Promise<{ id: string }> }
const idSchema = z.string().uuid()

export async function GET(_request: Request, { params }: RouteContext) {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }

  const { id: propertyId } = await params
  if (!idSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: 'Imóvel inválido' }, { status: 404 })
  }

  const { tenantId, supabase } = result.context

  // 1. Busca chave cadastrada para o imóvel
  const { data: key, error: keyErr } = await supabase
    .from('property_keys')
    .select('id, property_id, codigo, status, localizacao, created_at, updated_at')
    .eq('property_id', propertyId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (keyErr) {
    console.error('Property key query failed', { code: keyErr.code })
    return NextResponse.json({ error: 'Falha ao buscar chave do imóvel' }, { status: 503 })
  }

  if (!key) {
    return NextResponse.json({ key: null, currentMovement: null, history: [] })
  }

  // 2. Busca histórico das últimas 20 movimentações
  const { data: movements, error: movErr } = await supabase
    .from('key_movements')
    .select(`
      id,
      tipo_responsavel,
      nome_responsavel,
      telefone_responsavel,
      documento_responsavel,
      motivo,
      data_saida,
      previsao_retorno,
      data_devolucao,
      observacoes_saida,
      observacoes_devolucao,
      consultor_id,
      profiles:consultor_id (
        id,
        nome,
        email
      )
    `)
    .eq('key_id', key.id)
    .eq('tenant_id', tenantId)
    .order('data_saida', { ascending: false })
    .limit(20)

  if (movErr) {
    console.error('Key history query failed', { code: movErr.code })
  }

  interface MovementWithProfile {
    id: string
    tipo_responsavel: string
    nome_responsavel: string
    telefone_responsavel: string | null
    documento_responsavel: string | null
    motivo: string | null
    data_saida: string
    previsao_retorno: string | null
    data_devolucao: string | null
    observacoes_saida: string | null
    observacoes_devolucao: string | null
    consultor_id: string | null
    profiles: { id: string; nome: string; email: string } | null
  }

  const history = (movements as unknown as MovementWithProfile[]) ?? []
  const currentMovementRaw = history.find((m) => m.data_devolucao === null) || null

  const currentMovement = currentMovementRaw
    ? {
        ...currentMovementRaw,
        isLate: isKeyLate(currentMovementRaw.previsao_retorno),
        minutesLate: getMinutesLate(currentMovementRaw.previsao_retorno),
        consultor: currentMovementRaw.profiles ?? null,
      }
    : null

  return NextResponse.json(
    {
      key,
      currentMovement,
      history,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function PUT(request: Request, { params }: RouteContext) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const { id: propertyId } = await params
  if (!idSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: 'Imóvel inválido' }, { status: 404 })
  }

  const body = await readJsonBody(request, 8_192)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = upsertKeySchema.safeParse(body.value)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Dados inválidos'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }

  const { tenantId, supabase } = result.context
  const { codigo, localizacao } = parsed.data

  const { data: key, error } = await supabase
    .from('property_keys')
    .upsert(
      {
        tenant_id: tenantId,
        property_id: propertyId,
        codigo,
        localizacao: localizacao ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'property_id' }
    )
    .select('id, property_id, codigo, status, localizacao, updated_at')
    .single()

  if (error || !key) {
    console.error('Property key update failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível salvar os dados da chave' }, { status: 503 })
  }

  return NextResponse.json({ key }, { headers: { 'Cache-Control': 'no-store' } })
}
