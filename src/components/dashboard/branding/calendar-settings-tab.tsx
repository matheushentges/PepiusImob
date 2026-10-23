'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Unlink,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CalendarSettingsInput, OperatingHoursInput } from '@/lib/calendar/validation'

interface CalendarSettingsResponse extends CalendarSettingsInput {
  connected: boolean
  connected_email: string | null
  has_client_secret: boolean
  has_env_credentials: boolean
  can_edit: boolean
}

const defaultOperatingHours: OperatingHoursInput = {
  monday: { enabled: true, start: '09:00', end: '18:00' },
  tuesday: { enabled: true, start: '09:00', end: '18:00' },
  wednesday: { enabled: true, start: '09:00', end: '18:00' },
  thursday: { enabled: true, start: '09:00', end: '18:00' },
  friday: { enabled: true, start: '09:00', end: '18:00' },
  saturday: { enabled: true, start: '09:00', end: '13:00' },
  sunday: { enabled: false, start: '09:00', end: '13:00' },
}

const dayLabels: Record<keyof OperatingHoursInput, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export function CalendarSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [enabled, setEnabled] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [calendarId, setCalendarId] = useState('primary')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [hasClientSecret, setHasClientSecret] = useState(false)
  const [hasEnvCredentials, setHasEnvCredentials] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  const [visitDuration, setVisitDuration] = useState<number>(45)
  const [bufferMinutes, setBufferMinutes] = useState<number>(15)
  const [minNoticeHours, setMinNoticeHours] = useState<number>(2)
  const [maxDaysAhead, setMaxDaysAhead] = useState<number>(30)
  const [operatingHours, setOperatingHours] = useState<OperatingHoursInput>(defaultOperatingHours)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/dashboard/calendar/settings', { cache: 'no-store' })
        if (!res.ok) throw new Error('Não foi possível carregar as configurações da agenda')
        const data: CalendarSettingsResponse = await res.json()

        setEnabled(data.enabled)
        setConnected(data.connected)
        setConnectedEmail(data.connected_email)
        setCalendarId(data.google_calendar_id || 'primary')
        setClientId(data.google_client_id || '')
        setHasClientSecret(data.has_client_secret)
        setHasEnvCredentials(data.has_env_credentials)
        setCanEdit(data.can_edit)
        setVisitDuration(data.visit_duration_minutes)
        setBufferMinutes(data.buffer_minutes)
        setMinNoticeHours(data.min_notice_hours)
        setMaxDaysAhead(data.max_days_ahead)
        if (data.operating_hours) {
          setOperatingHours(data.operating_hours)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function updateDaySchedule(day: keyof OperatingHoursInput, key: 'enabled' | 'start' | 'end', value: unknown) {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [key]: value,
      },
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canEdit || saving) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload: CalendarSettingsInput = {
        enabled,
        google_client_id: clientId.trim(),
        google_client_secret: clientSecret.trim(),
        google_calendar_id: calendarId.trim() || 'primary',
        visit_duration_minutes: visitDuration as 15 | 30 | 45 | 60 | 90 | 120,
        buffer_minutes: bufferMinutes as 0 | 10 | 15 | 30 | 45 | 60,
        min_notice_hours: minNoticeHours,
        max_days_ahead: maxDaysAhead,
        operating_hours: operatingHours,
      }

      const res = await fetch('/api/dashboard/calendar/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configurações')

      setSuccess('Configurações de agendamento salvas com sucesso!')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Deseja realmente desconectar a conta do Google Agenda? O agendamento online será desativado na vitrine.')) {
      return
    }

    setDisconnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/calendar/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Não foi possível desconectar a conta')
      setConnected(false)
      setConnectedEmail(null)
      setEnabled(false)
      setSuccess('Conta do Google Agenda desconectada.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Bloco 1: Conexão com Google Agenda */}
      <section className="rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">Google Agenda de Visitas</h2>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Sincronize visitas diretamente na agenda Google da sua equipe em tempo real.
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto">
            <span className="text-sm font-medium text-text-primary">
              Agendamento na vitrine:
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              disabled={!canEdit || !connected}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-border-default peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent peer-disabled:opacity-50"></div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enabled ? 'bg-success/15 text-success' : 'bg-surface-sunken text-text-tertiary'}`}>
              {enabled ? 'Ativo' : 'Pausado'}
            </span>
          </label>
        </div>

        <div className="mt-6">
          {connected ? (
            <div className="rounded-lg border border-success/30 bg-success/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">Google Agenda Conectada</span>
                    <span className="inline-flex items-center rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                      Sincronizando
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Conta: <strong className="text-text-primary">{connectedEmail || 'Conta Google Autorizada'}</strong> • Agenda: {calendarId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting || !canEdit}
                  className="text-xs text-error hover:bg-error/10 border-error/30"
                >
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Unlink className="h-3.5 w-3.5 mr-1" />}
                  Desconectar
                </Button>
                <a
                  href="/api/dashboard/calendar/auth"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-raised transition-colors"
                >
                  Reconectar <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-default bg-surface-sunken p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-text-primary">Conecte sua Agenda</h3>
              <p className="mt-1 text-sm text-text-secondary max-w-md mx-auto">
                Conecte a conta do Google da imobiliária para que o sistema consulte horários livres e insira as visitas automaticamente.
              </p>
              <div className="mt-5">
                <a
                  href="/api/dashboard/calendar/auth"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors"
                >
                  <CalendarDays className="h-4 w-4" />
                  Conectar com o Google Agenda
                </a>
              </div>
              {!hasEnvCredentials && !clientId && (
                <p className="mt-3 text-xs text-text-tertiary">
                  💡 Necessário preencher o Client ID do Google Cloud abaixo caso não utilize variáveis de ambiente.
                </p>
              )}
            </div>
          )}

          {/* Configurações Avançadas */}
          <div className="mt-4 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
            >
              <span>Configurações avançadas de chaves e ID de agenda</span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-lg bg-surface-sunken p-4 border border-border-subtle">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="google-client-id" className="text-xs">Google OAuth Client ID</Label>
                    <Input
                      id="google-client-id"
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      placeholder={hasEnvCredentials ? 'Configurado no arquivo .env' : 'xxxx.apps.googleusercontent.com'}
                      disabled={!canEdit}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="google-client-secret" className="text-xs">Google OAuth Client Secret</Label>
                    <Input
                      id="google-client-secret"
                      type="password"
                      value={clientSecret}
                      onChange={e => setClientSecret(e.target.value)}
                      placeholder={hasClientSecret || hasEnvCredentials ? '••••••••••••••••' : 'Chave privada do Google'}
                      disabled={!canEdit}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="google-calendar-id" className="text-xs">ID da Agenda Google (padrão: primary)</Label>
                  <Input
                    id="google-calendar-id"
                    value={calendarId}
                    onChange={e => setCalendarId(e.target.value)}
                    placeholder="primary ou ID de agenda secundária"
                    disabled={!canEdit}
                    className="text-xs max-w-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bloco 2: Regras e Janelas de Visita */}
      <section className="rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">Janelas e Tempo da Visita</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Defina o tempo de atendimento e o intervalo para que seus corretores não fiquem sobrecarregados.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="visit-duration" className="text-sm font-medium text-text-primary">
              Duração da Visita
            </Label>
            <select
              id="visit-duration"
              value={visitDuration}
              onChange={e => setVisitDuration(Number(e.target.value))}
              disabled={!canEdit}
              className="flex h-10 w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value={15}>15 minutos (Visita rápida)</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos (Recomendado)</option>
              <option value={60}>60 minutos (1 hora)</option>
              <option value={90}>90 minutos (1h 30m)</option>
              <option value={120}>120 minutos (2 horas)</option>
            </select>
            <p className="text-xs text-text-tertiary">
              Tempo reservado no imóvel e bloqueado no Google Calendar para cada cliente.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buffer-minutes" className="text-sm font-medium text-text-primary">
              Intervalo de Deslocamento (Buffer)
            </Label>
            <select
              id="buffer-minutes"
              value={bufferMinutes}
              onChange={e => setBufferMinutes(Number(e.target.value))}
              disabled={!canEdit}
              className="flex h-10 w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value={0}>Sem intervalo</option>
              <option value={10}>10 minutos</option>
              <option value={15}>15 minutos (Recomendado)</option>
              <option value={30}>30 minutos (Cidades com trânsito)</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
            <p className="text-xs text-text-tertiary">
              Tempo adicional adicionado após a visita para viagem do corretor até o próximo compromisso.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-notice" className="text-sm font-medium text-text-primary">
              Antecedência Mínima
            </Label>
            <select
              id="min-notice"
              value={minNoticeHours}
              onChange={e => setMinNoticeHours(Number(e.target.value))}
              disabled={!canEdit}
              className="flex h-10 w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value={0}>Imediato (Sem antecedência)</option>
              <option value={1}>1 hora antes</option>
              <option value={2}>2 horas antes (Recomendado)</option>
              <option value={4}>4 horas antes</option>
              <option value={12}>12 horas antes</option>
              <option value={24}>24 horas antes (1 dia útil)</option>
              <option value={48}>48 horas antes (2 dias)</option>
            </select>
            <p className="text-xs text-text-tertiary">
              Impede que clientes façam reservas de última hora sem aviso prévio.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-days" className="text-sm font-medium text-text-primary">
              Janela Máxima de Agendamento
            </Label>
            <select
              id="max-days"
              value={maxDaysAhead}
              onChange={e => setMaxDaysAhead(Number(e.target.value))}
              disabled={!canEdit}
              className="flex h-10 w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value={7}>Próximos 7 dias</option>
              <option value={14}>Próximos 14 dias (2 semanas)</option>
              <option value={30}>Próximos 30 dias (1 mês - Recomendado)</option>
              <option value={60}>Próximos 60 dias (2 meses)</option>
              <option value={90}>Próximos 90 dias (3 meses)</option>
            </select>
            <p className="text-xs text-text-tertiary">
              Até quantos dias no futuro o calendário público permitirá novas reservas.
            </p>
          </div>
        </div>
      </section>

      {/* Bloco 3: Grade Semanal de Atendimento */}
      <section className="rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">Grade Semanal de Atendimento</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Determine em quais dias da semana e horários a sua imobiliária realiza visitas a imóveis.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {(Object.keys(operatingHours) as Array<keyof OperatingHoursInput>).map(day => {
            const schedule = operatingHours[day]
            return (
              <div
                key={day}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors ${schedule.enabled ? 'border-border-default bg-surface' : 'border-border-subtle bg-surface-sunken opacity-60'}`}
              >
                <label className="flex items-center gap-3 cursor-pointer min-w-[180px]">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={e => updateDaySchedule(day, 'enabled', e.target.checked)}
                    disabled={!canEdit}
                    className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
                  />
                  <span className={`text-sm font-medium ${schedule.enabled ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {dayLabels[day]}
                  </span>
                </label>

                {schedule.enabled ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">Das</span>
                    <input
                      type="time"
                      value={schedule.start}
                      onChange={e => updateDaySchedule(day, 'start', e.target.value)}
                      disabled={!canEdit}
                      className="h-8 rounded border border-border-default bg-surface-raised px-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                    <span className="text-xs text-text-tertiary">às</span>
                    <input
                      type="time"
                      value={schedule.end}
                      onChange={e => updateDaySchedule(day, 'end', e.target.value)}
                      disabled={!canEdit}
                      className="h-8 rounded border border-border-default bg-surface-raised px-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-text-tertiary italic">Não há atendimento para visitas neste dia</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 rounded-lg bg-accent/5 border border-accent/20 p-4 text-xs text-text-secondary">
          💡 <strong>Como funciona na prática:</strong> Com visitas de <strong>{visitDuration} minutos</strong> e intervalo de <strong>{bufferMinutes} minutos</strong>, o sistema gerará horários livres a cada {visitDuration + bufferMinutes} minutos durante sua jornada diária, pulando automaticamente qualquer compromisso pessoal já existente no seu Google Calendar.
        </div>
      </section>

      {/* Ações */}
      {canEdit && (
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent/90 text-white min-w-[160px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}
