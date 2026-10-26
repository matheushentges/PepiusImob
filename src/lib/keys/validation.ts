import { z } from 'zod'
import type { KeyHolderType, KeyStatus } from './types'

export const upsertKeySchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'Informe o código ou identificação da chave')
    .max(50, 'Código da chave deve ter no máximo 50 caracteres'),
  localizacao: z
    .string()
    .trim()
    .max(200, 'Localização no claviculário deve ter no máximo 200 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
}).strict()

export const checkoutKeySchema = z
  .object({
    key_id: z.string().uuid('ID de chave inválido'),
    property_id: z.string().uuid('ID de imóvel inválido'),
    tipo_responsavel: z.enum(['consultor', 'cliente', 'prestador', 'outros'], {
      message: 'Tipo de responsável inválido',
    }),
    consultor_id: z
      .string()
      .uuid('ID de consultor inválido')
      .optional()
      .nullable()
      .transform((val) => val || null),
    nome_responsavel: z
      .string()
      .trim()
      .min(2, 'Informe o nome do responsável pela chave')
      .max(120, 'Nome deve ter no máximo 120 caracteres'),
    telefone_responsavel: z
      .string()
      .trim()
      .max(25, 'Telefone inválido')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    documento_responsavel: z
      .string()
      .trim()
      .max(30, 'Documento deve ter no máximo 30 caracteres')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    motivo: z
      .string()
      .trim()
      .max(255, 'Motivo deve ter no máximo 255 caracteres')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    previsao_retorno: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (!val) return true
          const date = new Date(val)
          return !isNaN(date.getTime())
        },
        { message: 'Previsão de retorno inválida' }
      )
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? new Date(val).toISOString() : null)),
    observacoes_saida: z
      .string()
      .trim()
      .max(1000, 'Observações devem ter no máximo 1000 caracteres')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .strict()

export const returnKeySchema = z
  .object({
    movement_id: z.string().uuid('ID da movimentação inválido'),
    observacoes_devolucao: z
      .string()
      .trim()
      .max(1000, 'Observações de devolução devem ter no máximo 1000 caracteres')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .strict()

export function mapHolderTypeToStatus(tipo: KeyHolderType): KeyStatus {
  switch (tipo) {
    case 'consultor':
      return 'com_consultor'
    case 'cliente':
      return 'com_cliente'
    case 'prestador':
      return 'em_manutencao'
    case 'outros':
    default:
      return 'outros'
  }
}

export function isKeyLate(previsaoRetorno: string | null | undefined): boolean {
  if (!previsaoRetorno) return false
  const target = new Date(previsaoRetorno).getTime()
  if (isNaN(target)) return false
  return Date.now() > target
}

export function getMinutesLate(previsaoRetorno: string | null | undefined): number {
  if (!previsaoRetorno) return 0
  const target = new Date(previsaoRetorno).getTime()
  if (isNaN(target)) return 0
  const diffMs = Date.now() - target
  return diffMs > 0 ? Math.floor(diffMs / (1000 * 60)) : 0
}
