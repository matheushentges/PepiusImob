import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature, requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { clientInputSchema, sanitizeDocument } from '@/lib/clients/validation'
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
  estado_civil?: 'solteiro' | 'casado' | 'separado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | null
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

export async function GET(request: Request) {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }

  const { tenantId, supabase } = result.context
  const url = new URL(request.url)
  const search = url.searchParams.get('search')?.trim().toLowerCase() || ''
  const role = url.searchParams.get('role')?.trim() || ''
  const status = url.searchParams.get('status')?.trim() || ''
  const corretorId = url.searchParams.get('corretor_id')?.trim() || ''

  // 1. Busca todos os clientes do tenant
  let query = supabase
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

  if (status) {
    query = query.eq('status', status)
  }
  if (corretorId) {
    query = query.eq('corretor_id', corretorId)
  }

  const { data: rawClients, error } = await query

  if (error) {
    console.error('Clients list query failed', { code: error.code })
    return NextResponse.json({ error: 'Não foi possível carregar os clientes' }, { status: 503 })
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

  // 2. Filtros em memória (busca textual e papel)
  const filtered = clients.filter((c) => {
    if (role && role !== 'todos' && !c.papeis.includes(role as ClientRole)) {
      return false
    }

    if (search) {
      const matchNome = c.nome.toLowerCase().includes(search)
      const matchFantasia = c.nome_fantasia?.toLowerCase().includes(search) ?? false
      const matchDoc = sanitizeDocument(c.documento).includes(sanitizeDocument(search))
      const matchEmail = c.email?.toLowerCase().includes(search) ?? false
      const matchTel = sanitizeDocument(c.telefone).includes(sanitizeDocument(search))

      if (!matchNome && !matchFantasia && !matchDoc && !matchEmail && !matchTel) {
        return false
      }
    }

    return true
  })

  // 3. Métricas agregadas
  const stats: ClientOverviewStats = {
    total: clients.length,
    proprietarios: clients.filter((c) => c.papeis.includes('proprietario')).length,
    compradores: clients.filter((c) => c.papeis.includes('comprador')).length,
    locatarios: clients.filter((c) => c.papeis.includes('locatario')).length,
    ativos: clients.filter((c) => c.status === 'ativo').length,
  }

  return NextResponse.json({ clients: filtered, stats })
}

export async function POST(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response

  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const { tenantId, supabase } = result.context
  const body = await readJsonBody(request, 65_536)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = clientInputSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const data = parsed.data

  const { data: inserted, error: insertError } = await supabase
    .from('clients')
    .insert({
      tenant_id: tenantId,
      tipo_pessoa: data.tipo_pessoa,
      papeis: data.papeis,
      status: data.status,
      nome: data.nome.trim(),
      nome_fantasia: data.nome_fantasia?.trim() || null,
      documento: data.documento ? sanitizeDocument(data.documento) : null,
      rg_ie: data.rg_ie?.trim() || null,
      data_nascimento: data.data_nascimento || null,
      profissao: data.profissao?.trim() || null,
      estado_civil: data.estado_civil?.trim() || null,
      regime_bens: data.regime_bens?.trim() || null,
      conjuge_nome: data.conjuge_nome?.trim() || null,
      conjuge_cpf: data.conjuge_cpf ? sanitizeDocument(data.conjuge_cpf) : null,
      email: data.email?.trim() || null,
      email_secundario: data.email_secundario?.trim() || null,
      telefone: data.telefone.trim(),
      telefone_secundario: data.telefone_secundario?.trim() || null,
      cep: data.cep?.trim() || null,
      logradouro: data.logradouro?.trim() || null,
      numero: data.numero?.trim() || null,
      complemento: data.complemento?.trim() || null,
      bairro: data.bairro?.trim() || null,
      cidade: data.cidade?.trim() || null,
      estado: data.estado?.trim() || null,
      dados_bancarios: data.dados_bancarios || {},
      perfil_interesse: data.perfil_interesse || {},
      corretor_id: data.corretor_id || null,
      observacoes: data.observacoes?.trim() || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Client insert failed', { code: insertError.code })
    return NextResponse.json({ error: 'Erro ao cadastrar cliente' }, { status: 500 })
  }

  return NextResponse.json({ client: inserted }, { status: 201 })
}
