import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import 'server-only'

export const AUTH_COOKIE_NAME = 'sb-pepius-auth-token'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase connection is not configured')
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookieOptions: {
        name: AUTH_COOKIE_NAME,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component não permite set de cookies
          }
        },
      },
    }
  )
}
