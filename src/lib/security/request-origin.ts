import 'server-only'

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  if (!origin || !host) return false

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}

export function requestIp(request: Request): string | null {
  // The reverse proxy must overwrite this header with the connecting IP.
  const value = request.headers.get('x-real-ip')?.trim()
  if (!value && process.env.NODE_ENV !== 'production') return '127.0.0.1'
  if (!value || value.length > 64) return null
  return value
}
