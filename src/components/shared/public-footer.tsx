import Link from 'next/link'
import { Building2, KeyRound, ShieldCheck, Mail, MapPin } from 'lucide-react'
import type { PublicSiteConfig } from '@/lib/public-listings'

interface PublicFooterProps {
  siteConfig: PublicSiteConfig
}

export function PublicFooter({ siteConfig }: PublicFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer id="contato" className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
          {/* Coluna 1: Identidade & Posicionamento */}
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-block font-serif text-xl font-bold tracking-tight text-foreground hover:text-accent transition-colors"
            >
              {siteConfig.agencyName}
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {siteConfig.heroSubtitle ||
                'Soluções completas e atendimento de confiança para compra, venda e locação de imóveis.'}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground border border-border/60">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Instalação Privada On-Premise
              </span>
            </div>
          </div>

          {/* Coluna 2: Catálogo & Busca */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Catálogo de Imóveis
            </p>
            <ul className="mt-3.5 space-y-2 text-xs">
              <li>
                <Link
                  href="/imoveis"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Todos os Imóveis
                </Link>
              </li>
              <li>
                <Link
                  href="/imoveis?tipo=venda"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Imóveis para Compra
                </Link>
              </li>
              <li>
                <Link
                  href="/imoveis?tipo=aluguel"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Imóveis para Locação
                </Link>
              </li>
              <li>
                <Link
                  href="/#imoveis"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Imóveis em Destaque
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Institucional & Atendimento */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Institucional
            </p>
            <ul className="mt-3.5 space-y-2 text-xs">
              <li>
                <Link
                  href="/#sobre"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sobre a Imobiliária
                </Link>
              </li>
              <li>
                <Link
                  href="/#contato"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacidade & Cookies (LGPD)
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Acesso da Equipe */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Acesso da Equipe
            </p>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Área de gerenciamento exclusiva para corretores e administradores da {siteConfig.agencyName}.
            </p>
            <div className="mt-3.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <KeyRound className="h-3.5 w-3.5 text-accent" />
                <span>Painel do Corretor ↗</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Linha Divisória e Sub-rodapé */}
        <div className="mt-10 border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {currentYear} {siteConfig.agencyName}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacidade" className="hover:text-foreground transition-colors">
              Termos e Privacidade
            </Link>
            <span>•</span>
            <span className="text-muted-foreground/70">Tecnologia Pepius Imob</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
