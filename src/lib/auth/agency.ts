import 'server-only'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSameOriginRequest } from '@/lib/security/request-origin'

export type AgencyContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  tenantId: string
  role: 'imobiliaria_owner' | 'imobiliaria_user'
}

export type AgencyContextResult =
  | { context: AgencyContext; response?: never }
  | { context?: never; response: NextResponse }

export async function getAgencyContext(request?: Request): Promise<AgencyContextResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (
    error ||
    !profile?.tenant_id ||
    (profile.role !== 'imobiliaria_owner' && profile.role !== 'imobiliaria_user')
  ) {
    return { response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }

  if (request && !isSameOriginRequest(request)) {
    return { response: NextResponse.json({ error: 'Origem inválida' }, { status: 403 }) }
  }

  return {
    context: {
      supabase,
      userId: user.id,
      tenantId: profile.tenant_id,
      role: profile.role,
    },
  }
}
