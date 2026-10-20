import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Domínio base do SaaS: usa variável de ambiente ou detecta automaticamente em produção
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || (process.env.VERCEL ? 'pepius-imob.vercel.app' : 'localhost:3000')

/**
 * Resolve o tenant_id com base no hostname da requisição.
 * Suporta subdomínios (imob.pepius.com) e domínios próprios (www.minhaimob.com.br).
 */
async function resolveTenantId(hostname: string): Promise<string | null> {
  // Ignora resolução para o domínio base (portal admin/landing)
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) {
    return null
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Usa cliente anon para consulta pública de roteamento (RLS deve permitir leitura de subdomain/custom_domain)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Tenta encontrar por custom_domain primeiro
  let { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('custom_domain', hostname)
    .eq('active', true)
    .maybeSingle()

  if (data?.id) return data.id

  // Se não encontrou, tenta extrair subdomínio
  const parts = hostname.split('.')
  // Remove www. se presente e verifica se é subdomínio válido
  const cleanHostname = hostname.startsWith('www.') ? hostname.slice(4) : hostname
  const subdomain = cleanHostname.replace(`.${BASE_DOMAIN}`, '')

  if (subdomain && subdomain !== cleanHostname) {
    const { data: subData } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .eq('active', true)
      .maybeSingle()

    if (subData?.id) return subData.id
  }

  return null
}

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname

  // Resolve tenant apenas para rotas públicas do site da imobiliária
  // Admin (/admin) e Dashboard (/dashboard) não precisam de roteamento por domínio
  const isPublicSiteRoute = !request.nextUrl.pathname.startsWith('/admin') &&
                            !request.nextUrl.pathname.startsWith('/dashboard') &&
                            !request.nextUrl.pathname.startsWith('/api/admin') &&
                            !request.nextUrl.pathname.startsWith('/login')

  if (isPublicSiteRoute) {
    const tenantId = await resolveTenantId(hostname)

    if (tenantId) {
      // Injeta o tenant_id nos headers para uso nas Server Components/API Routes
      request.headers.set('x-tenant-id', tenantId)

      // Opcional: reescrever URL interna se necessário para segmentar rotas
      // Por enquanto, mantemos a mesma rota mas com contexto do tenant
    } else if (hostname !== BASE_DOMAIN && hostname !== `www.${BASE_DOMAIN}`) {
      // Domínio desconhecido → redireciona para landing page principal
      return NextResponse.redirect(new URL('/', `https://${BASE_DOMAIN}`))
    }
  }

  // Mantém a atualização de sessão do Supabase (auth cookies)
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}