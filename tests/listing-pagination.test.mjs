import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getPaginationPages,
  paginateItems,
} from '../src/lib/listings-data.ts'

test('getPaginationPages returns all pages when totalPages <= 7', () => {
  assert.deepEqual(getPaginationPages(1, 1), [1])
  assert.deepEqual(getPaginationPages(1, 5), [1, 2, 3, 4, 5])
  assert.deepEqual(getPaginationPages(4, 7), [1, 2, 3, 4, 5, 6, 7])
})

test('getPaginationPages adds ellipsis when totalPages > 7', () => {
  // Near start: 1, 2, 3, 4 ... 10
  const atStart = getPaginationPages(2, 10)
  assert.deepEqual(atStart, [1, 2, 3, 'ellipsis', 10])

  // In middle: 1 ... 4, 5, 6 ... 10
  const inMiddle = getPaginationPages(5, 10)
  assert.deepEqual(inMiddle, [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])

  // Near end: 1 ... 8, 9, 10
  const atEnd = getPaginationPages(9, 10)
  assert.deepEqual(atEnd, [1, 'ellipsis', 8, 9, 10])
})

test('paginateItems slices data correctly and clamps page bounds', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: `item-${i + 1}` }))

  // Page 1 of 12 items
  const page1 = paginateItems(items, 1, 12)
  assert.equal(page1.totalItems, 25)
  assert.equal(page1.totalPages, 3)
  assert.equal(page1.currentPage, 1)
  assert.equal(page1.startIndex, 0)
  assert.equal(page1.endIndex, 12)
  assert.equal(page1.items.length, 12)
  assert.equal(page1.items[0]?.id, 'item-1')
  assert.equal(page1.items[11]?.id, 'item-12')

  // Page 2
  const page2 = paginateItems(items, 2, 12)
  assert.equal(page2.currentPage, 2)
  assert.equal(page2.startIndex, 12)
  assert.equal(page2.endIndex, 24)
  assert.equal(page2.items.length, 12)
  assert.equal(page2.items[0]?.id, 'item-13')

  // Page 3 (remainder)
  const page3 = paginateItems(items, 3, 12)
  assert.equal(page3.currentPage, 3)
  assert.equal(page3.startIndex, 24)
  assert.equal(page3.endIndex, 25)
  assert.equal(page3.items.length, 1)
  assert.equal(page3.items[0]?.id, 'item-25')

  // Out of bounds page clamps safely to totalPages
  const outOfBounds = paginateItems(items, 999, 12)
  assert.equal(outOfBounds.currentPage, 3)
  assert.equal(outOfBounds.items.length, 1)

  // Negative or 0 page clamps safely to page 1
  const negativePage = paginateItems(items, -5, 12)
  assert.equal(negativePage.currentPage, 1)
  assert.equal(negativePage.items.length, 12)
})
