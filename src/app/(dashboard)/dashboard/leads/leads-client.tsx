'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Phone, Mail, Clock, X, Loader2, Search, CalendarDays, ExternalLink } from 'lucide-react'

export interface AgencyLead {
  id: string
  propertyId: string | null
  propertyTitle: string
  nome: string
  email: string | null
  telefone: string | null
  mensagem: string | null
  horarioPreferido: string | null
  status: string
  createdAt: string
  visitStartsAt?: string | null
  visitEndsAt?: string | null
  googleEventId?: string | null
  googleEventLink?: string | null
}

function formatVisitTime(startsAt: string) {
  const start = new Date(startsAt)
  const dateStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const timeStr = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} às ${timeStr}`
}

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_contato: 'Em Contato',
  convertido: 'Convertido',
  perdido: 'Perdido',
}

const statusColors: Record<string, string> = {
  novo: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  em_contato: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  convertido: 'bg-green-50 text-green-700 ring-green-600/20',
  perdido: 'bg-red-50 text-red-700 ring-red-600/20',
}

const preferenceLabels: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR')
}

function statusBadge(status: string) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
    >
      {statusLabels[status] || status}
    </span>
  )
}

export function LeadsClient({ leads, canEdit }: { leads: AgencyLead[]; canEdit: boolean }) {
  const [rows, setRows] = useState(leads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<AgencyLead | null>(null)
  const [draftStatus, setDraftStatus] = useState('novo')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!selected) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false
      if (!term) return true
      return [
        lead.nome,
        lead.email,
        lead.telefone,
        lead.mensagem,
        lead.propertyTitle,
      ].some((value) => value?.toLowerCase().includes(term))
    })
  }, [rows, search, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    novo: rows.filter((lead) => lead.status === 'novo').length,
    em_contato: rows.filter((lead) => lead.status === 'em_contato').length,
    convertido: rows.filter((lead) => lead.status === 'convertido').length,
  }), [rows])

  function openLead(lead: AgencyLead) {
    setSelected(lead)
    setDraftStatus(lead.status)
    setError(null)
    setSuccess(null)
  }

  async function saveStatus() {
    if (!selected) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/dashboard/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status: draftStatus }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Não foi possível atualizar o contato')
      }
      const updated = { ...selected, status: draftStatus }
      setRows((current) => current.map((lead) => (lead.id === selected.id ? updated : lead)))
      setSelected(updated)
      setSuccess('Status atualizado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o contato')
    } finally {
      setSaving(false)
    }
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
  }

  const filtersActive = Boolean(search.trim() || statusFilter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          Leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe e gerencie os leads da sua imobiliária
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, accent: false },
          { label: 'Novos', value: stats.novo, accent: false },
          { label: 'Em Contato', value: stats.em_contato, accent: false },
          { label: 'Convertidos', value: stats.convertido, accent: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-1 text-xl font-semibold ${stat.accent ? 'text-accent' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou imóvel..."
            aria-label="Buscar leads"
            className="h-10 sm:h-9 w-full rounded-md border border-input bg-input pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrar por status"
          className="h-10 sm:h-9 w-full sm:w-auto rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="em_contato">Em Contato</option>
          <option value="convertido">Convertido</option>
          <option value="perdido">Perdido</option>
        </select>
        {filtersActive && (
          <Button type="button" variant="outline" size="sm" className="h-10 sm:h-9 w-full sm:w-auto" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'lead' : 'leads'}
        {filtersActive ? ' com os filtros atuais' : ' registrados'}
      </p>

      {/* Mobile View - Cards de Leads compactos e acionáveis */}
      <div className="space-y-3 md:hidden">
        {filtered.length > 0 ? (
          filtered.map((lead) => (
            <div
              key={lead.id}
              className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {lead.nome}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Recebido em {formatDate(lead.createdAt)}
                  </p>
                </div>
                {statusBadge(lead.status)}
              </div>

              {lead.visitStartsAt && (
                <div className="flex items-center gap-1.5 rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>Visita: {formatVisitTime(lead.visitStartsAt)}</span>
                </div>
              )}

              {lead.propertyTitle && (
                <div className="rounded bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Interesse: </span>
                  <span className="truncate">{lead.propertyTitle}</span>
                </div>
              )}

              {/* Ações diretas de contato */}
              <div className="flex flex-wrap gap-2 text-xs">
                {lead.telefone && (
                  <a
                    href={`tel:${lead.telefone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 font-medium text-foreground hover:bg-secondary"
                  >
                    <Phone className="h-3 w-3 text-accent" />
                    <span>Ligar</span>
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 font-medium text-foreground hover:bg-secondary truncate max-w-[180px]"
                  >
                    <Mail className="h-3 w-3 text-accent shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                )}
              </div>

              {lead.mensagem && (
                <p className="line-clamp-2 rounded bg-secondary/30 p-2 text-xs text-muted-foreground">
                  &ldquo;{lead.mensagem}&rdquo;
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full justify-center"
                onClick={() => openLead(lead)}
              >
                Ver Detalhes do Atendimento
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {filtersActive ? 'Nenhum lead encontrado' : 'Nenhum lead registrado'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtersActive
                ? 'Ajuste a busca ou o status para ver outros contatos.'
                : 'Os leads aparecerão aqui quando clientes entrarem em contato'}
            </p>
            {filtersActive && (
              <Button type="button" variant="outline" size="sm" className="mt-4 w-full" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop View - Tabela completa */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lead
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contato
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imóvel Interesse
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Data
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((lead) => (
                <TableRow key={lead.id} className="border-b border-border last:border-0">
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {lead.nome}
                      </p>
                      {lead.visitStartsAt && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            Visita: {formatVisitTime(lead.visitStartsAt)}
                          </span>
                        </div>
                      )}
                      {lead.mensagem && !lead.visitStartsAt && (
                        <p className="truncate text-xs text-muted-foreground max-w-[200px]">
                          {lead.mensagem}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.telefone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{lead.telefone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.propertyTitle || '—'}
                  </TableCell>
                  <TableCell>{statusBadge(lead.status)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => openLead(lead)}>
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {filtersActive ? 'Nenhum lead encontrado' : 'Nenhum lead registrado'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {filtersActive
                      ? 'Ajuste a busca ou o status para ver outros contatos.'
                      : 'Os leads aparecerão aqui quando clientes entrarem em contato'}
                  </p>
                  {filtersActive && (
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:p-4 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-detail-title"
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border px-4 sm:px-5 py-4">
              <div>
                <h2 id="lead-detail-title" className="font-serif text-lg font-semibold text-foreground">
                  {selected.nome}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Recebido em {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Fechar detalhes"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-4 sm:px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(selected.status)}
                {selected.visitStartsAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    <CalendarDays className="h-3 w-3" />
                    Visita: {formatVisitTime(selected.visitStartsAt)}
                  </span>
                ) : selected.horarioPreferido ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Melhor horário: {preferenceLabels[selected.horarioPreferido] || selected.horarioPreferido}
                  </span>
                ) : null}
              </div>

              {selected.visitStartsAt && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                      <CalendarDays className="h-4 w-4" />
                      Visita Presencial Agendada
                    </span>
                    <span className="font-semibold text-foreground">
                      {new Date(selected.visitStartsAt).toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Horário da visita:</span>
                    <span className="font-medium text-foreground">
                      {new Date(selected.visitStartsAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {selected.visitEndsAt &&
                        ` às ${new Date(selected.visitEndsAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`}
                    </span>
                  </div>
                  {selected.googleEventLink && (
                    <div className="pt-1 border-t border-accent/20">
                      <a
                        href={selected.googleEventLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Abrir compromisso no Google Agenda</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Imóvel</dt>
                  <dd className="mt-0.5 text-foreground">{selected.propertyTitle || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contato</dt>
                  <dd className="mt-1 flex flex-col gap-1.5">
                    {selected.email ? (
                      <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-2 text-foreground hover:text-accent">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {selected.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">E-mail não informado</span>
                    )}
                    {selected.telefone ? (
                      <a href={`tel:${selected.telefone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-2 text-foreground hover:text-accent">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {selected.telefone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Telefone não informado</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mensagem</dt>
                  <dd className="mt-1 whitespace-pre-wrap leading-relaxed text-foreground">
                    {selected.mensagem || 'Nenhuma mensagem enviada.'}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 border-t border-border pt-4">
                <label htmlFor="lead-status" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status do atendimento
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    id="lead-status"
                    value={draftStatus}
                    onChange={(event) => setDraftStatus(event.target.value)}
                    disabled={!canEdit || saving}
                    className="h-10 sm:h-9 w-full sm:w-auto rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="novo">Novo</option>
                    <option value="em_contato">Em Contato</option>
                    <option value="convertido">Convertido</option>
                    <option value="perdido">Perdido</option>
                  </select>
                  <Button
                    type="button"
                    className="h-10 sm:h-9 w-full sm:w-auto"
                    onClick={saveStatus}
                    disabled={!canEdit || saving || draftStatus === selected.status}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar status
                  </Button>
                </div>
                {!canEdit && (
                  <p className="text-xs text-muted-foreground">
                    A licença está suspensa. Os dados continuam disponíveis para leitura e exportação.
                  </p>
                )}
                {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
                {success && <p role="status" className="text-xs text-green-700">{success}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
