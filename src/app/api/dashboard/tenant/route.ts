import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: 'Perfil não encontrado ou sem imobiliária vinculada' }, { status: 403 })
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, nome, subdomain, custom_domain, domain_verified, site_config')
    .eq('id', profile.tenant_id)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Imobiliária não encontrada' }, { status: 404 })
  }

  return NextResponse.json(tenant)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: 'Perfil não encontrado ou sem imobiliária vinculada' }, { status: 403 })
  }

  // Apenas owner ou admin podem alterar configurações do tenant
  if (profile.role !== 'imobiliaria_owner' && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores da imobiliária podem alterar configurações' }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validação básica de subdomínio
    if (body.subdomain) {
      const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/
      if (!subdomainRegex.test(body.subdomain)) {
        return NextResponse.json(
          { error: 'Subdomínio inválido. Use apenas letras minúsculas, números e hífens.' },
          { status: 400 }
        )
      }

      // Verificar unicidade do subdomínio
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', body.subdomain)
        .neq('id', profile.tenant_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'Este subdomínio já está em uso por outra imobiliária' }, { status: 409 })
      }
    }

    // Validação básica de domínio próprio
    if (body.custom_domain) {
      const { data: existingDomain } = await supabase
        .from('tenants')
        .select('id')
        .eq('custom_domain', body.custom_domain)
        .neq('id', profile.tenant_id)
        .maybeSingle()

      if (existingDomain) {
        return NextResponse.json({ error: 'Este domínio já está vinculado a outra imobiliária' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.subdomain !== undefined) updateData.subdomain = body.subdomain || null
    if (body.custom_domain !== undefined) updateData.custom_domain = body.custom_domain || null
    if (body.site_config !== undefined) updateData.site_config = body.site_config

    // Se o domínio próprio mudou, resetar verificação
    if (body.custom_domain !== undefined) {
      updateData.domain_verified = false
    }

    const { data: updated, error: updateError } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', profile.tenant_id)
      .select('id, nome, subdomain, custom_domain, domain_verified, site_config')
      .single()

    if (updateError) {
      console.error('Error updating tenant config:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/dashboard/tenant:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}