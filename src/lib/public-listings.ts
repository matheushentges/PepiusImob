import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSignedPropertyImageUrl } from '@/lib/storage/property-images'
import type { Listing, ListingOffer } from '@/lib/listings-data'

type PropertyRecord = {
  id: string
  titulo: string
  descricao: string
  tipo: Listing['category']
  finalidade: 'venda' | 'locacao' | 'ambos'
  status: string
  preco_venda: number | null
  preco_locacao: number | null
  featured: boolean
  cidade: string
  estado: string
  bairro: string
  area_total: number | null
  quartos: number | null
  banheiros: number | null
  vagas_garagem: number | null
  created_at: string
  property_images: Array<{ url: string; ordem: number; is_cover: boolean }>
}

export type PublicSiteConfig = {
  agencyName: string
  creci: string
  slogan: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  accentColor: string
  heroTitle: string
  heroSubtitle: string
  aboutTag: string
  aboutTitle: string
  aboutText: string
  whatsapp: string
  telefone: string
  emailContato: string
  enderecoCompleto: string
  redesSociais: {
    instagram: string
    facebook: string
    linkedin: string
    youtube: string
  }
}

const DEFAULT_SITE_CONFIG: Omit<PublicSiteConfig, 'agencyName'> = {
  creci: '',
  slogan: '',
  logoUrl: null,
  faviconUrl: null,
  heroTitle: 'Encontre seu próximo imóvel',
  heroSubtitle: 'Explore imóveis para venda e locação e encontre um lugar que combina com seus planos.',
  aboutTag: 'Atendimento próximo',
  aboutTitle: 'Uma escolha importante merece atenção de verdade.',
  aboutText: 'Consulte os detalhes de cada imóvel e fale com a equipe da imobiliária para tirar dúvidas ou agendar uma visita.',
  primaryColor: '#334155',
  accentColor: '#E07A5F',
  whatsapp: '(11) 98765-4321',
  telefone: '(11) 3456-7890',
  emailContato: '',
  enderecoCompleto: '',
  redesSociais: {
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
  },
}

function safeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().slice(0, maxLength)
  return normalized || fallback
}

function safeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
}

async function currentTenantId(): Promise<string | null> {
  const configuredId = process.env.PEPIUS_TENANT_ID
  if (!configuredId) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('tenants')
    .select('id')
    .eq('id', configuredId)
    .eq('active', true)
    .maybeSingle()
  return data?.id ?? null
}

export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  const tenantId = await currentTenantId()
  if (!tenantId) return { agencyName: 'Imobiliária', ...DEFAULT_SITE_CONFIG }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tenants')
    .select('nome,site_config')
    .eq('id', tenantId)
    .maybeSingle()

  if (error || !data) return { agencyName: 'Imobiliária', ...DEFAULT_SITE_CONFIG }

  const stored = data.site_config && typeof data.site_config === 'object' && !Array.isArray(data.site_config)
    ? data.site_config as Record<string, unknown>
    : {}

  const rawLogo = typeof stored.logo_url === 'string' && stored.logo_url.trim() ? stored.logo_url.trim() : null
  const rawFavicon = typeof stored.favicon_url === 'string' && stored.favicon_url.trim() ? stored.favicon_url.trim() : null

  const [logoUrl, faviconUrl] = await Promise.all([
    rawLogo ? getSignedPropertyImageUrl(rawLogo, 3600) : null,
    rawFavicon ? getSignedPropertyImageUrl(rawFavicon, 3600) : null,
  ])

  const rawRedes = (stored.redes_sociais && typeof stored.redes_sociais === 'object' && !Array.isArray(stored.redes_sociais))
    ? stored.redes_sociais as Record<string, unknown>
    : {}

  return {
    agencyName: safeText(data.nome, 'Imobiliária', 120),
    creci: safeText(stored.creci, '', 40),
    slogan: safeText(stored.slogan, '', 160),
    logoUrl,
    faviconUrl,
    primaryColor: safeColor(stored.primary_color, DEFAULT_SITE_CONFIG.primaryColor),
    accentColor: safeColor(stored.accent_color, DEFAULT_SITE_CONFIG.accentColor),
    heroTitle: safeText(stored.hero_title, DEFAULT_SITE_CONFIG.heroTitle, 120),
    heroSubtitle: safeText(stored.hero_subtitle, DEFAULT_SITE_CONFIG.heroSubtitle, 350),
    aboutTag: safeText(stored.about_tag, DEFAULT_SITE_CONFIG.aboutTag, 60),
    aboutTitle: safeText(stored.about_title, DEFAULT_SITE_CONFIG.aboutTitle, 120),
    aboutText: safeText(stored.about_text, DEFAULT_SITE_CONFIG.aboutText, 600),
    whatsapp: safeText(stored.whatsapp, DEFAULT_SITE_CONFIG.whatsapp, 30),
    telefone: safeText(stored.telefone, DEFAULT_SITE_CONFIG.telefone, 30),
    emailContato: safeText(stored.email_contato, '', 120),
    enderecoCompleto: safeText(stored.endereco_completo, '', 250),
    redesSociais: {
      instagram: safeText(rawRedes.instagram, '', 150),
      facebook: safeText(rawRedes.facebook, '', 150),
      linkedin: safeText(rawRedes.linkedin, '', 150),
      youtube: safeText(rawRedes.youtube, '', 150),
    },
  }
}

