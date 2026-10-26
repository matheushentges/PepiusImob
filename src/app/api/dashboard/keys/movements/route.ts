import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { checkoutKeySchema, returnKeySchema, mapHolderTypeToStatus } from '@/lib/keys/validation'

export async function POST(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 16_384)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = checkoutKeySchema.safeParse(body.value)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Dados inválidos'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }

  const { tenantId, userId, supabase } = result.context
  const {
    key_id,
    property_id,
    tipo_responsavel,
    consultor_id,
    nome_responsavel,
    telefone_responsavel,
    documento_responsavel,
    motivo,
    previsao_retorno,
    observacoes_saida,
  } = parsed.data

  // 1. Verifica se a chave existe e está disponível
  const { data: key, error: keyErr } = await supabase
    .from('property_keys')
    .select('id, status, codigo')
    .eq('id', key_id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (keyErr || !key) {
    return NextResponse.json({ error: 'Chave não encontrada' }, { status: 404 })
  }

  if (key.status !== 'disponivel') {
    return NextResponse.json(
      { error: `A chave ${key.codigo} já está alocada no momento e não pode ser retirada novamente` },
      { status: 409 }
    )
  }

  const newStatus = mapHolderTypeToStatus(tipo_responsavel)

  // 2. Insere a movimentação
  const { data: movement, error: movErr } = await supabase
    .from('key_movements')
    .insert({
      tenant_id: tenantId,
      key_id,
      property_id,
      tipo_responsavel,
      consultor_id,
      nome_responsavel,
      telefone_responsavel,
      documento_responsavel,
      motivo,
      previsao_retorno,
      observacoes_saida,
      registrado_por: userId,
      data_saida: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (movErr || !movement) {
    console.error('Key checkout movement insert failed', { code: movErr?.code })
    return NextResponse.json({ error: 'Não foi possível registrar a saída da chave' }, { status: 503 })
  }

  // 3. Atualiza o status da chave
  const { error: updateErr } = await supabase
    .from('property_keys')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', key_id)
    .eq('tenant_id', tenantId)

  if (updateErr) {
    console.error('Property key status update failed', { code: updateErr.code })
  }

  return NextResponse.json(
    {
      movement,
      keyStatus: newStatus,
      message: `Saída da chave ${key.codigo} registrada com sucesso`,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function PUT(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 16_384)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = returnKeySchema.safeParse(body.value)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Dados inválidos'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }

  const { tenantId, userId, supabase } = result.context
  const { movement_id, observacoes_devolucao } = parsed.data

  // 1. Busca a movimentação em aberto
  const { data: movement, error: movErr } = await supabase
    .from('key_movements')
    .select('id, key_id, property_id, data_devolucao')
    .eq('id', movement_id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (movErr || !movement) {
    return NextResponse.json({ error: 'Registro de movimentação não encontrado' }, { status: 404 })
  }

  if (movement.data_devolucao !== null) {
    return NextResponse.json({ error: 'Esta chave já teve sua devolução registrada anteriormente' }, { status: 409 })
  }

  // 2. Registra o retorno na movimentação
  const now = new Date().toISOString()
  const { data: updatedMov, error: updateMovErr } = await supabase
    .from('key_movements')
    .update({
      data_devolucao: now,
      observacoes_devolucao,
      recebido_por: userId,
      updated_at: now,
    })
    .eq('id', movement_id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (updateMovErr || !updatedMov) {
    console.error('Movement return update failed', { code: updateMovErr?.code })
    return NextResponse.json({ error: 'Não foi possível dar baixa na devolução' }, { status: 503 })
  }

  // 3. Atualiza a chave de volta para 'disponivel'
  const { error: keyStatusErr } = await supabase
    .from('property_keys')
    .update({
      status: 'disponivel',
      updated_at: now,
    })
    .eq('id', movement.key_id)
    .eq('tenant_id', tenantId)

  if (keyStatusErr) {
    console.error('Key status return to available failed', { code: keyStatusErr.code })
  }

  return NextResponse.json(
    {
      movement: updatedMov,
      keyStatus: 'disponivel',
      message: 'Devolução da chave registrada com sucesso no claviculário',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
