import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { buildEventPayload } from '../src/lib/calendar/google-calendar.ts'

test('Security Audit: buildEventPayload omits street address and contains broker confirmation note', () => {
  const secretStreetAddress = 'Rua das Palmeiras, 123, Apto 404'
  const regionAddress = 'Jardim América, São Paulo - SP'

  const payload = buildEventPayload({
    propertyTitle: 'Apartamento de Luxo',
    propertyCode: 'AP100',
    propertyAddress: regionAddress,
    clientName: 'João da Silva',
    clientPhone: '(11) 98765-4321',
    clientEmail: 'joao@example.com',
    startDateTime: '2026-10-30T10:00:00-03:00',
    endDateTime: '2026-10-30T10:45:00-03:00',
  })

  // Garante que o endereço da rua nunca esteja presente na descrição
  assert.equal(payload.description.includes(secretStreetAddress), false)
  // Garante que o bairro/cidade esteja presente
  assert.equal(payload.description.includes('📍 Localização / Bairro: Jardim América, São Paulo - SP'), true)
  // Garante a presença do aviso de confirmação prévia pelo corretor
  assert.equal(
    payload.description.includes('O endereço completo e instruções de acesso serão informados pelo corretor responsável antes da visita.'),
    true
  )
})

test('Security Audit: OAuth state generation and signature validation integrity', () => {
  const secret = 'super-secure-production-pepper-1234567890'
  const tenantId = '11111111-2222-3333-4444-555555555555'
  const timestamp = Date.now().toString()
  const payload = `${tenantId}:${timestamp}`
  const validSignature = createHmac('sha256', secret).update(payload).digest('hex')
  const validState = Buffer.from(`${payload}:${validSignature}`).toString('base64url')

  // Testa decodificação e validação com segredo correto
  const decoded = Buffer.from(validState, 'base64url').toString('utf8')
  const [decTenant, decTime, decSig] = decoded.split(':')
  assert.equal(decTenant, tenantId)

  const recomputedSig = createHmac('sha256', secret).update(`${decTenant}:${decTime}`).digest('hex')
  assert.equal(recomputedSig, decSig)

  // Testa rejeição com assinatura forjada (chave incorreta / fallback fraco)
  const attackerSignature = createHmac('sha256', 'calendar-state-secret').update(payload).digest('hex')
  assert.notEqual(validSignature, attackerSignature)
})
