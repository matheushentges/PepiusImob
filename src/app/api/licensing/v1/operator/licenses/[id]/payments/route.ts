import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateOperator, controlPlaneEnabled, createControlPlaneClient } from '@/lib/licensing/control-plane'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const paymentDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}).refine((value) => value >= new Date().toISOString().slice(0, 10))

const paymentSchema = z.object({
  amountCents: z.number().int().positive().max(100_000_000),
  paidThrough: paymentDateSchema,
  reference: z.string().trim().max(160).optional(),
}).strict()

export async function POST(
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
    const input = paymentSchema.parse(body.value)
    const supabase = createControlPlaneClient()
    const { data, error } = await supabase.rpc('record_license_payment', {
      p_license_id: id,
      p_amount_cents: input.amountCents,
      p_paid_through: input.paidThrough,
      p_reference: input.reference ?? '',
      p_actor_id: operator.id,
    })
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Licença não encontrada' }, { status: 404 })

    return NextResponse.json({ success: true, status: 'active' }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 })
    }
    console.error('License payment could not be recorded')
    return NextResponse.json({ error: 'Payment could not be recorded' }, { status: 503 })
  }
}
