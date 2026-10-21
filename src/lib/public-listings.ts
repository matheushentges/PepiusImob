import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSignedPropertyImageUrl } from '@/lib/storage/property-images'
import type { Listing } from '@/lib/listings-data'

type PropertyRecord = {
  id: string
  titulo: string
  descricao: string
  tipo: Listing['category']
  finalidade: 'venda' | 'locacao' | 'ambos'
  status: string
  preco_venda: number | null
  preco_locacao: number | null
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
  heroTitle: string
  heroSubtitle: string
  primaryColor: string
  accentColor: string
}

const DEFAULT_SITE_CONFIG: Omit<PublicSiteConfig, 'agencyName'> = {
  heroTitle: 'Imóveis disponíveis',
  heroSubtitle: 'Explore os imóveis disponíveis para venda e locação.',
  primaryColor: '#334155',
  accentColor: '#E07A5F',
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

  return {
    agencyName: safeText(data.nome, 'Imobiliária', 120),
    heroTitle: safeText(stored.hero_title, DEFAULT_SITE_CONFIG.heroTitle, 100),
    heroSubtitle: safeText(stored.hero_subtitle, DEFAULT_SITE_CONFIG.heroSubtitle, 300),
    primaryColor: safeColor(stored.primary_color, DEFAULT_SITE_CONFIG.primaryColor),
    accentColor: safeColor(stored.accent_color, DEFAULT_SITE_CONFIG.accentColor),
  }
}

async function toListing(row: PropertyRecord): Promise<Listing | null> {
  const type =
    row.finalidade === 'locacao' ||
    (row.finalidade === 'ambos' && row.preco_venda === null && row.preco_locacao !== null)
      ? 'aluguel'
      : 'venda'
  const price = type === 'aluguel' ? row.preco_locacao : row.preco_venda
  if (price === null || price === undefined) return null

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
    type,
    category: row.tipo,
    price,
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
    featured: false,
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
      'id,titulo,descricao,tipo,finalidade,status,preco_venda,preco_locacao,cidade,estado,bairro,area_total,quartos,banheiros,vagas_garagem,created_at,property_images(url,ordem,is_cover)',
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
      'id,titulo,descricao,tipo,finalidade,status,preco_venda,preco_locacao,cidade,estado,bairro,area_total,quartos,banheiros,vagas_garagem,created_at,property_images(url,ordem,is_cover)',
    )
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('status', 'disponivel')
    .maybeSingle()

  if (error || !data) return null
  return toListing(data as unknown as PropertyRecord)
}
