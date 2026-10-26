import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  upsertKeySchema,
  checkoutKeySchema,
  returnKeySchema,
  mapHolderTypeToStatus,
  isKeyLate,
  getMinutesLate,
} from '../src/lib/keys/validation.ts'

const VALID_KEY_ID = '11111111-1111-4111-8111-111111111111'
const VALID_PROP_ID = '22222222-2222-4222-8222-222222222222'
const VALID_CONSULTOR_ID = '33333333-3333-4333-8333-333333333333'
const VALID_MOVEMENT_ID = '44444444-4444-4444-8444-444444444444'

test('upsertKeySchema validates valid key codes and localizations', () => {
  const result = upsertKeySchema.safeParse({
    codigo: '  CH-102  ',
    localizacao: '  Armário Principal, Gancho 14  ',
  })

  assert.ok(result.success)
  assert.equal(result.data.codigo, 'CH-102')
  assert.equal(result.data.localizacao, 'Armário Principal, Gancho 14')
})

test('upsertKeySchema rejects empty code', () => {
  const result = upsertKeySchema.safeParse({
    codigo: '   ',
  })

  assert.equal(result.success, false)
})

test('checkoutKeySchema validates consultor checkout', () => {
  const payload = {
    key_id: VALID_KEY_ID,
    property_id: VALID_PROP_ID,
    tipo_responsavel: 'consultor',
    consultor_id: VALID_CONSULTOR_ID,
    nome_responsavel: 'Carlos Corretor',
    motivo: 'Visita com cliente comprador',
    previsao_retorno: new Date(Date.now() + 3600000).toISOString(),
  }

  const result = checkoutKeySchema.safeParse(payload)
  assert.ok(result.success)
  assert.equal(result.data.tipo_responsavel, 'consultor')
  assert.equal(result.data.consultor_id, VALID_CONSULTOR_ID)
  assert.equal(result.data.nome_responsavel, 'Carlos Corretor')
})

test('checkoutKeySchema validates client self-guided visit', () => {
  const payload = {
    key_id: VALID_KEY_ID,
    property_id: VALID_PROP_ID,
    tipo_responsavel: 'cliente',
    nome_responsavel: 'Mariana Lima',
    telefone_responsavel: '(11) 98765-4321',
    documento_responsavel: '123.456.789-00',
    motivo: 'Visita avulsa para locação',
    previsao_retorno: new Date(Date.now() + 7200000).toISOString(),
    observacoes_saida: 'Deixou CNH na recepção',
  }

  const result = checkoutKeySchema.safeParse(payload)
  assert.ok(result.success)
  assert.equal(result.data.tipo_responsavel, 'cliente')
  assert.equal(result.data.nome_responsavel, 'Mariana Lima')
  assert.equal(result.data.telefone_responsavel, '(11) 98765-4321')
})

test('checkoutKeySchema rejects invalid UUID and empty name', () => {
  const result = checkoutKeySchema.safeParse({
    key_id: 'invalid-uuid',
    property_id: VALID_PROP_ID,
    tipo_responsavel: 'cliente',
    nome_responsavel: '   ',
  })

  assert.equal(result.success, false)
})

test('returnKeySchema accepts valid movement id and optional notes', () => {
  const result = returnKeySchema.safeParse({
    movement_id: VALID_MOVEMENT_ID,
    observacoes_devolucao: 'Chave devolvida no claviculário sem avarias',
  })

  assert.ok(result.success)
  assert.equal(result.data.movement_id, VALID_MOVEMENT_ID)
  assert.equal(result.data.observacoes_devolucao, 'Chave devolvida no claviculário sem avarias')
})

test('mapHolderTypeToStatus correctly maps responsible types to statuses', () => {
  assert.equal(mapHolderTypeToStatus('consultor'), 'com_consultor')
  assert.equal(mapHolderTypeToStatus('cliente'), 'com_cliente')
  assert.equal(mapHolderTypeToStatus('prestador'), 'em_manutencao')
  assert.equal(mapHolderTypeToStatus('outros'), 'outros')
})

test('isKeyLate and getMinutesLate handle past and future dates', () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const past = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  assert.equal(isKeyLate(future), false)
  assert.equal(getMinutesLate(future), 0)

  assert.equal(isKeyLate(past), true)
  const minutes = getMinutesLate(past)
  assert.ok(minutes >= 29 && minutes <= 31, `Minutes was ${minutes}`)

  assert.equal(isKeyLate(null), false)
  assert.equal(getMinutesLate(null), 0)
})
