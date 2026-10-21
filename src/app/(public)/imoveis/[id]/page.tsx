import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { getListingImages, formatPrice } from '@/lib/listings-data'
import { getPublicListing, getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { ListingDetailClient } from './listing-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) return {}
  const listing = await getPublicListing(id)
  if (!listing) return {}
  const siteConfig = await getPublicSiteConfig()

  return {
    title: `${listing.title} | ${siteConfig.agencyName}`,
    description: `${listing.category} para ${listing.type} em ${listing.neighborhood}, ${listing.city}. ${listing.area}m² por ${formatPrice(listing.price, listing.type)}.`,
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) notFound()
  const listing = await getPublicListing(id)

  if (!listing) notFound()

  const [images, siteConfig] = await Promise.all([
    Promise.resolve(getListingImages(listing)),
    getPublicSiteConfig(),
  ])

  return (
    <div style={{ '--primary': siteConfig.primaryColor, '--accent': siteConfig.accentColor } as CSSProperties}>
      <ListingDetailClient listing={listing} images={images} agencyName={siteConfig.agencyName} />
    </div>
  )
}
