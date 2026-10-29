'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Home,
  ShoppingBag,
  Key,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClientRoleBadge, ClientStatusBadge, ClientTypeBadge } from '@/components/clients/client-role-badge'
import { ClientWhatsAppButton } from '@/components/clients/client-whatsapp-button'
import { ClientDialog } from '@/components/clients/client-dialog'
import { formatDocument, formatPhoneBR, sanitizeDocument } from '@/lib/clients/validation'
import type { Client, ClientOverviewStats } from '@/lib/clients/types'

interface ClientsClientProps {
  initialClients: Client[]
  initialStats: ClientOverviewStats
  teamMembers: Array<{ id: string; nome: string }>
  canEdit: boolean
}

type TabFilter = 'todas' | 'proprietario' | 'comprador' | 'locatario' | 'pj'

export function ClientsClient({
  initialClients,
  initialStats,
  teamMembers,
  canEdit,
}: ClientsClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [stats, setStats] = useState<ClientOverviewStats>(initialStats)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabFilter>('todas')
  const [corretorFilter, setCorretorFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const reloadClients = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/dashboard/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
        setStats(data.stats || initialStats)
      }
    } catch (err) {
      console.error('Falha ao recarregar clientes', err)
    } finally {
      setRefreshing(false)
    }
  }, [initialStats])

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase()

    return clients.filter((c) => {
      // Filtro de aba
      if (tab === 'proprietario' && !c.papeis.includes('proprietario')) return false
      if (tab === 'comprador' && !c.papeis.includes('comprador')) return false
      if (tab === 'locatario' && !c.papeis.includes('locatario')) return false
      if (tab === 'pj' && c.tipo_pessoa !== 'pj') return false

      // Filtro por Corretor
      if (corretorFilter && c.corretor_id !== corretorFilter) return false

      // Busca textual
      if (term) {
        const matchNome = c.nome.toLowerCase().includes(term)
        const matchFantasia = c.nome_fantasia?.toLowerCase().includes(term) ?? false
        const matchDoc = sanitizeDocument(c.documento).includes(sanitizeDocument(term))
        const matchEmail = c.email?.toLowerCase().includes(term) ?? false
        const matchTel = sanitizeDocument(c.telefone).includes(sanitizeDocument(term))
        const matchBairro = c.bairro?.toLowerCase().includes(term) ?? false
        const matchCidade = c.cidade?.toLowerCase().includes(term) ?? false

        if (!matchNome && !matchFantasia && !matchDoc && !matchEmail && !matchTel && !matchBairro && !matchCidade) {
          return false
        }
      }

      return true
    })
  }, [clients, tab, corretorFilter, search])

  async function handleDelete(client: Client) {
    if (!confirm(`Tem certeza que deseja excluir o cadastro de "${client.nome}"? Esta ação removerá o histórico associado.`)) {
      return
    }

    try {
      const res = await fetch(`/api/dashboard/clients/${client.id}`, { method: 'DELETE' })
      if (res.ok) {
        await reloadClients()
      } else {
        alert('Não foi possível excluir o cliente. Verifique se ele possui imóveis vinculados.')
      }
    } catch (err) {
      console.error('Erro ao excluir cliente', err)
    }
  }

  function openCreate() {
    setEditingClient(null)
    setDialogOpen(true)
  }

  function openEdit(c: Client) {
    setEditingClient(c)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Gestão de Clientes
            </h1>
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
              CRM Unificado
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro completo de proprietários, compradores, locatários e radar de compatibilidade com imóveis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reloadClients}
            disabled={refreshing}
            className="cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1">Atualizar</span>
          </Button>

          {canEdit && (
            <Button
              size="sm"
              onClick={openCreate}
              className="cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground font-medium shadow-xs"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Novo Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Métricas "Linha de Planta" */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total de Clientes</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{stats.total}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Na base da imobiliária</div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Proprietários</span>
            <Home className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-200">
            {stats.proprietarios}
          </div>
          <div className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">Com imóveis captados</div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Compradores</span>
            <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-200">
            {stats.compradores}
          </div>
          <div className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-400/80">Em busca de imóveis</div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Locatários</span>
            <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
            {stats.locatarios}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Inquilinos & interessados</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
        {/* Abas */}
        <div className="flex border-b border-border/80 pb-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('todas')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tab === 'todas'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('proprietario')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tab === 'proprietario'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Proprietários ({stats.proprietarios})
          </button>
          <button
            type="button"
            onClick={() => setTab('comprador')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tab === 'comprador'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Compradores ({stats.compradores})
          </button>
          <button
            type="button"
            onClick={() => setTab('locatario')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tab === 'locatario'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Locatários ({stats.locatarios})
          </button>
          <button
            type="button"
            onClick={() => setTab('pj')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tab === 'pj'
                ? 'bg-secondary text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Pessoa Jurídica (PJ)
          </button>
        </div>

        {/* Inputs de Filtro */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF/CNPJ, telefone ou cidade..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={corretorFilter}
              onChange={(e) => setCorretorFilter(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-card px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todos os Corretores</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  Corretor: {m.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead className="w-[280px]">Cliente / Identificação</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead>Contato Direto</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium">Nenhum cliente encontrado</p>
                      <p className="text-xs">
                        {search || tab !== 'todas' || corretorFilter
                          ? 'Tente ajustar os filtros ou termos da busca.'
                          : 'Comece adicionando o primeiro cliente da imobiliária.'}
                      </p>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openCreate}
                          className="mt-3 text-xs cursor-pointer"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Cadastrar Cliente
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((c) => {
                  const initial = (c.nome || 'C').charAt(0).toUpperCase()

                  return (
                    <TableRow key={c.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Cliente / Identificação */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent text-xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/dashboard/clientes/${c.id}`}
                                className="font-medium text-foreground hover:text-accent hover:underline truncate max-w-[190px]"
                                title={c.nome}
                              >
                                {c.nome}
                              </Link>
                              <ClientTypeBadge type={c.tipo_pessoa} />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {c.documento ? (
                                <span>{formatDocument(c.documento)}</span>
                              ) : (
                                <span className="italic">Sem documento</span>
                              )}
                              {c.nome_fantasia && (
                                <span className="truncate max-w-[120px]">• {c.nome_fantasia}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Papéis */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {c.papeis.map((p) => (
                            <ClientRoleBadge key={p} role={p} />
                          ))}
                        </div>
                      </TableCell>

                      {/* Contato Direto */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {formatPhoneBR(c.telefone)}
                            </span>
                            <ClientWhatsAppButton
                              phone={c.telefone}
                              clientName={c.nome}
                              compact
                            />
                          </div>
                          {c.email && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-[160px]" title={c.email}>
                              {c.email}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Localização */}
                      <TableCell>
                        <div className="text-xs">
                          {c.cidade ? (
                            <div className="text-foreground">
                              {c.cidade}{c.estado ? ` - ${c.estado}` : ''}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Não informada</span>
                          )}
                          {c.bairro && (
                            <div className="text-[11px] text-muted-foreground">{c.bairro}</div>
                          )}
                        </div>
                      </TableCell>

                      {/* Corretor Responsável */}
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {c.corretor_nome ? (
                            <span className="font-medium text-foreground">{c.corretor_nome}</span>
                          ) : (
                            <span className="italic">Geral</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <ClientStatusBadge status={c.status} />
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/dashboard/clientes/${c.id}`}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title="Ver Perfil 360º"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(c)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                                title="Editar Cadastro"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(c)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                title="Excluir Cliente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      <ClientDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          reloadClients()
        }}
        client={editingClient}
        teamMembers={teamMembers}
      />
    </div>
  )
}
