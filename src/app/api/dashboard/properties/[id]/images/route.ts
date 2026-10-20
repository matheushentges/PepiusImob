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

  // Verificar se o imóvel pertence ao tenant
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle()

  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  const { data: images, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', id)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(images || [])
}