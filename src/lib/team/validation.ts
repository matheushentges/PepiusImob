import { z } from 'zod'

export const createTeamMemberSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido')
    .max(160, 'E-mail muito longo')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(72, 'A senha não pode exceder 72 caracteres'),
  role: z.enum(['imobiliaria_user', 'imobiliaria_owner'], {
    message: 'Perfil de acesso inválido',
  }),
})

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>
