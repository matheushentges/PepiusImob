export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua imobiliária
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Total de Imóveis
          </p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Imóveis Disponíveis
          </p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Leads Este Mês
          </p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Conversas Ativas
          </p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">Ações Rápidas</h2>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          <a
            href="/dashboard/imoveis/novo"
            className="rounded-md border border-dashed p-6 text-center hover:border-solid hover:bg-accent"
          >
            <p className="font-medium">+ Novo Imóvel</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastrar um novo imóvel
            </p>
          </a>
          <a
            href="/dashboard/inbox"
            className="rounded-md border border-dashed p-6 text-center hover:border-solid hover:bg-accent"
          >
            <p className="font-medium">💬 Inbox</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ver conversas omnichannel
            </p>
          </a>
          <a
            href="/dashboard/configuracoes/canais"
            className="rounded-md border border-dashed p-6 text-center hover:border-solid hover:bg-accent"
          >
            <p className="font-medium">⚙️ Configurar Canais</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Integrar WhatsApp, Instagram
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}
