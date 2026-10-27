import React from 'react'
import { MessageCircle } from 'lucide-react'
import { sanitizeDocument } from '@/lib/clients/validation'

interface ClientWhatsAppButtonProps {
  phone: string | null | undefined
  clientName: string
  className?: string
  label?: string
  compact?: boolean
}

export function ClientWhatsAppButton({
  phone,
  clientName,
  className = '',
  label = 'WhatsApp',
  compact = false,
}: ClientWhatsAppButtonProps) {
  if (!phone) return null

  const digits = sanitizeDocument(phone)
  if (digits.length < 10) return null

  const fullNumber = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`
  const firstName = clientName.split(' ')[0] || 'Cliente'
  const message = encodeURIComponent(`Olá, ${firstName}! Tudo bem? Sou da equipe da imobiliária e estou entrando em contato para acompanhar seu atendimento.`)
  const url = `https://wa.me/${fullNumber}?text=${message}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Conversar com ${clientName} no WhatsApp (${phone})`}
      className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-600/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors ${className}`}
    >
      <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      {!compact && <span>{label}</span>}
    </a>
  )
}
