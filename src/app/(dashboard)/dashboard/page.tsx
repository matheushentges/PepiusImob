import { Building2, MessageSquare, Settings, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Visão Geral
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Acompanhe o desempenho da sua imobiliária
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de Imóveis"
          value="0"
          icon={Building2}
        />
        <StatCard
          label="Imóveis Disponíveis"
          value="0"
          icon={TrendingUp}
        />
        <StatCard
          label="Leads Este Mês"
          value="0"
          icon={MessageSquare}
        />
        <StatCard
          label="Conversas Ativas"
          value="0"
          icon={MessageSquare}
        />
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-medium text-text-primary">
          Ações Rápidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction
            href="/dashboard/imoveis/novo"
            title="Novo Imóvel"
            description="Cadastrar um novo imóvel"
            icon={Building2}
          />
          <QuickAction
            href="/dashboard/inbox"
            title="Inbox"
            description="Ver conversas omnichannel"
            icon={MessageSquare}
          />
          <QuickAction
            href="/dashboard/configuracoes/canais"
            title="Configurar Canais"
            description="Integrar WhatsApp, Instagram"
            icon={Settings}
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg bg-surface-raised p-5 border border-border-subtle">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </p>
        <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
        {value}
      </p>
    </div>
  )
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <a
      href={href}
      className="group flex items-start gap-4 rounded-lg border border-dashed border-border-default bg-surface-base p-5 transition-all hover:border-solid hover:border-accent hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-overlay text-text-secondary transition-colors group-hover:bg-accent group-hover:text-accent-text">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
      </div>
    </a>
  )
}