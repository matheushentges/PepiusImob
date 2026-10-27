import { z } from 'zod'

const hexColorRegex = /^#[0-9a-fA-F]{6}$/

export const siteConfigSchema = z.object({
  creci: z.string().trim().max(40).optional().default(''),
  slogan: z.string().trim().max(160).optional().default(''),
  logo_url: z.string().trim().max(500).nullable().optional(),
  favicon_url: z.string().trim().max(500).nullable().optional(),
  primary_color: z.string().trim().regex(hexColorRegex, 'Cor primária deve estar no formato HEX (#RRGGBB)').default('#334155'),
  accent_color: z.string().trim().regex(hexColorRegex, 'Cor de destaque deve estar no formato HEX (#RRGGBB)').default('#E07A5F'),
  hero_title: z.string().trim().max(120).default(''),
  hero_subtitle: z.string().trim().max(350).default(''),
  about_tag: z.string().trim().max(60).optional().default(''),
  about_title: z.string().trim().max(120).optional().default(''),
  about_text: z.string().trim().max(600).optional().default(''),
  whatsapp: z.string().trim().max(30).optional().default(''),
  telefone: z.string().trim().max(30).optional().default(''),
  email_contato: z.string().trim().max(120).optional().default(''),
  endereco_completo: z.string().trim().max(250).optional().default(''),
  redes_sociais: z.object({
    instagram: z.string().trim().max(150).optional().default(''),
    facebook: z.string().trim().max(150).optional().default(''),
    linkedin: z.string().trim().max(150).optional().default(''),
    youtube: z.string().trim().max(150).optional().default(''),
  }).default({
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
  }),
}).strict()

export const tenantBrandingSchema = z.object({
  nome: z.string().trim().min(2, 'Nome da imobiliária deve ter ao menos 2 caracteres').max(120, 'Nome da imobiliária deve ter no máximo 120 caracteres'),
  site_config: siteConfigSchema,
}).strict()

export type SiteConfigInput = z.infer<typeof siteConfigSchema>
export type TenantBrandingInput = z.infer<typeof tenantBrandingSchema>
