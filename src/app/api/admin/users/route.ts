import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/users - Listar todos os usuários
export async function GET() {
  try {
    const supabase = await createClient()

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

    // Buscar usuários
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/admin/users - Criar novo usuário
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

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
    const { email, password, nome, telefone, role, tenant_id } = body

    // Validações
    if (!email || !password || !nome || !role) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, password, nome, role' },
        { status: 400 }
      )
    }

    if (role !== 'admin' && !tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id é obrigatório para roles que não sejam admin' },
        { status: 400 }
      )
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Erro ao criar usuário no auth:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Criar profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        tenant_id: role === 'admin' ? null : tenant_id,
        role,
        nome,
        email,
        telefone: telefone || null,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Erro ao criar profile:', profileError)
      // Tentar limpar o usuário criado no auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Erro ao criar perfil do usuário' }, { status: 500 })
    }

    return NextResponse.json(newProfile, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
