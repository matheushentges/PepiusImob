import React from 'react'
import { Home, ShoppingBag, Key, Shield, User, Building } from 'lucide-react'
import type { ClientRole, ClientStatus, ClientType } from '@/lib/clients/types'

interface ClientRoleBadgeProps {
  role: ClientRole
  className?: string
}

export function ClientRoleBadge({ role, className = '' }: ClientRoleBadgeProps) {
  switch (role) {
    case 'proprietario':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300 ${className}`}
        >
          <Home className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Proprietário</span>
        </span>
      )
    case 'comprador':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:text-blue-300 ${className}`}
        >
          <ShoppingBag className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>Comprador</span>
        </span>
      )
    case 'locatario':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 ${className}`}
        >
          <Key className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Locatário</span>
        </span>
      )
    case 'fiador':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-800 dark:text-purple-300 ${className}`}
        >
          <Shield className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />
          <span>Fiador</span>
        </span>
      )
  }
}

export function ClientStatusBadge({ status, className = '' }: { status: ClientStatus; className?: string }) {
  switch (status) {
    case 'ativo':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Ativo</span>
        </span>
      )
    case 'potencial':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>Potencial</span>
        </span>
      )
    case 'inativo':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-slate-500/25 bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>Inativo</span>
        </span>
      )
    case 'arquivado':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span>Arquivado</span>
        </span>
      )
  }
}

export function ClientTypeBadge({ type, className = '' }: { type: ClientType; className?: string }) {
  return type === 'pj' ? (
    <span
      className={`inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground ${className}`}
      title="Pessoa Jurídica"
    >
      <Building className="h-2.5 w-2.5" />
      <span>PJ</span>
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground ${className}`}
      title="Pessoa Física"
    >
      <User className="h-2.5 w-2.5" />
      <span>PF</span>
    </span>
  )
}
