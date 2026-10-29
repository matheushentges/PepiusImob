import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { canReadLicensedFeature } from '@/lib/licensing/local-state'
import {
  calculatePropertyMatch,
  buildReverseRadarWhatsAppUrl,
  type PropertyMatchCandidate,
} from '@/lib/clients/matching'
import type { ReverseClientMatchResult, ClientRole, ClientSearchProfile } from '@/lib/clients/types'

type RouteContext = { params: Promise<{ id: string }> }
const idSchema = z.string().uuid()

interface RawPropertyWithImages {
  id: string
  titulo: string
  tipo: string
  finalidade: 'venda' | 'locacao' | 'ambos'
  status: string
  preco_venda: number | null
  preco_locacao: number | null
  bairro: string
  cidade: string
  area_total: number | null
  quartos: number | null
  vagas_garagem: number | null
  property_images?: Array<{ url: string; is_cover?: boolean | null }> | null
}

interface RawClientForMatch {
  id: string
  nome: string
  telefone: string
  email?: string | null
  papeis?: ClientRole[] | null
  status: string
  perfil_interesse?: ClientSearchProfile | null
  profiles?: { nome: string | null } | null
}

export async function GET(request: Request, { params }: RouteContext) {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  const { tenantId, supabase } = result.context

  // 1. Busca os dados do imóvel com imagens
  const { data: rawProp, error: propError } = await supabase
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
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (propError || !rawProp) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  const prop = rawProp as unknown as RawPropertyWithImages
  const coverUrl =
    prop.property_images?.find((img) => img.is_cover)?.url ||
    prop.property_images?.[0]?.url ||
    null

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
    cover_url: coverUrl,
  }

  // 2. Busca todos os clientes ativos com papel de comprador ou locatário
  const { data: rawClients, error: clientsError } = await supabase
    .from('clients')
    .select(`
      id,
      nome,
      telefone,
      email,
      papeis,
      status,
      perfil_interesse,
      profiles:corretor_id (
        nome
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'ativo')

  if (clientsError) {
    console.error('Reverse radar clients query failed', { code: clientsError.code })
    return NextResponse.json({ error: 'Não foi possível buscar clientes' }, { status: 503 })
  }

  const clients = (rawClients || []) as unknown as RawClientForMatch[]

  // Constrói URL pública do imóvel a partir da origem da requisição
  const origin = request.headers.get('origin') || request.headers.get('host') || ''
  const baseUrl = origin.startsWith('http') ? origin : origin ? `https://${origin}` : ''
  const propertyPublicUrl = baseUrl ? `${baseUrl}/imoveis/${prop.id}` : `/imoveis/${prop.id}`

  // Formatação de preço amigável para a mensagem de WhatsApp
  let priceFormatted: string | null = null
  if (prop.preco_venda && prop.preco_locacao) {
    priceFormatted = `Venda: R$ ${Number(prop.preco_venda).toLocaleString('pt-BR')} | Aluguel: R$ ${Number(prop.preco_locacao).toLocaleString('pt-BR')}/mês`
  } else if (prop.preco_venda) {
    priceFormatted = `Valor: R$ ${Number(prop.preco_venda).toLocaleString('pt-BR')}`
  } else if (prop.preco_locacao) {
    priceFormatted = `Aluguel: R$ ${Number(prop.preco_locacao).toLocaleString('pt-BR')}/mês`
  }

  // 3. Executa o Matchmaking Reverso
  const matches: ReverseClientMatchResult[] = []

  for (const client of clients) {
    const roles = client.papeis || []
    const isBuyerOrTenant = roles.includes('comprador') || roles.includes('locatario')
    if (!isBuyerOrTenant) continue

    const profile = client.perfil_interesse || {}
    const match = calculatePropertyMatch(profile, candidate)
    if (!match) continue

    const whatsappUrl = buildReverseRadarWhatsAppUrl({
      clientName: client.nome,
      clientPhone: client.telefone,
      matchScore: match.matchScore,
      propertyTitle: prop.titulo,
      propertyNeighborhood: prop.bairro,
      propertyPriceFormatted: priceFormatted,
      propertyUrl: propertyPublicUrl,
    })

    matches.push({
      clientId: client.id,
      nome: client.nome,
      telefone: client.telefone,
      email: client.email || null,
      papeis: roles,
      corretorNome: client.profiles?.nome || null,
      matchScore: match.matchScore,
      matchReasons: match.matchReasons,
      whatsappUrl,
    })
  }

  // Ordena por afinidade decrescente
  matches.sort((a, b) => b.matchScore - a.matchScore)

  return NextResponse.json({
    propertyId: prop.id,
    propertyTitle: prop.titulo,
    totalMatches: matches.length,
    matches,
  })
}
