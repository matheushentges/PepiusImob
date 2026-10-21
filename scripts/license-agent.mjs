import { chmod, mkdir, readFile } from 'node:fs/promises'
import { randomBytes, sign } from 'node:crypto'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { buildHeartbeatMessage, verifyLeaseSignature } from '../src/lib/licensing/domain.ts'

const stateDirectory = process.env.LICENSE_STATE_DIR || join(process.cwd(), '.local', 'license-state')
const stateFile = join(stateDirectory, 'installation.json')
const day = 24 * 60 * 60 * 1000

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function trustedKeys() {
  const parsed = JSON.parse(required('LICENSE_TRUSTED_PUBLIC_KEYS_JSON'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('LICENSE_TRUSTED_PUBLIC_KEYS_JSON must be a key map')
  }
  return parsed
}

function localAdminClient() {
  return createClient(
    process.env.SUPABASE_INTERNAL_URL || required('NEXT_PUBLIC_SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function sendHeartbeat() {
  const installation = JSON.parse(await readFile(stateFile, 'utf8'))
  if (!installation.activated) return

  const challenge = {
    installationId: installation.installationId,
    nonce: randomBytes(24).toString('base64url'),
    timestamp: new Date().toISOString(),
  }
  const signature = sign(
    null,
    Buffer.from(buildHeartbeatMessage(challenge)),
    installation.privateKey,
  ).toString('base64url')
  const base = required('PEPIUS_LICENSE_API_URL').replace(/\/$/, '')
  const response = await fetch(`${base}/api/licensing/v1/heartbeat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...challenge, signature, version: process.env.npm_package_version || '0.1.0' }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`License heartbeat returned HTTP ${response.status}`)

  const result = await response.json()
  if (!verifyLeaseSignature(result.signedLease, trustedKeys(), installation.installationId)) {
    throw new Error('License heartbeat returned an invalid signed lease')
  }

  const client = localAdminClient()
  const checkedAt = new Date().toISOString()
  const { error } = await client.from('local_license_state').upsert({
    id: 1,
    installation_id: installation.installationId,
    status: result.signedLease.status,
    features: result.signedLease.features,
    issued_at: result.signedLease.issuedAt,
    expires_at: result.signedLease.expiresAt,
    signed_lease: result.signedLease,
    last_heartbeat_at: checkedAt,
    updated_at: checkedAt,
  })
  if (error) throw new Error('Could not save the renewed license locally')
  await chmod(stateFile, 0o600)
  console.log(`License checked at ${checkedAt}: ${result.signedLease.status}`)
}

await mkdir(stateDirectory, { recursive: true, mode: 0o700 })
try {
  await sendHeartbeat()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'License heartbeat failed')
}

const timer = setInterval(async () => {
  try {
    await sendHeartbeat()
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'License heartbeat failed')
  }
}, day)

process.on('SIGTERM', () => {
  clearInterval(timer)
  process.exit(0)
})
process.on('SIGINT', () => {
  clearInterval(timer)
  process.exit(0)
})
