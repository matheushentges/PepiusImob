import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
    : { data: null }
  const license = await getLocalLicenseAccess()

  let totalProperties = 0
  let availableProperties = 0
  let monthlyLeads = 0

  if (profile?.tenant_id) {
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()
    const [properties, available, leads] = await Promise.all([
      (!license.active || license.features.includes('properties'))
        ? supabase.from('properties').select('id', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id)
        : Promise.resolve({ count: 0 }),
      (!license.active || license.features.includes('properties'))
        ? supabase.from('properties').select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id).eq('status', 'disponivel')
        : Promise.resolve({ count: 0 }),
      (!license.active || license.features.includes('leads'))
        ? supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id).gte('created_at', monthStart)
        : Promise.resolve({ count: 0 }),
    ])
    totalProperties = properties.count ?? 0
    availableProperties = available.count ?? 0
    monthlyLeads = leads.count ?? 0
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua imobiliária</p>
      </header>

      <section aria-label="Indicadores da imobiliária" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Total de imóveis', value: totalProperties },
          { label: 'Imóveis disponíveis', value: availableProperties },
          { label: 'Leads neste mês', value: monthlyLeads },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Ações rápidas</h2>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {[
            { href: '/dashboard/imoveis/novo', title: 'Novo imóvel', desc: 'Cadastrar um imóvel no portfólio' },
            { href: '/dashboard/leads', title: 'Ver leads', desc: 'Acompanhar solicitações de contato' },
            { href: '/dashboard/configuracoes', title: 'Configurações', desc: 'Ajustar textos e cores da vitrine' },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="group rounded-md border border-border p-5 transition-colors hover:border-primary hover:bg-secondary">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">{action.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
