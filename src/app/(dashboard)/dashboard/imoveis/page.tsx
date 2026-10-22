import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
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

  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, tenant_id, titulo, tipo, finalidade, status, featured, preco_venda, preco_locacao, cidade, estado, bairro, created_at')
    .eq('tenant_id', profile?.tenant_id ?? '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false })
  const license = await getLocalLicenseAccess()
  if (license.active && !license.features.includes('properties')) notFound()

  if (error) {
    console.error('Agency property page query failed', { code: error.code })
  }

  const rows: AgencyProperty[] = ((properties ?? []) as unknown as PropertyQueryRow[]).map((property) => ({
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
  }))

  return <PropertiesClient properties={rows} canEdit={license.active} />
}
