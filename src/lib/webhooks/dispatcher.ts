import { createHmac, randomUUID } from 'node:crypto'

export type WebhookEventName = 'lead.created' | 'visit.scheduled'

export interface WebhookPropertySummary {
  id: string
  titulo: string
  codigo?: string | null
  precoVenda?: number | null
  precoLocacao?: number | null
  bairro?: string | null
  cidade?: string | null
}

export interface LeadCreatedEventData {
  leadId: string | null
  nome: string
  telefone: string
  email?: string | null
  mensagem?: string | null
  horarioPreferido?: string | null
  imovel?: WebhookPropertySummary | null
  createdAt: string
}

export interface VisitScheduledEventData {
  leadId: string
  nome: string
  telefone: string
  email?: string | null
  mensagem?: string | null
  visitStartsAt: string
  visitEndsAt: string
  googleEventLink?: string | null
  imovel: WebhookPropertySummary
}

export type WebhookEventMap = {
  'lead.created': LeadCreatedEventData
  'visit.scheduled': VisitScheduledEventData
}

export interface WebhookEnvelope<T> {
  id: string
  event: WebhookEventName
  timestamp: string
  tenantId: string
  data: T
}

export interface WebhookDispatchResult {
  delivered: boolean
  statusCode?: number
  reason?: string
}

export function computeWebhookSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export async function dispatchWebhookEvent<K extends WebhookEventName>(
  event: K,
  data: WebhookEventMap[K],
  options?: {
    webhookUrl?: string
    secret?: string
    tenantId?: string
    fetchFn?: typeof fetch
  },
): Promise<WebhookDispatchResult> {
  const eventSpecificUrl =
    event === 'lead.created'
      ? process.env.PEPIUS_N8N_LEAD_WEBHOOK_URL
      : event === 'visit.scheduled'
        ? process.env.PEPIUS_N8N_VISIT_WEBHOOK_URL
        : undefined

  const webhookUrl =
    options?.webhookUrl ??
    eventSpecificUrl ??
    process.env.PEPIUS_N8N_WEBHOOK_URL ??
    process.env.PEPIUS_WEBHOOK_URL

  if (!webhookUrl || !webhookUrl.trim()) {
    return { delivered: false, reason: 'unconfigured' }
  }

  const tenantId =
    options?.tenantId ??
    process.env.PEPIUS_TENANT_ID ??
    '00000000-0000-0000-0000-000000000000'

  const secret = options?.secret ?? process.env.PEPIUS_WEBHOOK_SECRET

  const envelope: WebhookEnvelope<WebhookEventMap[K]> = {
    id: randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    tenantId,
    data,
  }

  const payloadString = JSON.stringify(envelope)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Pepius-Event': event,
    'X-Pepius-Delivery': envelope.id,
  }

  if (secret) {
    const signature = computeWebhookSignature(payloadString, secret)
    headers['X-Pepius-Signature'] = `sha256=${signature}`
  }

  const customFetch = options?.fetchFn ?? fetch

  try {
    const response = await customFetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn(`[WebhookDispatcher] Non-2xx response: ${response.status} from ${webhookUrl}`)
      return { delivered: false, statusCode: response.status, reason: `http_${response.status}` }
    }

    return { delivered: true, statusCode: response.status }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network_error'
    console.warn(`[WebhookDispatcher] Delivery failed to ${webhookUrl}: ${message}`)
    return { delivered: false, reason: message }
  }
}
