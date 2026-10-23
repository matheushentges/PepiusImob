import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanCep,
  formatCep,
  fetchAddressByCep,
} from '../src/lib/cep/viacep.ts'

test('cleanCep removes non-digits and validates 8 digits length', () => {
  assert.equal(cleanCep('01310-100'), '01310100')
  assert.equal(cleanCep(' 01.310-100 '), '01310100')
  assert.equal(cleanCep('01310100'), '01310100')
  assert.equal(cleanCep('123'), '') // too short
  assert.equal(cleanCep('123456789'), '') // too long
  assert.equal(cleanCep('abc-defgh'), '') // non-numeric
})

test('formatCep applies 00000-000 mask smoothly', () => {
  assert.equal(formatCep('01310100'), '01310-100')
  assert.equal(formatCep('01310-100'), '01310-100')
  assert.equal(formatCep('0131'), '0131')
  assert.equal(formatCep('01310'), '01310')
  assert.equal(formatCep('013101'), '01310-1')
})

test('fetchAddressByCep maps ViaCEP response correctly to address fields', async () => {
  const mockFetch = async (url) => {
    assert.equal(url, 'https://viacep.com.br/ws/01310100/json/')
    return {
      ok: true,
      json: async () => ({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: 'de 611 a 1045 - lado ímpar',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
        ibge: '3550308',
      }),
    }
  }

  const result = await fetchAddressByCep('01310-100', mockFetch)
  assert.deepEqual(result, {
    endereco: 'Avenida Paulista',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
  })
})

test('fetchAddressByCep returns null when CEP does not exist (erro: true)', async () => {
  const mockFetch = async () => ({
    ok: true,
    json: async () => ({ erro: true }),
  })

  const result = await fetchAddressByCep('99999-999', mockFetch)
  assert.equal(result, null)
})

test('fetchAddressByCep returns null on network failure without throwing', async () => {
  const mockFetch = async () => {
    throw new Error('Network offline')
  }

  const result = await fetchAddressByCep('01310-100', mockFetch)
  assert.equal(result, null)
})
