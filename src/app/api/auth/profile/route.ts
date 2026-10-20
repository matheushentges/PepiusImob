import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Consulta server-side com cookies de sessão — RLS funciona corretamente
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, nome, email, tenant_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'Perfil não encontrado', details: profileError?.message },
      { status: 404 }
    )
  }

  return NextResponse.json(profile)
}