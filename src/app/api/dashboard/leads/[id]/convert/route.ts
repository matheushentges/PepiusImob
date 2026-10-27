import { NextResponse } from 'next/server'
import { getAgencyContext } from '@/lib/auth/agency'
import { requireActiveLicense } from '@/lib/licensing/local-state'
import { sanitizeDocument } from '@/lib/clients/validation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getAgencyContext(request)
  if (!result.context) return result.response

  if (!(await requireActiveLicense('leads'))) {
    return NextResponse.json({ error: 'A licença não permite alterações neste momento' }, { status: 423 })
  }

  const { tenantId, userId, supabase } = result.context
  const { id: leadId } = await params

  // 1. Busca os dados do lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(`
      id,
      tenant_id,
      property_id,
      client_id,
      nome,
      email,
      telefone,
      mensagem,
      status,
      properties (
        id,
        titulo,
        tipo,
        finalidade,
        bairro
      )
    `)
    .eq('id', leadId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  }

  // Se o lead já foi convertido anteriormente
  if (lead.client_id) {
    return NextResponse.json({
      message: 'Lead já convertido em cliente anteriormente',
      clientId: lead.client_id,
    })
  }

  const prop = lead.properties as any
  const finalidade = prop?.finalidade === 'locacao' ? 'locatario' : 'comprador'

  // 2. Insere o novo cliente
  const { data: newClient, error: clientInsertError } = await supabase
    .from('clients')
    .insert({
      tenant_id: tenantId,
      tipo_pessoa: 'pf',
      papeis: [finalidade],
      status: 'ativo',
      nome: lead.nome.trim(),
      email: lead.email?.trim() || null,
      telefone: lead.telefone?.trim() || '',
      corretor_id: userId,
      observacoes: lead.mensagem ? `Origem Lead: ${lead.mensagem}` : 'Convertido a partir do funil de Leads',
      perfil_interesse: prop
        ? {
            tipos_imovel: prop.tipo ? [prop.tipo] : [],
            finalidade: prop.finalidade || 'ambos',
            bairros_interesse: prop.bairro ? [prop.bairro] : [],
          }
        : {},
    })
    .select('id, nome')
    .single()

  if (clientInsertError || !newClient) {
    console.error('Lead conversion to client failed', { code: clientInsertError?.code })
    return NextResponse.json({ error: 'Erro ao criar cliente a partir do lead' }, { status: 500 })
  }

  // 3. Atualiza o lead com o client_id
  await supabase
    .from('leads')
    .update({
      client_id: newClient.id,
    })
    .eq('id', leadId)

  // 4. Cria a nota inicial na timeline do cliente
  const initialNote = prop
    ? `Promovido de Lead. Demonstrou interesse no imóvel "${prop.titulo}". Mensagem inicial: "${lead.mensagem || 'Sem mensagem'}"`
    : `Promovido de Lead. Mensagem inicial: "${lead.mensagem || 'Sem mensagem'}"`

  await supabase.from('client_notes').insert({
    tenant_id: tenantId,
    client_id: newClient.id,
    autor_id: userId,
    conteudo: initialNote,
  })

  return NextResponse.json({
    success: true,
    clientId: newClient.id,
    clientName: newClient.nome,
  }, { status: 201 })
}
