#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[!] Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('=== Iniciando Povoamento de Dados para Simulação do Pepius Imob ===')

// 1. Resolve o tenant
let tenantId = process.env.PEPIUS_TENANT_ID
if (!tenantId) {
  const { data: tenant } = await supabase.from('tenants').select('id, nome').limit(1).maybeSingle()
  if (!tenant) {
    console.error('[!] Nenhum tenant encontrado no banco de dados.')
    process.exit(1)
  }
  tenantId = tenant.id
  console.log(`[+] Tenant ativo identificado: ${tenant.nome} (${tenantId})`)
} else {
  console.log(`[+] Tenant ID configurado: ${tenantId}`)
}

// 2. Busca o primeiro corretor/administrador para associar
const { data: profiles } = await supabase.from('profiles').select('id, nome').eq('tenant_id', tenantId).limit(2)
const owner = profiles?.[0] || null
console.log(`[+] Usuário gestor identificado: ${owner?.nome || 'Nenhum'}`)

// 3. Mapeamento de Fotos de Alta Resolução por Tipo de Imóvel
const SAMPLE_PHOTOS = {
  casa: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
  ],
  apartamento: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
  ],
  comercial: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80',
  ],
  rural: [
    'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
  ],
  terreno: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
  ],
}

// 4. Busca todos os imóveis cadastrados
const { data: properties, error: propError } = await supabase
  .from('properties')
  .select('id, titulo, tipo, bairro, cidade, preco_venda, preco_locacao')
  .eq('tenant_id', tenantId)

if (propError || !properties || properties.length === 0) {
  console.error('[!] Erro ao buscar imóveis do tenant:', propError)
  process.exit(1)
}

console.log(`[+] ${properties.length} imóveis localizados no catálogo.`)

