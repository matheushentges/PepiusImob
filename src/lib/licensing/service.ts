import 'server-only'

import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { generateKeyPairSync, randomBytes, randomUUID, sign } from 'node:crypto'
import { join } from 'node:path'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildHeartbeatMessage,
  formatRemainingTime,
  MAX_LEASE_AGE_MS,
  verifyLease,
  verifyLeaseSignature,
  type LicenseStatus,
  type SignedLicenseLease,
} from './domain'

export interface LicenseStatusDetails {
  active: boolean
  status: 'active' | 'inactive' | 'suspended' | 'expired' | 'unavailable'
  installationId: string | null
  issuedAt: string | null
  expiresAt: string | null
  lastHeartbeatAt: string | null
  features: string[]
  remainingMs: number
  remainingDays: number
  remainingHours: number
  remainingMinutes: number
  remainingFormatted: string
  validityPercentage: number
  isDevBypass: boolean
}

interface LocalInstallation {
  installationId: string
  publicKey: string
  privateKey: string
  activated: boolean
}

const stateDirectory = process.env.LICENSE_STATE_DIR || join(process.cwd(), '.local', 'license-state')
const stateFile = join(stateDirectory, 'installation.json')

let memoryInstallation: LocalInstallation | null = null

function trustedKeys(): Record<string, string> {
  const value = process.env.LICENSE_TRUSTED_PUBLIC_KEYS_JSON
  if (!value) return {}

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    )
  } catch {
    return {}
  }
}

function developmentLicenseBypassEnabled(): boolean {
  if (process.env.LICENSE_DEV_BYPASS !== 'true') return false
  if (process.env.VERCEL_ENV === 'production') return false

  return process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview'
}

