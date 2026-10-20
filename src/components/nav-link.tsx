'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}

export function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent-subtle text-accent border-l-2 border-accent'
          : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </Link>
  )
}