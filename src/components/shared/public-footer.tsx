import Link from 'next/link'
import {
  KeyRound,
  ShieldCheck,
  Mail,
  MapPin,
  Phone,
  MessageCircle,
  Award,
} from 'lucide-react'
import type { PublicSiteConfig } from '@/lib/public-listings'

interface PublicFooterProps {
  siteConfig: PublicSiteConfig
}

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function LinkedinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function YoutubeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" />
    </svg>
  )
}

export function PublicFooter({ siteConfig }: PublicFooterProps) {
  const currentYear = new Date().getFullYear()
  const cleanWhatsapp = siteConfig.whatsapp?.replace(/\D/g, '')

  const hasRedes =
    siteConfig.redesSociais &&
    Object.values(siteConfig.redesSociais).some((val) => Boolean(val?.trim()))

  return (
    <footer id="contato" className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
          {/* Coluna 1: Identidade, CRECI & Posicionamento */}
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-block group"
              aria-label={`${siteConfig.agencyName} — página inicial`}
            >
              {siteConfig.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={siteConfig.logoUrl}
                  alt={siteConfig.agencyName}
                  className="h-9 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <span className="font-serif text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
                  {siteConfig.agencyName}
                </span>
              )}
            </Link>

            {siteConfig.creci && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>{siteConfig.creci}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {siteConfig.slogan ||
                siteConfig.heroSubtitle ||
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

          {/* Coluna 3: Atendimento & Contato Comercial */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Atendimento & Contato
            </p>
            <div className="mt-3.5 space-y-2.5 text-xs text-muted-foreground">
              {siteConfig.enderecoCompleto && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                  <span className="leading-snug">{siteConfig.enderecoCompleto}</span>
                </div>
              )}

              {siteConfig.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-accent shrink-0" />
                  <a
                    href={`tel:${siteConfig.telefone.replace(/\D/g, '')}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {siteConfig.telefone}
                  </a>
                </div>
              )}

              {siteConfig.emailContato && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-accent shrink-0" />
                  <a
                    href={`mailto:${siteConfig.emailContato}`}
                    className="hover:text-foreground transition-colors truncate"
                  >
                    {siteConfig.emailContato}
                  </a>
                </div>
              )}

              {cleanWhatsapp && (
                <div className="pt-1">
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                      `Olá! Acessei o site da ${siteConfig.agencyName} e gostaria de informações sobre imóveis.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp: {siteConfig.whatsapp}</span>
                  </a>
                </div>
              )}

              {/* Redes Sociais */}
              {hasRedes && (
                <div className="pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">
                    Siga-nos
                  </p>
                  <div className="flex items-center gap-2">
                    {siteConfig.redesSociais.instagram && (
                      <a
                        href={siteConfig.redesSociais.instagram.startsWith('http') ? siteConfig.redesSociais.instagram : `https://instagram.com/${siteConfig.redesSociais.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="Instagram"
                      >
                        <InstagramIcon className="h-4 w-4" />
                      </a>
                    )}
                    {siteConfig.redesSociais.facebook && (
                      <a
                        href={siteConfig.redesSociais.facebook.startsWith('http') ? siteConfig.redesSociais.facebook : `https://facebook.com/${siteConfig.redesSociais.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="Facebook"
                      >
                        <FacebookIcon className="h-4 w-4" />
                      </a>
                    )}
                    {siteConfig.redesSociais.linkedin && (
                      <a
                        href={siteConfig.redesSociais.linkedin.startsWith('http') ? siteConfig.redesSociais.linkedin : `https://linkedin.com/in/${siteConfig.redesSociais.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="LinkedIn"
                      >
                        <LinkedinIcon className="h-4 w-4" />
                      </a>
                    )}
                    {siteConfig.redesSociais.youtube && (
                      <a
                        href={siteConfig.redesSociais.youtube.startsWith('http') ? siteConfig.redesSociais.youtube : `https://youtube.com/@${siteConfig.redesSociais.youtube.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="YouTube"
                      >
                        <YoutubeIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
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
