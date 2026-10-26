'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  KeyRound,
  Search,
  CheckCircle2,
  UserCheck,
  Users,
  Wrench,
  AlertCircle,
  Building,
  Home,
  Check,
  RefreshCw,
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
import { KeyStatusBadge } from '@/components/keys/key-status-badge'
import { KeyCheckoutDialog } from '@/components/keys/key-checkout-dialog'
import { KeyReturnDialog } from '@/components/keys/key-return-dialog'
import { KeyWhatsAppButton } from '@/components/keys/key-whatsapp-button'
import { formatDateTimeBR } from '@/lib/keys/whatsapp'
import type { KeyOverviewItem } from '@/lib/keys/types'

interface KeysClientProps {
  initialKeys: KeyOverviewItem[]
  canEdit: boolean
}

type TabFilter = 'todas' | 'disponivel' | 'fora' | 'atrasada' | 'manutencao'

export function KeysClient({ initialKeys, canEdit }: KeysClientProps) {
  const [keys, setKeys] = useState<KeyOverviewItem[]>(initialKeys)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabFilter>('todas')
  const [refreshing, setRefreshing] = useState(false)

  // Dialog states
  const [checkoutTarget, setCheckoutTarget] = useState<KeyOverviewItem | null>(null)
  const [returnTarget, setReturnTarget] = useState<KeyOverviewItem | null>(null)

  const reloadKeys = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/dashboard/keys')
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys || [])
      }
    } catch (err) {
      console.error('Falha ao atualizar chaves', err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Métricas do Claviculário
  const stats = useMemo(() => {
    let total = keys.length
    let disponiveis = 0
    let comConsultor = 0
    let comCliente = 0
    let emManutencao = 0
    let atrasadas = 0

    for (const k of keys) {
      if (k.status === 'disponivel') disponiveis++
      if (k.status === 'com_consultor') comConsultor++
      if (k.status === 'com_cliente') comCliente++
      if (k.status === 'em_manutencao') emManutencao++
      if (k.currentMovement?.isLate) atrasadas++
    }

    const totalFora = total - disponiveis

    return {
      total,
      disponiveis,
      comConsultor,
      comCliente,
      emManutencao,
      totalFora,
      atrasadas,
    }
  }, [keys])

  // Filtragem
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return keys.filter((k) => {
      // Filtro de aba
      if (tab === 'disponivel' && k.status !== 'disponivel') return false
      if (tab === 'fora' && k.status === 'disponivel') return false
      if (tab === 'atrasada' && !k.currentMovement?.isLate) return false
      if (tab === 'manutencao' && k.status !== 'em_manutencao') return false

      // Busca textual
      if (!term) return true
      return [
        k.codigo,
        k.propertyTitle,
        k.propertyNeighborhood,
        k.propertyCity,
        k.localizacao || '',
        k.currentMovement?.nomeResponsavel || '',
      ].some((v) => v.toLowerCase().includes(term))
    })
  }, [keys, search, tab])

  return (
    <div className="space-y-6">
      {/* Header com título e atualização */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Controle de Chaves & Claviculário
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o paradeiro das chaves, visitas com clientes, manutenções e devoluções
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reloadKeys}
            disabled={refreshing}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas / KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Cadastradas</span>
            <KeyRound className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-foreground">
            {stats.total}
          </p>
          <span className="text-[11px] text-muted-foreground">chaveiros</span>
        </div>

        {/* No Claviculário */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-medium">No Claviculário</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {stats.disponiveis}
          </p>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">disponíveis</span>
        </div>

        {/* Com Consultor */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">Com Consultor</span>
            <UserCheck className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
            {stats.comConsultor}
          </p>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">em visita</span>
        </div>

        {/* Com Cliente */}
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400">
            <span className="text-xs font-medium">Com Cliente</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-sky-700 dark:text-sky-400">
            {stats.comCliente}
          </p>
          <span className="text-[11px] text-sky-600/80 dark:text-sky-400/80">visita por conta</span>
        </div>

        {/* Em Manutenção */}
        <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
            <span className="text-xs font-medium">Manutenção</span>
            <Wrench className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-purple-700 dark:text-purple-400">
            {stats.emManutencao}
          </p>
          <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80">em reparos</span>
        </div>

        {/* Atrasadas */}
        <div className={`rounded-xl border p-3.5 shadow-xs ${stats.atrasadas > 0 ? 'border-rose-500/40 bg-rose-500/10' : 'border-border bg-card'}`}>
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-medium">Atrasadas</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${stats.atrasadas > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-foreground'}`}>
            {stats.atrasadas}
          </p>
          <span className={`text-[11px] ${stats.atrasadas > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-muted-foreground'}`}>
            {stats.atrasadas === 1 ? '1 devolução pendente' : `${stats.atrasadas} pendentes`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código de chave, imóvel, bairro ou responsável..."
            className="h-9 pl-9 pr-3 text-sm bg-card"
          />
        </div>

        {/* Abas de Filtro */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTab('todas')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'todas'
                ? 'bg-accent/15 text-accent font-semibold'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTab('disponivel')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'disponivel'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            No Claviculário ({stats.disponiveis})
          </button>
          <button
            type="button"
            onClick={() => setTab('fora')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'fora'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Em Uso ({stats.totalFora})
          </button>
          {stats.atrasadas > 0 && (
            <button
              type="button"
              onClick={() => setTab('atrasada')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                tab === 'atrasada'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              Atrasadas ({stats.atrasadas})
            </button>
          )}
        </div>
      </div>

      {/* Mobile View - Cards de Chaves */}
      <div className="space-y-3 md:hidden">
        {filtered.length > 0 ? (
          filtered.map((k) => (
            <div key={k.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-foreground">
                      {k.codigo}
                    </span>
                    <KeyStatusBadge
                      status={k.status}
                      isLate={k.currentMovement?.isLate}
                      responsibleName={k.currentMovement?.nomeResponsavel}
                      compact
                    />
                  </div>
                  <Link
                    href={`/dashboard/imoveis/${k.propertyId}`}
                    className="text-sm font-semibold text-foreground hover:underline line-clamp-1 mt-1 block"
                  >
                    {k.propertyTitle}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {k.propertyNeighborhood}, {k.propertyCity}/{k.propertyState}
                  </p>
                </div>
              </div>

              {k.localizacao && (
                <p className="text-xs text-muted-foreground border-t border-border/60 pt-2">
                  Posição: <span className="text-foreground">{k.localizacao}</span>
                </p>
              )}

              {/* Informações da Posse Atual */}
              {k.currentMovement && (
                <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Com:</span>
                    <span className="font-semibold text-foreground">
                      {k.currentMovement.nomeResponsavel} ({k.currentMovement.tipoResponsavel})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Saída:</span>
                    <span className="font-mono text-foreground">
                      {formatDateTimeBR(k.currentMovement.dataSaida)}
                    </span>
                  </div>
                  {k.currentMovement.previsaoRetorno && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Previsão:</span>
                      <span className={`font-mono ${k.currentMovement.isLate ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-foreground'}`}>
                        {formatDateTimeBR(k.currentMovement.previsaoRetorno)}
                      </span>
                    </div>
                  )}

                  {k.currentMovement.telefoneResponsavel && (
                    <div className="pt-1.5">
                      <KeyWhatsAppButton
                        phone={k.currentMovement.telefoneResponsavel}
                        responsibleName={k.currentMovement.nomeResponsavel}
                        propertyTitle={k.propertyTitle}
                        expectedAt={k.currentMovement.previsaoRetorno}
                        isLate={k.currentMovement.isLate}
                        className="w-full justify-center"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Ações Mobile */}
              {canEdit && (
                <div className="border-t border-border/60 pt-2 flex items-center gap-2">
                  {k.status === 'disponivel' ? (
                    <Button
                      size="sm"
                      onClick={() => setCheckoutTarget(k)}
                      className="w-full h-8 text-xs gap-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Registrar Saída
                    </Button>
                  ) : k.currentMovement ? (
                    <Button
                      size="sm"
                      onClick={() => setReturnTarget(k)}
                      className="w-full h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Dar Baixa / Devolver
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            Nenhuma chave encontrada com os filtros atuais.
          </div>
        )}
      </div>

      {/* Desktop View - Tabela do Claviculário */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Chave
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imóvel
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Localização Física
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Responsável Atual
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Previsão de Retorno
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações Rápidas
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((k) => (
                <TableRow key={k.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                  <TableCell className="font-mono font-bold text-sm text-foreground">
                    {k.codigo}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/imoveis/${k.propertyId}`}
                      className="font-medium text-sm text-foreground hover:underline line-clamp-1"
                    >
                      {k.propertyTitle}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {k.propertyNeighborhood}, {k.propertyCity}/{k.propertyState}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {k.localizacao || '—'}
                  </TableCell>
                  <TableCell>
                    <KeyStatusBadge
                      status={k.status}
                      isLate={k.currentMovement?.isLate}
                      responsibleName={k.currentMovement?.nomeResponsavel}
                    />
                  </TableCell>
                  <TableCell>
                    {k.currentMovement ? (
                      <div className="text-xs space-y-0.5">
                        <span className="font-semibold text-foreground block">
                          {k.currentMovement.nomeResponsavel}
                        </span>
                        <span className="text-muted-foreground text-[11px] capitalize block">
                          {k.currentMovement.tipoResponsavel === 'prestador'
                            ? 'Manutenção'
                            : k.currentMovement.tipoResponsavel}
                        </span>
                        {k.currentMovement.telefoneResponsavel && (
                          <div className="pt-0.5">
                            <KeyWhatsAppButton
                              phone={k.currentMovement.telefoneResponsavel}
                              responsibleName={k.currentMovement.nomeResponsavel}
                              propertyTitle={k.propertyTitle}
                              expectedAt={k.currentMovement.previsaoRetorno}
                              isLate={k.currentMovement.isLate}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No claviculário</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {k.currentMovement?.previsaoRetorno ? (
                      <span
                        className={
                          k.currentMovement.isLate
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : 'text-muted-foreground'
                        }
                      >
                        {formatDateTimeBR(k.currentMovement.previsaoRetorno)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {k.status === 'disponivel' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCheckoutTarget(k)}
                            className="h-8 text-xs gap-1"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span>Retirar</span>
                          </Button>
                        ) : k.currentMovement ? (
                          <Button
                            size="sm"
                            onClick={() => setReturnTarget(k)}
                            className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Devolver</span>
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                  Nenhuma chave encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Saída */}
      {checkoutTarget && (
        <KeyCheckoutDialog
          isOpen={Boolean(checkoutTarget)}
          onClose={() => setCheckoutTarget(null)}
          onSuccess={reloadKeys}
          keyId={checkoutTarget.id}
          propertyId={checkoutTarget.propertyId}
          keyCode={checkoutTarget.codigo}
          propertyTitle={checkoutTarget.propertyTitle}
        />
      )}

      {/* Modal de Devolução */}
      {returnTarget && returnTarget.currentMovement && (
        <KeyReturnDialog
          isOpen={Boolean(returnTarget)}
          onClose={() => setReturnTarget(null)}
          onSuccess={reloadKeys}
          movementId={returnTarget.currentMovement.id}
          keyCode={returnTarget.codigo}
          propertyTitle={returnTarget.propertyTitle}
          responsibleName={returnTarget.currentMovement.nomeResponsavel}
          dataSaida={returnTarget.currentMovement.dataSaida}
          previsaoRetorno={returnTarget.currentMovement.previsaoRetorno}
          isLate={returnTarget.currentMovement.isLate}
        />
      )}
    </div>
  )
}
