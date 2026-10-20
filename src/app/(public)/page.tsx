'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Building2, MessageSquare, Bot, Search, MapPin, BedDouble, Bath, Maximize, Car, ArrowRight, Key, Home, Briefcase, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { ContactFab } from '@/components/contact-fab'
import { MOCK_LISTINGS, formatPrice } from '@/lib/listings-data'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Tipo de imóvel' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
] as const

export default function HomePage() {
  const [heroType, setHeroType] = useState<'venda' | 'aluguel' | ''>('')
  const [heroCategory, setHeroCategory] = useState('')
  const [heroSearch, setHeroSearch] = useState('')

  // Filtros dinâmicos aplicados às seções de listagem abaixo do hero
  const filteredFeatured = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      if (!l.featured) return false
      if (heroType && l.type !== heroType) return false
      if (heroCategory && l.category !== heroCategory) return false
      if (heroSearch) {
        const q = heroSearch.toLowerCase()
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.neighborhood.toLowerCase().includes(q) &&
          !l.city.toLowerCase().includes(q)
        )
          return false
      }
      return true
    }).slice(0, 3)
  }, [heroType, heroCategory, heroSearch])

  const filteredSale = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      if (l.type !== 'venda' || l.featured) return false
      if (heroCategory && l.category !== heroCategory) return false
      if (heroSearch) {
        const q = heroSearch.toLowerCase()
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.neighborhood.toLowerCase().includes(q) &&
          !l.city.toLowerCase().includes(q)
        )
          return false
      }
      return true
    }).slice(0, 4)
  }, [heroCategory, heroSearch])

  const filteredRent = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      if (l.type !== 'aluguel') return false
      if (heroCategory && l.category !== heroCategory) return false
      if (heroSearch) {
        const q = heroSearch.toLowerCase()
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.neighborhood.toLowerCase().includes(q) &&
          !l.city.toLowerCase().includes(q)
        )
          return false
      }
      return true
    }).slice(0, 4)
  }, [heroCategory, heroSearch])

  const hasActiveFilters = Boolean(heroType || heroCategory || heroSearch)

  function buildFilteredUrl() {
    const params = new URLSearchParams()
    if (heroType) params.set('type', heroType)
    if (heroCategory) params.set('category', heroCategory)
    if (heroSearch) params.set('q', heroSearch)
    const qs = params.toString()
    return `/imoveis${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-base/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-accent">
            Pepius Imob
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/imoveis" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              Imóveis
            </Link>
            <a href="#servicos" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              Serviços
            </a>
            <Link href="/contato" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              Contato
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — busca dinâmica com filtros funcionais */}
        <section className="relative overflow-hidden bg-surface-overlay/30 py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                Excelência em imóveis
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl leading-[1.1]">
                Imóveis que fazem sentido para o seu momento
              </h1>
              <p className="mt-4 text-lg text-text-secondary max-w-prose mx-auto">
                Encontre o lugar ideal para morar ou investir. Busca simplificada entre milhares de opções verificadas.
              </p>

              {/* Search widget com tabs e filtros dinâmicos */}
              <div className="mt-10 mx-auto max-w-2xl rounded-xl border border-border-subtle bg-surface-raised p-2 shadow-sm">
                {/* Tabs Comprar / Alugar */}
                <div className="flex gap-1 mb-2 px-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setHeroType(heroType === 'venda' ? '' : 'venda')}
                    className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                      heroType === 'venda'
                        ? 'bg-accent text-accent-text'
                        : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                    }`}
                  >
                    Comprar
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroType(heroType === 'aluguel' ? '' : 'aluguel')}
                    className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                      heroType === 'aluguel'
                        ? 'bg-accent text-accent-text'
                        : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                    }`}
                  >
                    Alugar
                  </button>
                </div>

                {/* Inputs de busca */}
                <div className="flex flex-col sm:flex-row gap-2 p-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                    <input
                      type="text"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      placeholder="Bairro, condomínio ou cidade..."
                      className="w-full rounded-lg border border-border-default bg-surface-base py-2.5 pl-10 pr-8 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                    {heroSearch && (
                      <button
                        type="button"
                        onClick={() => setHeroSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
                        aria-label="Limpar busca"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <select
                    value={heroCategory}
                    onChange={(e) => setHeroCategory(e.target.value)}
                    className="rounded-lg border border-border-default bg-surface-base px-3 py-2.5 text-sm text-text-secondary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={buildFilteredUrl()}
                    className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover"
                  >
                    Buscar
                  </Link>
                </div>

                {/* Contador de resultados em tempo real */}
                {hasActiveFilters && (
                  <p className="px-2 pb-1 text-xs text-text-tertiary">
                    {filteredFeatured.length + filteredSale.length + filteredRent.length}{' '}
                    {filteredFeatured.length + filteredSale.length + filteredRent.length === 1
                      ? 'imóvel encontrado'
                      : 'imóveis encontrados'}{' '}
                    com os filtros selecionados
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Service Pathways — Como podemos ajudar */}
        <section id="servicos" className="border-b border-border-subtle py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-text-primary">
              Como podemos ajudar
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <ServicePathway
                icon={Home}
                title="Comprar um imóvel"
                description="Encontre casas e apartamentos à venda nas melhores localizações."
                cta="Ver imóveis à venda"
                href="/imoveis?type=venda"
              />
              <ServicePathway
                icon={Key}
                title="Alugar um imóvel"
                description="Opções de aluguel residencial e comercial com processo simplificado."
                cta="Ver imóveis para alugar"
                href="/imoveis?type=aluguel"
              />
              <ServicePathway
                icon={Briefcase}
                title="Sou imobiliária"
                description="Gestão completa, atendimento omnichannel e IA para captar mais leads."
                cta="Conhecer o sistema"
                href="/imobiliaria/login"
              />
            </div>
          </div>
        </section>

        {/* Imóveis em Destaque */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              title="Imóveis em destaque"
              description="Seleção especial de oportunidades imperdíveis."
              linkHref={buildFilteredUrl()}
              linkLabel="Ver todos os destaques"
            />
            {filteredFeatured.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFeatured.map((listing) => (
                  <ListingCardLink key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyFilterState onClear={() => { setHeroType(''); setHeroCategory(''); setHeroSearch('') }} />
            )}
          </div>
        </section>

        {/* Imóveis para Venda */}
        <section className="border-t border-border-subtle bg-surface-overlay/30 py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              title="Para comprar"
              description="Apartamentos, casas e coberturas disponíveis para venda."
              linkHref="/imoveis?type=venda"
              linkLabel="Ver tudo para venda"
            />
            {filteredSale.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredSale.map((listing) => (
                  <ListingCardLink key={listing.id} listing={listing} compact />
                ))}
              </div>
            ) : (
              <EmptyFilterState onClear={() => { setHeroType(''); setHeroCategory(''); setHeroSearch('') }} />
            )}
          </div>
        </section>

        {/* Imóveis para Aluguel */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              title="Para alugar"
              description="Encontre o imóvel ideal para morar ou trabalhar."
              linkHref="/imoveis?type=aluguel"
              linkLabel="Ver tudo para alugar"
            />
            {filteredRent.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredRent.map((listing) => (
                  <ListingCardLink key={listing.id} listing={listing} compact />
                ))}
              </div>
            ) : (
              <EmptyFilterState onClear={() => { setHeroType(''); setHeroCategory(''); setHeroSearch('') }} />
            )}
          </div>
        </section>

        {/* Conversion block */}
        <section className="border-t border-border-subtle bg-accent-subtle/50 py-20">
          <div className="container mx-auto px-4 text-center lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
              A conversa mais importante começa com um contato
            </h2>
            <p className="mt-3 text-text-secondary max-w-md mx-auto">
              Tem dúvidas sobre um imóvel ou quer cadastrar sua imobiliária? Fale com nossa equipe.
            </p>
            <Link
              href="/contato"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-accent px-8 py-3 text-sm font-semibold text-accent-text shadow-sm transition-colors hover:bg-accent-hover"
            >
              Falar com a equipe
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface-overlay/30 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-lg font-bold tracking-tight text-accent">Pepius Imob</span>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                Sistema completo para gestão imobiliária com atendimento inteligente e integração omnichannel.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Navegação</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li><Link href="/imoveis" className="hover:text-accent transition-colors">Imóveis</Link></li>
                <li><Link href="/imoveis?type=venda" className="hover:text-accent transition-colors">Comprar</Link></li>
                <li><Link href="/imoveis?type=aluguel" className="hover:text-accent transition-colors">Alugar</Link></li>
                <li><Link href="/contato" className="hover:text-accent transition-colors">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Para imobiliárias</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li><Link href="/imobiliaria/login" className="hover:text-accent transition-colors">Acesso ao painel</Link></li>
                <li><a href="#" className="hover:text-accent transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Contato</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>contato@pepiusimob.com.br</li>
                <li>(11) 99999-9999</li>
                <li>Seg–Sex, 9h–18h</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border-subtle pt-6 text-center text-xs text-text-tertiary">
            © {new Date().getFullYear()} Pepius Imob. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <ContactFab />
    </div>
  )
}

/* ─── Sub-components ─── */

function EmptyFilterState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-border-default bg-surface-base py-12 text-center">
      <Search className="mb-3 h-8 w-8 text-text-tertiary" aria-hidden="true" />
      <p className="text-sm font-medium text-text-primary">Nenhum imóvel encontrado com estes filtros</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 text-sm font-medium text-accent transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:underline"
      >
        Limpar filtros
      </button>
    </div>
  )
}

function SectionHeader({
  title,
  description,
  linkHref,
  linkLabel,
}: {
  title: string
  description: string
  linkHref: string
  linkLabel: string
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      <Link
        href={linkHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

function ServicePathway({
  icon: Icon,
  title,
  description,
  cta,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  cta: string
  href: string
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-6 transition-all hover:border-accent/40 hover:shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-subtle text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

function ListingCardLink({
  listing,
  compact = false,
}: {
  listing: typeof MOCK_LISTINGS[number]
  compact?: boolean
}) {
  return (
    <Link
      href={`/imoveis/${listing.id}`}
      className="group block overflow-hidden rounded-lg border border-border-subtle bg-surface-raised transition-all hover:border-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <article>
        <div className={`relative overflow-hidden bg-surface-overlay ${compact ? 'aspect-[4/3]' : 'aspect-[3/2]'}`}>
          <img
            src={listing.image}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute left-3 top-3 rounded bg-surface-base/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-text-primary backdrop-blur-sm">
            {listing.type === 'venda' ? 'Venda' : 'Aluguel'}
          </span>
          {listing.featured && (
            <span className="absolute right-3 top-3 rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-text">
              Destaque
            </span>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          <p className="text-lg font-bold tracking-tight text-accent tabular-nums">
            {formatPrice(listing.price, listing.type)}
          </p>
          <h3 className={`font-semibold text-text-primary leading-snug line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
            {listing.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{listing.neighborhood}, {listing.city}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-subtle pt-2.5 text-xs text-text-secondary">
            {listing.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3 w-3" aria-hidden="true" />
                {listing.bedrooms}
              </span>
            )}
            {listing.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" aria-hidden="true" />
                {listing.bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" aria-hidden="true" />
              {listing.area}m²
            </span>
            {listing.parking > 0 && (
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" aria-hidden="true" />
                {listing.parking}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}