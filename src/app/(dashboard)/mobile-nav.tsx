'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'

type NavItem = { href: string; label: string }

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/imoveis': Building2,
  '/dashboard/leads': Users,
  '/dashboard/configuracoes': Settings,
}

export function MobileNav({
  items,
  userName,
  userEmail,
}: {
  items: NavItem[]
  userName: string
  userEmail: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="mobile-dashboard-menu"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-dashboard-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu do painel"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-border bg-card transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="font-serif text-base font-semibold text-foreground">Pepius Imob</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {items.map((item) => {
            const Icon = icons[item.href]
            const active = pathname === item.href
              || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 px-3">
            <p className="text-xs font-medium text-foreground">{userName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
