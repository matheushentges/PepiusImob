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

export function getPaginationPages(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

  pages.push(totalPages)
  return pages
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  startIndex: number
  endIndex: number
} {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.max(1, Math.min(page, totalPages))
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    currentPage: safePage,
    startIndex,
    endIndex,
  }
}

