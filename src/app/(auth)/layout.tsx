import { CookieConsentBanner } from '@/components/shared/cookie-consent-banner'

export default function AuthLayout({
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
