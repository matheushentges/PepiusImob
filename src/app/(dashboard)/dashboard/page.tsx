import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { CalendarDays, Users, Phone, MessageSquare, ExternalLink, ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface PropertyRelation {
  titulo: string
}

interface VisitRow {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  visit_starts_at: string
  visit_ends_at: string | null
  google_event_link: string | null
  properties: PropertyRelation | PropertyRelation[] | null
}

interface RecentLeadRow {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  mensagem: string | null
  created_at: string
  properties: PropertyRelation | PropertyRelation[] | null
}

function getPropertyTitle(rel: PropertyRelation | PropertyRelation[] | null): string {
  if (!rel) return 'Imóvel sob consulta'
  if (Array.isArray(rel)) return rel[0]?.titulo ?? 'Imóvel sob consulta'
  return rel.titulo ?? 'Imóvel sob consulta'
}

function formatVisitRelative(dateIso: string): string {
  const date = new Date(dateIso)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  if (isToday) return `Hoje às ${timeStr}`

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()

  if (isTomorrow) return `Amanhã às ${timeStr}`

  const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${dayMonth} às ${timeStr}`
}

function formatLeadTime(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `há ${Math.max(1, minutes)} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  return new Date(dateIso).toLocaleDateString('pt-BR')
}

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
  let upcomingVisitsCount = 0
  let upcomingVisits: VisitRow[] = []
  let pendingLeads: RecentLeadRow[] = []

  if (profile?.tenant_id) {
    const nowIso = new Date().toISOString()
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()

    const [propertiesRes, availableRes, leadsRes, visitsCountRes, visitsListRes, pendingLeadsRes] = await Promise.all([
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
      (!license.active || license.features.includes('leads'))
        ? supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id).gte('visit_starts_at', nowIso)
        : Promise.resolve({ count: 0 }),
      (!license.active || license.features.includes('leads'))
        ? supabase.from('leads')
          .select('id, nome, telefone, email, visit_starts_at, visit_ends_at, google_event_link, properties(titulo)')
          .eq('tenant_id', profile.tenant_id)
          .gte('visit_starts_at', nowIso)
          .order('visit_starts_at', { ascending: true })
          .limit(4)
        : Promise.resolve({ data: [] }),
      (!license.active || license.features.includes('leads'))
        ? supabase.from('leads')
          .select('id, nome, telefone, email, mensagem, created_at, properties(titulo)')
          .eq('tenant_id', profile.tenant_id)
          .eq('status', 'novo')
          .is('visit_starts_at', null)
          .order('created_at', { ascending: false })
          .limit(4)
        : Promise.resolve({ data: [] }),
    ])

    totalProperties = propertiesRes.count ?? 0
    availableProperties = availableRes.count ?? 0
    monthlyLeads = leadsRes.count ?? 0
    upcomingVisitsCount = visitsCountRes.count ?? 0
    upcomingVisits = (visitsListRes.data as unknown as VisitRow[]) ?? []
    pendingLeads = (pendingLeadsRes.data as unknown as RecentLeadRow[]) ?? []
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral e operação em tempo real da sua imobiliária</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/dashboard/leads" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Ver Todos os Leads</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9">
            <Link href="/dashboard/imoveis/novo">
              <span>+ Novo Imóvel</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Indicadores Principais */}
      <section aria-label="Indicadores da imobiliária" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total de imóveis', value: totalProperties, desc: 'no portfólio' },
          { label: 'Imóveis disponíveis', value: availableProperties, desc: 'publicados na vitrine' },
          { label: 'Leads no mês', value: monthlyLeads, desc: 'contatos recebidos' },
          { label: 'Visitas agendadas', value: upcomingVisitsCount, desc: 'próximas visitas' },
        ].map((stat, i) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-foreground">{stat.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{stat.desc}</p>
          </div>
        ))}
      </section>

      {/* Grade Operacional: Visitas Agendadas vs Leads Não Atendidos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel: Agenda de Visitas Presenciais */}
        <div className="rounded-lg border border-border bg-card flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 sm:px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground">Agenda de Visitas</h2>
            </div>
            <Link href="/dashboard/leads" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
              Ver agenda completa <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 sm:p-5 flex-1 space-y-3">
            {upcomingVisits.length > 0 ? (
              upcomingVisits.map((visit) => {
                const propertyTitle = getPropertyTitle(visit.properties)
                const phoneDigits = (visit.telefone || '').replace(/\D/g, '')

                return (
                  <div
                    key={visit.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/70 bg-secondary/30 hover:border-accent/40 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                          <Clock className="h-3 w-3" />
                          {formatVisitRelative(visit.visit_starts_at)}
                        </span>
                        <p className="text-sm font-semibold text-foreground truncate">{visit.nome}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Interesse: <span className="text-foreground font-medium">{propertyTitle}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {visit.google_event_link && (
                        <a
                          href={visit.google_event_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
                          title="Abrir no Google Agenda"
                        >
                          <ExternalLink className="h-3 w-3 text-accent" />
                          <span>Google Agenda</span>
                        </a>
                      )}
                      {phoneDigits && (
                        <a
                          href={`https://wa.me/55${phoneDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90"
                          title="Chamar no WhatsApp"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-md">
                <CalendarDays className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium text-foreground">Nenhuma visita agendada</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  As visitas marcadas pelos clientes na vitrine aparecerão aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Painel: Leads Aguardando Primeiro Atendimento */}
        <div className="rounded-lg border border-border bg-card flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 sm:px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground">Leads Novos (Aguardando Atendimento)</h2>
            </div>
            <Link href="/dashboard/leads" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
              Todos os contatos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 sm:p-5 flex-1 space-y-3">
            {pendingLeads.length > 0 ? (
              pendingLeads.map((lead) => {
                const propertyTitle = getPropertyTitle(lead.properties)
                const phoneDigits = (lead.telefone || '').replace(/\D/g, '')

                return (
                  <div
                    key={lead.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/70 bg-secondary/30 hover:border-accent/40 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                          Novo
                        </span>
                        <p className="text-sm font-semibold text-foreground truncate">{lead.nome}</p>
                        <span className="text-[11px] text-muted-foreground">{formatLeadTime(lead.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Interesse: <span className="text-foreground font-medium">{propertyTitle}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {lead.telefone && (
                        <a
                          href={`tel:${phoneDigits}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                          <Phone className="h-3 w-3 text-accent" />
                          <span>Ligar</span>
                        </a>
                      )}
                      {phoneDigits && (
                        <a
                          href={`https://wa.me/55${phoneDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-md">
                <CheckCircle2 className="h-8 w-8 text-green-500/80 mb-2" />
                <p className="text-sm font-medium text-foreground">Todos os leads foram atendidos!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nenhum contato pendente de primeiro retorno no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ações Rápidas */}
      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 sm:px-5 py-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Ações rápidas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5">
          {[
            { href: '/dashboard/imoveis/novo', title: 'Novo imóvel', desc: 'Cadastrar um imóvel no portfólio' },
            { href: '/dashboard/leads', title: 'Gestão de Leads', desc: 'Acompanhar solicitações de contato' },
            { href: '/dashboard/configuracoes?tab=agenda', title: 'Google Agenda', desc: 'Ajustar horários de visitas' },
            { href: '/dashboard/configuracoes', title: 'Personalização', desc: 'Ajustar logo, textos e cores do site' },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="group rounded-md border border-border p-4 sm:p-5 transition-colors hover:border-primary hover:bg-secondary">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">{action.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
