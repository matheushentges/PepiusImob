import { createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { requestIp } from '@/lib/security/request-origin'
import { bodyErrorResponse, readJsonBody } from '@/lib/security/request-body'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher'

const contactSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  phone: z.string().trim().min(10).max(30).regex(/^[0-9+().\s-]+$/),
  message: z.string().trim().max(2000).optional(),
  preference: z.enum(['manha', 'tarde', 'noite']),
  website: z.string().max(200).optional(),
}).strict()

export async function POST(request: Request) {
  const body = await readJsonBody(request, 8192)
  if (!body.ok) return bodyErrorResponse(body.reason)
  const parsed = contactSchema.safeParse(body.value)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confira os dados do formulário' }, { status: 400 })
  }

  // Honeypot: return the normal success response without storing bot submissions.
  if (parsed.data.website) {
    return NextResponse.json({ success: true }, { status: 201 })
  }

  if (!(await requireActiveLicense('public-listing')) || !(await requireActiveLicense('leads'))) {
    return NextResponse.json({ error: 'A vitrine está temporariamente indisponível' }, { status: 423 })
  }

  const ip = requestIp(request)
  const pepper = process.env.LEAD_RATE_LIMIT_PEPPER
  const tenantId = process.env.PEPIUS_TENANT_ID
  if (!ip || !pepper || !tenantId) {
    return NextResponse.json({ error: 'Contato temporariamente indisponível' }, { status: 503 })
  }

  try {
    const admin = createAdminClient()
    const ipHash = createHmac('sha256', pepper).update(ip).digest('hex')
    const { data: allowed, error: rateError } = await admin.rpc('consume_public_lead_rate_limit', {
      p_ip_hash: ipHash,
      p_window_seconds: 900,
      p_max_requests: 5,
    })
    if (rateError) throw rateError
    if (!allowed) {
      return NextResponse.json({ error: 'Muitas solicitações. Tente novamente mais tarde.' }, { status: 429 })
    }

    const { data: property, error: propertyError } = await admin
      .from('properties')
      .select('id, titulo, preco_venda, preco_locacao, bairro, cidade')
      .eq('id', parsed.data.propertyId)
      .eq('tenant_id', tenantId)
      .eq('status', 'disponivel')
      .maybeSingle()
    if (propertyError || !property) {
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
    }

    const phoneDigits = parsed.data.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const { data: insertedLead, error: insertError } = await admin
      .from('leads')
      .insert({
        tenant_id: tenantId,
        property_id: property.id,
        nome: parsed.data.name,
        email: parsed.data.email || null,
        telefone: parsed.data.phone,
        mensagem: parsed.data.message || null,
        horario_preferido: parsed.data.preference,
        status: 'novo',
      })
      .select('id, created_at')
      .maybeSingle()

    if (insertError) throw insertError

    // Dispara webhook assinado de forma não-bloqueante para o n8n/automações
    dispatchWebhookEvent('lead.created', {
      leadId: insertedLead?.id ?? null,
      nome: parsed.data.name,
      telefone: parsed.data.phone,
      email: parsed.data.email || null,
      mensagem: parsed.data.message || null,
      horarioPreferido: parsed.data.preference,
      imovel: {
        id: property.id,
        titulo: property.titulo,
        precoVenda: property.preco_venda,
        precoLocacao: property.preco_locacao,
        bairro: property.bairro,
        cidade: property.cidade,
      },
      createdAt: insertedLead?.created_at ?? new Date().toISOString(),
    }).catch(() => {})

    return NextResponse.json(
      { success: true },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    console.error('Public lead submission failed')
    return NextResponse.json({ error: 'Não foi possível enviar sua solicitação' }, { status: 503 })
  }
}
