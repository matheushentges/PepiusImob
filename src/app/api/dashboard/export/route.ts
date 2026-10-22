import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSignedPropertyImageUrl } from '@/lib/storage/property-images'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await getAgencyContext()
  if (!result.context) return result.response

  const admin = createAdminClient()
  const tenantId = result.context.tenantId
  const [tenantResult, propertiesResult, leadsResult] = await Promise.all([
    admin.from('tenants').select('id, nome').eq('id', tenantId).maybeSingle(),
    admin.from('properties')
      .select('id, titulo, descricao, tipo, finalidade, status, featured, preco_venda, preco_locacao, endereco, cidade, estado, cep, bairro, area_total, area_construida, quartos, banheiros, vagas_garagem, created_at, updated_at')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    admin.from('leads')
      .select('id, property_id, nome, email, telefone, mensagem, horario_preferido, status, created_at')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false }),
  ])

  if (tenantResult.error || !tenantResult.data || propertiesResult.error || leadsResult.error) {
    console.error('Agency export query failed', {
      tenantCode: tenantResult.error?.code,
      propertiesCode: propertiesResult.error?.code,
      leadsCode: leadsResult.error?.code,
    })
    return NextResponse.json({ error: 'Não foi possível exportar os dados' }, { status: 503 })
  }

  const propertyIds = (propertiesResult.data ?? []).map((property) => property.id)
  const imagesResult = propertyIds.length
    ? await admin.from('property_images')
      .select('id, property_id, url, ordem, is_cover, created_at')
      .in('property_id', propertyIds)
      .order('ordem', { ascending: true })
    : { data: [], error: null }

  if (imagesResult.error) {
    console.error('Agency image export query failed', { code: imagesResult.error.code })
    return NextResponse.json({ error: 'Não foi possível exportar as imagens' }, { status: 503 })
  }

  const images = await Promise.all((imagesResult.data ?? []).map(async (image) => ({
    id: image.id,
    property_id: image.property_id,
    ordem: image.ordem,
    is_cover: image.is_cover,
    created_at: image.created_at,
    download_url: await getSignedPropertyImageUrl(image.url, 3600),
    url_expires_in_seconds: 3600,
  })))

  const exportData = {
    format: 'pepius-imob-export-v1',
    exported_at: new Date().toISOString(),
    agency: tenantResult.data,
    properties: propertiesResult.data,
    leads: leadsResult.data,
    images,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pepius-imob-export.json"',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
