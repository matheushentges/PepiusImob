import { CookieConsentBanner } from '@/components/shared/cookie-consent-banner'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <CookieConsentBanner />
    </>
  )
}