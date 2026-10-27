import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { calculatePropertyMatch, type PropertyMatchCandidate } from '@/lib/clients/matching'
import { ClientDetailClient } from './client-detail-client'
import type { Client, ClientNote, PropertyMatchResult } from '@/lib/clients/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Perfil do Cliente | Painel Gerencial Pepius Imob`,
    description: `Visão 360º de cliente, histórico e radar de imóveis.`,
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
  const { id } = await params

  // 1. Busca dados do cliente
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
    notFound()
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

  // 2. Busca imóveis vinculados (se for proprietário)
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

  // 3. Busca notas
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

  // 4. Radar de Imóveis (se comprador ou locatário)
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

      radarMatches.sort((a, b) => b.matchScore - a.matchScore)
    }
  }

  // 5. Leads vinculados
  const { data: leads } = await supabase
    .from('leads')
    .select('id, property_id, nome, email, telefone, mensagem, status, created_at')
    .eq('tenant_id', tenantId)
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // 6. Equipe
  const { data: teamData } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('tenant_id', tenantId)
    .order('nome', { ascending: true })

  const teamMembers = (teamData || []).map((t) => ({ id: t.id, nome: t.nome }))

  return (
    <ClientDetailClient
      initialClient={client}
      ownedProperties={ownedProperties || []}
      initialNotes={notes}
      radarMatches={radarMatches}
      associatedLeads={leads || []}
      teamMembers={teamMembers}
      canEdit={license.active}
    />
  )
}
