import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export function getPropertyImagePath(value: string): string | null {
  try {
    const url = new URL(value)
    const objectMarker = '/storage/v1/object/'
    const markerIndex = url.pathname.indexOf(objectMarker)
    if (markerIndex < 0) return null
    const objectPath = url.pathname.slice(markerIndex + objectMarker.length)
    const prefixes = ['public/property-images/', 'sign/property-images/']
    const prefix = prefixes.find((candidate) => objectPath.startsWith(candidate))
    return prefix ? decodeURIComponent(objectPath.slice(prefix.length)) : null
  } catch {
    return value.startsWith('/') ? null : value
  }
}

export async function getSignedPropertyImageUrl(value: string, expiresIn = 300): Promise<string | null> {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (!value.includes('/storage/v1/object/')) {
      return value
    }
  }
  const path = getPropertyImagePath(value)
  if (!path) return null
  const admin = createAdminClient()
  const safeExpiry = Math.max(60, Math.min(Math.floor(expiresIn), 3600))
  const { data, error } = await admin.storage.from('property-images').createSignedUrl(path, safeExpiry)
  if (error) return null

  const signedUrl = new URL(data.signedUrl)
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!publicBase) return null
  const publicUrl = new URL(publicBase)
  publicUrl.pathname = signedUrl.pathname
  publicUrl.search = signedUrl.search
  return publicUrl.toString()
}
