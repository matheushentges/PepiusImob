import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Buscar uma imobiliária específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar se o usuário é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    // Buscar a imobiliária
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    if (!tenant) {
      return NextResponse.json({ message: 'Imobiliária não encontrada' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Erro ao buscar imobiliária:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar uma imobiliária
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Verificar se o usuário é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    // Validar dados
    const { nome, slug, email, telefone, active } = body

    if (!nome || !slug || !email) {
      return NextResponse.json(
        { message: 'Nome, slug e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o slug já existe em outra imobiliária
    const { data: existingSlug } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existingSlug) {
      return NextResponse.json(
        { message: 'Este slug já está em uso' },
        { status: 400 }
      )
    }

    // Atualizar a imobiliária
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        nome,
        slug,
        email,
        telefone,
        active: active !== undefined ? active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Erro ao atualizar imobiliária:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar uma imobiliária
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar se o usuário é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se existem dados relacionados
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('tenant_id', id)
      .limit(1)

    if (properties && properties.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível deletar. Existem imóveis cadastrados.' },
        { status: 400 }
      )
    }

    // Deletar a imobiliária
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Imobiliária deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar imobiliária:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
