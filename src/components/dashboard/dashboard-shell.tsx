'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LogOut,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { DashboardNavLinks, type NavItem } from '@/components/dashboard/dashboard-nav-links'
import { ThemeToggle } from '@/components/theme-toggle'

const STORAGE_KEY = 'pepius_sidebar_collapsed'

interface DashboardShellProps {
  navItems: NavItem[]
  profileNome: string
  userEmail: string
  mobileNav: React.ReactNode
  children: React.ReactNode
}

export function DashboardShell({
  navItems,
  profileNome,
  userEmail,
  mobileNav,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        setCollapsed(true)
      }
    } catch {
      // Ignora erro de acesso ao localStorage (modo anônimo/restrito)
    }
    setMounted(true)
  }, [])

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Ignora erro de escrita
      }
      return next
    })
  }

  // Atalho de teclado opcional (Ctrl+[ ou Alt+S) para alternar retração
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault()
        toggleCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Desktop Fixa com scroll independente */}
      <aside
        aria-label="Painel lateral da imobiliária"
        className={`fixed inset-y-0 left-0 z-30 hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Cabeçalho da Sidebar */}
        <div
          className={`flex h-16 items-center border-b border-border shrink-0 ${
            collapsed ? 'flex-col justify-center px-2' : 'justify-between px-5'
          }`}
        >
          {collapsed ? (
            <Link
              href="/dashboard"
              className="flex flex-col items-center group py-1"
              title="Ir para o Início do Painel"
            >
              <span className="font-serif text-sm font-bold tracking-tight text-foreground leading-none">
                Pepius
              </span>
              <span className="rounded bg-accent/15 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-accent leading-none mt-1">
                Imob
              </span>
            </Link>
          ) : (
            <>
              <Link href="/dashboard" className="flex items-center gap-1.5">
                <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
                  Pepius
                </span>
                <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                  Imob
                </span>
              </Link>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir vitrine pública em nova aba"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <span>Site</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>

        {/* Links de Navegação */}
        <DashboardNavLinks items={navItems} collapsed={collapsed} />

        {/* Rodapé da Sidebar */}
        <div className="border-t border-border p-3 space-y-3 shrink-0">
          {/* Botão de Retrair / Expandir Sidebar */}
          {collapsed ? (
            <div className="space-y-2">
              <div className="relative group flex justify-center">
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Expandir menu lateral"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden md:group-hover:flex items-center whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md border border-border animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  Expandir menu (Ctrl+[)
                </div>
              </div>

              {/* Atalho rápido para ver site quando retraído */}
              <div className="relative group flex justify-center">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  aria-label="Ver vitrine pública"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden md:group-hover:flex items-center whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md border border-border animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  Ver site público
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              title="Recolher menu lateral (Ctrl+[)"
            >
              <span className="flex items-center gap-2">
                <PanelLeftClose className="h-4 w-4" />
                <span>Recolher menu</span>
              </span>
              <kbd className="hidden lg:inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                Ctrl+[
              </kbd>
            </button>
          )}

          {/* Dados do Usuário e Tema */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 pt-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground border border-border"
                title={`${profileNome} (${userEmail})`}
              >
                {profileNome.charAt(0).toUpperCase()}
              </div>
              <ThemeToggle className="h-8 w-8 shrink-0" />
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="min-w-0 pr-2">
                <p className="truncate text-xs font-semibold text-foreground">{profileNome}</p>
                <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
              </div>
              <ThemeToggle className="h-8 w-8 shrink-0" />
            </div>
          )}

          {/* Sair da Conta */}
          {collapsed ? (
            <form action="/api/auth/signout" method="post" className="relative group flex justify-center pt-1">
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive cursor-pointer"
                aria-label="Sair da conta"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden md:group-hover:flex items-center whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md border border-border animate-in fade-in-0 zoom-in-95 duration-150"
              >
                Sair da conta
              </div>
            </form>
          ) : (
            <form action="/api/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border/80 bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                Sair da conta
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Conteúdo Principal com compensação dinâmica da sidebar */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out min-w-0 ${
          collapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Cabeçalho Mobile */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold text-foreground">Pepius Imob</span>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
            >
              <span>Ver site</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8" />
            {mobileNav}
          </div>
        </header>

        {/* Área Principal de Visualização */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
          <div className="mx-auto max-w-6xl w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
