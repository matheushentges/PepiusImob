import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { generateKeyPairSync, randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { verifyLeaseSignature } from '../src/lib/licensing/domain.ts'

const stateDirectory = process.env.LICENSE_STATE_DIR || join(process.cwd(), '.local', 'license-state')
const stateFile = join(stateDirectory, 'installation.json')

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

async function readInstallation() {
  try {
    return JSON.parse(await readFile(stateFile, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function saveInstallation(value) {
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 })
  await writeFile(stateFile, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  await chmod(stateFile, 0o600)
}

async function persistLease(installationId, signedLease) {
  const client = localAdminClient()
  const { error } = await client.from('local_license_state').upsert({
    id: 1,
    installation_id: installationId,
    status: signedLease.status,
    features: signedLease.features,
    issued_at: signedLease.issuedAt,
    expires_at: signedLease.expiresAt,
    signed_lease: signedLease,
    last_heartbeat_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error('Could not save the signed license locally')
}

function apiUrl(path) {
  const base = required('PEPIUS_LICENSE_API_URL').replace(/\/$/, '')
  const url = new URL(path, `${base}/`)
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('The license API must use HTTPS')
  }
  return url
}

async function activate() {
  const terminal = createInterface({ input, output })
  const activationCode = (process.env.PEPIUS_ACTIVATION_CODE || await terminal.question('Código de ativação: ')).trim()
  terminal.close()
  if (!activationCode) throw new Error('Activation code is required')

  let installation = await readInstallation()
  if (installation?.activated) throw new Error('This installation is already activated')
  if (!installation) {
    const keys = generateKeyPairSync('ed25519')
    installation = {
      installationId: randomUUID(),
      publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
      privateKey: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      activated: false,
    }
    await saveInstallation(installation)
  }

  const response = await fetch(apiUrl('/api/licensing/v1/activate'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      activationCode,
      installationId: installation.installationId,
      publicKey: installation.publicKey,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Activation failed')
  if (result.installationId !== installation.installationId) {
    throw new Error('The control plane returned a different installation ID')
  }
  if (!verifyLeaseSignature(result.signedLease, trustedKeys(), installation.installationId)) {
    throw new Error('The control plane returned an invalid signed license')
  }

  installation.activated = true
  await saveInstallation(installation)
  await persistLease(installation.installationId, result.signedLease)
  console.log(`Instalação ativada: ${installation.installationId}`)
  console.log(`Licença válida até: ${result.signedLease.expiresAt}`)
}

async function showStatus() {
  const installation = await readInstallation()
  const client = localAdminClient()
  const { data, error } = await client
    .from('local_license_state')
    .select('status, features, expires_at, last_heartbeat_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error('Could not read local license state')
  console.log(JSON.stringify({ installationId: installation?.installationId, ...data }, null, 2))
}

const command = process.argv[2]
try {
  if (command === 'activate') await activate()
  else if (command === 'status') await showStatus()
  else {
    console.error('Usage: node scripts/license.mjs <activate|status>')
    process.exitCode = 2
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'License operation failed')
  process.exitCode = 1
}
