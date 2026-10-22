import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { getPropertyImagePath, getSignedPropertyImageUrl } from '@/lib/storage/property-images'
import { bodyErrorResponse, readBoundedBody, readJsonBody } from '@/lib/security/request-body'

const imageIdSchema = z.string().uuid()
const updateSchema = z.object({
  id: z.string().uuid(),
  is_cover: z.boolean().optional(),
  ordem: z.number().int().min(0).max(1000).optional(),
}).strict().refine((value) => value.is_cover !== undefined || value.ordem !== undefined)

function validImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === 'image/png') return Buffer.from(bytes.slice(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mime === 'image/webp') {
    return Buffer.from(bytes.slice(0, 4)).toString() === 'RIFF' && Buffer.from(bytes.slice(8, 12)).toString() === 'WEBP'
  }
  return false
}

export async function POST(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }
  const body = await readBoundedBody(request, 6 * 1024 * 1024)
  if (!body.ok) return bodyErrorResponse(body.reason)
  const contentType = request.headers.get('content-type')
  if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) {
    return NextResponse.json({ error: 'Envie um formulário de imagem válido' }, { status: 400 })
  }
  const formRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: new Blob([Buffer.from(body.value)]),
  })
  const formData = await formRequest.formData().catch(() => null)
  const file = formData?.get('file')
  const propertyId = formData?.get('property_id')
  if (!(file instanceof File) || typeof propertyId !== 'string' || !imageIdSchema.safeParse(propertyId).success) {
    return NextResponse.json({ error: 'Arquivo ou imóvel inválido' }, { status: 400 })
  }
  if (file.size < 1 || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'A imagem deve ter no máximo 5 MB' }, { status: 413 })
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!validImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: 'Envie uma imagem JPEG, PNG ou WebP válida' }, { status: 400 })
  }

  // Re-encoding drops EXIF/GPS metadata and caps the stored dimensions.
  let storedImage: Buffer
  try {
    const pipeline = sharp(Buffer.from(bytes))
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    storedImage = file.type === 'image/png'
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : file.type === 'image/webp'
        ? await pipeline.webp({ quality: 82 }).toBuffer()
        : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  } catch {
    return NextResponse.json({ error: 'Não foi possível processar a imagem' }, { status: 400 })
  }

  const { data: property } = await result.context.supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('tenant_id', result.context.tenantId)
    .maybeSingle()
  if (!property) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const objectPath = `${result.context.tenantId}/${propertyId}/${randomUUID()}.${extension}`
  const { error: uploadError } = await result.context.supabase.storage
    .from('property-images')
    .upload(objectPath, new Blob([new Uint8Array(storedImage).buffer as ArrayBuffer], { type: file.type }), {
      contentType: file.type,
      cacheControl: '300',
      upsert: false,
    })

  if (uploadError) {
    console.error('Property image upload failed', { code: uploadError.name })
    return NextResponse.json({ error: 'Não foi possível enviar a imagem' }, { status: 503 })
  }

  const { data: image, error: insertError } = await result.context.supabase
    .from('property_images')
    .insert({ property_id: propertyId, url: objectPath, ordem: 0, is_cover: false })
    .select('id, property_id, url, ordem, is_cover, created_at')
    .single()

  if (insertError || !image) {
    await result.context.supabase.storage.from('property-images').remove([objectPath])
    console.error('Property image record failed', { code: insertError?.code })
    return NextResponse.json({ error: 'Não foi possível registrar a imagem' }, { status: 503 })
  }

  return NextResponse.json(
    { ...image, url: await getSignedPropertyImageUrl(objectPath) },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function PATCH(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const body = await readJsonBody(request, 4096)
  if (!body.ok) return bodyErrorResponse(body.reason)
  const input = updateSchema.safeParse(body.value)
  if (!input.success) return NextResponse.json({ error: 'Dados da imagem inválidos' }, { status: 400 })
  const { data: image } = await result.context.supabase
    .from('property_images')
    .select('id, property_id, properties!inner(tenant_id)')
    .eq('id', input.data.id)
    .maybeSingle()
  const propertyRelation = Array.isArray(image?.properties) ? image.properties[0] : image?.properties
  if (!image || propertyRelation?.tenant_id !== result.context.tenantId) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
  }

  if (input.data.is_cover === true) {
    const { error: clearError } = await result.context.supabase
      .from('property_images')
      .update({ is_cover: false })
      .eq('property_id', image.property_id)
      .neq('id', image.id)
    if (clearError) return NextResponse.json({ error: 'Não foi possível atualizar a capa' }, { status: 503 })
  }

  const update = {
    ...(input.data.is_cover === undefined ? {} : { is_cover: input.data.is_cover }),
    ...(input.data.ordem === undefined ? {} : { ordem: input.data.ordem }),
  }
  const { data, error } = await result.context.supabase
    .from('property_images')
    .update(update)
    .eq('id', image.id)
    .select('id, property_id, url, ordem, is_cover, created_at')
    .single()
  if (error || !data) {
    console.error('Property image update failed', { code: error?.code })
    return NextResponse.json({ error: 'Não foi possível atualizar a imagem' }, { status: 503 })
  }
  return NextResponse.json({ ...data, url: await getSignedPropertyImageUrl(data.url) })
}

export async function DELETE(request: Request) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response
  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id || !imageIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
  }
  const { data: image } = await result.context.supabase
    .from('property_images')
    .select('id, url, properties!inner(tenant_id)')
    .eq('id', id)
    .maybeSingle()
  const propertyRelation = Array.isArray(image?.properties) ? image.properties[0] : image?.properties
  if (!image || propertyRelation?.tenant_id !== result.context.tenantId) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
  }

  const path = getPropertyImagePath(image.url)
  const { error } = await result.context.supabase.from('property_images').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Não foi possível excluir a imagem' }, { status: 503 })
  if (path) {
    const { error: storageError } = await result.context.supabase.storage.from('property-images').remove([path])
    if (storageError) {
      console.error('Property image storage cleanup failed', { code: storageError.name })
    }
  }
  return NextResponse.json({ success: true })
}
