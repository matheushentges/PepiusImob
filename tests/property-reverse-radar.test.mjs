import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculatePropertyMatch,
  buildReverseRadarWhatsAppUrl,
} from '../src/lib/clients/matching.ts'

test('buildReverseRadarWhatsAppUrl formats message and link correctly', () => {
  const url = buildReverseRadarWhatsAppUrl({
    clientName: 'Matheus Silva',
    clientPhone: '(11) 98765-4321',
    matchScore: 92,
    propertyTitle: 'Apartamento Jardins Alto Padrão',
    propertyNeighborhood: 'Jardins',
    propertyPriceFormatted: 'R$ 1.250.000',
    propertyUrl: 'https://imob.exemplo.com/imoveis/prop-123',
  })

  assert.ok(url)
  assert.ok(url.startsWith('https://wa.me/5511987654321?text='))
  const decoded = decodeURIComponent(url.replace('https://wa.me/5511987654321?text=', ''))
  assert.ok(decoded.includes('Matheus'))
  assert.ok(decoded.includes('92%'))
  assert.ok(decoded.includes('Apartamento Jardins Alto Padrão'))
  assert.ok(decoded.includes('Jardins'))
  assert.ok(decoded.includes('R$ 1.250.000'))
  assert.ok(decoded.includes('https://imob.exemplo.com/imoveis/prop-123'))
})

test('buildReverseRadarWhatsAppUrl returns null for invalid or missing phone', () => {
  assert.equal(
    buildReverseRadarWhatsAppUrl({
      clientName: 'Sem Fone',
      clientPhone: '123',
      matchScore: 80,
      propertyTitle: 'Casa',
    }),
    null,
  )

  assert.equal(
    buildReverseRadarWhatsAppUrl({
      clientName: 'Sem Fone',
      clientPhone: '',
      matchScore: 80,
      propertyTitle: 'Casa',
    }),
    null,
  )
})

test('reverse matching calculates high match for compatible buyer', () => {
  const candidate = {
    id: 'prop-1',
    titulo: 'Casa Contemporânea em Alphaville',
    tipo: 'casa',
    finalidade: 'venda',
    status: 'disponivel',
    preco_venda: 1800000,
    preco_locacao: null,
    bairro: 'Alphaville',
    cidade: 'Barueri',
    quartos: 4,
    vagas_garagem: 3,
    area_total: 350,
  }

  const buyerProfile = {
    finalidade: 'venda',
    tipos_imovel: ['casa'],
    valor_minimo: 1500000,
    valor_maximo: 2000000,
    quartos_minimo: 3,
    bairros_interesse: ['Alphaville', 'Tamboré'],
  }

  const match = calculatePropertyMatch(buyerProfile, candidate)
  assert.ok(match)
  assert.ok(match.matchScore >= 85)
  assert.equal(match.propertyId, 'prop-1')
  assert.ok(match.matchReasons.some((r) => r.includes('Alphaville')))
  assert.ok(match.matchReasons.some((r) => r.includes('faixa estipulada') || r.includes('Preço ideal')))
})

test('reverse matching excludes incompatible purpose (locação vs venda)', () => {
  const candidate = {
    id: 'prop-2',
    titulo: 'Apartamento para Locação',
    tipo: 'apartamento',
    finalidade: 'locacao',
    status: 'disponivel',
    preco_venda: null,
    preco_locacao: 4500,
    bairro: 'Moema',
    cidade: 'São Paulo',
    quartos: 2,
    vagas_garagem: 1,
    area_total: 75,
  }

  const buyerProfile = {
    finalidade: 'venda',
    tipos_imovel: ['apartamento'],
    valor_maximo: 800000,
  }

  const match = calculatePropertyMatch(buyerProfile, candidate)
  assert.equal(match, null)
})
