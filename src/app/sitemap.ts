import type { MetadataRoute } from 'next'
import { getPublicListings } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const license = await getLocalLicenseAccess()

  if (!license.active || !license.features.includes('public-listing')) {
    return []
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/imoveis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    const listings = await getPublicListings()
    const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
      url: `${baseUrl}/imoveis/${listing.id}`,
      lastModified: listing.createdAt ? new Date(listing.createdAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
    return [...staticRoutes, ...listingRoutes]
  } catch {
    return staticRoutes
  }
}