// 5. Vincula Imagens Reais aos Imóveis
console.log('[*] Processando e vinculando fotos nos imóveis...')
for (const prop of properties) {
  // Verifica se o imóvel já possui fotos
  const { data: existingImages } = await supabase
    .from('property_images')
    .select('id')
    .eq('property_id', prop.id)

  if (existingImages && existingImages.length > 0) {
    console.log(`  - Imóvel "${prop.titulo}" já possui ${existingImages.length} foto(s). Pulando upload.`)
    continue
  }

  const photosForType = SAMPLE_PHOTOS[prop.tipo] || SAMPLE_PHOTOS.apartamento
  console.log(`  - Baixando e enviando ${photosForType.length} foto(s) para "${prop.titulo}"...`)

  for (let i = 0; i < photosForType.length; i++) {
    const photoUrl = photosForType[i]
    try {
      const res = await fetch(photoUrl)
      if (!res.ok) continue
      const buffer = Buffer.from(await res.arrayBuffer())

      const filename = `${tenantId}/${prop.id}/${randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filename, buffer, { contentType: 'image/jpeg', cacheControl: '3600' })

      if (uploadError) {
        console.warn(`    [!] Falha no upload Storage: ${uploadError.message}`)
        continue
      }

      await supabase.from('property_images').insert({
        property_id: prop.id,
        url: filename,
        ordem: i,
        is_cover: i === 0, // A primeira foto é sempre a capa
      })
    } catch (err) {
      console.warn(`    [!] Exceção no upload: ${err.message}`)
    }
  }
}
console.log('[+] Fotos de imóveis sincronizadas com sucesso!')

// 6. Cadastra Clientes para Simulação do Radar Reverso
console.log('[*] Cadastrando clientes realistas com perfis de interesse para o Radar...')

const SEED_CLIENTS = [
  {
    nome: 'Mariana Alcântara',
    tipo_pessoa: 'pf',
    papeis: ['comprador'],
    status: 'ativo',
    documento: '28471938012',
    email: 'mariana.alcantara@gmail.com',
    telefone: '19981234567',
    cidade: 'Campinas',
    estado: 'SP',
    bairro: 'Cambuí',
    perfil_interesse: {
      finalidade: 'venda',
      tipos_imovel: ['apartamento'],
      valor_minimo: 500000,
      valor_maximo: 750000,
      quartos_minimo: 2,
      bairros_interesse: ['Cambuí', 'Guanabara', 'Taquaral'],
    },
    observacoes: 'Busca apartamento ventilado com varanda gourmet para compra à vista/financiamento aprovado Itaú.',
  },
  {
    nome: 'Ricardo Silveira',
    tipo_pessoa: 'pf',
    papeis: ['locatario'],
    status: 'ativo',
    documento: '51928374091',
    email: 'ricardo.silveira@outlook.com',
    telefone: '12997654321',
    cidade: 'São José dos Campos',
    estado: 'SP',
    bairro: 'Jardim Aquarius',
    perfil_interesse: {
      finalidade: 'locacao',
      tipos_imovel: ['casa'],
      valor_maximo: 5500,
      quartos_minimo: 3,
      bairros_interesse: ['Jardim Aquarius', 'Urbanova', 'Esplanada'],
    },
    observacoes: 'Engenheiro transferido da Embraer. Família com 2 filhos e 1 pet. Entrada imediata.',
  },
  {
    nome: 'Dra. Camila Prado',
    tipo_pessoa: 'pf',
    papeis: ['comprador', 'locatario'],
    status: 'ativo',
    documento: '63819274015',
    email: 'dra.camila.prado@clinica.med.br',
    telefone: '31988776655',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    bairro: 'Savassi',
    perfil_interesse: {
      finalidade: 'ambos',
      tipos_imovel: ['comercial'],
      valor_maximo: 650000,
      bairros_interesse: ['Savassi', 'Funcionários', 'Lourdes'],
    },
    observacoes: 'Dermatologista procurando consultório comercial para expansão de clínica médica.',
  },
  {
    nome: 'Felipe Zanetti',
    tipo_pessoa: 'pf',
    papeis: ['locatario'],
    status: 'ativo',
    documento: '71928304918',
    email: 'felipe.zanetti@tech.io',
    telefone: '51991112233',
    cidade: 'Porto Alegre',
    estado: 'RS',
    bairro: 'Moinhos de Vento',
    perfil_interesse: {
      finalidade: 'locacao',
      tipos_imovel: ['apartamento'],
      valor_maximo: 2500,
      quartos_minimo: 1,
      bairros_interesse: ['Moinhos de Vento', 'Bom Fim', 'Rio Branco'],
    },
    observacoes: 'Desenvolvedor em home office. Busca studio mobiliado e compacto.',
  },
  {
    nome: 'Eduardo e Beatriz Mendes',
    tipo_pessoa: 'pf',
    papeis: ['proprietario'],
    status: 'ativo',
    documento: '10928374902',
    email: 'eduardo.mendes@mendesinvest.com.br',
    telefone: '11976543210',
    cidade: 'São Paulo',
    estado: 'SP',
    bairro: 'Jardins',
    dados_bancarios: {
      banco: 'Banco Itaú (341)',
      agencia: '1234',
      conta: '56789-0',
      tipo_conta: 'corrente',
      tipo_chave_pix: 'cpf',
      chave_pix: '109.283.749-02',
      titular: 'Eduardo Mendes',
    },
    observacoes: 'Proprietários de imóveis administrados pela imobiliária. Repasse Pix mensal até o dia 10.',
  },
]

for (const client of SEED_CLIENTS) {
  // Upsert por e-mail e tenant
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email', client.email)
    .maybeSingle()

  if (existing) {
    await supabase.from('clients').update({
      ...client,
      corretor_id: owner?.id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
    console.log(`  - Cliente "${client.nome}" atualizado.`)
  } else {
    await supabase.from('clients').insert({
      id: randomUUID(),
      tenant_id: tenantId,
      corretor_id: owner?.id || null,
      ...client,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    console.log(`  - Cliente "${client.nome}" cadastrado com sucesso.`)
  }
}

// 7. Configura Claviculário e Chaves Físicas dos Imóveis
console.log('[*] Configurando chaves no claviculário...')
let keyCounter = 1

for (const prop of properties) {
  const code = `G-${String(keyCounter).padStart(2, '0')}`
  keyCounter++

  const { data: existingKey } = await supabase
    .from('property_keys')
    .select('id')
    .eq('property_id', prop.id)
    .maybeSingle()

  let keyId
  if (!existingKey) {
    const { data: newKey } = await supabase
      .from('property_keys')
      .insert({
        id: randomUUID(),
        tenant_id: tenantId,
        property_id: prop.id,
        codigo: code,
        localizacao: 'Claviculário Principal - Sala de Atendimento',
        status: 'no_claviculario',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    keyId = newKey?.id
    console.log(`  - Chave [${code}] vinculada ao imóvel "${prop.titulo}".`)
  } else {
    keyId = existingKey.id
  }

  // No primeiro imóvel, simula uma retirada com atraso para testar o alerta de devolução e cobrança WhatsApp!
  if (keyCounter === 2 && keyId && owner) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    // Atualiza status da chave para 'com_consultor'
    await supabase.from('property_keys').update({ status: 'com_consultor' }).eq('id', keyId)

    // Insere movimento em atraso
    const { data: existingMov } = await supabase
      .from('key_movements')
      .select('id')
      .eq('property_key_id', keyId)
      .is('devolvido_em', null)
      .maybeSingle()

    if (!existingMov) {
      await supabase.from('key_movements').insert({
        id: randomUUID(),
        tenant_id: tenantId,
        property_key_id: keyId,
        tipo_responsavel: 'consultor',
        profile_id: owner.id,
        nome_responsavel: owner.nome,
        motivo: 'Visita presencial com cliente agendado',
        retirado_em: yesterday,
        previsao_devolucao: twoHoursAgo, // Venceu há 2 horas!
        created_at: yesterday,
      })
      console.log(`  - Movimento de teste com ATRASO gerado na chave [${code}] para demonstrar o alerta de cobrança!`)
    }
  }
}

// 8. Leads de Demonstração
console.log('[*] Sincronizando leads recentes no pipeline...')
const SEED_LEADS = [
  {
    nome: 'Arthur Vasconcellos',
    email: 'arthur.vasc@gmail.com',
    telefone: '11987654321',
    mensagem: 'Olá, gostaria de saber se este imóvel aceita financiamento pela Caixa e se está desocupado.',
    status: 'novo',
  },
  {
    nome: 'Carla Silveira Meireles',
    email: 'carla.meireles@terra.com.br',
    telefone: '21998877665',
    mensagem: 'Tenho interesse em agendar visita para este sábado pela manhã.',
    status: 'atendimento',
  },
]

for (const lead of SEED_LEADS) {
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email', lead.email)
    .maybeSingle()

  if (!existingLead && properties[0]) {
    await supabase.from('leads').insert({
      id: randomUUID(),
      tenant_id: tenantId,
      property_id: properties[0].id,
      ...lead,
      created_at: new Date().toISOString(),
    })
    console.log(`  - Lead "${lead.nome}" registrado para o imóvel "${properties[0].titulo}".`)
  }
}

console.log('\n=== Povoamento de Dados Concluído com Sucesso! ===')
