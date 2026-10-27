import { z } from 'zod'

const optionalAmount = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().finite().min(0).max(1_000_000_000).optional(),
)

const optionalCount = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(0).max(100).optional(),
)

const optionalArea = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().finite().min(0).max(1_000_000).optional(),
)

export const propertyInputSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().min(10).max(10_000),
  tipo: z.enum(['casa', 'apartamento', 'terreno', 'comercial', 'rural']),
  finalidade: z.enum(['venda', 'locacao', 'ambos']),
  status: z.enum(['disponivel', 'vendido', 'alugado', 'reservado']).default('disponivel'),
  featured: z.boolean().default(false),
  preco_venda: optionalAmount,
  preco_locacao: optionalAmount,
  endereco: z.string().trim().min(3).max(240),
  cidade: z.string().trim().min(2).max(120),
  estado: z.string().trim().min(2).max(80),
  cep: z.string().trim().min(5).max(16),
  bairro: z.string().trim().min(2).max(120),
  area_total: optionalArea,
  area_construida: optionalArea,
  quartos: optionalCount,
  banheiros: optionalCount,
  vagas_garagem: optionalCount,
  proprietario_id: z
    .string()
    .uuid('ID de proprietário inválido')
    .optional()
    .nullable()
    .transform((val) => val || null),
}).strict().superRefine((property, context) => {
  if (property.finalidade === 'venda' && property.preco_venda === undefined) {
    context.addIssue({ code: 'custom', path: ['preco_venda'], message: 'Informe o preço de venda' })
  }
  if (property.finalidade === 'locacao' && property.preco_locacao === undefined) {
    context.addIssue({ code: 'custom', path: ['preco_locacao'], message: 'Informe o preço de locação' })
  }
  if (
    property.finalidade === 'ambos' &&
    property.preco_venda === undefined &&
    property.preco_locacao === undefined
  ) {
    context.addIssue({ code: 'custom', path: ['preco_venda'], message: 'Informe pelo menos um preço' })
  }
})
