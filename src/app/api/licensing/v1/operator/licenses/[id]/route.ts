import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateOperator, controlPlaneEnabled, createControlPlaneClient, resolvedLicenseStatus } from '@/lib/licensing/control-plane'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const bodySchema = z.object({ suspended: z.boolean() }).strict()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!controlPlaneEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const operator = authenticateOperator(request)
  if (!operator) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Licença não encontrada' }, { status: 404 })
  }
  const body = await readJsonBody(request, 4096)
  if (!body.ok) return bodyErrorResponse(body.reason)

  try {
    const input = bodySchema.parse(body.value)
    const supabase = createControlPlaneClient()
    const { data, error } = await supabase.rpc('set_license_suspension', {
      p_license_id: id,
      p_suspended: input.suspended,
      p_actor_id: operator.id,
    })
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Licença não encontrada' }, { status: 404 })

    const { data: account, error: accountError } = await supabase
      .from('license_accounts')
      .select('features, manually_suspended, paid_through')
      .eq('id', id)
      .maybeSingle()
    if (accountError || !account) throw accountError ?? new Error('License could not be loaded')
    const status = resolvedLicenseStatus(account)

    return NextResponse.json({ success: true, status }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid license data' }, { status: 400 })
    }
    console.error('License suspension update failed')
    return NextResponse.json({ error: 'License could not be updated' }, { status: 503 })
  }
}
