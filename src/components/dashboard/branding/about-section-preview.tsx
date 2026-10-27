'use client'

import { Eye, ArrowRight, Sparkles } from 'lucide-react'

interface AboutSectionPreviewProps {
  tag?: string
  title?: string
  text?: string
  primaryColor?: string
  accentColor?: string
}

export function AboutSectionPreview({
  tag,
  title,
  text,
  primaryColor = '#334155',
  accentColor = '#E07A5F',
}: AboutSectionPreviewProps) {
  const displayTag = tag?.trim() || 'Atendimento próximo'
  const displayTitle = title?.trim() || 'Uma escolha importante merece atenção de verdade.'
  const displayText =
    text?.trim() ||
    'Consulte os detalhes de cada imóvel e fale com a equipe da imobiliária para tirar dúvidas ou agendar uma visita.'

  return (
    <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-foreground">
            Pré-visualização em Tempo Real (Vitrine Pública)
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
          <Sparkles className="h-3 w-3" />
          Live Preview
        </span>
      </div>

      {/* Mock do container público da vitrine */}
      <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card p-6 sm:p-8 text-center shadow-2xs transition-all">
        {/* Tag Superior */}
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors"
          style={{ color: accentColor }}
        >
          {displayTag}
        </p>

        {/* Título Principal */}
        <h3 className="mx-auto mt-2.5 max-w-xl font-serif text-xl sm:text-2xl font-semibold tracking-tight text-foreground transition-all">
          {displayTitle}
        </h3>

        {/* Texto Descritivo */}
        <p className="mx-auto mt-3 max-w-lg text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line transition-all">
          {displayText}
        </p>

        {/* Botão de Ação (CTA) fixo */}
        <div className="mt-5 flex justify-center">
          <span
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-5 text-xs font-medium text-white shadow-2xs transition-all opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Encontrar um imóvel</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center sm:text-left">
        * As cores e tipografia refletem a paleta da marca e o tema padrão do site.
      </p>
    </div>
  )
}
