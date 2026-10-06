import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/licenses - Listar todas as licenças
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

    // Buscar licenças
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar licenças:', error)
      return NextResponse.json({ error: 'Erro ao buscar licenças' }, { status: 500 })
    }

    return NextResponse.json(licenses)
  } catch (error) {
    console.error('Erro ao buscar licenças:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/admin/licenses - Criar nova licença
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
    const { tenant_id, plano, valor, inicio, fim, active } = body

    // Validações
    if (!tenant_id || !plano || valor === undefined || !inicio || !fim) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tenant_id, plano, valor, inicio, fim' },
        { status: 400 }
      )
    }

    // Verificar se tenant existe
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Imobiliária não encontrada' }, { status: 404 })
    }

    // Criar licença
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        tenant_id,
        plano,
        valor,
        inicio,
        fim,
        active: active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar licença:', error)
      return NextResponse.json({ error: 'Erro ao criar licença' }, { status: 500 })
    }

    // Atualizar license_expires_at do tenant
    await supabase
      .from('tenants')
      .update({ license_expires_at: fim })
      .eq('id', tenant_id)

    return NextResponse.json(license, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar licença:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
