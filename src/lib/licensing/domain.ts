import { sign, verify, type KeyObject } from 'node:crypto'

export const MAX_LEASE_AGE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_FUTURE_ISSUANCE_SKEW_MS = 5 * 60 * 1000
const HEARTBEAT_MAX_AGE_MS = 5 * 60 * 1000

export type LicenseStatus = 'active' | 'suspended'

export interface LicenseLease {
  installationId: string
  status: LicenseStatus
  features: string[]
  issuedAt: string
  expiresAt: string
  keyId: string
}

export interface SignedLicenseLease extends LicenseLease {
  signature: string
}

export interface HeartbeatChallenge {
  installationId: string
  nonce: string
  timestamp: string
}

type KeyLike = string | Buffer | KeyObject

function leaseMessage(lease: LicenseLease): string {
  return JSON.stringify({
    installationId: lease.installationId,
    status: lease.status,
    features: [...lease.features].sort(),
    issuedAt: lease.issuedAt,
    expiresAt: lease.expiresAt,
    keyId: lease.keyId,
  })
}

function dateValue(value: string): number {
  return typeof value === 'string' ? Date.parse(value) : Number.NaN
}

function isLeaseShape(value: unknown): value is SignedLicenseLease {
  if (!value || typeof value !== 'object') return false
  const lease = value as Partial<SignedLicenseLease>
  return (
    typeof lease.installationId === 'string' &&
    lease.installationId.length > 0 &&
    (lease.status === 'active' || lease.status === 'suspended') &&
    Array.isArray(lease.features) &&
    lease.features.every((feature) => typeof feature === 'string' && feature.length > 0) &&
    typeof lease.issuedAt === 'string' &&
    typeof lease.expiresAt === 'string' &&
    typeof lease.keyId === 'string' &&
    typeof lease.signature === 'string'
  )
}

export function signLease(lease: LicenseLease, privateKey: KeyLike): SignedLicenseLease {
  const issuedAt = dateValue(lease.issuedAt)
  const expiresAt = dateValue(lease.expiresAt)

  if (
    !lease.installationId ||
    !lease.keyId ||
    !Array.isArray(lease.features) ||
    (lease.status !== 'active' && lease.status !== 'suspended') ||
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > MAX_LEASE_AGE_MS
  ) {
    throw new Error('Invalid lease payload')
  }

  const payload = { ...lease, features: [...new Set(lease.features)].sort() }
  const signature = sign(null, Buffer.from(leaseMessage(payload)), privateKey).toString('base64url')
  return { ...payload, signature }
}

export function verifyLease(
  lease: unknown,
  trustedKeys: Record<string, KeyLike>,
  expectedInstallationId: string,
  now = Date.now(),
): lease is SignedLicenseLease {
  return isLeaseShape(lease) && lease.status === 'active' && verifyLeaseSignature(
    lease,
    trustedKeys,
    expectedInstallationId,
    now,
  )
}

export function verifyLeaseSignature(
  lease: unknown,
  trustedKeys: Record<string, KeyLike>,
  expectedInstallationId: string,
  now = Date.now(),
): lease is SignedLicenseLease {
  if (!isLeaseShape(lease)) return false
  if (lease.installationId !== expectedInstallationId) return false

  const publicKey = trustedKeys[lease.keyId]
  if (!publicKey) return false

  const issuedAt = dateValue(lease.issuedAt)
  const expiresAt = dateValue(lease.expiresAt)
  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    issuedAt > now + MAX_FUTURE_ISSUANCE_SKEW_MS ||
    expiresAt <= now ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > MAX_LEASE_AGE_MS
  ) {
    return false
  }

  try {
    return verify(
      null,
      Buffer.from(leaseMessage(lease)),
      publicKey,
      Buffer.from(lease.signature, 'base64url'),
    )
  } catch {
    return false
  }
}

export function buildHeartbeatMessage(challenge: HeartbeatChallenge): string {
  return JSON.stringify({
    installationId: challenge.installationId,
    nonce: challenge.nonce,
    timestamp: challenge.timestamp,
  })
}

export function verifyHeartbeat(
  challenge: HeartbeatChallenge,
  signature: string,
  publicKey: KeyLike,
  now = Date.now(),
): boolean {
  const timestamp = dateValue(challenge.timestamp)
  if (
    !challenge.installationId ||
    challenge.nonce.length < 16 ||
    challenge.nonce.length > 128 ||
    !Number.isFinite(timestamp) ||
    Math.abs(now - timestamp) > HEARTBEAT_MAX_AGE_MS
  ) {
    return false
  }

  try {
    return verify(
      null,
      Buffer.from(buildHeartbeatMessage(challenge)),
      publicKey,
      Buffer.from(signature, 'base64url'),
    )
  } catch {
    return false
  }
}

export function isPastDue(paidThrough: string, now = Date.now()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidThrough)) return true
  const [year, month, day] = paidThrough.split('-').map(Number)
  const paidThroughUtc = Date.UTC(year, month - 1, day)
  const normalized = new Date(paidThroughUtc).toISOString().slice(0, 10)
  if (normalized !== paidThrough) return true

  const suspendAt = new Date(paidThroughUtc)
  suspendAt.setUTCDate(suspendAt.getUTCDate() + 15)
  return now >= suspendAt.getTime()
}
