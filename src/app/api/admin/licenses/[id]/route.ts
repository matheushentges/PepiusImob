import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/licenses/[id] - Buscar licença por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Buscar licença
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Licença não encontrada' }, { status: 404 })
    }

    return NextResponse.json(license)
  } catch (error) {
    console.error('Erro ao buscar licença:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/admin/licenses/[id] - Atualizar licença
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { tenant_id, plano, valor, inicio, fim, active } = body

    // Validações
    if (!tenant_id || !plano || valor === undefined || !inicio || !fim) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tenant_id, plano, valor, inicio, fim' },
        { status: 400 }
      )
    }

    // Atualizar licença
    const { data: license, error } = await supabase
      .from('licenses')
      .update({
        tenant_id,
        plano,
        valor,
        inicio,
        fim,
        active: active ?? true,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar licença:', error)
      return NextResponse.json({ error: 'Erro ao atualizar licença' }, { status: 500 })
    }

    // Atualizar license_expires_at do tenant
    await supabase
      .from('tenants')
      .update({ license_expires_at: fim })
      .eq('id', tenant_id)

    return NextResponse.json(license)
  } catch (error) {
    console.error('Erro ao atualizar licença:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/admin/licenses/[id] - Excluir licença
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Excluir licença
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao excluir licença:', error)
      return NextResponse.json({ error: 'Erro ao excluir licença' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir licença:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
