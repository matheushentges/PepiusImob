'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  KeyRound,
  UserCheck,
  ShieldCheck,
  Contact2,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
}

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/imoveis': Building2,
  '/dashboard/chaves': KeyRound,
  '/dashboard/leads': Users,
  '/dashboard/clientes': Contact2,
  '/dashboard/equipe': UserCheck,
  '/dashboard/configuracoes': Settings,
  '/dashboard/licenca': ShieldCheck,
}

interface DashboardNavLinksProps {
  items: NavItem[]
  collapsed?: boolean
}

export function DashboardNavLinks({ items, collapsed = false }: DashboardNavLinksProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden" aria-label="Navegação do painel">
      {items.map((item) => {
        const Icon = icons[item.href] || LayoutDashboard
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

        return (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center rounded-lg transition-all duration-150 ${
                collapsed
                  ? 'justify-center h-10 w-full px-0'
                  : 'gap-3 px-3 py-2.5 text-sm font-medium'
              } ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>

            {/* Tooltip flutuante quando o painel estiver recolhido */}
            {collapsed && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden md:group-hover:flex items-center whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md border border-border animate-in fade-in-0 zoom-in-95 duration-150"
              >
                {item.label}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
