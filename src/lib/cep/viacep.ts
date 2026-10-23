export interface ViaCepAddress {
  endereco: string
  bairro: string
  cidade: string
  estado: string
}

/**
 * Remove qualquer caractere não numérico e valida se tem exatamente 8 dígitos.
 */
export function cleanCep(cep: string): string {
  const digits = (cep || '').replace(/\D/g, '')
  return digits.length === 8 ? digits : ''
}

/**
 * Aplica máscara 00000-000 em tempo real enquanto o usuário digita.
 */
export function formatCep(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Consulta a API pública do ViaCEP e retorna os campos mapeados para o formulário.
 */
export async function fetchAddressByCep(
  cep: string,
  fetchFn: typeof fetch = fetch,
): Promise<ViaCepAddress | null> {
  const digits = cleanCep(cep)
  if (!digits) return null

  try {
    const response = await fetchFn(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(4000),
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data || data.erro === true || data.erro === 'true') {
      return null
    }

    return {
      endereco: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
    }
  } catch {
    return null
  }
}
