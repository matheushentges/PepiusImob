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

function cleanActivationCode(input: string): string {
  let cleaned = input.trim().replace(/^['"]|['"]$/g, '')
  const match = cleaned.match(/(?:--code\s+|code=)?([a-f0-9]{32,128})/i)
  if (match) {
    cleaned = match[1]
  }
  return cleaned
}

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

  const sanitizedCode = cleanActivationCode(parsed.data.activationCode)

  try {
    const result = await activateWithCode(sanitizedCode)
    return NextResponse.json({
      message: 'Licença ativada com sucesso! A vitrine pública e o painel estão operacionais.',
      ...result,
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Falha na ativação da licença'
    let friendlyMessage = rawMessage

    if (rawMessage.includes('invalid or expired')) {
      friendlyMessage = 'O código de ativação é inválido, já foi utilizado ou expirou. Gere um novo código no Portal de Licenças.'
    } else if (rawMessage.includes('Invalid activation request')) {
      friendlyMessage = 'Formato do código de ativação inválido. O código deve conter entre 32 e 128 caracteres hexadecimais.'
    } else if (rawMessage.includes('Invalid installation key')) {
      friendlyMessage = 'A chave criptográfica da instalação é inválida.'
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 400 })
  }
}
