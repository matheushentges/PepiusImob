'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Home, Building, Search, Star } from 'lucide-react'

export interface AgencyProperty {
  id: string
  titulo: string
  tipo: string
  finalidade: string
  status: string
  featured: boolean
  precoVenda: number | null
  precoLocacao: number | null
  cidade: string
  estado: string
  bairro: string
  createdAt: string
}

const statusLabels: Record<string, string> = {
  disponivel: 'Disponível',
  vendido: 'Vendido',
  alugado: 'Alugado',
  reservado: 'Reservado',
}

const statusColors: Record<string, string> = {
  disponivel: 'bg-green-50 text-green-700 ring-green-600/20',
  vendido: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  alugado: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  reservado: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

const tipoLabels: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
  rural: 'Rural',
}

const finalidadeLabels: Record<string, string> = {
  venda: 'Venda',
  locacao: 'Locação',
  ambos: 'Venda e locação',
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function PriceCell({ property }: { property: AgencyProperty }) {
  if (property.finalidade === 'venda') {
    return <span>{formatCurrency(property.precoVenda)}</span>
  }
  if (property.finalidade === 'locacao') {
    return (
      <span>
        {formatCurrency(property.precoLocacao)}
        {property.precoLocacao !== null && <span className="ml-1 text-xs text-muted-foreground">/mês</span>}
      </span>
    )
  }
  return (
    <span className="block space-y-0.5">
      <span className="block">
        <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Venda</span>
        {formatCurrency(property.precoVenda)}
      </span>
      <span className="block">
        <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Locação</span>
        {formatCurrency(property.precoLocacao)}
        {property.precoLocacao !== null && <span className="ml-1 text-xs text-muted-foreground">/mês</span>}
      </span>
    </span>
  )
}

export function PropertiesClient({ properties, canEdit }: { properties: AgencyProperty[]; canEdit: boolean }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return properties.filter((property) => {
      if (typeFilter && property.tipo !== typeFilter) return false
      if (statusFilter && property.status !== statusFilter) return false
      if (!term) return true
      return [property.titulo, property.bairro, property.cidade, property.estado]
        .some((value) => value.toLowerCase().includes(term))
    })
  }, [properties, search, statusFilter, typeFilter])

  const filtersActive = Boolean(search.trim() || typeFilter || statusFilter)

  function clearFilters() {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Imóveis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o portfólio de imóveis da sua imobiliária
          </p>
        </div>
        {canEdit && (
          <Button asChild className="h-10 sm:h-9 gap-2 w-full sm:w-auto justify-center">
            <Link href="/dashboard/imoveis/novo">
              <Plus className="h-4 w-4" />
              Novo Imóvel
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, cidade ou bairro..."
            aria-label="Buscar imóveis"
            className="h-10 sm:h-9 w-full rounded-md border border-input bg-input pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filtrar por tipo"
            className="h-10 sm:h-9 w-full rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos os tipos</option>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="terreno">Terreno</option>
            <option value="comercial">Comercial</option>
            <option value="rural">Rural</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrar por status"
            className="h-10 sm:h-9 w-full rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos os status</option>
            <option value="disponivel">Disponível</option>
            <option value="reservado">Reservado</option>
            <option value="vendido">Vendido</option>
            <option value="alugado">Alugado</option>
          </select>
        </div>
        {filtersActive && (
          <Button type="button" variant="outline" size="sm" className="h-10 sm:h-9 w-full sm:w-auto" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'imóvel' : 'imóveis'}
        {filtersActive ? ' com os filtros atuais' : ' no portfólio'}
      </p>

      {/* Mobile View - Cards compactos e ergonômicos */}
      <div className="space-y-3 md:hidden">
        {filtered.length > 0 ? (
          filtered.map((property) => (
            <div
              key={property.id}
              className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground mt-0.5">
                    {property.tipo === 'apartamento' ? (
                      <Building className="h-5 w-5" />
                    ) : (
                      <Home className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      {property.featured && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-current text-accent" aria-label="Destaque na vitrine" />
                      )}
                      <span className="truncate">{property.titulo}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {property.bairro}, {property.cidade}/{property.estado}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[property.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                >
                  {statusLabels[property.status] || property.status}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-secondary px-2 py-0.5 font-medium text-foreground">
                    {tipoLabels[property.tipo] || property.tipo}
                  </span>
                  <span>•</span>
                  <span>{finalidadeLabels[property.finalidade] || property.finalidade}</span>
                </div>
                <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  <PriceCell property={property} />
                </div>
              </div>

              {canEdit && (
                <div className="border-t border-border/60 pt-2.5">
                  <Button variant="outline" size="sm" asChild className="h-9 w-full justify-center">
                    <Link href={`/dashboard/imoveis/${property.id}`}>
                      Editar imóvel
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Home className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {filtersActive ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtersActive
                ? 'Ajuste a busca ou os filtros para ver outros imóveis.'
                : 'Comece adicionando seu primeiro imóvel ao portfólio'}
            </p>
            {filtersActive ? (
              <Button type="button" variant="outline" size="sm" className="mt-4 w-full" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : canEdit ? (
              <Button asChild className="mt-4 h-9 w-full">
                <Link href="/dashboard/imoveis/novo">Adicionar Imóvel</Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {/* Desktop View - Tabela completa */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imóvel
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tipo
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Finalidade
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preço
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((property) => (
                <TableRow key={property.id} className="border-b border-border last:border-0">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        {property.tipo === 'apartamento' ? (
                          <Building className="h-5 w-5" />
                        ) : (
                          <Home className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                          {property.featured && (
                            <Star className="h-3.5 w-3.5 shrink-0 fill-current text-accent" aria-label="Destaque na vitrine" />
                          )}
                          <span className="truncate">{property.titulo}</span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {property.bairro}, {property.cidade}/{property.estado}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tipoLabels[property.tipo] || property.tipo}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {finalidadeLabels[property.finalidade] || property.finalidade}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums text-foreground">
                    <PriceCell property={property} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[property.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                    >
                      {statusLabels[property.status] || property.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit ? (
                      <Button variant="ghost" size="sm" asChild className="h-8">
                        <Link href={`/dashboard/imoveis/${property.id}`}>Editar</Link>
                      </Button>
                    ) : <span className="text-xs text-muted-foreground">Somente leitura</span>}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Home className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {filtersActive ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {filtersActive
                      ? 'Ajuste a busca ou os filtros para ver outros imóveis.'
                      : 'Comece adicionando seu primeiro imóvel ao portfólio'}
                  </p>
                  {filtersActive ? (
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  ) : canEdit ? (
                    <Button asChild className="mt-4 h-9">
                      <Link href="/dashboard/imoveis/novo">Adicionar Imóvel</Link>
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
