import { Building2, MessageSquare, Bot, Search, MapPin, BedDouble, Bath, Maximize, Car, ArrowRight, Key, Home, Briefcase } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { ContactFab } from '@/components/contact-fab'
import { MOCK_LISTINGS, formatPrice } from '@/lib/listings-data'

const featuredListings = MOCK_LISTINGS.filter((l) => l.featured).slice(0, 3)
const saleListings = MOCK_LISTINGS.filter((l) => l.type === 'venda' && !l.featured).slice(0, 4)
const rentListings = MOCK_LISTINGS.filter((l) => l.type === 'aluguel').slice(0, 4)

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-base/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <a href="/" className="text-xl font-bold tracking-tight text-accent">
            Pepius Imob
          </a>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="/imoveis" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              Imóveis
            </a>
            <a href="#servicos" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              Serviços
            </a>
            <a href="/contato" className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              Contato
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — busca como elemento central com tabs Comprar/Alugar */}
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

              {/* Search widget com tabs */}
              <div className="mt-10 mx-auto max-w-2xl rounded-xl border border-border-subtle bg-surface-raised p-2 shadow-sm">
                {/* Tabs */}
                <div className="flex gap-1 mb-2 px-1 pt-1">
                  <button
                    type="button"
                    className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-text"
                  >
                    Comprar
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-4 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
                  >
                    Alugar
                  </button>
                </div>
                {/* Search inputs */}
                <div className="flex flex-col sm:flex-row gap-2 p-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Bairro, condomínio ou cidade..."
                      className="w-full rounded-lg border border-border-default bg-surface-base py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <select className="rounded-lg border border-border-default bg-surface-base px-3 py-2.5 text-sm text-text-secondary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
                    <option>Tipo de imóvel</option>
                    <option>Apartamento</option>
                    <option>Casa</option>
                    <option>Cobertura</option>
                    <option>Comercial</option>
                  </select>
                  <a
                    href="/imoveis"
                    className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover"
                  >
                    Buscar
                  </a>
                </div>
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
              linkHref="/imoveis?featured=true"
              linkLabel="Ver todos os destaques"
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
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
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {saleListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
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
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {rentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
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
            <a
              href="/contato"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-accent px-8 py-3 text-sm font-semibold text-accent-text shadow-sm transition-colors hover:bg-accent-hover"
            >
              Falar com a equipe
            </a>
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
                <li><a href="/imoveis" className="hover:text-accent transition-colors">Imóveis</a></li>
                <li><a href="/imoveis?type=venda" className="hover:text-accent transition-colors">Comprar</a></li>
                <li><a href="/imoveis?type=aluguel" className="hover:text-accent transition-colors">Alugar</a></li>
                <li><a href="/contato" className="hover:text-accent transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Para imobiliárias</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li><a href="/imobiliaria/login" className="hover:text-accent transition-colors">Acesso ao painel</a></li>
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
      <a
        href={linkHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
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
      <a
        href={href}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  )
}

function ListingCard({
  listing,
  compact = false,
}: {
  listing: typeof MOCK_LISTINGS[number]
  compact?: boolean
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border-subtle bg-surface-raised transition-all hover:border-accent/40 hover:shadow-md">
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
  )
}