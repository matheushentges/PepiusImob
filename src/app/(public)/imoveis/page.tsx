import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
import { ListingResults } from './listing-results'
import { getPublicListings, getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function ImoveisPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const requestedType = firstValue(query.tipo)
  const initialType = requestedType === 'venda' || requestedType === 'aluguel' ? requestedType : ''
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) notFound()

  const [listings, siteConfig] = await Promise.all([getPublicListings(), getPublicSiteConfig()])

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col justify-between"
      style={{ '--primary': siteConfig.primaryColor, '--accent': siteConfig.accentColor } as CSSProperties}
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label={`${siteConfig.agencyName} — página inicial`}>
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              {siteConfig.agencyName}
            </span>
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
              Vitrine
            </span>
          </Link>

          <nav aria-label="Navegação rápida" className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Início
            </Link>
            <Link
              href="/imoveis"
              className="text-sm font-semibold text-accent transition-colors"
            >
              Imóveis
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main Results */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 flex-1">
        <ListingResults
          listings={listings}
          siteConfig={siteConfig}
          initialSearch={firstValue(query.q).trim().slice(0, 120)}
          initialType={initialType}
        />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border bg-card py-10 mt-16">
        <div className="container mx-auto flex flex-col items-center justify-between gap-5 px-4 text-center md:flex-row md:px-6 md:text-left">
          <div>
            <p className="font-serif text-lg font-semibold tracking-tight text-foreground">{siteConfig.agencyName}</p>
            <p className="mt-1 text-sm text-muted-foreground">Imóveis para venda e locação</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
              Início
            </Link>
            <Link href="/imoveis" className="font-medium text-foreground">
              Vitrine de Imóveis
            </Link>
            <Link href="/privacidade" className="text-muted-foreground transition-colors hover:text-foreground">
              Privacidade & Cookies
            </Link>
            <Link
              href="/login"
              className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground hover:underline"
              title="Acesso exclusivo para corretores e equipe da imobiliária"
            >
              Imobiliária
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.agencyName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
