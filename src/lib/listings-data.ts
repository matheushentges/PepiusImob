export interface Listing {
  id: string
  title: string
  type: 'venda' | 'aluguel'
  category: 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural'
  price: number
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

export function formatPrice(value: number, type: 'venda' | 'aluguel'): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
  return type === 'aluguel' ? `${formatted}/mês` : formatted
}

export function getListingImages(listing: Listing): string[] {
  return listing.images.length ? listing.images : ['/placeholder-property.svg']
}
