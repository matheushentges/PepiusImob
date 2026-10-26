'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatDateTimeBR } from '@/lib/keys/whatsapp'

interface KeyReturnDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  movementId: string
  keyCode: string
  propertyTitle: string
  responsibleName: string
  dataSaida: string
  previsaoRetorno?: string | null
  isLate?: boolean
}

export function KeyReturnDialog({
  isOpen,
  onClose,
  onSuccess,
  movementId,
  keyCode,
  propertyTitle,
  responsibleName,
  dataSaida,
  previsaoRetorno,
  isLate = false,
}: KeyReturnDialogProps) {
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/dashboard/keys/movements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movement_id: movementId,
          observacoes_devolucao: observacoes.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao dar baixa na devolução')
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('Erro de conexão ao registrar devolução')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Confirmar Devolução
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-mono font-semibold text-foreground">Chave {keyCode}</span> • {propertyTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          {/* Resumo da saída */}
          <div className="rounded-lg border border-border bg-secondary/40 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Responsável atual:</span>
              <span className="font-semibold text-foreground">{responsibleName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retirada em:</span>
              <span className="font-mono text-foreground">{formatDateTimeBR(dataSaida)}</span>
            </div>
            {previsaoRetorno && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Previsão combinada:</span>
                <span className={`font-mono font-semibold ${isLate ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                  {formatDateTimeBR(previsaoRetorno)}
                </span>
              </div>
            )}
            {isLate && (
              <div className="flex items-center gap-1.5 pt-1 text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Esta chave estava com retorno em atraso.</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs-dev" className="text-xs">
              Observações da devolução (opcional)
            </Label>
            <textarea
              id="obs-dev"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Devolvida em perfeito estado no claviculário..."
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-2xs transition-all placeholder:text-muted-foreground hover:border-border-strong focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Dar Baixa no Claviculário
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
