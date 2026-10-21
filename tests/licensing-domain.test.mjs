import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import test from 'node:test'
import {
  buildHeartbeatMessage,
  isPastDue,
  signLease,
  verifyHeartbeat,
  verifyLease,
  verifyLeaseSignature,
} from '../src/lib/licensing/domain.ts'

const { privateKey, publicKey } = generateKeyPairSync('ed25519')
const keyId = 'test-key'

function makeLease(overrides = {}) {
  const issuedAt = '2026-10-21T00:00:00.000Z'

  return {
    installationId: 'install-123',
    status: 'active',
    features: ['properties', 'leads', 'public-listing'],
    issuedAt,
    expiresAt: '2026-10-28T00:00:00.000Z',
    keyId,
    ...overrides,
  }
}

test('a signed lease grants only its installation before expiration', () => {
  const lease = signLease(makeLease(), privateKey)

  assert.equal(
    verifyLease(lease, { [keyId]: publicKey }, 'install-123', Date.parse('2026-10-24T00:00:00Z')),
    true,
  )
  assert.equal(
    verifyLease(lease, { [keyId]: publicKey }, 'another-install', Date.parse('2026-10-24T00:00:00Z')),
    false,
  )
  assert.equal(
    verifyLease(lease, { [keyId]: publicKey }, 'install-123', Date.parse('2026-10-29T00:00:00Z')),
    false,
  )
})

test('a lease cannot be changed after signing or extend beyond seven days', () => {
  const signed = signLease(makeLease(), privateKey)

  assert.equal(
    verifyLease(
      { ...signed, status: 'suspended' },
      { [keyId]: publicKey },
      'install-123',
      Date.parse('2026-10-24T00:00:00Z'),
    ),
    false,
  )
  assert.throws(() =>
    signLease(makeLease({ expiresAt: '2026-11-01T00:00:00.000Z' }), privateKey),
  )
})

test('suspended leases are verifiable but never grant active access', () => {
  const suspended = signLease(makeLease({ status: 'suspended' }), privateKey)
  assert.equal(verifyLeaseSignature(suspended, { [keyId]: publicKey }, 'install-123'), true)
  assert.equal(verifyLease(suspended, { [keyId]: publicKey }, 'install-123'), false)
  assert.equal(verifyLease(suspended, { 'unknown-key': publicKey }, 'install-123'), false)
})

test('a delinquent account suspends at the 15-day calendar boundary', () => {
  assert.equal(isPastDue('2026-10-21', Date.parse('2026-11-04T23:59:59Z')), false)
  assert.equal(isPastDue('2026-10-21', Date.parse('2026-11-05T00:00:00Z')), true)
})

test('heartbeats require a fresh signature from the registered installation key', () => {
  const heartbeat = {
    installationId: 'install-123',
    nonce: 'nonce-value-1234567890',
    timestamp: '2026-10-21T12:00:00.000Z',
  }
  const signature = sign(null, Buffer.from(buildHeartbeatMessage(heartbeat)), privateKey).toString('base64url')

  assert.equal(verifyHeartbeat(heartbeat, signature, publicKey, Date.parse(heartbeat.timestamp)), true)
  assert.equal(verifyHeartbeat(heartbeat, signature, publicKey, Date.parse('2026-10-21T12:06:00Z')), false)
  assert.equal(verifyHeartbeat({ ...heartbeat, nonce: 'short' }, signature, publicKey, Date.parse(heartbeat.timestamp)), false)
})
