import assert from 'node:assert/strict'
import test from 'node:test'
import { propertyInputSchema } from '../src/lib/properties/validation.ts'

const validProperty = {
  titulo: 'Casa na Vila Mariana',
  descricao: 'Casa reformada, iluminada e próxima ao metrô.',
  tipo: 'casa',
  finalidade: 'venda',
  status: 'disponivel',
  preco_venda: 850000,
  endereco: 'Rua das Flores, 12',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '04101-000',
  bairro: 'Vila Mariana',
}

test('property input accepts a valid record and refuses client-supplied ownership fields', () => {
  assert.equal(propertyInputSchema.safeParse(validProperty).success, true)
  assert.equal(propertyInputSchema.safeParse({ ...validProperty, tenant_id: 'another-agency' }).success, false)
  assert.equal(propertyInputSchema.safeParse({ ...validProperty, role: 'admin' }).success, false)
})

test('property input rejects invalid prices, enums and overlong text', () => {
  assert.equal(propertyInputSchema.safeParse({ ...validProperty, preco_venda: -1 }).success, false)
  assert.equal(propertyInputSchema.safeParse({ ...validProperty, tipo: 'unknown' }).success, false)
  assert.equal(propertyInputSchema.safeParse({ ...validProperty, titulo: 'x'.repeat(161) }).success, false)
  assert.equal(propertyInputSchema.safeParse({ ...validProperty, finalidade: 'locacao' }).success, false)
})
