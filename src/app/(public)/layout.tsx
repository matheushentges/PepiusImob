import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { PublicHeader } from '@/components/shared/public-header'
import { PublicFooter } from '@/components/shared/public-footer'
import { CookieConsentBanner } from '@/components/shared/cookie-consent-banner'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) {
    notFound()
  }

  const siteConfig = await getPublicSiteConfig()

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col justify-between"
      style={{
        '--primary': siteConfig.primaryColor,
        '--accent': siteConfig.accentColor,
      } as CSSProperties}
    >
      <PublicHeader siteConfig={siteConfig} />
      <div className="flex-1">{children}</div>
      <PublicFooter siteConfig={siteConfig} />
      <CookieConsentBanner />
    </div>
  )
}