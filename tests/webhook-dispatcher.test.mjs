import test from 'node:test'
import assert from 'node:assert/strict'
import {
  computeWebhookSignature,
  dispatchWebhookEvent,
} from '../src/lib/webhooks/dispatcher.ts'

test('computeWebhookSignature produces valid HMAC-SHA256 hex string', () => {
  const payload = JSON.stringify({ message: 'hello' })
  const secret = 'super-secret-key-123'
  const sig = computeWebhookSignature(payload, secret)

  assert.equal(typeof sig, 'string')
  assert.equal(sig.length, 64) // 256 bits = 64 hex characters
  assert.match(sig, /^[0-9a-f]{64}$/)
})

test('dispatchWebhookEvent returns unconfigured when URL is empty', async () => {
  const result = await dispatchWebhookEvent(
    'lead.created',
    {
      leadId: 'test-1',
      nome: 'Teste',
      telefone: '11999999999',
      createdAt: new Date().toISOString(),
    },
    { webhookUrl: '' },
  )

  assert.equal(result.delivered, false)
  assert.equal(result.reason, 'unconfigured')
})

test('dispatchWebhookEvent sends signed payload with required headers', async () => {
  let capturedUrl = ''
  let capturedHeaders = {}
  let capturedBody = null

  const mockFetch = async (url, options) => {
    capturedUrl = url
    capturedHeaders = options.headers
    capturedBody = JSON.parse(options.body)
    return {
      ok: true,
      status: 200,
    }
  }

  const result = await dispatchWebhookEvent(
    'lead.created',
    {
      leadId: 'lead-123',
      nome: 'Carlos Corretor',
      telefone: '11988887777',
      email: 'carlos@exemplo.com',
      createdAt: '2026-10-23T12:00:00.000Z',
    },
    {
      webhookUrl: 'https://n8n.imob.com/webhook/pepius',
      secret: 'secret-key',
      tenantId: 'tenant-abc-123',
      fetchFn: mockFetch,
    },
  )

  assert.equal(result.delivered, true)
  assert.equal(result.statusCode, 200)
  assert.equal(capturedUrl, 'https://n8n.imob.com/webhook/pepius')
  assert.equal(capturedHeaders['X-Pepius-Event'], 'lead.created')
  assert.ok(capturedHeaders['X-Pepius-Delivery'])
  assert.ok(capturedHeaders['X-Pepius-Signature'].startsWith('sha256='))
  assert.equal(capturedBody.event, 'lead.created')
  assert.equal(capturedBody.tenantId, 'tenant-abc-123')
  assert.equal(capturedBody.data.leadId, 'lead-123')
  assert.equal(capturedBody.data.nome, 'Carlos Corretor')
})

test('dispatchWebhookEvent catches non-2xx response without throwing', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 502,
  })

  const result = await dispatchWebhookEvent(
    'visit.scheduled',
    {
      leadId: 'lead-visit',
      nome: 'Ana',
      telefone: '11977776666',
      visitStartsAt: '2026-10-24T14:00:00-03:00',
      visitEndsAt: '2026-10-24T14:45:00-03:00',
      imovel: { id: 'prop-1', titulo: 'Casa' },
    },
    {
      webhookUrl: 'https://n8n.imob.com/webhook/pepius',
      fetchFn: mockFetch,
    },
  )

  assert.equal(result.delivered, false)
  assert.equal(result.statusCode, 502)
  assert.equal(result.reason, 'http_502')
})
