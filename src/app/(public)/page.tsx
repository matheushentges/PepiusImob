export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Pepius Imob</h1>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/imoveis" className="text-sm font-medium hover:underline">
              Imóveis
            </a>
            <a href="/contato" className="text-sm font-medium hover:underline">
              Contato
            </a>
            <a
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Entrar
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Encontre o imóvel ideal
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Milhares de imóveis para venda e locação. Sistema completo para
              sua imobiliária com atendimento automatizado por IA.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <a
                href="/imoveis"
                className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Ver Imóveis
              </a>
              <a
                href="/dashboard"
                className="rounded-md border border-input px-6 py-3 text-sm font-semibold hover:bg-accent"
              >
                Sou Imobiliária
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h3 className="text-center text-3xl font-bold">
                Para Imobiliárias
              </h3>
              <p className="mt-4 text-center text-muted-foreground">
                Sistema completo SaaS para gestão da sua imobiliária
              </p>
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="font-semibold">Gestão de Imóveis</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    CRUD completo, fotos, filtros avançados e muito mais.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="font-semibold">Atendimento Omnichannel</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    WhatsApp, Instagram, Messenger e Webchat integrados.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h4 className="font-semibold">IA para Atendimento</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Agente inteligente responde 24/7 e captura leads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Pepius Imob. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
