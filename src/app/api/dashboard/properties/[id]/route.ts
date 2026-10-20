import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role === 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role === 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('properties')
      .update({
        titulo: body.titulo,
        descricao: body.descricao,
        tipo: body.tipo,
        finalidade: body.finalidade,
        status: body.status,
        preco_venda: body.preco_venda,
        preco_locacao: body.preco_locacao,
        endereco: body.endereco,
        cidade: body.cidade,
        estado: body.estado,
        cep: body.cep,
        bairro: body.bairro,
        area_total: body.area_total,
        area_construida: body.area_construida,
        quartos: body.quartos,
        banheiros: body.banheiros,
        vagas_garagem: body.vagas_garagem,
      })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating property:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar imóvel' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role === 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}