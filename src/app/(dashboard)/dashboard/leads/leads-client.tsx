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
import { Users, Phone, Mail, Clock, X, Loader2, Search } from 'lucide-react'

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

      <div className="grid gap-4 md:grid-cols-4">
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

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou imóvel..."
            aria-label="Buscar leads"
            className="h-9 w-full rounded-md border border-input bg-input pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrar por status"
          className="h-9 rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="em_contato">Em Contato</option>
          <option value="convertido">Convertido</option>
          <option value="perdido">Perdido</option>
        </select>
        {filtersActive && (
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
                      {lead.mensagem && (
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-detail-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
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

            <div className="space-y-5 px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(selected.status)}
                {selected.horarioPreferido && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Melhor horário: {preferenceLabels[selected.horarioPreferido] || selected.horarioPreferido}
                  </span>
                )}
              </div>

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
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    id="lead-status"
                    value={draftStatus}
                    onChange={(event) => setDraftStatus(event.target.value)}
                    disabled={!canEdit || saving}
                    className="h-9 rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="novo">Novo</option>
                    <option value="em_contato">Em Contato</option>
                    <option value="convertido">Convertido</option>
                    <option value="perdido">Perdido</option>
                  </select>
                  <Button
                    type="button"
                    className="h-9"
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
