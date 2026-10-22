'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
} from 'lucide-react'
import type { LicenseStatusDetails } from '@/lib/licensing/service'

interface LicenseClientViewProps {
  initialDetails: LicenseStatusDetails
  userRole: 'imobiliaria_owner' | 'imobiliaria_user'
}

export function LicenseClientView({ initialDetails, userRole }: LicenseClientViewProps) {
  const [details, setDetails] = useState<LicenseStatusDetails>(initialDetails)
  const [activationCode, setActivationCode] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const isOwner = userRole === 'imobiliaria_owner'

  function copyInstallationId() {
    if (!details.installationId) return
    navigator.clipboard.writeText(details.installationId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  function formatDate(isoString: string | null): string {
    if (!isoString) return 'Não definida'
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(date)
    } catch {
      return isoString
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activationCode.trim() || !isOwner) return

    // Se já possui uma licença ativa, solicita confirmação para não sobrescrever acidentalmente
    if (details.status === 'active') {
      setShowConfirmOverwrite(true)
      return
    }

    executeActivation()
  }

  async function executeActivation() {
    setIsActivating(true)
    setFeedback({ type: null, message: '' })
    setShowConfirmOverwrite(false)

    try {
      const res = await fetch('/api/dashboard/licensing/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationCode: activationCode.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao ativar código')
      }

      setFeedback({
        type: 'success',
        message: data.message || 'Licença ativada com sucesso! O sistema está regularizado.',
      })
      setActivationCode('')

      // Recarrega o status atualizado
      const refreshRes = await fetch('/api/dashboard/licensing')
      if (refreshRes.ok) {
        const updated = await refreshRes.json()
        setDetails(updated)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao processar ativação',
      })
    } finally {
      setIsActivating(false)
    }
  }

  async function handleSync() {
    if (!isOwner) return

    setIsSyncing(true)
    setFeedback({ type: null, message: '' })

    try {
      const res = await fetch('/api/dashboard/licensing/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Falha na checagem de licença')
      }

      setFeedback({
        type: 'success',
        message: 'Licença sincronizada com sucesso! Vigência renovada com o servidor.',
      })

      // Recarrega o status atualizado
      const refreshRes = await fetch('/api/dashboard/licensing')
      if (refreshRes.ok) {
        const updated = await refreshRes.json()
        setDetails(updated)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao sincronizar',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Definições visuais por status
  const statusConfig = {
    active: {
      label: 'Licença Ativa',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      icon: ShieldCheck,
      iconColor: 'text-emerald-500',
      description: 'Instalação regularizada e autorizada para operação completa.',
    },
    inactive: {
      label: 'Aguardando Ativação',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      dotClass: 'bg-amber-500',
      icon: ShieldAlert,
      iconColor: 'text-amber-500',
      description: 'A instalação necessita de um código de ativação para liberar a vitrine pública.',
    },
    suspended: {
      label: 'Suspensa Comercial',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dotClass: 'bg-rose-500',
      icon: AlertTriangle,
      iconColor: 'text-rose-500',
      description: 'Acesso suspenso por pendência comercial. O painel opera em modo de leitura e exportação.',
    },
    expired: {
      label: 'Licença Expirada',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dotClass: 'bg-rose-500',
      icon: Clock,
      iconColor: 'text-rose-500',
      description: 'O período da licença expirou. Faça uma sincronização ou insira um novo código.',
    },
    unavailable: {
      label: 'Indisponível',
      badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
      dotClass: 'bg-slate-400',
      icon: AlertTriangle,
      iconColor: 'text-slate-400',
      description: 'Estado da licença não pôde ser lido no momento.',
    },
  }[details.status]

  const StatusIcon = statusConfig.icon

  // Cor da barra de validade
  const progressColor =
    details.validityPercentage > 30
      ? 'bg-emerald-500'
      : details.validityPercentage > 15
        ? 'bg-amber-500'
        : 'bg-rose-500'

  return (
    <div className="space-y-8">
      {/* Feedback banner */}
      {feedback.type && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm transition-all duration-200 animate-in fade-in ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{feedback.type === 'success' ? 'Sucesso' : 'Atenção'}</p>
            <p className="mt-0.5">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: null, message: '' })}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid Principal: Status & Tempo Restante + Recursos */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card Principal: Status e Tempo Restante (ocupa 2 colunas) */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <StatusIcon className={`h-6 w-6 ${statusConfig.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Estado do Licenciamento</h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass} animate-pulse`} />
                    {statusConfig.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{statusConfig.description}</p>
              </div>
            </div>

            {/* Botão de sincronização manual */}
            {isOwner && (
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing || details.status === 'inactive'}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                title="Checar licença com o servidor central"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Verificar Licença Agora'}</span>
              </button>
            )}
          </div>

          {/* Destaque do Tempo Restante */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tempo Restante
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {details.remainingFormatted}
                </p>
              </div>
              {details.expiresAt && (
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Ciclo atual de validação:</span>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {details.validityPercentage}% restante
                  </p>
                </div>
              )}
            </div>

            {/* Barra de Progresso Visual */}
            {details.expiresAt && (
              <div className="space-y-1.5">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${details.validityPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  O sistema renova a validade automaticamente.
                </p>
              </div>
            )}

            {/* Metadados Técnicos da Instalação */}
            <div className="mt-6 grid gap-4 rounded-lg bg-secondary/40 p-4 text-xs sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Data de Expiração do Token:</span>
                <p className="mt-0.5 font-medium text-foreground">{formatDate(details.expiresAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Última Sincronização:</span>
                <p className="mt-0.5 font-medium text-foreground">{formatDate(details.lastHeartbeatAt)}</p>
              </div>
              {details.contractPaidThrough && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Contrato vigente até:</span>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {new Intl.DateTimeFormat('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    }).format(new Date(`${details.contractPaidThrough}T00:00:00.000Z`))}
                  </p>
                </div>
              )}
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">ID da Instalação:</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-background px-2 py-1 font-mono text-[11px] text-foreground border border-border/60 break-all">
                    {details.installationId || 'Não gerado ainda'}
                  </code>
                  {details.installationId && (
                    <button
                      type="button"
                      onClick={copyInstallationId}
                      className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                      title="Copiar ID da Instalação"
                    >
                      {copiedId ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Lateral: Funcionalidades Contratadas */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Server className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">Recursos do Pacote</h3>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Módulos incluídos:
            </p>

            <ul className="mt-4 space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    details.active ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                />
                <div>
                  <span className="font-medium text-foreground">Vitrine Pública</span>
                  <p className="text-[11px] text-muted-foreground">Busca, catálogo e detalhes de imóveis</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    details.active ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                />
                <div>
                  <span className="font-medium text-foreground">Painel de Imóveis</span>
                  <p className="text-[11px] text-muted-foreground">Cadastro, imagens e preços de venda/locação</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    details.active ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                />
                <div>
                  <span className="font-medium text-foreground">CRM de Leads</span>
                  <p className="text-[11px] text-muted-foreground">Formulário protegido e gestão de contatos</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    details.active ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                />
                <div>
                  <span className="font-medium text-foreground">Soberania de Dados</span>
                  <p className="text-[11px] text-muted-foreground">Exportação JSON completa de imóveis e leads</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Card de Ativação / Inserção de Código */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Ativação ou Renovação da Licença</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Informe o código de ativação fornecido pela Pepius.
            </p>
          </div>
        </div>

        {!isOwner ? (
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-secondary/50 p-4 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 text-accent" />
            <p>
              Você está autenticado como corretor/equipe. Apenas o responsável legal da imobiliária (role{' '}
              <code className="font-mono font-semibold text-foreground">owner</code>) pode submeter códigos
              de ativação.
            </p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="activationCode" className="block text-xs font-semibold text-foreground">
                Código de Ativação da Instalação
              </label>
              <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
                <input
                  id="activationCode"
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="Cole o código de ativação fornecido pela Pepius"
                  disabled={isActivating}
                  className="flex-1 rounded-lg border border-input bg-background px-3.5 py-2.5 font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={isActivating || !activationCode.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isActivating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Validando Código...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Ativar Instalação</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                O código de ativação é de uso único.
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Modal de Confirmação para Substituir Licença Ativa */}
      {showConfirmOverwrite && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-overwrite-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => !isActivating && setShowConfirmOverwrite(false)}
          />

          {/* Card do Diálogo */}
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl transition-all animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 id="confirm-overwrite-title" className="text-base font-semibold text-foreground">
                  Substituir licença vigente?
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Esta instalação já possui uma licença ativa e operacional. Ao prosseguir, a autorização e chave
                  vigentes serão substituídas pelo novo código informado.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmOverwrite(false)}
                disabled={isActivating}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeActivation}
                disabled={isActivating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isActivating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Substituindo...</span>
                  </>
                ) : (
                  <span>Sim, Substituir Licença</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
