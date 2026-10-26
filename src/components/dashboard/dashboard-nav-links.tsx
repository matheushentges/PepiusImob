'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Settings, KeyRound, UserCheck, ShieldCheck } from 'lucide-react'

type NavItem = {
  href: string
  label: string
}

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/imoveis': Building2,
  '/dashboard/chaves': KeyRound,
  '/dashboard/leads': Users,
  '/dashboard/equipe': UserCheck,
  '/dashboard/configuracoes': Settings,
  '/dashboard/licenca': ShieldCheck,
}

export function DashboardNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-3" aria-label="Navegação do painel">
      {items.map((item) => {
        const Icon = icons[item.href] || LayoutDashboard
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
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
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
