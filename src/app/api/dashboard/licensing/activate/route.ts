import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAgencyContext } from '@/lib/auth/agency'
import { activateWithCode } from '@/lib/licensing/service'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const activateSchema = z
  .object({
    activationCode: z
      .string()
      .trim()
      .min(8, 'Código de ativação muito curto')
      .max(128, 'Código de ativação inválido'),
  })
  .strict()

export async function POST(request: Request) {
  const agencyResult = await getAgencyContext(request)
  if (agencyResult.response) return agencyResult.response

  if (agencyResult.context.role !== 'imobiliaria_owner') {
    return NextResponse.json(
      { error: 'Apenas o responsável da imobiliária tem permissão para ativar ou renovar a licença.' },
      { status: 403 },
    )
  }

  const body = await readJsonBody(request, 2048)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = activateSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Código de ativação inválido' },
      { status: 400 },
    )
  }

  try {
    const result = await activateWithCode(parsed.data.activationCode)
    return NextResponse.json({
      message: 'Licença ativada com sucesso! A vitrine pública e o painel estão operacionais.',
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha na ativação da licença'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
