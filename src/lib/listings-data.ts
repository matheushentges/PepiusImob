export type ListingPurpose = 'venda' | 'aluguel'

export interface ListingOffer {
  type: ListingPurpose
  price: number
}

export interface Listing {
  id: string
  title: string
  type: ListingPurpose
  price: number
  offers: ListingOffer[]
  category: 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural'
  address: string
  neighborhood: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  area: number
  parking: number
  image: string
  images: string[]
  description: string
  featured: boolean
  createdAt: string
}

export function formatPrice(value: number, type: ListingPurpose): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
  return type === 'aluguel' ? `${formatted}/mês` : formatted
}

export function listingPurposeLabel(listing: Pick<Listing, 'offers'>): string {
  if (listing.offers.length === 2) return 'Venda e locação'
  return listing.offers[0]?.type === 'aluguel' ? 'Locação' : 'Venda'
}

export function listingMatchesPrice(
  listing: Pick<Listing, 'offers'>,
  min: number | null,
  max: number | null,
): boolean {
  return listing.offers.some((offer) => {
    const aboveMin = min === null || offer.price >= min
    const belowMax = max === null || offer.price <= max
    return aboveMin && belowMax
  })
}

export function getListingImages(listing: Listing): string[] {
  return listing.images.length ? listing.images : ['/placeholder-property.svg']
}
