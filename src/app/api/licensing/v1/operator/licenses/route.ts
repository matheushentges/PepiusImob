import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  authenticateOperator,
  controlPlaneEnabled,
  createControlPlaneClient,
  resolvedLicenseStatus,
} from '@/lib/licensing/control-plane'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const shippedFeatures = ['public-listing', 'properties', 'leads'] as const
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
})

const issueSchema = z.object({
  agencyName: z.string().trim().min(2).max(160),
  plan: z.string().trim().min(1).max(80),
  features: z.array(z.enum(shippedFeatures)).min(1).max(shippedFeatures.length),
  monthlyAmountCents: z.number().int().min(0).max(100_000_000),
  paidThrough: dateSchema,
}).strict()

function operatorRequired(request: Request) {
  const operator = authenticateOperator(request)
  if (!operator) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  return operator
}

export async function GET(request: Request) {
  if (!controlPlaneEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const operator = operatorRequired(request)
  if (operator instanceof NextResponse) return operator

  try {
    const supabase = createControlPlaneClient()
    const { data, error } = await supabase
      .from('license_accounts')
      .select('id, agency_name, plan, features, monthly_amount_cents, paid_through, manually_suspended, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(
      data.map((account) => ({ ...account, status: resolvedLicenseStatus(account) })),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    console.error('License list failed')
    return NextResponse.json({ error: 'Licenses unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!controlPlaneEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const operator = operatorRequired(request)
  if (operator instanceof NextResponse) return operator
  const body = await readJsonBody(request, 8192)
  if (!body.ok) return bodyErrorResponse(body.reason)

  try {
    const input = issueSchema.parse(body.value)
    const code = randomBytes(32).toString('base64url')
    const codeHash = createHash('sha256').update(code).digest('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const supabase = createControlPlaneClient()
    const { data: licenseId, error } = await supabase.rpc('issue_license_account', {
      p_agency_name: input.agencyName,
      p_plan: input.plan,
      p_features: [...new Set(input.features)],
      p_monthly_amount_cents: input.monthlyAmountCents,
      p_paid_through: input.paidThrough,
      p_code_hash: codeHash,
      p_activation_expires_at: expiresAt,
      p_actor_id: operator.id,
    })

    if (error || !licenseId) throw error ?? new Error('License was not created')
    return NextResponse.json(
      { licenseId, activationCode: code, activationExpiresAt: expiresAt },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid license data' }, { status: 400 })
    }
    console.error('License issue failed')
    return NextResponse.json({ error: 'License could not be created' }, { status: 503 })
  }
}
