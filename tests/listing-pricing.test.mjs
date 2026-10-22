import assert from 'node:assert/strict'
import test from 'node:test'
import {
  listingMatchesPrice,
  listingPurposeLabel,
} from '../src/lib/listings-data.ts'

const sale = { offers: [{ type: 'venda', price: 850000 }] }
const rent = { offers: [{ type: 'aluguel', price: 3200 }] }
const both = {
  offers: [
    { type: 'venda', price: 850000 },
    { type: 'aluguel', price: 3200 },
  ],
}

test('purpose label reflects every offer available', () => {
  assert.equal(listingPurposeLabel(sale), 'Venda')
  assert.equal(listingPurposeLabel(rent), 'Locação')
  assert.equal(listingPurposeLabel(both), 'Venda e locação')
})

test('price range matches when any offer fits the range', () => {
  assert.equal(listingMatchesPrice(both, 3000, 4000), true)
  assert.equal(listingMatchesPrice(both, 800000, 900000), true)
  assert.equal(listingMatchesPrice(both, 5000, 10000), false)
  assert.equal(listingMatchesPrice(both, null, 4000), true)
  assert.equal(listingMatchesPrice(both, 900000, null), false)
})