function toOffer(type: ListingOffer['type'], value: number | null): ListingOffer | null {
  if (value === null || value === undefined) return null
  const price = Number(value)
  return Number.isFinite(price) ? { type, price } : null
}

async function toListing(row: PropertyRecord): Promise<Listing | null> {
  const offers = [
    row.finalidade === 'venda' || row.finalidade === 'ambos'
      ? toOffer('venda', row.preco_venda)
      : null,
    row.finalidade === 'locacao' || row.finalidade === 'ambos'
      ? toOffer('aluguel', row.preco_locacao)
      : null,
  ].filter((offer): offer is ListingOffer => offer !== null)

  if (offers.length === 0) return null
  const primaryOffer = offers[0]

  const images = await Promise.all(
    [...(row.property_images ?? [])]
      .sort((left, right) => Number(right.is_cover) - Number(left.is_cover) || left.ordem - right.ordem)
      .map(async (image) => {
        return getSignedPropertyImageUrl(image.url)
      }),
  )
  const safeImages = images.filter((image): image is string => Boolean(image))

  return {
    id: row.id,
    title: row.titulo,
    type: primaryOffer.type,
    price: primaryOffer.price,
    offers,
    category: row.tipo,
    address: row.bairro,
    neighborhood: row.bairro,
    city: row.cidade,
    state: row.estado,
    bedrooms: row.quartos ?? 0,
    bathrooms: row.banheiros ?? 0,
    area: row.area_total ?? 0,
    parking: row.vagas_garagem ?? 0,
    image: safeImages[0] ?? '/placeholder-property.svg',
    images: safeImages,
    description: row.descricao,
    featured: row.featured === true,
    createdAt: row.created_at,
  }
}

export async function getPublicListings(): Promise<Listing[]> {
  const tenantId = await currentTenantId()
  if (!tenantId) return []

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('properties')
    .select(
      'id,titulo,descricao,tipo,finalidade,status,preco_venda,preco_locacao,featured,cidade,estado,bairro,area_total,quartos,banheiros,vagas_garagem,created_at,property_images(url,ordem,is_cover)',
    )
    .eq('tenant_id', tenantId)
    .eq('status', 'disponivel')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Public listing query failed', { code: error.code })
    return []
  }

  const listings = await Promise.all((data as unknown as PropertyRecord[]).map(toListing))
  return listings.filter((listing): listing is Listing => Boolean(listing))
}

export async function getPublicListing(id: string): Promise<Listing | null> {
  const tenantId = await currentTenantId()
  if (!tenantId) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('properties')
    .select(
      'id,titulo,descricao,tipo,finalidade,status,preco_venda,preco_locacao,featured,cidade,estado,bairro,area_total,quartos,banheiros,vagas_garagem,created_at,property_images(url,ordem,is_cover)',
    )
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('status', 'disponivel')
    .maybeSingle()

  if (error || !data) return null
  return toListing(data as unknown as PropertyRecord)
}
