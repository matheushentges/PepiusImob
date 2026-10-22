'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Cookie, ShieldCheck, X } from 'lucide-react'

const CONSENT_KEY = 'pepius_cookie_consent'

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function CookieConsentBanner() {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(CONSENT_KEY)
  })

  if (!mounted || !visible) return null

  function handleAccept(type: 'all' | 'essential') {
    localStorage.setItem(CONSENT_KEY, type)
    setVisible(false)
  }

  return (
    <aside
      aria-label="Aviso de cookies e privacidade"
      role="region"
      className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-300 sm:bottom-6 sm:right-6 sm:left-auto"
    >
      <div className="rounded-xl border border-border/80 bg-card/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md dark:bg-card/90">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm sm:text-base font-semibold text-foreground">
                Privacidade & Cookies
              </h3>
              <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> LGPD
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Utilizamos cookies essenciais de navegação e segurança para garantir que você tenha a melhor experiência na nossa vitrine, em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>

            <div className="mt-2.5 text-xs text-muted-foreground">
              Consulte nossa{' '}
              <Link
                href="/privacidade"
                className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent/80"
              >
                Política de Privacidade
              </Link>
              .
            </div>

            <div className="mt-3.5 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleAccept('all')}
                className="inline-flex h-9 w-full sm:w-auto items-center justify-center rounded-md bg-accent px-4 text-xs font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                Aceitar todos
              </button>

              <button
                type="button"
                onClick={() => handleAccept('essential')}
                className="inline-flex h-9 w-full sm:w-auto items-center justify-center rounded-md border border-border bg-secondary/80 px-3.5 text-xs font-medium text-secondary-foreground transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                Apenas essenciais
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAccept('essential')}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Fechar aviso de cookies"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
