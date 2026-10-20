import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  // Buscar métricas reais do SaaS
  const [{ count: totalTenants }, { count: activeTenants }, { count: totalUsers }] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
  ])

  // Calcular receita mensal estimada (soma das licenças ativas)
  const { data: licenses } = await supabase
    .from('licenses')
    .select('valor')
    .eq('active', true)
    .gte('fim', new Date().toISOString())

  const monthlyRevenue = licenses?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral do sistema Pepius Imob
        </p>
      </div>

      {/* Stats Grid - Linha de Planta: cards com border precisa, sem sombras pesadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total de Imobiliárias', value: totalTenants || 0, accent: false },
          { label: 'Imobiliárias Ativas', value: activeTenants || 0, accent: false },
          { label: 'Total de Usuários', value: totalUsers || 0, accent: false },
          { label: 'Receita Mensal', value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, accent: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-2 text-2xl font-semibold ${stat.accent ? 'text-accent' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions - Linha de Planta: bordas precisas, hover sutil */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Ações Rápidas</h2>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {[
            {
              href: '/admin/imobiliarias/nova',
              title: 'Nova Imobiliária',
              desc: 'Cadastrar nova imobiliária no sistema',
            },
            {
              href: '/admin/licencas',
              title: 'Gerenciar Licenças',
              desc: 'Ativar, renovar e desativar licenças',
            },
            {
              href: '/admin/usuarios',
              title: 'Gerenciar Usuários',
              desc: 'Ver e editar todos os usuários',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-md border border-border p-5 transition-colors hover:border-primary hover:bg-secondary"
            >
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                {action.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}