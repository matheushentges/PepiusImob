import type { ClientSearchProfile, PropertyMatchResult } from './types'

export interface PropertyMatchCandidate {
  id: string
  titulo: string
  tipo: string
  finalidade: 'venda' | 'locacao' | 'ambos'
  status: string
  preco_venda: number | null
  preco_locacao: number | null
  bairro: string
  cidade: string
  quartos: number | null
  vagas_garagem: number | null
  area_total: number | null
  cover_url?: string | null
}

/**
 * Calcula a compatibilidade entre o perfil de busca de um cliente e um imóvel do catálogo.
 */
export function calculatePropertyMatch(
  profile: ClientSearchProfile,
  property: PropertyMatchCandidate,
): PropertyMatchResult | null {
  // Apenas imóveis disponíveis participam do Radar
  if (property.status !== 'disponivel') {
    return null
  }

  const reasons: string[] = []
  let score = 0
  let maxPossible = 0

  // 1. Verificação de Finalidade (Venda / Locação)
  const clientPurpose = profile.finalidade || 'ambos'
  let isPurposeMatch = false

  if (clientPurpose === 'ambos') {
    isPurposeMatch = true
  } else if (clientPurpose === 'venda') {
    isPurposeMatch =
      (property.finalidade === 'venda' || property.finalidade === 'ambos') &&
      Boolean(property.preco_venda && property.preco_venda > 0)
  } else if (clientPurpose === 'locacao') {
    isPurposeMatch =
      (property.finalidade === 'locacao' || property.finalidade === 'ambos') &&
      Boolean(property.preco_locacao && property.preco_locacao > 0)
  }

  if (!isPurposeMatch) {
    return null
  }

  // 2. Tipo do Imóvel (Peso: 25)
  maxPossible += 25
  const selectedTypes = profile.tipos_imovel || []
  if (selectedTypes.length > 0) {
    if (selectedTypes.includes(property.tipo as any)) {
      score += 25
      reasons.push(`Tipo compatível (${property.tipo})`)
    }
  } else {
    // Se cliente não especificou tipo, ganha pontuação neutra proporcional
    score += 15
  }

  // 3. Faixa de Valor (Peso: 35)
  maxPossible += 35
  const relevantPrice =
    clientPurpose === 'locacao'
      ? property.preco_locacao
      : property.preco_venda || property.preco_locacao

  if (relevantPrice && relevantPrice > 0) {
    const min = profile.valor_minimo
    const max = profile.valor_maximo

    if (min != null && max != null) {
      if (relevantPrice >= min && relevantPrice <= max) {
        score += 35
        reasons.push('Preço ideal dentro da faixa estipulada')
      } else if (relevantPrice <= max * 1.1 && relevantPrice >= min * 0.9) {
        score += 20
        reasons.push('Preço próximo da margem (±10%)')
      }
    } else if (max != null) {
      if (relevantPrice <= max) {
        score += 35
        reasons.push('Preço abaixo do teto máximo')
      } else if (relevantPrice <= max * 1.1) {
        score += 20
        reasons.push('Preço próximo do teto (até +10%)')
      }
    } else if (min != null) {
      if (relevantPrice >= min) {
        score += 35
        reasons.push('Valor compatível com piso mínimo')
      }
    } else {
      score += 20 // Neutro se não delimitou valor
    }
  }

  // 4. Bairro / Região (Peso: 25)
  maxPossible += 25
  const desiredBairros = (profile.bairros_interesse || []).map((b) => b.trim().toLowerCase())
  if (desiredBairros.length > 0) {
    const propBairro = (property.bairro || '').trim().toLowerCase()
    const matchesBairro = desiredBairros.some(
      (b) => propBairro.includes(b) || b.includes(propBairro),
    )
    if (matchesBairro) {
      score += 25
      reasons.push(`Bairro de preferência (${property.bairro})`)
    }
  } else {
    score += 15 // Neutro
  }

  // 5. Quartos (Peso: 15)
  maxPossible += 15
  if (profile.quartos_minimo != null && profile.quartos_minimo > 0) {
    if ((property.quartos || 0) >= profile.quartos_minimo) {
      score += 15
      reasons.push(`${property.quartos} quartos atendem a exigência mínima de ${profile.quartos_minimo}`)
    }
  } else {
    score += 10
  }

  // Normalização do Score (0 a 100)
  const finalScore = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 50

  // Descartamos candidatos com menos de 35% de compatibilidade
  if (finalScore < 35) {
    return null
  }

  return {
    propertyId: property.id,
    titulo: property.titulo,
    tipo: property.tipo,
    finalidade: property.finalidade,
    precoVenda: property.preco_venda,
    precoLocacao: property.preco_locacao,
    bairro: property.bairro,
    cidade: property.cidade,
    quartos: property.quartos,
    vagasGaragem: property.vagas_garagem,
    areaTotal: property.area_total,
    coverUrl: property.cover_url,
    matchScore: finalScore,
    matchReasons: reasons,
  }
}
