import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature, requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { upsertKeySchema, isKeyLate, getMinutesLate } from '@/lib/keys/validation'
import type { KeyOverviewItem, KeyMovement } from '@/lib/keys/types'

const keyWithPropertySchema = upsertKeySchema.extend({
  property_id: z.string().uuid('ID do imóvel inválido'),
})

export async function GET() {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }

  const { tenantId, supabase } = result.context

  // 1. Busca todas as chaves cadastradas com os dados do imóvel correspondente
  const { data: keys, error: keysError } = await supabase
    .from('property_keys')
    .select(`
      id,
      property_id,
      codigo,
      status,
      localizacao,
      updated_at,
      properties!inner (
        id,
        titulo,
        tipo,
        finalidade,
        cidade,
        estado,
        bairro
      )
    `)
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  if (keysError) {
    console.error('Keys list query failed', { code: keysError.code })
    return NextResponse.json({ error: 'Não foi possível carregar as chaves' }, { status: 503 })
  }

  // 2. Busca movimentações em aberto (chaves que estão atualmente retiradas)
  const { data: openMovements, error: movError } = await supabase
    .from('key_movements')
    .select(`
      id,
      key_id,
      tipo_responsavel,
      nome_responsavel,
      telefone_responsavel,
      documento_responsavel,
      motivo,
      data_saida,
      previsao_retorno,
      consultor_id,
      profiles:consultor_id (
        nome
      )
    `)
    .eq('tenant_id', tenantId)
    .is('data_devolucao', null)

  if (movError) {
    console.error('Open movements query failed', { code: movError.code })
  }

  interface MovementProfile {
    nome: string
  }
  interface MovementRecord {
    id: string
    key_id: string
    tipo_responsavel: KeyMovement['tipo_responsavel']
    nome_responsavel: string
    telefone_responsavel: string | null
    documento_responsavel: string | null
    motivo: string | null
    data_saida: string
    previsao_retorno: string | null
    consultor_id: string | null
    profiles: MovementProfile | null
  }

  interface ApiKeyRow {
    id: string
    property_id: string
    codigo: string
    status: KeyOverviewItem['status']
    localizacao: string | null
    updated_at: string
    properties: {
      id: string
      titulo: string
      tipo: string
      finalidade: string
      cidade: string
      estado: string
      bairro: string
    } | null
  }

  const openMovementsByKey = new Map<string, MovementRecord>()
  for (const mov of ((openMovements as unknown as MovementRecord[]) ?? [])) {
    openMovementsByKey.set(mov.key_id, mov)
  }

  const rows: KeyOverviewItem[] = ((keys as unknown as ApiKeyRow[]) ?? []).map((row) => {
    const prop = row.properties
    const openMov = openMovementsByKey.get(row.id)
    const isLate = openMov ? isKeyLate(openMov.previsao_retorno) : false
    const minutesLate = openMov ? getMinutesLate(openMov.previsao_retorno) : 0

    return {
      id: row.id,
      propertyId: row.property_id,
      propertyTitle: prop?.titulo ?? 'Sem título',
      propertyType: prop?.tipo ?? 'outro',
      propertyPurpose: prop?.finalidade ?? 'ambos',
      propertyCity: prop?.cidade ?? '',
      propertyState: prop?.estado ?? '',
      propertyNeighborhood: prop?.bairro ?? '',
      codigo: row.codigo,
      status: row.status,
      localizacao: row.localizacao,
      updatedAt: row.updated_at,
      currentMovement: openMov
        ? {
            id: openMov.id,
            tipoResponsavel: openMov.tipo_responsavel,
            nomeResponsavel: openMov.nome_responsavel,
            telefoneResponsavel: openMov.telefone_responsavel,
            documentoResponsavel: openMov.documento_responsavel,
            motivo: openMov.motivo,
            dataSaida: openMov.data_saida,
            previsaoRetorno: openMov.previsao_retorno,
            isLate,
            minutesLate,
            consultorNome: openMov.profiles?.nome ?? null,
          }
        : null,
    }
  })

  return NextResponse.json({ keys: rows }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 16_384)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = keyWithPropertySchema.safeParse(body.value)
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message || 'Dados inválidos'
    return NextResponse.json({ error: firstMessage }, { status: 400 })
  }

  const { tenantId, supabase } = result.context
  const { property_id, codigo, localizacao } = parsed.data

  // Verifica se o imóvel pertence a este tenant
  const { data: prop, error: propErr } = await supabase
    .from('properties')
    .select('id')
    .eq('id', property_id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (propErr || !prop) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  // Upsert da chave vinculada ao imóvel
  const { data, error } = await supabase
    .from('property_keys')
    .upsert(
      {
        tenant_id: tenantId,
        property_id,
        codigo,
        localizacao: localizacao ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'property_id' }
    )
    .select('id, property_id, codigo, status, localizacao, updated_at')
    .single()

  if (error || !data) {
    console.error('Property key upsert failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível salvar os dados da chave' }, { status: 503 })
  }

  return NextResponse.json({ key: data }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
