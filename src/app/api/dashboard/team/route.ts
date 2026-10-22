import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTeamMemberSchema } from '@/lib/team/validation'

export async function GET() {
  const result = await getAgencyContext()
  if (result.response) return result.response
  const { context } = result

  const { data: members, error } = await context.supabase
    .from('profiles')
    .select('id, nome, email, role, created_at')
    .eq('tenant_id', context.tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: 'Não foi possível carregar os membros da equipe' },
      { status: 500 }
    )
  }

  return NextResponse.json({ members: members ?? [] })
}

export async function POST(request: Request) {
  const result = await getAgencyContext(request)
  if (result.response) return result.response
  const { context } = result

  // Apenas o responsável/proprietário da imobiliária pode cadastrar novos membros
  if (context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas administradores podem cadastrar novos membros da equipe' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
  }

  const parsed = createTeamMemberSchema.safeParse(body)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Dados inválidos'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }

  const { nome, email, password, role } = parsed.data

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'Credenciais de administração do Supabase não configuradas no servidor' },
      { status: 500 }
    )
  }

  // Cria o usuário de autenticação com e-mail já confirmado
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered') || authError?.status === 422) {
      return NextResponse.json(
        { error: 'Já existe um usuário cadastrado com este e-mail' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: authError?.message || 'Falha ao criar o usuário no sistema' },
      { status: 400 }
    )
  }

  // Vincula o perfil rigorosamente ao tenant_id da imobiliária autenticada
  const { data: newProfile, error: profileError } = await adminClient
    .from('profiles')
    .upsert(
      {
        id: authData.user.id,
        nome,
        email,
        role,
        tenant_id: context.tenantId,
      },
      { onConflict: 'id' }
    )
    .select('id, nome, email, role, created_at')
    .single()

  if (profileError) {
    // Reverte o usuário de autenticação criado se houver falha na tabela profiles
    await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {})
    return NextResponse.json(
      { error: 'Falha ao configurar o perfil da imobiliária' },
      { status: 500 }
    )
  }

  return NextResponse.json({ member: newProfile }, { status: 201 })
}
