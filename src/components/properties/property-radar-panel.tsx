'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientRoleBadge } from '@/components/clients/client-role-badge'
import type { ReverseClientMatchResult } from '@/lib/clients/types'

interface PropertyRadarPanelProps {
  propertyId: string
  propertyTitle: string
  canEdit?: boolean
  initialAutoOpen?: boolean
}

export function PropertyRadarPanel({
  propertyId,
  propertyTitle,
  initialAutoOpen = false,
}: PropertyRadarPanelProps) {
  const [matches, setMatches] = useState<ReverseClientMatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showCelebrationModal, setShowCelebrationModal] = useState(initialAutoOpen)

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/properties/${propertyId}/matching-clients`)
      if (!res.ok) {
        throw new Error('Falha ao carregar oportunidades do Radar')
      }
      const data = await res.json()
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar Radar')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const res = await fetch(`/api/dashboard/properties/${propertyId}/matching-clients`)
        if (!res.ok) {
          throw new Error('Falha ao carregar oportunidades do Radar')
        }
        const data = await res.json()
        if (!ignore) {
          setMatches(data.matches || [])
          if (initialAutoOpen && (data.matches || []).length > 0) {
            setShowCelebrationModal(true)
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Erro ao consultar Radar')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [propertyId, initialAutoOpen])

  return (
    <div className="rounded-xl border border-accent/30 bg-card p-4 sm:p-6 shadow-2xs space-y-4">
      {/* Header do Radar Reverso */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-foreground">
                Radar Reverso de Oportunidades
              </h3>
              {!loading && (
                <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                  {matches.length} {matches.length === 1 ? 'cliente compatível' : 'clientes compatíveis'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Compradores e locatários da sua carteira cujo perfil de busca coincide com este imóvel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Atualizar Radar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      {isExpanded && (
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Calculando afinidade com clientes da imobiliária...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-secondary/15 p-6 text-center space-y-2">
              <Sparkles className="h-6 w-6 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm font-medium text-foreground">
                Nenhum cliente cadastrado no CRM busca este perfil no momento
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Quando novos compradores ou locatários forem cadastrados com preferências de valor, bairro ou tipo compatíveis, eles aparecerão aqui automaticamente.
              </p>
              <div className="pt-2">
                <Link href="/dashboard/clientes">
                  <Button variant="outline" size="sm" className="text-xs">
                    Ir para Gestão de Clientes
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {matches.map((client) => {
                const scoreBg =
                  client.matchScore >= 80
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : client.matchScore >= 60
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20'

                return (
                  <div
                    key={client.clientId}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/50 p-3.5 space-y-3 hover:border-accent/40 transition-colors shadow-2xs"
                  >
                    <div>
                      {/* Topo do Card de Cliente */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/clientes/${client.clientId}`}
                            className="font-semibold text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1.5 group"
                          >
                            <span className="truncate">{client.nome}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                          {client.corretorNome && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3" />
                              Corretor: {client.corretorNome}
                            </p>
                          )}
                        </div>

                        <div
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${scoreBg}`}
                        >
                          {client.matchScore}% Match
                        </div>
                      </div>

                      {/* Badges de Papel */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {client.papeis.map((role) => (
                          <ClientRoleBadge key={role} role={role} />
                        ))}
                      </div>

                      {/* Motivos da Afinidade */}
                      <div className="mt-2.5 space-y-1">
                        {client.matchReasons.map((reason, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      {client.whatsappUrl ? (
                        <a
                          href={client.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button
                            size="sm"
                            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-2xs"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Avisar no WhatsApp
                          </Button>
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic flex-1">
                          Sem telefone válido
                        </span>
                      )}

                      <Link href={`/dashboard/clientes/${client.clientId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          title="Abrir Perfil Completo"
                        >
                          Ficha 360º
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal / Dialog de Alerta Ativo (Ex: após cadastro de novo imóvel) */}
      {showCelebrationModal && matches.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-lg rounded-2xl border border-accent/40 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-bold text-base text-foreground">
                  Oportunidades Imediatas Detectadas!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-foreground">
                O imóvel <strong>&ldquo;{propertyTitle}&rdquo;</strong> possui{' '}
                <strong className="text-accent">{matches.length} clientes compatíveis</strong>{' '}
                cadastrados no seu CRM!
              </p>
              <p className="text-xs text-muted-foreground">
                Acelere a negociação enviando a ficha agora mesmo no WhatsApp dos clientes mais quentes:
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {matches.slice(0, 3).map((client) => (
                <div
                  key={client.clientId}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/20 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-foreground truncate">{client.nome}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {client.matchScore}% de compatibilidade
                    </p>
                  </div>
                  {client.whatsappUrl && (
                    <a
                      href={client.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Disparar
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCelebrationModal(false)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
