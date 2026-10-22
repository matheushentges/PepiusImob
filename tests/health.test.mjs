import test from 'node:test'
import assert from 'node:assert/strict'
import { GET } from '../src/app/api/health/route.ts'

test('health endpoint returns ok status and version metadata', async () => {
  const response = await GET()
  assert.equal(response.status, 200)

  const body = await response.json()
  assert.equal(body.status, 'ok')
  assert.ok(typeof body.version === 'string' && body.version.length > 0)
  assert.ok(typeof body.timestamp === 'string' && !isNaN(Date.parse(body.timestamp)))

  const cacheHeader = response.headers.get('Cache-Control')
  assert.ok(cacheHeader && cacheHeader.includes('no-store'))
})
