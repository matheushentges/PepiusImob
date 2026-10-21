import { createPublicKey } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyHeartbeat } from '@/lib/licensing/domain'
import { createControlPlaneClient, controlPlaneEnabled, resolvedLicenseStatus, signedLease } from '@/lib/licensing/control-plane'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const heartbeatSchema = z.object({
  installationId: z.string().uuid(),
  nonce: z.string().min(16).max(128),
  timestamp: z.string().datetime(),
  signature: z.string().min(40).max(256),
  version: z.string().max(40).optional(),
}).strict()

export async function POST(request: Request) {
  if (!controlPlaneEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await readJsonBody(request, 4096)
  if (!body.ok) return bodyErrorResponse(body.reason)

  try {
    const input = heartbeatSchema.parse(body.value)
    const supabase = createControlPlaneClient()
    const { data: installation, error: installationError } = await supabase
      .from('license_installations')
      .select('id, license_id, public_key, active')
      .eq('id', input.installationId)
      .maybeSingle()

    if (installationError || !installation?.active) {
      return NextResponse.json({ error: 'Installation is inactive' }, { status: 401 })
    }

    const publicKey = createPublicKey(installation.public_key)
    const challenge = {
      installationId: input.installationId,
      nonce: input.nonce,
      timestamp: input.timestamp,
    }
    if (!verifyHeartbeat(challenge, input.signature, publicKey)) {
      return NextResponse.json({ error: 'Invalid heartbeat signature' }, { status: 401 })
    }

    const { data: account, error: accountError } = await supabase
      .from('license_accounts')
      .select('features, manually_suspended, paid_through')
      .eq('id', installation.license_id)
      .maybeSingle()

    if (accountError || !account) {
      return NextResponse.json({ error: 'License could not be loaded' }, { status: 503 })
    }

    const { error: updateError } = await supabase
      .from('license_installations')
      .update({ last_heartbeat_at: new Date().toISOString() })
      .eq('id', installation.id)

    if (updateError) throw updateError

    const lease = signedLease(
      installation.id,
      resolvedLicenseStatus(account),
      account.features,
    )
    return NextResponse.json(
      { signedLease: lease },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid heartbeat request' }, { status: 400 })
    }
    console.error('License heartbeat failed')
    return NextResponse.json({ error: 'License service unavailable' }, { status: 503 })
  }
}
