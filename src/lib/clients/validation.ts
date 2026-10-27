import { z } from 'zod'

/**
 * Remove qualquer caracter não numérico
 */
export function sanitizeDocument(val?: string | null): string {
  if (!val) return ''
  return val.replace(/\D/g, '')
}

/**
 * Validação simplificada e robusta de formato de CPF (11 dígitos) e CNPJ (14 dígitos)
 */
export function isValidCPF(cpf: string): boolean {
  const clean = sanitizeDocument(cpf)
  if (clean.length !== 11) return false
  // Rejeita sequências repetidas como 11111111111
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  let rest = 0
  for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(clean.substring(9, 10), 10)) return false

  sum = 0
  for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(clean.substring(10, 11), 10)) return false

  return true
}

export function isValidCNPJ(cnpj: string): boolean {
  const clean = sanitizeDocument(cnpj)
  if (clean.length !== 14) return false
  if (/^(\d)\1{13}$/.test(clean)) return false

  let size = clean.length - 2
  let numbers = clean.substring(0, size)
  const digits = clean.substring(size)
  let sum = 0
  let pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0), 10)) return false

  size = size + 1
  numbers = clean.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1), 10)) return false

  return true
}

export function formatDocument(val?: string | null): string {
  const clean = sanitizeDocument(val)
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return val || ''
}

export function formatPhoneBR(val?: string | null): string {
  if (!val) return ''
  const clean = sanitizeDocument(val)
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return val
}

const clientRoleEnum = z.enum(['proprietario', 'comprador', 'locatario', 'fiador'])
const clientTypeEnum = z.enum(['pf', 'pj'])
const clientStatusEnum = z.enum(['ativo', 'inativo', 'potencial', 'arquivado'])

export const clientBankDataSchema = z.object({
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  tipo_conta: z.enum(['corrente', 'poupanca']).optional(),
  tipo_chave_pix: z.enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']).optional(),
  chave_pix: z.string().optional(),
  titular: z.string().optional(),
}).default({})

export const clientSearchProfileSchema = z.object({
  tipos_imovel: z.array(z.enum(['casa', 'apartamento', 'terreno', 'comercial', 'rural'])).default([]),
  finalidade: z.enum(['venda', 'locacao', 'ambos']).default('ambos'),
  valor_minimo: z.number().nullable().optional(),
  valor_maximo: z.number().nullable().optional(),
  quartos_minimo: z.number().nullable().optional(),
  vagas_minimo: z.number().nullable().optional(),
  bairros_interesse: z.array(z.string()).default([]),
  cidades_interesse: z.array(z.string()).default([]),
}).default({
  tipos_imovel: [],
  finalidade: 'ambos',
  bairros_interesse: [],
  cidades_interesse: [],
})

export const clientInputSchema = z.object({
  tipo_pessoa: clientTypeEnum.default('pf'),
  papeis: z.array(clientRoleEnum).min(1, 'Selecione ao menos um papel para o cliente (ex: comprador, proprietário)'),
  status: clientStatusEnum.default('ativo'),
  nome: z.string().min(2, 'Nome ou Razão Social deve ter pelo menos 2 caracteres'),
  nome_fantasia: z.string().optional().nullable(),
  documento: z.string().optional().nullable().refine((val) => {
    if (!val || val.trim() === '') return true
    const clean = sanitizeDocument(val)
    if (clean.length === 11) return isValidCPF(clean)
    if (clean.length === 14) return isValidCNPJ(clean)
    return false
  }, {
    message: 'CPF ou CNPJ inválido',
  }),
  rg_ie: z.string().optional().nullable(),
  data_nascimento: z.string().optional().nullable(),
  profissao: z.string().optional().nullable(),
  estado_civil: z.string().optional().nullable(),
  regime_bens: z.string().optional().nullable(),
  conjuge_nome: z.string().optional().nullable(),
  conjuge_cpf: z.string().optional().nullable().refine((val) => {
    if (!val || val.trim() === '') return true
    return isValidCPF(val)
  }, {
    message: 'CPF do cônjuge inválido',
  }),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  email_secundario: z.string().email('E-mail secundário inválido').optional().nullable().or(z.literal('')),
  telefone: z.string().min(8, 'Telefone obrigatório (mínimo 8 dígitos)'),
  telefone_secundario: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  dados_bancarios: clientBankDataSchema.optional(),
  perfil_interesse: clientSearchProfileSchema.optional(),
  corretor_id: z.string().uuid().optional().nullable().or(z.literal('')),
  observacoes: z.string().optional().nullable(),
})

export const clientNoteInputSchema = z.object({
  conteudo: z.string().min(1, 'Conteúdo da anotação não pode ser vazio'),
})

export type ClientInput = z.infer<typeof clientInputSchema>
export type ClientNoteInput = z.infer<typeof clientNoteInputSchema>
