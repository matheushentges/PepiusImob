import { notFound } from 'next/navigation'
import { ListingResults } from './listing-results'
import { getPublicListings, getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function ImoveisPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const requestedType = firstValue(query.tipo)
  const initialType = requestedType === 'venda' || requestedType === 'aluguel' ? requestedType : ''
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) notFound()

  const [listings, siteConfig] = await Promise.all([getPublicListings(), getPublicSiteConfig()])
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ListingResults
        listings={listings}
        siteConfig={siteConfig}
        initialSearch={firstValue(query.q).trim().slice(0, 120)}
        initialType={initialType}
      />
    </main>
  )
}