function resolveControlPlaneUrl(): string {
  const customUrl = process.env.PEPIUS_LICENSE_API_URL
  if (customUrl) return customUrl.replace(/\/$/, '')

  if (process.env.NEXT_PUBLIC_APP_URL && process.env.LICENSE_CONTROL_PLANE_ENABLED === 'true') {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  // Fallback canônico para a API do portal Pepius
  return 'https://pepius-imob.vercel.app'
}

export async function readInstallation(): Promise<LocalInstallation | null> {
  if (memoryInstallation) return memoryInstallation

  try {
    const raw = await readFile(stateFile, 'utf8')
    const parsed = JSON.parse(raw) as LocalInstallation
    if (parsed && typeof parsed.installationId === 'string') {
      memoryInstallation = parsed
      return parsed
    }
  } catch {
    // Arquivo não existe ainda ou filesystem não permite leitura
  }

  return null
}

export async function getOrCreateInstallation(): Promise<LocalInstallation> {
  const existing = await readInstallation()
  if (existing) return existing

  const keys = generateKeyPairSync('ed25519')
  const installation: LocalInstallation = {
    installationId: randomUUID(),
    publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKey: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    activated: false,
  }

  memoryInstallation = installation

  try {
    await mkdir(stateDirectory, { recursive: true, mode: 0o700 })
    await writeFile(stateFile, `${JSON.stringify(installation, null, 2)}\n`, { mode: 0o600 })
    await chmod(stateFile, 0o600)
  } catch {
    // Em ambientes serverless somente-leitura, a chave permanece em memória
  }

  return installation
}

export async function saveInstallation(installation: LocalInstallation): Promise<void> {
  memoryInstallation = installation
  try {
    await mkdir(stateDirectory, { recursive: true, mode: 0o700 })
    await writeFile(stateFile, `${JSON.stringify(installation, null, 2)}\n`, { mode: 0o600 })
    await chmod(stateFile, 0o600)
  } catch {
    // Ignora se o filesystem for read-only
  }
}

export async function getLicenseStatusDetails(): Promise<LicenseStatusDetails> {
  if (developmentLicenseBypassEnabled()) {
    return {
      active: true,
      status: 'active',
      installationId: 'dev-bypass-local',
      issuedAt: new Date().toISOString(),
      expiresAt: null,
      lastHeartbeatAt: new Date().toISOString(),
      features: ['public-listing', 'properties', 'leads'],
      remainingMs: MAX_LEASE_AGE_MS,
      remainingDays: 7,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingFormatted: 'Modo de desenvolvimento (Bypass ativo)',
      validityPercentage: 100,
      isDevBypass: true,
    }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('local_license_state')
      .select('installation_id, status, features, issued_at, expires_at, signed_lease, last_heartbeat_at')
      .eq('id', 1)
      .maybeSingle()

    if (error || !data) {
      return {
        active: false,
        status: 'inactive',
        installationId: null,
        issuedAt: null,
        expiresAt: null,
        lastHeartbeatAt: null,
        features: [],
        remainingMs: 0,
        remainingDays: 0,
        remainingHours: 0,
        remainingMinutes: 0,
        remainingFormatted: 'Não ativada',
        validityPercentage: 0,
        isDevBypass: false,
      }
    }

    const installationId = data.installation_id
    const expiresAt = data.expires_at
    const issuedAt = data.issued_at
    const lastHeartbeatAt = data.last_heartbeat_at
    const now = Date.now()
    const expiresAtMs = expiresAt ? Date.parse(expiresAt) : null
    const remainingMs = expiresAtMs ? Math.max(0, expiresAtMs - now) : 0
    const totalMinutes = Math.floor(remainingMs / (60 * 1000))
    const remainingDays = Math.floor(totalMinutes / (24 * 60))
    const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const remainingMinutes = totalMinutes % 60
    const remainingFormatted = formatRemainingTime(remainingMs, expiresAt)
    const validityPercentage = Math.min(100, Math.max(0, Math.round((remainingMs / MAX_LEASE_AGE_MS) * 100)))

    const lease = data.signed_lease as unknown as SignedLicenseLease | null
    if (!installationId || !lease) {
      return {
        active: false,
        status: 'inactive',
        installationId: null,
        issuedAt: null,
        expiresAt: null,
        lastHeartbeatAt: null,
        features: [],
        remainingMs: 0,
        remainingDays: 0,
        remainingHours: 0,
        remainingMinutes: 0,
        remainingFormatted: 'Aguardando código de ativação',
        validityPercentage: 0,
        isDevBypass: false,
      }
    }

    if (lease.status === 'suspended') {
      return {
        active: false,
        status: 'suspended',
        installationId,
        issuedAt,
        expiresAt,
        lastHeartbeatAt,
        features: [],
        remainingMs,
        remainingDays,
        remainingHours,
        remainingMinutes,
        remainingFormatted: 'Suspensa comercialmente',
        validityPercentage: 0,
        isDevBypass: false,
      }
    }

    const active = verifyLease(lease, trustedKeys(), installationId, now)

    return {
      active,
      status: active ? 'active' : 'expired',
      installationId,
      issuedAt,
      expiresAt,
      lastHeartbeatAt,
      features: active ? lease.features : [],
      remainingMs,
      remainingDays,
      remainingHours,
      remainingMinutes,
      remainingFormatted,
      validityPercentage,
      isDevBypass: false,
    }
  } catch {
    return {
      active: false,
      status: 'unavailable',
      installationId: null,
      issuedAt: null,
      expiresAt: null,
      lastHeartbeatAt: null,
      features: [],
      remainingMs: 0,
      remainingDays: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingFormatted: 'Serviço temporariamente indisponível',
      validityPercentage: 0,
      isDevBypass: false,
    }
  }
}

export async function activateWithCode(rawCode: string): Promise<{
  success: boolean
  status: LicenseStatus
  expiresAt: string
  features: string[]
  installationId: string
}> {
  const activationCode = rawCode.trim()
  if (!activationCode || activationCode.length < 8) {
    throw new Error('Código de ativação inválido. Forneça o código completo.')
  }

  const installation = await getOrCreateInstallation()
  const base = resolveControlPlaneUrl()
  const activateUrl = `${base}/api/licensing/v1/activate`

  let response: Response
  try {
    response = await fetch(activateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activationCode,
        installationId: installation.installationId,
        publicKey: installation.publicKey,
      }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Falha na conexão'
    throw new Error(`Não foi possível conectar ao servidor de licenças (${msg})`)
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errorMsg =
      typeof result.error === 'string'
        ? result.error
        : `Erro ${response.status} ao validar código de ativação`
    throw new Error(errorMsg)
  }

  if (result.installationId !== installation.installationId) {
    throw new Error('O servidor de licenças retornou uma identidade de instalação divergente')
  }

  const lease = result.signedLease as SignedLicenseLease
  const keys = trustedKeys()
  if (!verifyLeaseSignature(lease, keys, installation.installationId)) {
    throw new Error('A assinatura criptográfica da licença não pôde ser verificada')
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { error: dbError } = await admin.from('local_license_state').upsert({
    id: 1,
    installation_id: installation.installationId,
    status: lease.status,
    features: lease.features,
    issued_at: lease.issuedAt,
    expires_at: lease.expiresAt,
    signed_lease: lease,
    last_heartbeat_at: now,
    updated_at: now,
  })

  if (dbError) {
    throw new Error(`Erro ao gravar a licença no banco local: ${dbError.message}`)
  }

  installation.activated = true
  await saveInstallation(installation)

  return {
    success: true,
    status: lease.status,
    expiresAt: lease.expiresAt,
    features: lease.features,
    installationId: installation.installationId,
  }
}

export async function syncLicenseHeartbeat(): Promise<{
  success: boolean
  status: LicenseStatus
  expiresAt: string
  features: string[]
  lastHeartbeatAt: string
}> {
  const installation = await readInstallation()
  if (!installation || !installation.activated) {
    throw new Error('A instalação ainda não foi ativada. Informe um código de licença antes de sincronizar.')
  }

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

  const base = resolveControlPlaneUrl()
  const heartbeatUrl = `${base}/api/licensing/v1/heartbeat`

  let response: Response
  try {
    response = await fetch(heartbeatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...challenge,
        signature,
        version: process.env.npm_package_version || '0.1.0',
      }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Falha na conexão'
    throw new Error(`Não foi possível checar a licença com o servidor (${msg})`)
  }

  if (!response.ok) {
    throw new Error(`O servidor retornou HTTP ${response.status} na checagem de licença`)
  }

  const result = await response.json().catch(() => ({}))
  const lease = result.signedLease as SignedLicenseLease
  const keys = trustedKeys()
  if (!verifyLeaseSignature(lease, keys, installation.installationId)) {
    throw new Error('O servidor retornou uma renovação de licença com assinatura inválida')
  }

  const admin = createAdminClient()
  const checkedAt = new Date().toISOString()
  const { error: dbError } = await admin.from('local_license_state').upsert({
    id: 1,
    installation_id: installation.installationId,
    status: lease.status,
    features: lease.features,
    issued_at: lease.issuedAt,
    expires_at: lease.expiresAt,
    signed_lease: lease,
    last_heartbeat_at: checkedAt,
    updated_at: checkedAt,
  })

  if (dbError) {
    throw new Error('Não foi possível atualizar a licença renovada no banco local')
  }

  return {
    success: true,
    status: lease.status,
    expiresAt: lease.expiresAt,
    features: lease.features,
    lastHeartbeatAt: checkedAt,
  }
}
