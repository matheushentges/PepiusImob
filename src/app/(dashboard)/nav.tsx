'use client'

import { useState } from 'react'
import { Menu, X, Home, MessageSquare, Settings, Building2, LogOut } from 'lucide-react'
import { NavLink } from '@/components/nav-link'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface DashboardNavProps {
  userName?: string | null
}

export function DashboardNav({ userName }: DashboardNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Visão Geral' },
    { href: '/dashboard/imoveis', icon: Building2, label: 'Imóveis' },
    { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox' },
    { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
  ]

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-md bg-surface-raised border border-border-subtle text-text-secondary lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border-subtle bg-surface-raised transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-border-subtle px-6">
          <span className="text-lg font-bold tracking-tight text-accent">Pepius Imob</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary hover:text-text-primary lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle p-4 space-y-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-text-tertiary truncate max-w-[120px]">
              {userName || 'Usuário'}
            </span>
            <ThemeToggle />
          </div>
          <a
            href="/login"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sair
          </a>
        </div>
      </aside>
    </>
  )
}