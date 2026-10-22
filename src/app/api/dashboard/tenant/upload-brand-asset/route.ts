import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { getSignedPropertyImageUrl } from '@/lib/storage/property-images'
import { bodyErrorResponse, readBoundedBody } from '@/lib/security/request-body'

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
  if (result.context.role !== 'imobiliaria_owner') {
    return NextResponse.json({ error: 'Apenas o responsável da imobiliária pode alterar a identidade visual' }, { status: 403 })
  }
  if (!(await requireActiveLicense('public-listing'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  // Max 4MB upload payload
  const body = await readBoundedBody(request, 4 * 1024 * 1024)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const contentType = request.headers.get('content-type')
  if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) {
    return NextResponse.json({ error: 'Envie um formulário multipart válido' }, { status: 400 })
  }

  const formRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: new Blob([Buffer.from(body.value)]),
  })

  const formData = await formRequest.formData().catch(() => null)
  const file = formData?.get('file')
  const assetType = formData?.get('type') // 'logo' | 'favicon'

  if (!(file instanceof File) || (assetType !== 'logo' && assetType !== 'favicon')) {
    return NextResponse.json({ error: 'Envie um arquivo de imagem e especifique o tipo (logo ou favicon)' }, { status: 400 })
  }

  const maxAllowedSize = assetType === 'favicon' ? 512 * 1024 : 3 * 1024 * 1024
  if (file.size < 1 || file.size > maxAllowedSize) {
    const limitLabel = assetType === 'favicon' ? '512 KB' : '3 MB'
    return NextResponse.json({ error: `O arquivo excede o tamanho máximo de ${limitLabel}` }, { status: 413 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!validImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: 'Envie uma imagem JPEG, PNG ou WebP válida' }, { status: 400 })
  }

  // Re-encode with sharp to strip EXIF/GPS and resize
  let processedBuffer: Buffer
  try {
    if (assetType === 'favicon') {
      processedBuffer = await sharp(Buffer.from(bytes))
        .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    } else {
      // logo: max 800px width/height, preserving aspect ratio and transparency
      processedBuffer = await sharp(Buffer.from(bytes))
        .rotate()
        .resize({ width: 800, height: 400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer()
    }
  } catch {
    return NextResponse.json({ error: 'Não foi possível processar o arquivo de imagem' }, { status: 400 })
  }

  const extension = assetType === 'favicon' ? 'png' : 'webp'
  const mimeType = assetType === 'favicon' ? 'image/png' : 'image/webp'
  const objectPath = `${result.context.tenantId}/branding/${assetType}-${randomUUID()}.${extension}`

  const { error: uploadError } = await result.context.supabase.storage
    .from('property-images')
    .upload(objectPath, new Blob([new Uint8Array(processedBuffer).buffer as ArrayBuffer], { type: mimeType }), {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Brand asset upload failed', { code: uploadError.name })
    return NextResponse.json({ error: 'Não foi possível salvar o arquivo no armazenamento' }, { status: 503 })
  }

  const signedUrl = await getSignedPropertyImageUrl(objectPath, 3600)

  return NextResponse.json(
    {
      path: objectPath,
      url: signedUrl ?? objectPath,
      type: assetType,
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}
