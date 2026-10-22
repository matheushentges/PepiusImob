'use client'

import { Check, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export interface ColorPreset {
  id: string
  name: string
  description: string
  primary: string
  accent: string
}

export const BRANDING_PRESETS: ColorPreset[] = [
  {
    id: 'linha-de-planta',
    name: 'Linha de Planta',
    description: 'Azul ardósia clássico com acento em terracota suave',
    primary: '#334155',
    accent: '#E07A5F',
  },
  {
    id: 'esmeralda-nobre',
    name: 'Esmeralda Nobre',
    description: 'Verde floresta profundo com acento em ouro nobre',
    primary: '#1B3B36',
    accent: '#D4AF37',
  },
  {
    id: 'azul-corporativo',
    name: 'Azul Corporativo',
    description: 'Azul marinho seguro com destaque vibrante',
    primary: '#0F172A',
    accent: '#2563EB',
  },
  {
    id: 'grafite-moderno',
    name: 'Grafite Contemporâneo',
    description: 'Tons neutros modernos com acento azul céu',
    primary: '#18181B',
    accent: '#0EA5E9',
  },
  {
    id: 'terra-cota-cafe',
    name: 'Café & Cobre',
    description: 'Tons terrosos aconchegantes com cobre sofisticado',
    primary: '#292524',
    accent: '#C2410C',
  },
]

interface ColorPresetsProps {
  primaryColor: string
  accentColor: string
  disabled?: boolean
  onChange: (colors: { primaryColor: string; accentColor: string }) => void
}

export function ColorPresets({
  primaryColor,
  accentColor,
  disabled = false,
  onChange,
}: ColorPresetsProps) {
  const activePreset = BRANDING_PRESETS.find(
    (p) =>
      p.primary.toLowerCase() === primaryColor.toLowerCase() &&
      p.accent.toLowerCase() === accentColor.toLowerCase(),
  )

  return (
    <div className="space-y-6">
      {/* Grade de Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Paletas de Cores Recomendadas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRANDING_PRESETS.map((preset) => {
            const isSelected = activePreset?.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    primaryColor: preset.primary,
                    accentColor: preset.accent,
                  })
                }
                className={`relative flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/5 ring-2 ring-accent/20 shadow-xs'
                    : 'border-border bg-card hover:bg-secondary/50 hover:border-border/80'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-semibold text-foreground">{preset.name}</span>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">
                  {preset.description}
                </p>
                <div className="flex items-center gap-2 mt-auto">
                  <div
                    className="h-5 w-10 rounded border border-black/10 shadow-xs"
                    style={{ backgroundColor: preset.primary }}
                    title={`Primária: ${preset.primary}`}
                  />
                  <div
                    className="h-5 w-10 rounded border border-black/10 shadow-xs"
                    style={{ backgroundColor: preset.accent }}
                    title={`Destaque: ${preset.accent}`}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Seletores Manuais de Cor */}
      <div className="pt-2 border-t border-border/70">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Personalização Manual
        </h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_color" className="text-xs font-medium">
              Cor Primária (Textos Principais, Cabeçalho & Elementos Estruturais)
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="primary_color"
                type="color"
                disabled={disabled}
                value={primaryColor}
                onChange={(e) =>
                  onChange({ primaryColor: e.target.value, accentColor })
                }
                className="h-10 w-14 rounded-lg border border-input bg-card p-1 cursor-pointer disabled:cursor-not-allowed"
              />
              <Input
                disabled={disabled}
                maxLength={7}
                value={primaryColor}
                onChange={(e) =>
                  onChange({ primaryColor: e.target.value, accentColor })
                }
                className="font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color" className="text-xs font-medium">
              Cor de Destaque (Botões de Ação, Badges & Destaques de Preço)
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="accent_color"
                type="color"
                disabled={disabled}
                value={accentColor}
                onChange={(e) =>
                  onChange({ primaryColor, accentColor: e.target.value })
                }
                className="h-10 w-14 rounded-lg border border-input bg-card p-1 cursor-pointer disabled:cursor-not-allowed"
              />
              <Input
                disabled={disabled}
                maxLength={7}
                value={accentColor}
                onChange={(e) =>
                  onChange({ primaryColor, accentColor: e.target.value })
                }
                className="font-mono text-xs uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mini-Preview Dinâmico */}
      <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Pré-visualização em Tempo Real na Vitrine
        </p>
        <div className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="font-serif text-sm font-semibold"
                style={{ color: primaryColor }}
              >
                Exemplo de Cabeçalho da Imobiliária
              </span>
            </div>
            <button
              type="button"
              className="px-3 py-1 text-[11px] font-semibold rounded-md shadow-xs transition-colors"
              style={{
                backgroundColor: accentColor,
                color: '#ffffff',
              }}
            >
              Falar com Corretor
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-secondary/40 p-3 rounded-md">
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                }}
              >
                Imóvel em Destaque
              </span>
              <p className="font-serif text-base font-semibold mt-1" style={{ color: primaryColor }}>
                Apartamento Vista Mar — 3 Suítes
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Valor de Venda</span>
              <p className="text-lg font-bold tabular-nums" style={{ color: accentColor }}>
                R$ 1.250.000
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
