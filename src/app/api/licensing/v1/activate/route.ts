import { createHash, createPublicKey } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createControlPlaneClient, controlPlaneEnabled, resolvedLicenseStatus, signedLease } from '@/lib/licensing/control-plane'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'

const activationSchema = z.object({
  activationCode: z.string().min(32).max(128),
  installationId: z.string().uuid(),
  publicKey: z.string().min(100).max(2048),
}).strict()

export async function POST(request: Request) {
  if (!controlPlaneEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await readJsonBody(request, 4096)
  if (!body.ok) return bodyErrorResponse(body.reason)

  try {
    const input = activationSchema.parse(body.value)
    const publicKey = createPublicKey(input.publicKey)
    if (publicKey.asymmetricKeyType !== 'ed25519') {
      return NextResponse.json({ error: 'Invalid installation key' }, { status: 400 })
    }

    const supabase = createControlPlaneClient()
    const installationId = input.installationId
    const codeHash = createHash('sha256').update(input.activationCode).digest('hex')
    const { data: licenseId, error: activationError } = await supabase.rpc(
      'activate_license_installation',
      {
        p_code_hash: codeHash,
        p_installation_id: installationId,
        p_public_key: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
      },
    )

    if (activationError || !licenseId) {
      return NextResponse.json({ error: 'Activation code is invalid or expired' }, { status: 401 })
    }

    const { data: account, error: accountError } = await supabase
      .from('license_accounts')
      .select('features, manually_suspended, paid_through')
      .eq('id', licenseId)
      .maybeSingle()

    if (accountError || !account) {
      return NextResponse.json({ error: 'License could not be loaded' }, { status: 503 })
    }

    const status = resolvedLicenseStatus(account)
    const lease = signedLease(installationId, status, account.features)
    return NextResponse.json(
      { installationId, signedLease: lease, paidThrough: account.paid_through },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid activation request' }, { status: 400 })
    }
    console.error('License activation failed')
    return NextResponse.json({ error: 'License activation unavailable' }, { status: 503 })
  }
}
