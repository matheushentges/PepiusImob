import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { getLicenseStatusDetails } from '@/lib/licensing/service'

export async function GET(request: Request) {
  const result = await getAgencyContext(request)
  if (result.response) return result.response

  try {
    const details = await getLicenseStatusDetails()
    return NextResponse.json({
      ...details,
      userRole: result.context.role,
      canManage: result.context.role === 'imobiliaria_owner',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao consultar licença'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
