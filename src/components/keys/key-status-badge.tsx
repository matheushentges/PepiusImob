import React from 'react'
import { Key, UserCheck, Users, Wrench, AlertCircle, Clock } from 'lucide-react'
import type { KeyStatus } from '@/lib/keys/types'

interface KeyStatusBadgeProps {
  status: KeyStatus
  codigo?: string | null
  isLate?: boolean
  responsibleName?: string | null
  compact?: boolean
  className?: string
}

export const statusLabels: Record<KeyStatus, string> = {
  disponivel: 'No Claviculário',
  com_consultor: 'Com Consultor',
  com_cliente: 'Com Cliente',
  em_manutencao: 'Em Manutenção',
  outros: 'Outros',
}

export function KeyStatusBadge({
  status,
  codigo,
  isLate = false,
  responsibleName,
  compact = false,
  className = '',
}: KeyStatusBadgeProps) {
  if (isLate) {
    return (
      <span
        title={responsibleName ? `Atrasada com ${responsibleName}` : 'Devolução atrasada'}
        className={`inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400 ${className}`}
      >
        <AlertCircle className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" />
        <span className="font-semibold">Atrasada</span>
        {codigo && <span className="opacity-75 font-mono">({codigo})</span>}
        {!compact && responsibleName && (
          <span className="truncate max-w-[120px] font-normal">
            • {responsibleName}
          </span>
        )}
      </span>
    )
  }

  switch (status) {
    case 'disponivel':
      return (
        <span
          title="Chave disponível para visitas"
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ${className}`}
        >
          <Key className="h-3 w-3 shrink-0" />
          <span>Disponível</span>
          {codigo && <span className="font-mono font-semibold">({codigo})</span>}
        </span>
      )

    case 'com_consultor':
      return (
        <span
          title={responsibleName ? `Em posse do consultor ${responsibleName}` : 'Em posse de um consultor'}
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 ${className}`}
        >
          <UserCheck className="h-3 w-3 shrink-0" />
          <span>Consultor</span>
          {codigo && <span className="font-mono opacity-80">({codigo})</span>}
          {!compact && responsibleName && (
            <span className="truncate max-w-[120px] font-normal">
              • {responsibleName}
            </span>
          )}
        </span>
      )

    case 'com_cliente':
      return (
        <span
          title={responsibleName ? `Em visita com o cliente ${responsibleName}` : 'Em visita por conta com cliente'}
          className={`inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400 ${className}`}
        >
          <Users className="h-3 w-3 shrink-0" />
          <span>Cliente</span>
          {codigo && <span className="font-mono opacity-80">({codigo})</span>}
          {!compact && responsibleName && (
            <span className="truncate max-w-[120px] font-normal">
              • {responsibleName}
            </span>
          )}
        </span>
      )

    case 'em_manutencao':
      return (
        <span
          title={responsibleName ? `Com prestador ${responsibleName}` : 'Imóvel/chave em manutenção'}
          className={`inline-flex items-center gap-1.5 rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400 ${className}`}
        >
          <Wrench className="h-3 w-3 shrink-0" />
          <span>Manutenção</span>
          {codigo && <span className="font-mono opacity-80">({codigo})</span>}
          {!compact && responsibleName && (
            <span className="truncate max-w-[120px] font-normal">
              • {responsibleName}
            </span>
          )}
        </span>
      )

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground ${className}`}
        >
          <Clock className="h-3 w-3 shrink-0" />
          <span>{statusLabels[status] || status}</span>
          {codigo && <span className="font-mono">({codigo})</span>}
        </span>
      )
  }
}
