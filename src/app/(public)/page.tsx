import { Building2, MessageSquare, Bot, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-base/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <span className="text-xl font-bold tracking-tight text-accent">
            Pepius Imob
          </span>
          <nav className="hidden items-center gap-6 sm:flex">
            <a
              href="/imoveis"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Imóveis
            </a>
            <a
              href="/contato"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Contato
            </a>
            <ThemeToggle />
            <a
              href="/login"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover"
            >
              Entrar
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — busca como elemento central */}
        <section className="container mx-auto px-4 py-24 lg:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-[1.1]">
              Encontre o imóvel ideal
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary max-w-prose mx-auto">
              Milhares de imóveis para venda e locação. Sistema completo para
              sua imobiliária com atendimento automatizado por IA.
            </p>

            {/* Search bar as hero centerpiece */}
            <div className="mt-10 mx-auto max-w-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Buscar por cidade, bairro ou tipo..."
                  className="w-full rounded-lg border border-border-default bg-surface-raised py-3.5 pl-12 pr-4 text-sm text-text-primary shadow-sm placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <a
                href="/imoveis"
                className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-text shadow-sm transition-colors hover:bg-accent-hover"
              >
                Ver Imóveis
              </a>
              <a
                href="/dashboard"
                className="rounded-md border border-border-default bg-surface-raised px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-overlay"
              >
                Sou Imobiliária
              </a>
            </div>
          </div>
        </section>

        {/* Features — ícones ao invés de cards genéricos */}
        <section className="border-t border-border-subtle bg-surface-overlay/50 py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-center text-2xl font-semibold tracking-tight text-text-primary">
                Para Imobiliárias
              </h2>
              <p className="mt-3 text-center text-text-secondary max-w-prose mx-auto">
                Sistema SaaS completo para gestão da sua imobiliária
              </p>

              <div className="mt-14 grid gap-10 sm:grid-cols-3">
                <FeatureItem
                  icon={Building2}
                  title="Gestão de Imóveis"
                  description="CRUD completo, fotos, filtros avançados e organização intuitiva."
                />
                <FeatureItem
                  icon={MessageSquare}
                  title="Atendimento Omnichannel"
                  description="WhatsApp, Instagram, Messenger e Webchat em um só lugar."
                />
                <FeatureItem
                  icon={Bot}
                  title="IA para Atendimento"
                  description="Agente inteligente responde 24/7 e captura leads automaticamente."
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-10">
        <div className="container mx-auto px-4 text-center text-sm text-text-tertiary lg:px-8">
          © {new Date().getFullYear()} Pepius Imob. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-subtle text-accent sm:mx-0">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary max-w-xs mx-auto sm:mx-0">
        {description}
      </p>
    </div>
  )
}