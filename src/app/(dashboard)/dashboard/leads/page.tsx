import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { LeadsClient, type AgencyLead } from './leads-client'

export const dynamic = 'force-dynamic'

type PropertyRelation = { titulo: string } | Array<{ titulo: string }> | null

type LeadQueryRow = {
  id: string
  property_id: string | null
  nome: string
  email: string | null
  telefone: string | null
  mensagem: string | null
  horario_preferido: string | null
  status: string
  created_at: string
  properties: PropertyRelation
}

function propertyTitle(value: PropertyRelation): string {
  if (!value) return ''
  if (Array.isArray(value)) return value[0]?.titulo ?? ''
  return value.titulo ?? ''
}

export default async function LeadsPage() {
  const license = await getLocalLicenseAccess()
  if (license.active && !license.features.includes('leads')) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
    : { data: null }
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, property_id, nome, email, telefone, mensagem, horario_preferido, status, created_at, properties(titulo)')
    .eq('tenant_id', profile?.tenant_id ?? '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Agency lead page query failed', { code: error.code })
  }

  const rows: AgencyLead[] = ((leads ?? []) as unknown as LeadQueryRow[]).map((lead) => ({
    id: lead.id,
    propertyId: lead.property_id,
    propertyTitle: propertyTitle(lead.properties),
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    mensagem: lead.mensagem,
    horarioPreferido: lead.horario_preferido,
    status: lead.status,
    createdAt: lead.created_at,
  }))

  return <LeadsClient leads={rows} canEdit={license.active} />
}
