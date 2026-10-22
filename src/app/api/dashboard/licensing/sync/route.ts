import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { syncLicenseHeartbeat } from '@/lib/licensing/service'

export async function POST(request: Request) {
  const agencyResult = await getAgencyContext(request)
  if (agencyResult.response) return agencyResult.response

  if (agencyResult.context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas o responsável da imobiliária pode sincronizar manualmente a licença.' },
      { status: 403 },
    )
  }

  try {
    const result = await syncLicenseHeartbeat()
    return NextResponse.json({
      message: 'Licença sincronizada com sucesso junto ao servidor central.',
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha na sincronização da licença'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
