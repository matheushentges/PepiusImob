import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/imoveis', '/imoveis/*', '/privacidade'],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/imobiliaria/*',
          '/login',
          '/_next/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
