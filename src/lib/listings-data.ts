export interface Listing {
  id: string
  title: string
  type: 'venda' | 'aluguel'
  category: 'apartamento' | 'casa' | 'cobertura' | 'terreno' | 'comercial'
  price: number
  address: string
  neighborhood: string
  city: string
  bedrooms: number
  bathrooms: number
  area: number // m²
  parking: number
  image: string
  featured?: boolean
  createdAt: string
}

export const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Apartamento com vista para o parque',
    type: 'venda',
    category: 'apartamento',
    price: 850000,
    address: 'Rua das Acácias, 420',
    neighborhood: 'Jardim Europa',
    city: 'São Paulo',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    parking: 2,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    featured: true,
    createdAt: '2026-10-15',
  },
  {
    id: '2',
    title: 'Casa moderna com piscina e jardim',
    type: 'venda',
    category: 'casa',
    price: 1250000,
    address: 'Alameda dos Ipês, 88',
    neighborhood: 'Alphaville',
    city: 'Barueri',
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    parking: 3,
    image: 'https://images.unsplash.com/photo-1600596542815-27b88e38e4d4?w=800&q=80',
    featured: true,
    createdAt: '2026-10-14',
  },
  {
    id: '3',
    title: 'Studio compacto próximo ao metrô',
    type: 'aluguel',
    category: 'apartamento',
    price: 2800,
    address: 'Av. Paulista, 1200',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    bedrooms: 1,
    bathrooms: 1,
    area: 38,
    parking: 0,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    createdAt: '2026-10-13',
  },
  {
    id: '4',
    title: 'Cobertura duplex com terraço gourmet',
    type: 'venda',
    category: 'cobertura',
    price: 2100000,
    address: 'Rua Funchal, 350',
    neighborhood: 'Vila Olímpia',
    city: 'São Paulo',
    bedrooms: 3,
    bathrooms: 4,
    area: 240,
    parking: 3,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    featured: true,
    createdAt: '2026-10-12',
  },
  {
    id: '5',
    title: 'Sala comercial em edifício corporativo',
    type: 'aluguel',
    category: 'comercial',
    price: 4500,
    address: 'Av. Brigadeiro Faria Lima, 3400',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    bedrooms: 0,
    bathrooms: 1,
    area: 65,
    parking: 1,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    createdAt: '2026-10-11',
  },
  {
    id: '6',
    title: 'Terreno residencial em condomínio',
    type: 'venda',
    category: 'terreno',
    price: 380000,
    address: 'Rua do Lago, Lote 12',
    neighborhood: 'Granja Viana',
    city: 'Cotia',
    bedrooms: 0,
    bathrooms: 0,
    area: 450,
    parking: 0,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    createdAt: '2026-10-10',
  },
  {
    id: '7',
    title: 'Apartamento reformado com varanda',
    type: 'aluguel',
    category: 'apartamento',
    price: 5200,
    address: 'Rua Augusta, 2100',
    neighborhood: 'Cerqueira César',
    city: 'São Paulo',
    bedrooms: 2,
    bathrooms: 2,
    area: 95,
    parking: 1,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    createdAt: '2026-10-09',
  },
  {
    id: '8',
    title: 'Casa térrea com amplo quintal',
    type: 'venda',
    category: 'casa',
    price: 680000,
    address: 'Rua Primavera, 55',
    neighborhood: 'Vila Mariana',
    city: 'São Paulo',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    parking: 2,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    createdAt: '2026-10-08',
  },
]

export function formatPrice(value: number, type: 'venda' | 'aluguel'): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

  return type === 'aluguel' ? `${formatted}/mês` : formatted
}