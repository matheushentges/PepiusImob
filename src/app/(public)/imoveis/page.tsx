import { notFound } from 'next/navigation'
import { ListingResults } from './listing-results'
import { getPublicListings, getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'

export const dynamic = 'force-dynamic'

export default async function ImoveisPage() {
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) notFound()

  const [listings, siteConfig] = await Promise.all([getPublicListings(), getPublicSiteConfig()])
  return <ListingResults listings={listings} siteConfig={siteConfig} />
}
