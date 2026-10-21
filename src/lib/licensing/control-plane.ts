import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'
import { isPastDue, signLease, type LicenseStatus } from './domain'

export type Operator = { id: string; token: string }

export function controlPlaneEnabled(): boolean {
  return process.env.LICENSE_CONTROL_PLANE_ENABLED === 'true'
}

export function createControlPlaneClient() {
  const url = process.env.LICENSE_CONTROL_PLANE_SUPABASE_URL
  const key = process.env.LICENSE_CONTROL_PLANE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Control-plane database is not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function readOperators(): Operator[] {
  const value = process.env.LICENSE_OPERATOR_TOKENS_JSON
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is Operator =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.token === 'string' &&
        item.id.length > 0 &&
        item.token.length >= 32,
    )
  } catch {
    return []
  }
}

export function authenticateOperator(request: Request): Operator | null {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  const presented = Buffer.from(authorization.slice(7))

  for (const operator of readOperators()) {
    const expected = Buffer.from(operator.token)
    if (presented.length === expected.length && timingSafeEqual(presented, expected)) {
      return operator
    }
  }
  return null
}

export function signedLease(
  installationId: string,
  status: LicenseStatus,
  features: string[],
  now = new Date(),
) {
  const keyId = process.env.LICENSE_SIGNING_KEY_ID
  const privateKeyBase64 = process.env.LICENSE_SIGNING_PRIVATE_KEY_BASE64
  if (!keyId || !privateKeyBase64) throw new Error('License signing key is not configured')

  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8')
  const issuedAt = now.toISOString()
  return signLease(
    {
      installationId,
      status,
      features,
      issuedAt,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      keyId,
    },
    privateKey,
  )
}

export function resolvedLicenseStatus(account: {
  manually_suspended: boolean
  paid_through: string
}, now = Date.now()): LicenseStatus {
  return account.manually_suspended || isPastDue(account.paid_through, now)
    ? 'suspended'
    : 'active'
}

export async function recordAudit(
  supabase: ReturnType<typeof createControlPlaneClient>,
  input: {
    actorId: string
    action: string
    licenseId?: string | null
    installationId?: string | null
    details?: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await supabase.from('license_audit_events').insert({
    actor_id: input.actorId,
    action: input.action,
    license_id: input.licenseId ?? null,
    installation_id: input.installationId ?? null,
    details: input.details ?? {},
  })
  if (error) throw new Error('Unable to record license audit event')
}
