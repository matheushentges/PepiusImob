import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculatePropertyMatch } from '../src/lib/clients/matching.ts'

test('calculatePropertyMatch matches candidate property within criteria', () => {
  const profile = {
    tipos_imovel: ['apartamento'],
    finalidade: 'venda',
    valor_minimo: 400000,
    valor_maximo: 600000,
    quartos_minimo: 2,
    bairros_interesse: ['Jardins', 'Pinheiros'],
  }

  const property = {
    id: 'prop-1',
    titulo: 'Apartamento Moderno nos Jardins',
    tipo: 'apartamento',
    finalidade: 'venda',
    status: 'disponivel',
    preco_venda: 550000,
    preco_locacao: null,
    bairro: 'Jardins',
    cidade: 'São Paulo',
    quartos: 3,
    vagas_garagem: 2,
    area_total: 95,
  }

  const match = calculatePropertyMatch(profile, property)
  assert.ok(match !== null)
  assert.equal(match.propertyId, 'prop-1')
  assert.ok(match.matchScore >= 80)
  assert.ok(match.matchReasons.some((r) => r.includes('Jardins')))
  assert.ok(match.matchReasons.some((r) => r.includes('Preço ideal')))
})

test('calculatePropertyMatch rejects unavailable properties', () => {
  const profile = {
    tipos_imovel: ['casa'],
    finalidade: 'venda',
  }

  const property = {
    id: 'prop-2',
    titulo: 'Casa Vendida',
    tipo: 'casa',
    finalidade: 'venda',
    status: 'vendido', // não disponível
    preco_venda: 300000,
    preco_locacao: null,
    bairro: 'Centro',
    cidade: 'São Paulo',
    quartos: 2,
    vagas_garagem: 1,
    area_total: 100,
  }

  const match = calculatePropertyMatch(profile, property)
  assert.equal(match, null)
})

test('calculatePropertyMatch rejects mismatched purpose (aluguel vs venda)', () => {
  const profile = {
    finalidade: 'locacao',
    valor_maximo: 3000,
  }

  const property = {
    id: 'prop-3',
    titulo: 'Cobertura Venda Exclusiva',
    tipo: 'apartamento',
    finalidade: 'venda', // só venda
    status: 'disponivel',
    preco_venda: 1500000,
    preco_locacao: null,
    bairro: 'Moema',
    cidade: 'São Paulo',
    quartos: 4,
    vagas_garagem: 3,
    area_total: 250,
  }

  const match = calculatePropertyMatch(profile, property)
  assert.equal(match, null)
})
