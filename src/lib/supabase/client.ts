import { createBrowserClient } from '@supabase/ssr'

export const AUTH_COOKIE_NAME = 'sb-pepius-auth-token'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      name: AUTH_COOKIE_NAME,
    },
  })
}

