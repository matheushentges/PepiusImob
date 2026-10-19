'use client'

import { useState } from 'react'
import { MessageCircle, X, Phone, Mail } from 'lucide-react'

export function ContactFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded panel */}
      {open && (
        <div className="mb-3 w-72 rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Fale conosco</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Tire dúvidas sobre imóveis ou saiba mais sobre o sistema para imobiliárias.
          </p>
          <div className="space-y-2">
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-base px-3 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:bg-accent-subtle"
            >
              <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
              WhatsApp
            </a>
            <a
              href="mailto:contato@pepiusimob.com.br"
              className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-base px-3 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:bg-accent-subtle"
            >
              <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
              E-mail
            </a>
          </div>
        </div>
      )}

      {/* FAB trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-text shadow-md transition-all hover:bg-accent-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
        aria-label={open ? 'Fechar contato' : 'Abrir contato'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}