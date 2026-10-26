'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  KeyRound,
  Edit2,
  Check,
  Plus,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KeyStatusBadge } from './key-status-badge'
import { KeyCheckoutDialog } from './key-checkout-dialog'
import { KeyReturnDialog } from './key-return-dialog'
import { KeyWhatsAppButton } from './key-whatsapp-button'
import { formatDateTimeBR } from '@/lib/keys/whatsapp'
import type { PropertyKey, KeyMovement } from '@/lib/keys/types'

interface CurrentMovementState extends KeyMovement {
  isLate?: boolean
  minutesLate?: number
}

interface PropertyKeyPanelProps {
  propertyId: string
  propertyTitle: string
  canEdit?: boolean
}

export function PropertyKeyPanel({
  propertyId,
  propertyTitle,
  canEdit = true,
}: PropertyKeyPanelProps) {
  const [key, setKey] = useState<PropertyKey | null>(null)
  const [currentMovement, setCurrentMovement] = useState<CurrentMovementState | null>(null)
  const [history, setHistory] = useState<KeyMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Form states para o código/localização da chave
  const [codigo, setCodigo] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [keyError, setKeyError] = useState<string | null>(null)

  // Dialogs de checkout e devolução
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  const fetchKeyData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const res = await fetch(`/api/dashboard/properties/${propertyId}/key`)
      if (res.ok) {
        const data = await res.json()
        setKey(data.key)
        setCurrentMovement(data.currentMovement)
        setHistory(data.history || [])
        if (data.key) {
          setCodigo(data.key.codigo)
          setLocalizacao(data.key.localizacao || '')
        }
      }
    } catch (err) {
      console.error('Falha ao carregar chave do imóvel', err)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchKeyData(false)
    })
  }, [fetchKeyData])

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault()
    setKeyError(null)

    if (!codigo.trim()) {
      setKeyError('Informe o código da chave (ex: CH-101 ou Gancho 12)')
      return
    }

    setSavingKey(true)
    try {
      const res = await fetch(`/api/dashboard/properties/${propertyId}/key`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: codigo.trim(),
          localizacao: localizacao.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setKeyError(data.error || 'Erro ao salvar chave')
        return
      }

      setKey(data.key)
      setEditingCode(false)
      fetchKeyData()
    } catch {
      setKeyError('Erro de conexão ao salvar chave')
    } finally {
      setSavingKey(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando dados do claviculário...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header do Card */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">
              Controle de Chaves & Claviculário
            </h3>
            <p className="text-xs text-muted-foreground">
              Alocação física, registro de saídas para visitas e auditoria
            </p>
          </div>
        </div>

        {key && (
          <div className="flex items-center gap-2">
            <KeyStatusBadge
              status={key.status}
              codigo={key.codigo}
              isLate={currentMovement?.isLate}
              responsibleName={currentMovement?.nome_responsavel}
            />
          </div>
        )}
      </div>

      {/* Cenário 1: Chave ainda não cadastrada */}
      {!key && !editingCode ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-secondary/20 p-5 text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Este imóvel ainda não possui identificação de chave/claviculário cadastrada.
          </p>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingCode(true)}
              className="gap-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Identificar Chave no Claviculário
            </Button>
          )}
        </div>
      ) : null}

      {/* Formulário de Edição do Código / Localização da Chave */}
      {editingCode && (
        <form onSubmit={handleSaveKey} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-foreground">
            {key ? 'Alterar Identificação da Chave' : 'Cadastrar Chave no Claviculário'}
          </h4>

          {keyError && (
            <p className="text-xs text-destructive font-medium">{keyError}</p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="key-code" className="text-xs font-medium text-foreground">
                Código ou Número da Chave *
              </label>
              <Input
                id="key-code"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: CH-104, Gancho 12, Gaveta 2"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="key-loc" className="text-xs font-medium text-foreground">
                Posição física no claviculário
              </label>
              <Input
                id="key-loc"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Armário principal, 2ª fileira"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingCode(false)
                if (key) {
                  setCodigo(key.codigo)
                  setLocalizacao(key.localizacao || '')
                }
              }}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={savingKey} className="h-8 text-xs gap-1.5">
              {savingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salvar Chave
            </Button>
          </div>
        </form>
      )}

      {/* Cenário 2: Chave já cadastrada */}
      {key && !editingCode && (
        <div className="space-y-4">
          {/* Card de Informações da Chave e Ações Rápidas */}
          <div className="rounded-lg border border-border bg-secondary/15 p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-foreground">
                    Chave {key.codigo}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditingCode(true)}
                      title="Editar código ou localização física da chave"
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {key.localizacao && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Localização: <span className="text-foreground">{key.localizacao}</span>
                  </p>
                )}
              </div>

              {/* Botões de Ação */}
              {canEdit && (
                <div className="flex items-center gap-2">
                  {key.status === 'disponivel' ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setCheckoutOpen(true)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Registrar Saída da Chave
                    </Button>
                  ) : currentMovement ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setReturnOpen(true)}
                      className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Dar Baixa / Devolver
                    </Button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Detalhes da Posse Atual (quando a chave estiver fora) */}
            {currentMovement && (
              <div className="mt-3 rounded-md border border-border bg-card p-3 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Em posse de:</span>
                    <span className="font-semibold text-foreground">
                      {currentMovement.nome_responsavel}
                    </span>
                    <span className="capitalize text-muted-foreground">
                      ({currentMovement.tipo_responsavel === 'prestador' ? 'manutenção' : currentMovement.tipo_responsavel})
                    </span>
                  </div>

                  {currentMovement.telefone_responsavel && (
                    <KeyWhatsAppButton
                      phone={currentMovement.telefone_responsavel}
                      responsibleName={currentMovement.nome_responsavel}
                      propertyTitle={propertyTitle}
                      expectedAt={currentMovement.previsao_retorno}
                      isLate={currentMovement.isLate}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div>
                    <span>Saída: </span>
                    <span className="font-mono text-foreground font-medium">
                      {formatDateTimeBR(currentMovement.data_saida)}
                    </span>
                  </div>

                  {currentMovement.previsao_retorno && (
                    <div>
                      <span>Previsão de Retorno: </span>
                      <span className={`font-mono font-medium ${currentMovement.isLate ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-foreground'}`}>
                        {formatDateTimeBR(currentMovement.previsao_retorno)}
                      </span>
                    </div>
                  )}

                  {currentMovement.motivo && (
                    <div className="sm:col-span-2">
                      <span>Motivo: </span>
                      <span className="text-foreground">{currentMovement.motivo}</span>
                    </div>
                  )}

                  {currentMovement.observacoes_saida && (
                    <div className="sm:col-span-2">
                      <span>Observações: </span>
                      <span className="text-foreground">{currentMovement.observacoes_saida}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Histórico Retrátil de Movimentações */}
          <div className="border-t border-border/80 pt-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center justify-between py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                <span>Histórico de Movimentações ({history.length})</span>
              </div>
              {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Nenhuma movimentação registrada para esta chave até o momento.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-secondary/50 text-muted-foreground">
                        <tr>
                          <th className="p-2.5 font-medium">Responsável</th>
                          <th className="p-2.5 font-medium">Tipo</th>
                          <th className="p-2.5 font-medium">Data Saída</th>
                          <th className="p-2.5 font-medium">Devolução</th>
                          <th className="p-2.5 font-medium">Motivo / Obs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {history.map((mov) => (
                          <tr key={mov.id} className="hover:bg-secondary/20">
                            <td className="p-2.5 font-medium text-foreground">
                              {mov.nome_responsavel}
                              {mov.telefone_responsavel && (
                                <span className="block text-[10px] text-muted-foreground font-mono">
                                  {mov.telefone_responsavel}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 capitalize text-muted-foreground">
                              {mov.tipo_responsavel === 'prestador' ? 'Manutenção' : mov.tipo_responsavel}
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">
                              {formatDateTimeBR(mov.data_saida)}
                            </td>
                            <td className="p-2.5 font-mono whitespace-nowrap">
                              {mov.data_devolucao ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  {formatDateTimeBR(mov.data_devolucao)}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                  Em Aberto
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-muted-foreground max-w-xs truncate">
                              {mov.motivo || mov.observacoes_devolucao || mov.observacoes_saida || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Saída */}
      {key && (
        <KeyCheckoutDialog
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={fetchKeyData}
          keyId={key.id}
          propertyId={propertyId}
          keyCode={key.codigo}
          propertyTitle={propertyTitle}
        />
      )}

      {/* Modal de Devolução */}
      {key && currentMovement && (
        <KeyReturnDialog
          isOpen={returnOpen}
          onClose={() => setReturnOpen(false)}
          onSuccess={fetchKeyData}
          movementId={currentMovement.id}
          keyCode={key.codigo}
          propertyTitle={propertyTitle}
          responsibleName={currentMovement.nome_responsavel}
          dataSaida={currentMovement.data_saida}
          previsaoRetorno={currentMovement.previsao_retorno}
          isLate={currentMovement.isLate}
        />
      )}
    </div>
  )
}
