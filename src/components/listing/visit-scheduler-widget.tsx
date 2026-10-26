'use client'

import { useState, useEffect, useId } from 'react'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContactForm } from '@/components/listing/contact-form'
import { getNextOperatingDays, type BusinessDayItem } from '@/lib/calendar/slot-calculator'

interface SlotItem {
  time: string
  startsAt: string
  endsAt: string
  formatted: string
}

interface VisitSchedulerWidgetProps {
  listingId: string
  listingTitle: string
  listingCode?: string
  agencyPhone?: string
  agencyName?: string
}

export function VisitSchedulerWidget({
  listingId,
  listingTitle,
  listingCode,
  agencyPhone,
  agencyName,
}: VisitSchedulerWidgetProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'message'>('schedule')
  const [isCalendarEnabled, setIsCalendarEnabled] = useState<boolean | null>(null)
  const [visitDuration, setVisitDuration] = useState<number>(45)

  // Geração dos próximos 3 dias de atendimento (incluindo sábado se configurado)
  const [availableDays, setAvailableDays] = useState<BusinessDayItem[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // Fluxo de passos do agendamento: 'pick' -> 'details' -> 'success'
  const [step, setStep] = useState<'pick' | 'details' | 'success'>('pick')

  // Dados do formulário
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [website, setWebsite] = useState('') // Honeypot
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    leadId: string
    visitStartsAt: string
    visitEndsAt: string
    googleEventLink?: string | null
  } | null>(null)

  const dateScrollId = useId()

  // Inicializa lista dos próximos 3 dias de atendimento a partir de amanhã
  useEffect(() => {
    const days = getNextOperatingDays(null, new Date(), 3)
    setAvailableDays(days)
    if (days[0]) {
      setSelectedDate(days[0].dateStr)
    }
  }, [])

  // Carrega slots ao mudar de data ou ao inicializar
  useEffect(() => {
    if (!selectedDate || !listingId) return

    let isCancelled = false
    setLoadingSlots(true)
    setSlotsError(null)
    setSelectedSlot(null)

    async function loadSlots() {
      try {
        const res = await fetch(
          `/api/public/calendar/slots?propertyId=${encodeURIComponent(
            listingId,
          )}&date=${encodeURIComponent(selectedDate)}`,
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao consultar horários')
        }
        const data = await res.json()
        if (isCancelled) return

        if (!data.enabled) {
          setIsCalendarEnabled(false)
          setSlots([])
        } else {
          setIsCalendarEnabled(true)
          setVisitDuration(data.visitDurationMinutes || 45)
          if (Array.isArray(data.availableDays) && data.availableDays.length > 0) {
            setAvailableDays(data.availableDays)
          }
          setSlots(data.slots || [])
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Falha ao carregar slots:', err)
          setSlotsError('Não foi possível verificar a agenda neste dia.')
        }
      } finally {
        if (!isCancelled) setLoadingSlots(false)
      }
    }

    loadSlots()

    return () => {
      isCancelled = true
    }
  }, [listingId, selectedDate])

  // Submissão do agendamento
  async function handleBookVisit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !selectedDate) return

    if (!consentGiven) {
      setSubmitError('É necessário aceitar os termos de privacidade para agendar a visita.')
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        propertyId: listingId,
        date: selectedDate,
        time: selectedSlot.time,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim() || undefined,
        website: website.trim() || undefined,
      }

      const res = await fetch('/api/public/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível confirmar o agendamento')
      }

      setSuccessData({
        leadId: data.leadId,
        visitStartsAt: data.visitStartsAt || selectedSlot.startsAt,
        visitEndsAt: data.visitEndsAt || selectedSlot.endsAt,
        googleEventLink: data.googleEventLink,
      })
      setStep('success')
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Erro ao reservar visita. Tente outro horário.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setSelectedSlot(null)
    setConsentGiven(false)
    setStep('pick')
    setSuccessData(null)
    setSubmitError(null)
  }

  // Formatação de data amigável para exibição
  function formatFriendlyDate(dateStr: string) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d, 12, 0, 0)
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  // Gera link do WhatsApp se houver telefone de imobiliária
  function getWhatsAppLink() {
    if (!agencyPhone) return null
    const cleanPhone = agencyPhone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá! Acabei de agendar uma visita para o imóvel #${listingCode || listingId.slice(0, 8)} (${listingTitle}) no dia ${formatFriendlyDate(selectedDate)} às ${selectedSlot?.time || ''}.`,
    )
    return `https://wa.me/55${cleanPhone}?text=${msg}`
  }

  return (
    <Card className="overflow-hidden border-border-subtle bg-surface-raised shadow-sm">
      {/* Abas Superiores */}
      <div className="flex border-b border-border-subtle bg-surface-inset/40 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'schedule'
              ? 'bg-surface-raised text-accent shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          aria-selected={activeTab === 'schedule'}
          role="tab"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <span>Agendar Visita</span>
          {isCalendarEnabled && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" title="Disponível online" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('message')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'message'
              ? 'bg-surface-raised text-accent shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          aria-selected={activeTab === 'message'}
          role="tab"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          <span>Enviar Mensagem</span>
        </button>
      </div>

      <CardContent className="p-5">
        {/* ABA 2: Enviar Mensagem Convencional */}
        {activeTab === 'message' && (
          <ContactForm listingId={listingId} listingTitle={listingTitle} />
        )}

        {/* ABA 1: Agendar Visita com Google Calendar */}
        {activeTab === 'schedule' && (
          <div>
            {/* Caso o agendamento esteja desativado pela imobiliária */}
            {isCalendarEnabled === false ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-inset text-text-tertiary">
                  <Calendar className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Agendamento online indisponível
                </h4>
                <p className="mt-1 text-xs text-text-secondary">
                  Esta imobiliária atende solicitações de visita via mensagem direta.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('message')}
                  className="mt-4 gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  Enviar Mensagem com Preferência
                </Button>
              </div>
            ) : step === 'success' && successData ? (
              /* PASSO 3: Tela de Sucesso */
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>

                <h3 className="text-base font-bold text-text-primary">
                  Visita Agendada com Sucesso!
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Um convite foi gerado e registrado na agenda da imobiliária.
                </p>

                {/* Resumo do Agendamento */}
                <div className="mt-4 rounded-lg border border-border-subtle bg-surface-inset/60 p-4 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Data:</span>
                    <span className="font-semibold text-text-primary capitalize">
                      {formatFriendlyDate(selectedDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Horário:</span>
                    <span className="font-semibold text-accent">
                      {selectedSlot?.time} às {selectedSlot?.endsAt.slice(11, 16)} ({visitDuration} min)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Visitante:</span>
                    <span className="font-medium text-text-primary">{name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Imóvel:</span>
                    <span className="font-medium text-text-primary truncate max-w-[180px]">
                      {listingTitle}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-5 space-y-2">
                  {successData.googleEventLink && (
                    <a
                      href={successData.googleEventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-xs font-semibold text-accent-contrast shadow-sm transition-colors hover:bg-accent/90"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Abrir no Google Agenda
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {getWhatsAppLink() && (
                    <a
                      href={getWhatsAppLink()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                    >
                      <span>Avisar Corretor no WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-2 text-xs text-text-tertiary hover:text-text-primary underline"
                  >
                    Agendar outra visita
                  </button>
                </div>
              </div>
            ) : step === 'details' && selectedSlot ? (
              /* PASSO 2: Formulário de Confirmação com Dados do Cliente */
              <form onSubmit={handleBookVisit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <button
                    type="button"
                    onClick={() => setStep('pick')}
                    className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Alterar data/hora
                  </button>
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {selectedSlot.formatted}
                  </span>
                </div>

                <div className="rounded-md bg-surface-inset/60 p-3 text-xs text-text-secondary">
                  <p className="font-medium text-text-primary capitalize">
                    {formatFriendlyDate(selectedDate)}
                  </p>
                  <p className="mt-0.5">Duração estimada da visita: {visitDuration} minutos</p>
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Honeypot anti-bot */}
                <div className="sr-only" aria-hidden="true">
                  <Label htmlFor="book-website">Website</Label>
                  <Input
                    id="book-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visit-name" className="text-xs">
                    Seu Nome Completo <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="visit-name"
                    required
                    placeholder="Ex: Ana Souza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visit-phone" className="text-xs">
                    WhatsApp / Telefone <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="visit-phone"
                    required
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                      let formatted = digits
                      if (digits.length > 2 && digits.length <= 6) {
                        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
                      } else if (digits.length > 6 && digits.length <= 10) {
                        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
                      } else if (digits.length > 10) {
                        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
                      } else if (digits.length > 0) {
                        formatted = `(${digits}`
                      }
                      setPhone(formatted)
                    }}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visit-email" className="text-xs">
                    Seu E-mail <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="visit-email"
                    required
                    type="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-text-tertiary">
                    Você receberá o convite oficial da agenda neste e-mail.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visit-message" className="text-xs">
                    Alguma observação? (opcional)
                  </Label>
                  <textarea
                    id="visit-message"
                    rows={2}
                    placeholder="Ex: Prefiro ser contatado antes para confirmar a rota."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex w-full rounded-md border border-border-default bg-surface-raised px-3 py-2 text-xs text-text-primary shadow-xs transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Consentimento LGPD */}
                <div className="flex items-start gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="visit-lgpd-consent"
                    required
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border-default text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                  <Label htmlFor="visit-lgpd-consent" className="text-[11px] leading-tight text-text-secondary cursor-pointer">
                    Concordo com o tratamento dos meus dados para agendamento desta visita, nos termos da{' '}
                    <a
                      href="/privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent underline hover:text-accent-hover"
                    >
                      Política de Privacidade
                    </a>
                    . <span className="text-rose-500">*</span>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 gap-2 font-semibold text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sincronizando agenda e confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar Agendamento de Visita
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* PASSO 1: Seleção de Data e Horário */
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-text-primary">
                      1. Escolha o dia
                    </span>
                    <span className="text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      Próximos 3 dias úteis
                    </span>
                  </div>

                  {/* Grade de 3 Dias Úteis */}
                  <div
                    id={dateScrollId}
                    className="grid grid-cols-3 gap-2"
                    role="region"
                    aria-label="Seleção de dias para visita"
                  >
                    {availableDays.map((d) => {
                      const isSelected = selectedDate === d.dateStr
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => setSelectedDate(d.dateStr)}
                          className={`relative flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-accent bg-accent text-accent-contrast shadow-sm ring-2 ring-accent/25'
                              : 'border-border-subtle bg-surface-raised text-text-secondary hover:border-accent/40 hover:bg-surface-raised/80 hover:text-text-primary'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                              isSelected
                                ? 'text-accent-contrast/90'
                                : d.isTomorrow
                                  ? 'text-accent font-extrabold'
                                  : 'text-text-tertiary'
                            }`}
                          >
                            {d.label}
                          </span>
                          <span className="text-lg font-bold tabular-nums leading-tight">
                            {d.dayOfMonth}
                          </span>
                          <span
                            className={`text-[10px] capitalize ${
                              isSelected ? 'text-accent-contrast/80' : 'text-text-tertiary'
                            }`}
                          >
                            {d.monthName}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Grade de Horários */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-primary">
                      2. Escolha o horário
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      08:00 às 17:00 ({visitDuration} min)
                    </span>
                  </div>

                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-text-tertiary">
                      <Loader2 className="mb-2 h-5 w-5 animate-spin text-accent" />
                      Consultando disponibilidade do corretor...
                    </div>
                  ) : slotsError ? (
                    <div className="rounded-md border border-border-subtle bg-surface-inset/40 p-4 text-center text-xs text-text-secondary">
                      <p>{slotsError}</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-md border border-border-subtle bg-surface-inset/40 p-5 text-center text-xs text-text-secondary">
                      <p className="font-medium text-text-primary">Sem horários livres nesta data</p>
                      <p className="mt-1 text-text-tertiary">
                        Os corretores estão ocupados ou é um dia sem atendimento. Escolha outro dia acima.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.time === slot.time
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`flex h-10 items-center justify-center rounded-md border text-xs font-medium tabular-nums transition-all ${
                              isSelected
                                ? 'border-accent bg-accent text-accent-contrast font-bold shadow-xs'
                                : 'border-border-subtle bg-surface-raised text-text-primary hover:border-accent hover:text-accent'
                            }`}
                          >
                            {slot.time}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Botão de Avançar */}
                <Button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep('details')}
                  className="w-full h-10 gap-2 font-semibold text-xs mt-2"
                >
                  Continuar com {selectedSlot ? selectedSlot.time : 'horário selecionado'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
