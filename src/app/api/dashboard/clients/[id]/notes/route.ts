import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { clientNoteInputSchema } from '@/lib/clients/validation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response

  if (!(await requireActiveLicense('properties'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const { tenantId, userId, supabase } = result.context
  const { id: clientId } = await params
  const body = await readJsonBody(request, 16_384)
  if (!body.ok) return bodyErrorResponse(body.reason)

  const parsed = clientNoteInputSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Conteúdo da anotação inválido', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // Verifica se o cliente existe no mesmo tenant
  const { data: clientExists } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!clientExists) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const { data: note, error: noteError } = await supabase
    .from('client_notes')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      autor_id: userId,
      conteudo: parsed.data.conteudo.trim(),
    })
    .select(`
      id,
      tenant_id,
      client_id,
      autor_id,
      conteudo,
      created_at,
      profiles:autor_id (
        id,
        nome
      )
    `)
    .single()

  if (noteError) {
    console.error('Note insert failed', { code: noteError.code })
    return NextResponse.json({ error: 'Não foi possível salvar a anotação' }, { status: 500 })
  }

  const noteWithProfile = note as unknown as {
    id: string
    tenant_id: string
    client_id: string
    autor_id: string | null
    conteudo: string
    created_at: string
    profiles?: { id: string; nome: string | null } | null
  }

  return NextResponse.json({
    note: {
      id: noteWithProfile.id,
      tenant_id: noteWithProfile.tenant_id,
      client_id: noteWithProfile.client_id,
      autor_id: noteWithProfile.autor_id,
      autor_nome: noteWithProfile.profiles?.nome || 'Você',
      conteudo: noteWithProfile.conteudo,
      created_at: noteWithProfile.created_at,
    },
  }, { status: 201 })
}
