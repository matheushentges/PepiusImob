import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { getListingImages, formatPrice, listingPurposeLabel } from '@/lib/listings-data'
import { getPublicListing, getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { ListingDetailClient } from './listing-detail-client'
import { ListingJsonLd, BreadcrumbsJsonLd } from '@/components/shared/json-ld'

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const priceSummary = listing.offers
    .map((offer) => formatPrice(offer.price, offer.type))
    .join(' ou ')

  const images = getListingImages(listing)
  const rawCoverImage = images[0] || '/placeholder-property.svg'
  const coverImage = rawCoverImage.startsWith('http') ? rawCoverImage : `${baseUrl}${rawCoverImage}`
  const title = `${listing.title} | ${siteConfig.agencyName}`
  const description = `${listing.category} para ${listingPurposeLabel(listing).toLowerCase()} em ${listing.neighborhood}, ${listing.city}. ${listing.area}m² por ${priceSummary}.`

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/imoveis/${listing.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/imoveis/${listing.id}`,
      siteName: siteConfig.agencyName,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
    },
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div style={{ '--primary': siteConfig.primaryColor, '--accent': siteConfig.accentColor } as CSSProperties}>
      <ListingJsonLd listing={listing} images={images} siteConfig={siteConfig} baseUrl={baseUrl} />
      <BreadcrumbsJsonLd
        baseUrl={baseUrl}
        items={[
          { name: 'Início', url: '/' },
          { name: 'Imóveis', url: '/imoveis' },
          { name: listing.title, url: `/imoveis/${listing.id}` },
        ]}
      />
      <ListingDetailClient
        listing={listing}
        images={images}
        agencyName={siteConfig.agencyName}
        agencyPhone={siteConfig.whatsapp || siteConfig.telefone}
      />
    </div>
  )
}
