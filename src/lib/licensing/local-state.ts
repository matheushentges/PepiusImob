import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyLease, type SignedLicenseLease } from './domain'

export type LocalLicenseAccess = {
  active: boolean
  status: 'active' | 'suspended' | 'inactive' | 'expired' | 'unavailable'
  features: string[]
  expiresAt: string | null
}

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
  if (process.env.NODE_ENV === 'production') return false

  return true
}

export async function getLocalLicenseAccess(): Promise<LocalLicenseAccess> {
  if (developmentLicenseBypassEnabled()) {
    return { active: true, status: 'active', features: ['public-listing', 'properties', 'leads'], expiresAt: null }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('local_license_state')
      .select('installation_id, status, features, expires_at, signed_lease')
      .eq('id', 1)
      .maybeSingle()

    if (error) return { active: false, status: 'unavailable', features: [], expiresAt: null }
    if (!data?.installation_id || !data.signed_lease) {
      return { active: false, status: 'inactive', features: [], expiresAt: null }
    }

    const lease = data.signed_lease as unknown as SignedLicenseLease
    if (lease.status === 'suspended') {
      return { active: false, status: 'suspended', features: [], expiresAt: data.expires_at }
    }

    const active = verifyLease(
      lease,
      trustedKeys(),
      data.installation_id,
      Date.now(),
    )

    return {
      active,
      status: active ? 'active' : 'expired',
      features: active ? lease.features : [],
      expiresAt: data.expires_at,
    }
  } catch {
    return { active: false, status: 'unavailable', features: [], expiresAt: null }
  }
}

export async function requireActiveLicense(feature?: string): Promise<boolean> {
  const access = await getLocalLicenseAccess()
  return access.active && (!feature || access.features.includes(feature))
}

export async function canReadLicensedFeature(feature: string): Promise<boolean> {
  const access = await getLocalLicenseAccess()
  return !access.active || access.features.includes(feature)
}
