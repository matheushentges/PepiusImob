'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Building2,
  Home,
  KeyRound,
  Info,
  Phone,
  ShieldCheck,
  Search,
  MessageCircle,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import type { PublicSiteConfig } from '@/lib/public-listings'

interface PublicHeaderProps {
  siteConfig: PublicSiteConfig
}

export function PublicHeader({ siteConfig }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Fecha o menu móvel ao mudar de rota sem disparar efeito síncrono em cascata
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileMenuOpen(false)
  }

  // Fecha com a tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  const isHome = pathname === '/'
  const isImoveis = pathname.startsWith('/imoveis')
  const isPrivacidade = pathname === '/privacidade'

  const cleanWhatsapp = siteConfig.whatsapp?.replace(/\D/g, '')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Identidade / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 group"
          aria-label={`${siteConfig.agencyName} — página inicial`}
        >
          {siteConfig.logoUrl ? (
            <div className="flex items-center h-10 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={siteConfig.logoUrl}
                alt={siteConfig.agencyName}
                className="h-8 sm:h-9 w-auto max-w-[180px] sm:max-w-[220px] object-contain"
              />
            </div>
          ) : (
            <>
              <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate group-hover:text-accent transition-colors">
                {siteConfig.agencyName}
              </span>
              <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent border border-accent/20">
                Imóveis
              </span>
            </>
          )}
        </Link>

        {/* Navegação Desktop */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              isHome
                ? 'text-accent font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Início
          </Link>
          <Link
            href="/imoveis"
            className={`text-sm font-medium transition-colors ${
              isImoveis
                ? 'text-accent font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Imóveis
          </Link>
          <Link
            href="/#sobre"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sobre
          </Link>
          <Link
            href="/#contato"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Contato
          </Link>
        </nav>

        {/* Ações no Header (Direita) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {cleanWhatsapp && (
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                `Olá! Acessei o site da ${siteConfig.agencyName} e gostaria de informações sobre imóveis.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-500/20"
              aria-label="Falar pelo WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          <Link
            href="/imoveis"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent transition-all hover:bg-accent hover:text-white"
          >
            Catálogo completo →
          </Link>

          <ThemeToggle />

          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-secondary md:hidden"
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu Móvel Dropdown / Gaveta */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card/98 px-4 py-5 shadow-lg backdrop-blur-lg animate-in slide-in-from-top-2 duration-200 md:hidden">
          <nav aria-label="Navegação móvel" className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isHome
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <Home className="h-4 w-4 text-accent" />
              <span>Início</span>
            </Link>

            <Link
              href="/imoveis"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isImoveis
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <Building2 className="h-4 w-4 text-accent" />
              <span>Todos os Imóveis</span>
            </Link>

            <div className="pl-6 space-y-1 py-1">
              <Link
                href="/imoveis?tipo=venda"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="h-3 w-3 text-muted-foreground" />
                <span>Imóveis para Compra</span>
              </Link>
              <Link
                href="/imoveis?tipo=aluguel"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <KeyRound className="h-3 w-3 text-muted-foreground" />
                <span>Imóveis para Locação</span>
              </Link>
            </div>

            <Link
              href="/#sobre"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Info className="h-4 w-4 text-accent" />
              <span>Sobre a Imobiliária</span>
            </Link>

            <Link
              href="/#contato"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Phone className="h-4 w-4 text-accent" />
              <span>Fale Conosco</span>
            </Link>

            {cleanWhatsapp && (
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                  `Olá! Acessei o site da ${siteConfig.agencyName} e gostaria de informações sobre imóveis.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                <span>Atendimento via WhatsApp</span>
              </a>
            )}

            <Link
              href="/privacidade"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isPrivacidade
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span>Política de Privacidade (LGPD)</span>
            </Link>
          </nav>

          {/* Divisor e Área da Equipe no Mobile */}
          <div className="mt-4 border-t border-border/70 pt-4">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg bg-secondary/60 px-3.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
            >
              <span>Área da Equipe / Corretores</span>
              <span className="text-[11px] font-semibold text-accent">Acessar ↗</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
