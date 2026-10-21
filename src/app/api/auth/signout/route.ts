import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSameOriginRequest } from '@/lib/security/request-origin'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Origem inválida' }, { status: 403 })
  }
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
