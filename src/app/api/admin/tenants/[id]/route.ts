import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/tenants/[id] - Buscar imobiliária por ID
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

    // Buscar tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Imobiliária não encontrada' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Erro ao buscar tenant:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/admin/tenants/[id] - Atualizar imobiliária
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
    const { nome, slug, email, telefone, logo_url, active } = body

    // Validações básicas
    if (!nome || !slug || !email || !telefone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, slug, email, telefone' },
        { status: 400 }
      )
    }

    // Verificar se slug já existe (exceto para o próprio tenant)
    const { data: existingSlug } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .neq('id', params.id)
      .single()

    if (existingSlug) {
      return NextResponse.json({ error: 'Slug já está em uso' }, { status: 400 })
    }

    // Atualizar tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        nome,
        slug,
        email,
        telefone,
        logo_url: logo_url || null,
        active: active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tenant:', error)
      return NextResponse.json({ error: 'Erro ao atualizar imobiliária' }, { status: 500 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/admin/tenants/[id] - Excluir imobiliária
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

    // Verificar se há dados relacionados (imóveis, usuários, etc)
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', params.id)

    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', params.id)

    if ((propertiesCount ?? 0) > 0 || (usersCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir imobiliária com imóveis ou usuários cadastrados' },
        { status: 400 }
      )
    }

    // Excluir licenças primeiro (FK constraint)
    await supabase
      .from('licenses')
      .delete()
      .eq('tenant_id', params.id)

    // Excluir tenant
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao excluir tenant:', error)
      return NextResponse.json({ error: 'Erro ao excluir imobiliária' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir tenant:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
