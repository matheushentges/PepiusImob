import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Consulta server-side com service-role para obter o perfil do usuário já autenticado
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'Perfil não encontrado' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { role: profile.role, tenant_id: profile.tenant_id },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
