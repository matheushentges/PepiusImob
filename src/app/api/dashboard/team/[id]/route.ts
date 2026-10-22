import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAgencyContext(request)
  if (result.response) return result.response
  const { context } = result

  // Apenas o responsável/proprietário da imobiliária pode remover membros
  if (context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas administradores podem remover membros da equipe' },
      { status: 403 }
    )
  }

  const { id: memberId } = await params

  if (!memberId || typeof memberId !== 'string') {
    return NextResponse.json({ error: 'ID de membro inválido' }, { status: 400 })
  }

  // Impede que o próprio responsável se auto-exclua
  if (memberId === context.userId) {
    return NextResponse.json(
      { error: 'Você não pode remover o seu próprio usuário' },
      { status: 400 }
    )
  }

  // Verifica se o membro existe e pertence estritamente ao tenant da imobiliária
  const { data: member, error: findError } = await context.supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('id', memberId)
    .maybeSingle()

  if (findError || !member || member.tenant_id !== context.tenantId) {
    return NextResponse.json(
      { error: 'Membro não encontrado ou não pertence a esta imobiliária' },
      { status: 404 }
    )
  }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'Credenciais de administração do Supabase não configuradas no servidor' },
      { status: 500 }
    )
  }

  // Exclui do banco de profiles
  await adminClient.from('profiles').delete().eq('id', memberId)

  // Exclui do Supabase Auth
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(memberId)
  if (deleteAuthError) {
    return NextResponse.json(
      { error: 'Falha ao remover a conta de autenticação do usuário' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, message: 'Membro removido com sucesso' })
}
