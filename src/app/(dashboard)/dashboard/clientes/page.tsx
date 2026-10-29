import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { ClientsClient } from './clients-client'
import type { Client, ClientOverviewStats, ClientRole } from '@/lib/clients/types'

interface RawClientRow {
  id: string
  tenant_id: string
  tipo_pessoa: 'pf' | 'pj'
  papeis?: ClientRole[] | null
  status: 'ativo' | 'inativo' | 'potencial'
  nome: string
  nome_fantasia?: string | null
  documento?: string | null
  rg_ie?: string | null
  data_nascimento?: string | null
  profissao?: string | null
  estado_civil?: string | null
  regime_bens?: string | null
  conjuge_nome?: string | null
  conjuge_cpf?: string | null
  email?: string | null
  email_secundario?: string | null
  telefone?: string | null
  telefone_secundario?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  dados_bancarios?: Client['dados_bancarios']
  perfil_interesse?: Client['perfil_interesse']
  corretor_id?: string | null
  profiles?: { nome: string | null } | null
  observacoes?: string | null
  created_at: string
  updated_at: string
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Gestão de Clientes | Painel Gerencial Pepius Imob',
  description: 'Controle unificado de clientes: proprietários, compradores, locatários e radar de imóveis.',
}

export default async function ClientesPage() {
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

  // 1. Busca todos os clientes do tenant
  const { data: rawClients, error: clientsError } = await supabase
    .from('clients')
    .select(`
      id,
      tenant_id,
      tipo_pessoa,
      papeis,
      status,
      nome,
      nome_fantasia,
      documento,
      rg_ie,
      data_nascimento,
      profissao,
      estado_civil,
      regime_bens,
      conjuge_nome,
      conjuge_cpf,
      email,
      email_secundario,
      telefone,
      telefone_secundario,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      dados_bancarios,
      perfil_interesse,
      corretor_id,
      observacoes,
      created_at,
      updated_at,
      profiles:corretor_id (
        id,
        nome
      )
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (clientsError) {
    console.error('Clients page query failed', { code: clientsError.code })
  }

  const clients: Client[] = ((rawClients || []) as unknown as RawClientRow[]).map((row) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    tipo_pessoa: row.tipo_pessoa,
    papeis: row.papeis || [],
    status: row.status,
    nome: row.nome,
    nome_fantasia: row.nome_fantasia,
    documento: row.documento,
    rg_ie: row.rg_ie,
    data_nascimento: row.data_nascimento,
    profissao: row.profissao,
    estado_civil: row.estado_civil,
    regime_bens: row.regime_bens,
    conjuge_nome: row.conjuge_nome,
    conjuge_cpf: row.conjuge_cpf,
    email: row.email,
    email_secundario: row.email_secundario,
    telefone: row.telefone || '',
    telefone_secundario: row.telefone_secundario,
    cep: row.cep,
    logradouro: row.logradouro,
    numero: row.numero,
    complemento: row.complemento,
    bairro: row.bairro,
    cidade: row.cidade,
    estado: row.estado,
    dados_bancarios: row.dados_bancarios || {},
    perfil_interesse: row.perfil_interesse || {},
    corretor_id: row.corretor_id,
    corretor_nome: row.profiles?.nome || null,
    observacoes: row.observacoes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  // 2. Busca lista de membros da equipe (corretores)
  const { data: teamData } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('tenant_id', tenantId)
    .order('nome', { ascending: true })

  const teamMembers = (teamData || []).map((t) => ({ id: t.id, nome: t.nome }))

  // 3. Métricas
  const stats: ClientOverviewStats = {
    total: clients.length,
    proprietarios: clients.filter((c) => c.papeis.includes('proprietario')).length,
    compradores: clients.filter((c) => c.papeis.includes('comprador')).length,
    locatarios: clients.filter((c) => c.papeis.includes('locatario')).length,
    ativos: clients.filter((c) => c.status === 'ativo').length,
  }

  return (
    <ClientsClient
      initialClients={clients}
      initialStats={stats}
      teamMembers={teamMembers}
      canEdit={license.active}
    />
  )
}
