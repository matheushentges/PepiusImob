import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { getSignedPropertyImageUrl } from '@/lib/storage/property-images'
import { canReadLicensedFeature } from '@/lib/licensing/local-state'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getAgencyContext()
  if (!result.context) return result.response
  if (!(await canReadLicensedFeature('properties'))) {
    return NextResponse.json({ error: 'Esta funcionalidade não está incluída na licença' }, { status: 403 })
  }
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
  }

  const { data: property } = await result.context.supabase
    .from('properties')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', result.context.tenantId)
    .maybeSingle()
  if (!property) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })

  const { data, error } = await result.context.supabase
    .from('property_images')
    .select('id, property_id, url, ordem, is_cover, created_at')
    .eq('property_id', id)
    .order('ordem', { ascending: true })
  if (error) {
    console.error('Property image list failed', { code: error.code })
    return NextResponse.json({ error: 'Não foi possível carregar as imagens' }, { status: 503 })
  }

  const images = await Promise.all((data ?? []).map(async (image) => ({
    ...image,
    url: await getSignedPropertyImageUrl(image.url),
  })))
  return NextResponse.json(images, { headers: { 'Cache-Control': 'no-store' } })
}
