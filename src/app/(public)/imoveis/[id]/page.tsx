import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MOCK_LISTINGS, getListingImages, formatPrice } from '@/lib/listings-data'
import { ListingDetailClient } from './listing-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = MOCK_LISTINGS.find((l) => l.id === id)
  if (!listing) return {}

  return {
    title: `${listing.title} | Pepius Imob`,
    description: `${listing.category} para ${listing.type} em ${listing.neighborhood}, ${listing.city}. ${listing.area}m² por ${formatPrice(listing.price, listing.type)}.`,
  }
}

export function generateStaticParams() {
  return MOCK_LISTINGS.map((l) => ({ id: l.id }))
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const listing = MOCK_LISTINGS.find((l) => l.id === id)

  if (!listing) notFound()

  const images = getListingImages(listing)

  return <ListingDetailClient listing={listing} images={images} />
}