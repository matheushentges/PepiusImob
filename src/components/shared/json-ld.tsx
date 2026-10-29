import type { PublicSiteConfig } from '@/lib/public-listings'
import type { Listing } from '@/lib/listings-data'

interface AgencyJsonLdProps {
  siteConfig: PublicSiteConfig
  baseUrl: string
}

export function AgencyJsonLd({ siteConfig, baseUrl }: AgencyJsonLdProps) {
  const sameAs: string[] = []
  if (siteConfig.redesSociais) {
    const { instagram, facebook, linkedin, youtube } = siteConfig.redesSociais
    if (instagram) sameAs.push(instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`)
    if (facebook) sameAs.push(facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`)
    if (linkedin) sameAs.push(linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`)
    if (youtube) sameAs.push(youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube.replace('@', '')}`)
  }

  const phone = siteConfig.whatsapp || siteConfig.telefone || undefined
  const logo = siteConfig.logoUrl
    ? (siteConfig.logoUrl.startsWith('http') ? siteConfig.logoUrl : `${baseUrl}${siteConfig.logoUrl}`)
    : undefined

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${baseUrl}/#realestateagent`,
    name: siteConfig.agencyName,
    url: baseUrl,
    description: siteConfig.slogan || siteConfig.heroSubtitle || undefined,
    logo: logo,
    image: logo,
    telephone: phone,
    email: siteConfig.emailContato || undefined,
    address: siteConfig.enderecoCompleto
      ? {
          '@type': 'PostalAddress',
          streetAddress: siteConfig.enderecoCompleto,
          addressCountry: 'BR',
        }
      : undefined,
    identifier: siteConfig.creci ? `CRECI: ${siteConfig.creci}` : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    priceRange: '$$$',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ListingJsonLdProps {
  listing: Listing
  images: string[]
  siteConfig: PublicSiteConfig
  baseUrl: string
}

export function ListingJsonLd({ listing, images, siteConfig, baseUrl }: ListingJsonLdProps) {
  const listingUrl = `${baseUrl}/imoveis/${listing.id}`
  const absoluteImages = images.map((img) => (img.startsWith('http') ? img : `${baseUrl}${img}`))

  let placeType = 'SingleFamilyResidence'
  if (listing.category === 'apartamento') placeType = 'Apartment'
  else if (listing.category === 'comercial') placeType = 'CommercialBuilding'
  else if (listing.category === 'terreno') placeType = 'Landform'

  const offers = listing.offers.map((offer) => ({
    '@type': 'Offer',
    price: offer.price,
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
    businessFunction:
      offer.type === 'aluguel'
        ? 'http://purl.org/goodrelations/v1#LeaseOut'
        : 'http://purl.org/goodrelations/v1#Sell',
    validFrom: listing.createdAt || new Date().toISOString(),
    offeredBy: {
      '@type': 'RealEstateAgent',
      name: siteConfig.agencyName,
      telephone: siteConfig.whatsapp || siteConfig.telefone || undefined,
      url: baseUrl,
    },
  }))

  const schema = {
    '@context': 'https://schema.org',
    '@type': ['RealEstateListing', placeType],
    '@id': `${listingUrl}#listing`,
    name: listing.title,
    description: listing.description || `${listing.category} em ${listing.neighborhood}, ${listing.city}`,
    url: listingUrl,
    image: absoluteImages.length > 0 ? absoluteImages : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.city,
      addressRegion: listing.neighborhood,
      addressCountry: 'BR',
    },
    numberOfRooms: listing.bedrooms > 0 ? listing.bedrooms : undefined,
    numberOfBedrooms: listing.bedrooms > 0 ? listing.bedrooms : undefined,
    numberOfBathroomsTotal: listing.bathrooms > 0 ? listing.bathrooms : undefined,
    floorSize: listing.area > 0
      ? {
          '@type': 'QuantitativeValue',
          value: listing.area,
          unitCode: 'MTK',
        }
      : undefined,
    offers: offers.length === 1 ? offers[0] : offers,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbsJsonLd({ items, baseUrl }: { items: BreadcrumbItem[]; baseUrl: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
