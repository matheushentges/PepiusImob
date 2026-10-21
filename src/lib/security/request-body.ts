import 'server-only'

export type BoundedBody<T = Uint8Array> =
  | { ok: true; value: T }
  | { ok: false; reason: 'too-large' | 'invalid' }

export async function readBoundedBody(request: Request, maxBytes: number): Promise<BoundedBody> {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    return { ok: false, reason: 'too-large' }
  }
  if (!request.body) return { ok: true, value: new Uint8Array() }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        return { ok: false, reason: 'too-large' }
      }
      chunks.push(value)
    }
  } catch {
    return { ok: false, reason: 'invalid' }
  }

  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { ok: true, value: body }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<BoundedBody<unknown>> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') return { ok: false, reason: 'invalid' }
  const body = await readBoundedBody(request, maxBytes)
  if (!body.ok) return body
  try {
    return { ok: true, value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body.value)) }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

export function bodyErrorResponse(reason: 'too-large' | 'invalid'): Response {
  const tooLarge = reason === 'too-large'
  return Response.json(
    { error: tooLarge ? 'Requisição muito grande' : 'Requisição inválida' },
    { status: tooLarge ? 413 : 400 },
  )
}
