import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature, requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { clientInputSchema, sanitizeDocument } from '@/lib/clients/validation'
import { calculatePropertyMatch, type PropertyMatchCandidate } from '@/lib/clients/matching'
import type { Client, ClientNote, PropertyMatchResult } from '@/lib/clients/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }

  const { tenantId, supabase } = result.context
  const { id } = await params

  // 1. Busca os dados do cliente
  const { data: rawClient, error: clientError } = await supabase
    .from('clients')
    .select(`
      *,
      profiles:corretor_id (
        id,
        nome
      )
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (clientError || !rawClient) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const client: Client = {
    id: rawClient.id,
    tenant_id: rawClient.tenant_id,
    tipo_pessoa: rawClient.tipo_pessoa,
    papeis: rawClient.papeis || [],
    status: rawClient.status,
    nome: rawClient.nome,
    nome_fantasia: rawClient.nome_fantasia,
    documento: rawClient.documento,
    rg_ie: rawClient.rg_ie,
    data_nascimento: rawClient.data_nascimento,
    profissao: rawClient.profissao,
    estado_civil: rawClient.estado_civil,
    regime_bens: rawClient.regime_bens,
    conjuge_nome: rawClient.conjuge_nome,
    conjuge_cpf: rawClient.conjuge_cpf,
    email: rawClient.email,
    email_secundario: rawClient.email_secundario,
    telefone: rawClient.telefone,
    telefone_secundario: rawClient.telefone_secundario,
    cep: rawClient.cep,
    logradouro: rawClient.logradouro,
    numero: rawClient.numero,
    complemento: rawClient.complemento,
    bairro: rawClient.bairro,
    cidade: rawClient.cidade,
    estado: rawClient.estado,
    dados_bancarios: rawClient.dados_bancarios || {},
    perfil_interesse: rawClient.perfil_interesse || {},
    corretor_id: rawClient.corretor_id,
    corretor_nome: rawClient.profiles?.nome || null,
    observacoes: rawClient.observacoes,
    created_at: rawClient.created_at,
    updated_at: rawClient.updated_at,
  }

  // 2. Busca imóveis vinculados (caso seja proprietário)
  const { data: ownedProperties } = await supabase
    .from('properties')
    .select(`
      id,
      titulo,
      tipo,
      finalidade,
      status,
      preco_venda,
      preco_locacao,
      bairro,
      cidade,
      area_total,
      quartos,
      vagas_garagem,
      property_images(url, is_cover)
    `)
    .eq('tenant_id', tenantId)
    .eq('proprietario_id', id)
    .order('created_at', { ascending: false })

  // 3. Busca notas internas / timeline de atendimento
  const { data: rawNotes } = await supabase
    .from('client_notes')
    .select(`
      id,
      tenant_id,
      client_id,
      autor_id,
      conteudo,
      created_at,
      profiles:autor_id (
        id,
        nome
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const notes: ClientNote[] = (rawNotes || []).map((n: any) => ({
    id: n.id,
    tenant_id: n.tenant_id,
    client_id: n.client_id,
    autor_id: n.autor_id,
    autor_nome: n.profiles?.nome || null,
    conteudo: n.conteudo,
    created_at: n.created_at,
  }))

  // 4. Se for comprador ou locatário, calcula os matches do Radar de Imóveis
  let radarMatches: PropertyMatchResult[] = []
  const isBuyerOrTenant = client.papeis.includes('comprador') || client.papeis.includes('locatario')

  if (isBuyerOrTenant) {
    const { data: availableProperties } = await supabase
      .from('properties')
      .select(`
        id,
        titulo,
        tipo,
        finalidade,
        status,
        preco_venda,
        preco_locacao,
        bairro,
        cidade,
        area_total,
        quartos,
        vagas_garagem,
        property_images(url, is_cover)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'disponivel')

    if (availableProperties) {
      for (const prop of availableProperties as any[]) {
        const cover = prop.property_images?.find((img: any) => img.is_cover)?.url || prop.property_images?.[0]?.url || null
        const candidate: PropertyMatchCandidate = {
          id: prop.id,
          titulo: prop.titulo,
          tipo: prop.tipo,
          finalidade: prop.finalidade,
          status: prop.status,
          preco_venda: prop.preco_venda,
          preco_locacao: prop.preco_locacao,
          bairro: prop.bairro,
          cidade: prop.cidade,
          quartos: prop.quartos,
          vagas_garagem: prop.vagas_garagem,
          area_total: prop.area_total,
          cover_url: cover,
        }

        const match = calculatePropertyMatch(client.perfil_interesse, candidate)
        if (match) {
          radarMatches.push(match)
        }
      }

      // Ordena por maior afinidade (%)
      radarMatches.sort((a, b) => b.matchScore - a.matchScore)
    }
  }

  // 5. Leads vinculados
  const { data: leads } = await supabase
    .from('leads')
    .select('id, property_id, nome, email, telefone, mensagem, status, created_at, visit_starts_at')
    .eq('tenant_id', tenantId)
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    client,
    ownedProperties: ownedProperties || [],
    notes,
    radarMatches,
    leads: leads || [],
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response

  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const { tenantId, supabase } = result.context
  const { id } = await params
  const body = await readJsonBody(request, 65_536)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = clientInputSchema.partial().safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  const d = parsed.data
  if (d.tipo_pessoa !== undefined) updateData.tipo_pessoa = d.tipo_pessoa
  if (d.papeis !== undefined) updateData.papeis = d.papeis
  if (d.status !== undefined) updateData.status = d.status
  if (d.nome !== undefined) updateData.nome = d.nome.trim()
  if (d.nome_fantasia !== undefined) updateData.nome_fantasia = d.nome_fantasia?.trim() || null
  if (d.documento !== undefined) updateData.documento = d.documento ? sanitizeDocument(d.documento) : null
  if (d.rg_ie !== undefined) updateData.rg_ie = d.rg_ie?.trim() || null
  if (d.data_nascimento !== undefined) updateData.data_nascimento = d.data_nascimento || null
  if (d.profissao !== undefined) updateData.profissao = d.profissao?.trim() || null
  if (d.estado_civil !== undefined) updateData.estado_civil = d.estado_civil?.trim() || null
  if (d.regime_bens !== undefined) updateData.regime_bens = d.regime_bens?.trim() || null
  if (d.conjuge_nome !== undefined) updateData.conjuge_nome = d.conjuge_nome?.trim() || null
  if (d.conjuge_cpf !== undefined) updateData.conjuge_cpf = d.conjuge_cpf ? sanitizeDocument(d.conjuge_cpf) : null
  if (d.email !== undefined) updateData.email = d.email?.trim() || null
  if (d.email_secundario !== undefined) updateData.email_secundario = d.email_secundario?.trim() || null
  if (d.telefone !== undefined) updateData.telefone = d.telefone.trim()
  if (d.telefone_secundario !== undefined) updateData.telefone_secundario = d.telefone_secundario?.trim() || null
  if (d.cep !== undefined) updateData.cep = d.cep?.trim() || null
  if (d.logradouro !== undefined) updateData.logradouro = d.logradouro?.trim() || null
  if (d.numero !== undefined) updateData.numero = d.numero?.trim() || null
  if (d.complemento !== undefined) updateData.complemento = d.complemento?.trim() || null
  if (d.bairro !== undefined) updateData.bairro = d.bairro?.trim() || null
  if (d.cidade !== undefined) updateData.cidade = d.cidade?.trim() || null
  if (d.estado !== undefined) updateData.estado = d.estado?.trim() || null
  if (d.dados_bancarios !== undefined) updateData.dados_bancarios = d.dados_bancarios
  if (d.perfil_interesse !== undefined) updateData.perfil_interesse = d.perfil_interesse
  if (d.corretor_id !== undefined) updateData.corretor_id = d.corretor_id || null
  if (d.observacoes !== undefined) updateData.observacoes = d.observacoes?.trim() || null

  const { data: updated, error: updateError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (updateError) {
    console.error('Client update failed', { code: updateError.code })
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }

  return NextResponse.json({ client: updated })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response

  if (result.context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas administradores podem excluir clientes' },
      { status: 403 },
    )
  }

  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const { tenantId, supabase } = result.context
  const { id } = await params

  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (deleteError) {
    console.error('Client delete failed', { code: deleteError.code })
    return NextResponse.json({ error: 'Não foi possível excluir o cliente' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
