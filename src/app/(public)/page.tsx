import Link from 'next/link'
import { Search, Building2, MessageSquare, Bot, KeyRound, MapPin } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header - Linha de Planta: border-b precisa, tipografia serif */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Pepius
            </span>
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
              Imob
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#imoveis" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Imóveis
            </a>
            <a href="#para-imobiliarias" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Para Imobiliárias
            </a>
            <a href="#contato" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Contato
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Entrar
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sou Imobiliária
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Signature: linha horizontal fina como divisor arquitetônico */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-20 md:px-6 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-accent">
                Encontre seu próximo imóvel
              </p>
              <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                O imóvel ideal está{' '}
                <span className="relative inline-block">
                  mais perto
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-accent/30"
                    viewBox="0 0 200 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M2 8C50 2 150 2 198 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>{' '}
                do que você imagina
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
                Milhares de imóveis para venda e locação. Atendimento inteligente 24h por dia.
              </p>

              {/* Search Bar - Signature: input com border precisa, ícone integrado */}
              <div className="mx-auto mt-10 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Busque por cidade, bairro ou tipo de imóvel..."
                    className="h-14 w-full rounded-lg border border-border bg-card pl-12 pr-4 text-base shadow-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                    Buscar
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    São Paulo
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Apartamento
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    Aluguel
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative line - Signature "Linha de Planta" */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </section>

        {/* Features Section - Para Imobiliárias */}
        <section id="para-imobiliarias" className="bg-secondary/30 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                  Para profissionais
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Sistema completo para sua imobiliária
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Gestão de imóveis, atendimento omnichannel e IA — tudo em um só lugar.
                </p>
              </div>

              <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Building2,
                    title: 'Gestão de Imóveis',
                    desc: 'CRUD completo com fotos, filtros avançados, status e histórico de alterações.',
                  },
                  {
                    icon: MessageSquare,
                    title: 'Inbox Omnichannel',
                    desc: 'WhatsApp, Instagram, Messenger e Webchat em uma única conversa unificada.',
                  },
                  {
                    icon: Bot,
                    title: 'IA para Atendimento',
                    desc: 'Agente inteligente responde 24/7, qualifica leads e agenda visitas automaticamente.',
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Começar agora
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Signature: borda superior fina como linha de planta */}
        <section className="border-t border-border py-20 md:py-28">
          <div className="container mx-auto px-4 text-center md:px-6">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Pronto para transformar sua imobiliária?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Junte-se a dezenas de imobiliárias que já usam o Pepius Imob para vender e alugar mais.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Criar conta grátis
              </Link>
              <Link
                href="#contato"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-8 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Falar com vendas
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Linha de Planta: border-t precisa, minimalista */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
                Pepius
              </span>
              <span className="text-xs text-muted-foreground">Imob</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">Sobre</a>
              <a href="#" className="transition-colors hover:text-foreground">Termos</a>
              <a href="#" className="transition-colors hover:text-foreground">Privacidade</a>
              <a href="#" className="transition-colors hover:text-foreground">Contato</a>
            </nav>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Pepius Imob. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}