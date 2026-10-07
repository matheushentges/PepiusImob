import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/users/[id] - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar usuário
    const { data: userProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { nome, email, telefone, role, tenant_id } = body

    // Validações
    if (!nome || !email || !role) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, role' },
        { status: 400 }
      )
    }

    if (role !== 'admin' && !tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id é obrigatório para roles que não sejam admin' },
        { status: 400 }
      )
    }

    // Atualizar profile
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({
        tenant_id: role === 'admin' ? null : tenant_id,
        role,
        nome,
        email,
        telefone: telefone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (profileError) {
      console.error('Erro ao atualizar profile:', profileError)
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
    }

    // Atualizar email no Auth (se mudou)
    try {
      await supabase.auth.admin.updateUserById(id, { email })
    } catch (authError) {
      console.error('Erro ao atualizar email no auth:', authError)
      // Não bloqueia a operação se falhar
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Excluir usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Não permitir que admin delete a si mesmo
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta' },
        { status: 400 }
      )
    }

    // Excluir profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileError) {
      console.error('Erro ao excluir profile:', profileError)
      return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 })
    }

    // Excluir usuário do Auth
    try {
      await supabase.auth.admin.deleteUser(id)
    } catch (authError) {
      console.error('Erro ao excluir usuário do auth:', authError)
      // Profile já foi deletado, continua mesmo se auth falhar
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
