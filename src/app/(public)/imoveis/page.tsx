import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ListingResults } from './listing-results'
import { getPublicListings, getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { BreadcrumbsJsonLd } from '@/components/shared/json-ld'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) return {}
  const siteConfig = await getPublicSiteConfig()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const query = await searchParams
  const tipo = firstValue(query.tipo)
  const busca = firstValue(query.q).trim()

  let titlePrefix = 'Catálogo de Imóveis'
  if (tipo === 'venda') titlePrefix = 'Imóveis à Venda'
  if (tipo === 'aluguel') titlePrefix = 'Imóveis para Aluguel'
  if (busca) titlePrefix += ` — "${busca}"`

  const title = `${titlePrefix} | ${siteConfig.agencyName}`
  const description = `Confira nosso catálogo de imóveis para compra, venda e locação na ${siteConfig.agencyName}. Apartamentos, casas, terrenos e salas comerciais com atendimento personalizado.`

  const ogImages = siteConfig.logoUrl ? [{ url: siteConfig.logoUrl }] : []

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/imoveis`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/imoveis`,
      siteName: siteConfig.agencyName,
      images: ogImages,
      locale: 'pt_BR',
      type: 'website',
    },
  }
}

export default async function ImoveisPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const requestedType = firstValue(query.tipo)
  const initialType = requestedType === 'venda' || requestedType === 'aluguel' ? requestedType : ''
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) notFound()

  const [listings, siteConfig] = await Promise.all([getPublicListings(), getPublicSiteConfig()])
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbsJsonLd
        baseUrl={baseUrl}
        items={[
          { name: 'Início', url: '/' },
          { name: 'Imóveis', url: '/imoveis' },
        ]}
      />
      <ListingResults
        listings={listings}
        siteConfig={siteConfig}
        initialSearch={firstValue(query.q).trim().slice(0, 120)}
        initialType={initialType}
      />
    </main>
  )
}
