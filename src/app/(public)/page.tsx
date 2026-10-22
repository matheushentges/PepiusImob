import Image from 'next/image'
import Link from 'next/link'
import { Building2, KeyRound, MapPin, Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { formatPrice, listingPurposeLabel } from '@/lib/listings-data'
import { getPublicListings, getPublicSiteConfig } from '@/lib/public-listings'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const license = await getLocalLicenseAccess()
  if (!license.active || !license.features.includes('public-listing')) notFound()

  const [listings, siteConfig] = await Promise.all([getPublicListings(), getPublicSiteConfig()])
  const featuredListings = listings.filter((listing) => listing.featured).slice(0, 3)
  const hasFeatured = featuredListings.length > 0
  const homeListings = hasFeatured ? featuredListings : listings.slice(0, 3)

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ '--primary': siteConfig.primaryColor, '--accent': siteConfig.accentColor } as CSSProperties}
    >
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label={`${siteConfig.agencyName} — página inicial`}>
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              {siteConfig.agencyName}
            </span>
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
              Imóveis
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
            <Link href="#imoveis" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Imóveis
            </Link>
            <Link href="#sobre" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sobre
            </Link>
            <Link href="#contato" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Contato
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Área da imobiliária
          </Link>
        </div>
        <nav aria-label="Navegação móvel" className="border-t border-border md:hidden">
          <div className="container mx-auto flex items-center justify-center gap-6 px-4 py-2.5">
            <Link href="#imoveis" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Imóveis
            </Link>
            <Link href="#sobre" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sobre
            </Link>
            <Link href="#contato" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Contato
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-20 md:px-6 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-accent">
                {siteConfig.agencyName}
              </p>
              <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                {siteConfig.heroTitle}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
                {siteConfig.heroSubtitle}
              </p>

              <form action="/imoveis" method="get" className="mx-auto mt-10 max-w-xl">
                <label htmlFor="home-search" className="sr-only">
                  Buscar imóveis por cidade, bairro ou tipo
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="home-search"
                    name="q"
                    type="search"
                    maxLength={120}
                    placeholder="Busque por cidade, bairro ou tipo de imóvel..."
                    className="h-14 w-full rounded-lg border border-border bg-card pl-12 pr-28 text-base shadow-sm transition-all placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Buscar
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <Link href="/imoveis?tipo=venda" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                    Comprar
                  </Link>
                  <Link href="/imoveis?tipo=aluguel" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Alugar
                  </Link>
                  <Link href="#imoveis" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Ver destaques
                  </Link>
                </div>
              </form>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </section>

        <section id="imoveis" className="bg-secondary/30 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                    {hasFeatured ? 'Nossa seleção' : 'Novidades'}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {hasFeatured ? 'Imóveis em destaque' : 'Adicionados recentemente'}
                  </h2>
                  <p className="mt-3 text-base text-muted-foreground">
                    {hasFeatured
                      ? 'Opções selecionadas para você conhecer com calma.'
                      : 'Os imóveis mais recentes do nosso portfólio.'}
                  </p>
                </div>
                <Link href="/imoveis" className="text-sm font-semibold text-primary transition-colors hover:text-accent">
                  Ver todos os imóveis <span aria-hidden="true">→</span>
                </Link>
              </div>

              {homeListings.length > 0 ? (
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {homeListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/imoveis/${listing.id}`}
                      className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <article>
                        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                          <Image
                            src={listing.image}
                            alt={listing.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute left-3 top-3 rounded bg-card/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur-sm">
                            {listingPurposeLabel(listing)}
                          </span>
                          {listing.featured && (
                            <span className="absolute right-3 top-3 rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                              Destaque
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 p-4">
                          <div className="space-y-0.5">
                            {listing.offers.map((offer, index) => (
                              <p
                                key={offer.type}
                                className={index === 0
                                  ? 'text-xl font-bold tracking-tight text-accent tabular-nums'
                                  : 'text-sm font-semibold tracking-tight text-muted-foreground tabular-nums'}
                              >
                                {listing.offers.length > 1 && (
                                  <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {offer.type === 'venda' ? 'Venda' : 'Locação'}
                                  </span>
                                )}
                                {formatPrice(offer.price, offer.type)}
                              </p>
                            ))}
                          </div>
                          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
                            {listing.title}
                          </h3>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{listing.neighborhood}, {listing.city}</span>
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-10 rounded-lg border border-border bg-card px-6 py-12 text-center">
                  <p className="font-serif text-xl font-semibold text-foreground">Novos imóveis em breve</p>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    Estamos preparando nossa seleção. Você também pode consultar todos os filtros disponíveis na vitrine.
                  </p>
                  <Link
                    href="/imoveis"
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Explorar imóveis
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="sobre" className="border-t border-border py-16 md:py-24">
          <div className="container mx-auto px-4 text-center md:px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Atendimento próximo</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Uma escolha importante merece atenção de verdade.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Consulte os detalhes de cada imóvel e fale com a equipe da imobiliária para tirar dúvidas ou agendar uma visita.
            </p>
            <Link
              href="/imoveis"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Encontrar um imóvel
            </Link>
          </div>
        </section>
      </main>

      <footer id="contato" className="border-t border-border bg-card py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-5 px-4 text-center md:flex-row md:px-6 md:text-left">
          <div>
            <p className="font-serif text-lg font-semibold tracking-tight text-foreground">{siteConfig.agencyName}</p>
            <p className="mt-1 text-sm text-muted-foreground">Imóveis para venda e locação</p>
          </div>
          <Link href="/imoveis" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Conheça nossa vitrine
          </Link>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {siteConfig.agencyName}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
