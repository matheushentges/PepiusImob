import React from 'react'
import { MessageCircle } from 'lucide-react'
import { buildKeyReminderWhatsAppUrl } from '@/lib/keys/whatsapp'

interface KeyWhatsAppButtonProps {
  phone: string | null | undefined
  responsibleName: string
  propertyTitle: string
  expectedAt?: string | null
  isLate?: boolean
  className?: string
  label?: string
}

export function KeyWhatsAppButton({
  phone,
  responsibleName,
  propertyTitle,
  expectedAt,
  isLate = false,
  className = '',
  label,
}: KeyWhatsAppButtonProps) {
  if (!phone) return null

  const url = buildKeyReminderWhatsAppUrl({
    phone,
    responsibleName,
    propertyTitle,
    expectedAt,
    isLate,
  })

  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Enviar mensagem no WhatsApp para ${responsibleName} (${phone})`}
      className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors ${className}`}
    >
      <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>{label || 'Cobrar WhatsApp'}</span>
    </a>
  )
}
