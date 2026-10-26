import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { isKeyLate, getMinutesLate } from '@/lib/keys/validation'
import { KeysClient } from './keys-client'
import type { KeyOverviewItem, KeyMovement } from '@/lib/keys/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Controle de Chaves & Claviculário | Painel Gerencial',
  description: 'Gestão de alocação de chaves, visitas com clientes, corretores e manutenções.',
}

export default async function ChavesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.tenant_id) {
    redirect('/login?error=acesso')
  }

  const license = await getLocalLicenseAccess()
  if (license.active && !license.features.includes('properties')) {
    notFound()
  }

  const tenantId = profile.tenant_id

  // 1. Busca chaves cadastradas do tenant com o imóvel
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
    console.error('Agency keys query failed', { code: keysError.code })
  }

  // 2. Busca movimentações em aberto
  const { data: openMovements } = await supabase
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

  interface MovementRow {
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
    profiles: { nome: string } | null
  }

  interface KeyRow {
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

  const openMovementsByKey = new Map<string, MovementRow>()
  for (const mov of ((openMovements as unknown as MovementRow[]) ?? [])) {
    openMovementsByKey.set(mov.key_id, mov)
  }

  const rows: KeyOverviewItem[] = ((keys as unknown as KeyRow[]) ?? []).map((row) => {
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

  return <KeysClient initialKeys={rows} canEdit={license.active} />
}
