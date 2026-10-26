'use client'

import React, { useState, useEffect } from 'react'
import { X, UserCheck, Users, Wrench, Clock, Loader2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { KeyHolderType } from '@/lib/keys/types'

interface TeamMember {
  id: string
  nome: string
  email: string
  role: string
}

interface KeyCheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  keyId: string
  propertyId: string
  keyCode: string
  propertyTitle: string
}

export function KeyCheckoutDialog({
  isOpen,
  onClose,
  onSuccess,
  keyId,
  propertyId,
  keyCode,
  propertyTitle,
}: KeyCheckoutDialogProps) {
  const [tipoResponsavel, setTipoResponsavel] = useState<KeyHolderType>('consultor')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedConsultorId, setSelectedConsultorId] = useState('')
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('')
  const [documentoResponsavel, setDocumentoResponsavel] = useState('')
  const [motivo, setMotivo] = useState('')
  const [previsaoRetorno, setPrevisaoRetorno] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carrega membros da equipe quando o modal abre
  useEffect(() => {
    if (!isOpen) return
    async function loadTeam() {
      try {
        const res = await fetch('/api/dashboard/team')
        if (res.ok) {
          const data = await res.json()
          setTeamMembers(data.members || [])
          if (data.members?.length > 0 && !selectedConsultorId) {
            setSelectedConsultorId(data.members[0].id)
            setNomeResponsavel(data.members[0].nome)
          }
        }
      } catch (err) {
        console.error('Falha ao carregar equipe', err)
      }
    }
    loadTeam()
  }, [isOpen])

  // Fecha no Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Atalhos de previsão de retorno
  function applyTimePreset(hoursAhead: number) {
    const target = new Date(Date.now() + hoursAhead * 60 * 60 * 1000)
    // Formato local YYYY-MM-DDTHH:mm para input datetime-local
    const pad = (n: number) => String(n).padStart(2, '0')
    const formatted = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`
    setPrevisaoRetorno(formatted)
  }

  function applyEndOfDay() {
    const today = new Date()
    today.setHours(18, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    const formatted = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T18:00`
    setPrevisaoRetorno(formatted)
  }

  function handleConsultorChange(id: string) {
    setSelectedConsultorId(id)
    const member = teamMembers.find((m) => m.id === id)
    if (member) {
      setNomeResponsavel(member.nome)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const finalNome =
      tipoResponsavel === 'consultor'
        ? teamMembers.find((m) => m.id === selectedConsultorId)?.nome || nomeResponsavel
        : nomeResponsavel

    if (!finalNome.trim()) {
      setError('Por favor informe o nome do responsável pela chave')
      return
    }

    setLoading(true)
    try {
      const payload = {
        key_id: keyId,
        property_id: propertyId,
        tipo_responsavel: tipoResponsavel,
        consultor_id: tipoResponsavel === 'consultor' ? selectedConsultorId || null : null,
        nome_responsavel: finalNome.trim(),
        telefone_responsavel: telefoneResponsavel.trim() || null,
        documento_responsavel: documentoResponsavel.trim() || null,
        motivo: motivo.trim() || null,
        previsao_retorno: previsaoRetorno ? new Date(previsaoRetorno).toISOString() : null,
        observacoes_saida: observacoes.trim() || null,
      }

      const res = await fetch('/api/dashboard/keys/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao registrar saída da chave')
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('Erro de conexão ao salvar movimentação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Registrar Saída da Chave
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

          {/* Segmentos de Tipo de Responsável */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Quem está retirando a chave?</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setTipoResponsavel('consultor')
                  if (teamMembers.length > 0 && !selectedConsultorId) {
                    setSelectedConsultorId(teamMembers[0].id)
                    setNomeResponsavel(teamMembers[0].nome)
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                  tipoResponsavel === 'consultor'
                    ? 'border-accent bg-accent/10 text-accent shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Consultor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoResponsavel('cliente')
                  setNomeResponsavel('')
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                  tipoResponsavel === 'cliente'
                    ? 'border-accent bg-accent/10 text-accent shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoResponsavel('prestador')
                  setNomeResponsavel('')
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                  tipoResponsavel === 'prestador'
                    ? 'border-accent bg-accent/10 text-accent shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span>Prestador</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoResponsavel('outros')
                  setNomeResponsavel('')
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                  tipoResponsavel === 'outros'
                    ? 'border-accent bg-accent/10 text-accent shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Outros</span>
              </button>
            </div>
          </div>

          {/* Campos específicos conforme o tipo */}
          {tipoResponsavel === 'consultor' ? (
            <div className="space-y-1.5">
              <Label htmlFor="consultor-select" className="text-xs">
                Membro da Equipe / Consultor *
              </Label>
              <select
                id="consultor-select"
                value={selectedConsultorId}
                onChange={(e) => handleConsultorChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-input px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.nome} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nome-resp" className="text-xs">
                  {tipoResponsavel === 'cliente'
                    ? 'Nome Completo do Cliente *'
                    : tipoResponsavel === 'prestador'
                    ? 'Nome do Prestador / Empresa *'
                    : 'Nome do Responsável *'}
                </Label>
                <Input
                  id="nome-resp"
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tel-resp" className="text-xs">
                    Telefone / WhatsApp (para contato)
                  </Label>
                  <Input
                    id="tel-resp"
                    value={telefoneResponsavel}
                    onChange={(e) => setTelefoneResponsavel(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc-resp" className="text-xs">
                    Documento (CPF ou RG)
                  </Label>
                  <Input
                    id="doc-resp"
                    value={documentoResponsavel}
                    onChange={(e) => setDocumentoResponsavel(e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Motivo da saída */}
          <div className="space-y-1.5">
            <Label htmlFor="motivo" className="text-xs">
              Motivo da Saída
            </Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={
                tipoResponsavel === 'cliente'
                  ? 'Ex: Visita por conta para locação'
                  : tipoResponsavel === 'consultor'
                  ? 'Ex: Visita acompanhada com interessado'
                  : 'Ex: Reparo elétrico, pintura, vistoria'
              }
              className="h-9 text-sm"
            />
          </div>

          {/* Previsão de Devolução com atalhos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="previsao" className="text-xs">
                Previsão de Retorno da Chave
              </Label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTimePreset(1)}
                  className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  +1h
                </button>
                <button
                  type="button"
                  onClick={() => applyTimePreset(2)}
                  className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  +2h
                </button>
                <button
                  type="button"
                  onClick={applyEndOfDay}
                  className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  Hoje às 18h
                </button>
              </div>
            </div>
            <Input
              id="previsao"
              type="datetime-local"
              value={previsaoRetorno}
              onChange={(e) => setPrevisaoRetorno(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Observações adicionais */}
          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-xs">
              Observações (opcional)
            </Label>
            <textarea
              id="obs"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Pegou também controle do portão..."
              className="flex w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Retirada
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
