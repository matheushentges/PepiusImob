import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { isKeyLate } from '@/lib/keys/validation'
import type { KeyStatus } from '@/lib/keys/types'
import { PropertiesClient, type AgencyProperty } from './properties-client'

export const dynamic = 'force-dynamic'

type PropertyQueryRow = {
  id: string
  titulo: string
  tipo: string
  finalidade: string
  status: string
  featured: boolean
  preco_venda: number | null
  preco_locacao: number | null
  cidade: string
  estado: string
  bairro: string
  created_at: string
}

function amount(value: number | null): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default async function ImoveisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
    : { data: null }

  const tenantId = profile?.tenant_id ?? '00000000-0000-0000-0000-000000000000'

  const [propertiesResult, keysResult, movementsResult] = await Promise.all([
    supabase
      .from('properties')
      .select('id, tenant_id, titulo, tipo, finalidade, status, featured, preco_venda, preco_locacao, cidade, estado, bairro, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('property_keys')
      .select('id, property_id, codigo, status')
      .eq('tenant_id', tenantId),
    supabase
      .from('key_movements')
      .select('key_id, nome_responsavel, previsao_retorno')
      .eq('tenant_id', tenantId)
      .is('data_devolucao', null),
  ])

  const license = await getLocalLicenseAccess()
  if (license.active && !license.features.includes('properties')) notFound()

  if (propertiesResult.error) {
    console.error('Agency property page query failed', { code: propertiesResult.error.code })
  }

  interface PropertyKeySummary {
    id: string
    property_id: string
    codigo: string
    status: string
  }

  interface OpenMovementSummary {
    key_id: string
    nome_responsavel: string
    previsao_retorno: string | null
  }

  const keysByPropertyId = new Map<string, PropertyKeySummary>()
  for (const k of ((keysResult.data as unknown as PropertyKeySummary[]) ?? [])) {
    keysByPropertyId.set(k.property_id, k)
  }

  const openMovementsByKeyId = new Map<string, OpenMovementSummary>()
  for (const m of ((movementsResult.data as unknown as OpenMovementSummary[]) ?? [])) {
    openMovementsByKeyId.set(m.key_id, m)
  }

  const rows: AgencyProperty[] = ((propertiesResult.data ?? []) as unknown as PropertyQueryRow[]).map((property) => {
    const key = keysByPropertyId.get(property.id)
    const openMov = key ? openMovementsByKeyId.get(key.id) : null

    return {
      id: property.id,
      titulo: property.titulo,
      tipo: property.tipo,
      finalidade: property.finalidade,
      status: property.status,
      featured: property.featured === true,
      precoVenda: amount(property.preco_venda),
      precoLocacao: amount(property.preco_locacao),
      cidade: property.cidade,
      estado: property.estado,
      bairro: property.bairro,
      createdAt: property.created_at,
      keyInfo: key
        ? {
            codigo: key.codigo,
            status: key.status as KeyStatus,
            responsibleName: openMov?.nome_responsavel ?? null,
            isLate: openMov ? isKeyLate(openMov.previsao_retorno) : false,
          }
        : null,
    }
  })

  return <PropertiesClient properties={rows} canEdit={license.active} />
}
